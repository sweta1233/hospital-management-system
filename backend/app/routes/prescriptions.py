"""Prescriptions routes."""
from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db, socketio
from app.models.prescription import Prescription, PrescriptionItem
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.medicine import Medicine
from app.models.user import User
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.auth import role_required

prescriptions_bp = Blueprint("prescriptions", __name__)


@prescriptions_bp.route("", methods=["GET"])
@jwt_required()
def get_prescriptions():
    """List prescriptions with patient privacy scoping."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    roles = [r.name for r in user.roles] if user else []

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    patient_id = request.args.get("patient_id", type=int)
    doctor_id = request.args.get("doctor_id", type=int)
    status = request.args.get("status")

    query = Prescription.query

    # Strict Patient Privacy: Patients can ONLY view their own prescriptions
    if "patient" in roles and not any(r in ["admin", "doctor", "pharmacist", "nurse"] for r in roles):
        patient = Patient.query.filter_by(user_id=user_id).first()
        if not patient:
            return paginated_response(items=[], total=0, page=page, per_page=per_page)
        query = query.filter_by(patient_id=patient.id)
    else:
        if patient_id:
            query = query.filter_by(patient_id=patient_id)
        if doctor_id:
            query = query.filter_by(doctor_id=doctor_id)

    if status:
        query = query.filter_by(status=status)

    total = query.count()
    prescriptions = query.order_by(Prescription.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return paginated_response(
        items=[p.to_dict() for p in prescriptions],
        total=total,
        page=page,
        per_page=per_page,
    )


@prescriptions_bp.route("/<int:prescription_id>", methods=["GET"])
@jwt_required()
def get_prescription_by_id(prescription_id):
    """Get single prescription with patient privacy validation."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    roles = [r.name for r in user.roles] if user else []

    prescription = Prescription.query.get(prescription_id)
    if not prescription:
        return error_response("Prescription not found", "NOT_FOUND", 404)

    # Privacy check for patient
    if "patient" in roles and not any(r in ["admin", "doctor", "pharmacist", "nurse"] for r in roles):
        patient = Patient.query.filter_by(user_id=user_id).first()
        if not patient or prescription.patient_id != patient.id:
            return error_response("Access denied. You can only view your own prescriptions.", "FORBIDDEN", 403)

    return success_response(data=prescription.to_dict(with_items=True))


@prescriptions_bp.route("", methods=["POST"])
@jwt_required()
def create_prescription():
    """Create a new prescription with items (Doctor or Admin)."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    roles = [r.name for r in user.roles] if user else []

    if not any(r in ["doctor", "admin"] for r in roles):
        return error_response("Only doctors or administrators can issue prescriptions", "FORBIDDEN", 403)

    data = request.get_json() or {}
    patient_id = data.get("patient_id")
    if not patient_id:
        return error_response("Patient ID is required", "MISSING_PATIENT", 400)

    doctor = Doctor.query.filter_by(user_id=user_id).first()
    doctor_id = doctor.id if doctor else data.get("doctor_id")

    items_data = data.get("items", [])
    if not items_data:
        return error_response("At least one medication item is required", "MISSING_ITEMS", 400)

    prescription = Prescription(
        patient_id=patient_id,
        doctor_id=doctor_id,
        appointment_id=data.get("appointment_id"),
        notes=data.get("notes") or data.get("diagnosis"),
        status=Prescription.STATUS_PENDING,
    )
    db.session.add(prescription)
    db.session.flush()

    for item_data in items_data:
        med_id = item_data.get("medicine_id")
        med_name = item_data.get("medicine_name", "")
        if med_id and not med_name:
            med = Medicine.query.get(med_id)
            if med:
                med_name = med.name

        item = PrescriptionItem(
            prescription_id=prescription.id,
            medicine_id=med_id,
            medicine_name=med_name or "Medication",
            dosage=item_data.get("dosage", "1 dose"),
            frequency=item_data.get("frequency", "1-0-1"),
            duration=item_data.get("duration", "5 days"),
            quantity=int(item_data.get("quantity", 1)),
            instructions=item_data.get("instructions", "Take after meals"),
        )
        db.session.add(item)

    db.session.commit()

    # Emit socket notification to pharmacists and patient
    try:
        prescription_dict = prescription.to_dict(with_items=True)
        socketio.emit("prescription_created", {"prescription": prescription_dict}, room="role_pharmacist")
        patient = Patient.query.get(patient_id)
        if patient and patient.user_id:
            socketio.emit("new_notification", {
                "type": "prescription",
                "title": "New Prescription Issued",
                "message": f"Your doctor has prescribed {len(items_data)} medication(s).",
                "prescription_id": prescription.id,
            }, room=f"user_{patient.user_id}")
    except Exception:
        pass

    return success_response(data=prescription.to_dict(with_items=True), message="Prescription issued successfully", status_code=201)


@prescriptions_bp.route("/<int:prescription_id>/dispense", methods=["POST"])
@jwt_required()
def dispense_prescription(prescription_id):
    """Mark prescription as dispensed (Pharmacist or Admin)."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    roles = [r.name for r in user.roles] if user else []

    if not any(r in ["pharmacist", "admin"] for r in roles):
        return error_response("Only pharmacy staff can dispense prescriptions", "FORBIDDEN", 403)

    prescription = Prescription.query.get(prescription_id)
    if not prescription:
        return error_response("Prescription not found", "NOT_FOUND", 404)

    prescription.status = Prescription.STATUS_DISPENSED
    prescription.dispensed_by_user_id = user_id
    prescription.dispensed_date = datetime.now(timezone.utc)

    # Deduct stock for all items
    for item in prescription.items:
        item.is_dispensed = True
        item.dispensed_quantity = item.quantity
        if item.medicine_id:
            med = Medicine.query.get(item.medicine_id)
            if med:
                med.current_stock = max(0, med.current_stock - item.quantity)

    db.session.commit()

    try:
        patient = Patient.query.get(prescription.patient_id)
        if patient and patient.user_id:
            socketio.emit("new_notification", {
                "type": "prescription",
                "title": "Medications Dispensed",
                "message": f"Your prescription #{prescription.id} has been dispensed by the pharmacy.",
                "prescription_id": prescription.id,
            }, room=f"user_{patient.user_id}")
    except Exception:
        pass

    return success_response(data=prescription.to_dict(with_items=True), message="Prescription dispensed successfully")
