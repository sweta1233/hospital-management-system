"""Medical Records management routes."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.medical_record import MedicalRecord
from app.models.doctor import Doctor
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.auth import role_required

medical_records_bp = Blueprint("medical_records", __name__)


@medical_records_bp.route("", methods=["GET"])
@jwt_required()
def get_medical_records():
    """List medical records with optional patient_id filter."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    patient_id = request.args.get("patient_id", type=int)

    query = MedicalRecord.query
    if patient_id:
        query = query.filter_by(patient_id=patient_id)

    total = query.count()
    records = query.order_by(MedicalRecord.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return paginated_response(
        items=[r.to_dict() for r in records],
        total=total,
        page=page,
        per_page=per_page,
    )


@medical_records_bp.route("", methods=["POST"])
@jwt_required()
@role_required("doctor")
def create_medical_record():
    """Create a medical record."""
    data = request.get_json() or {}
    user_id = int(get_jwt_identity())
    doctor = Doctor.query.filter_by(user_id=user_id).first()

    record = MedicalRecord(
        patient_id=data.get("patient_id"),
        doctor_id=doctor.id if doctor else None,
        appointment_id=data.get("appointment_id"),
        diagnosis=data.get("diagnosis", ""),
        symptoms=data.get("symptoms"),
        clinical_notes=data.get("clinical_notes"),
        treatment_plan=data.get("treatment_plan"),
        follow_up_instructions=data.get("follow_up_instructions"),
    )
    db.session.add(record)
    db.session.commit()

    return success_response(data=record.to_dict(), message="Medical record created", status_code=201)
