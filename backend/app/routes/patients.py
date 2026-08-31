"""Patient management routes."""
import random
from datetime import datetime, timezone, date
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.patient import Patient
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.auth import role_required, audit_log

patients_bp = Blueprint("patients", __name__)


@patients_bp.route("", methods=["GET"])
@jwt_required()
@role_required("admin", "doctor", "nurse", "receptionist")
def get_patients():
    """List patients with search and pagination."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search", "").strip()

    query = Patient.query.filter_by(is_active=True)

    if search:
        query = query.filter(
            (Patient.first_name.ilike(f"%{search}%")) |
            (Patient.last_name.ilike(f"%{search}%")) |
            (Patient.patient_id.ilike(f"%{search}%")) |
            (Patient.phone.ilike(f"%{search}%"))
        )

    total = query.count()
    patients = query.order_by(Patient.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return paginated_response(
        items=[p.to_dict(detailed=False) for p in patients],
        total=total,
        page=page,
        per_page=per_page,
    )


@patients_bp.route("/<int:patient_id>", methods=["GET"])
@jwt_required()
def get_patient(patient_id):
    """Get single patient details."""
    patient = Patient.query.get(patient_id)
    if not patient:
        return error_response("Patient not found", "NOT_FOUND", 404)
    return success_response(data=patient.to_dict(detailed=True))


@patients_bp.route("", methods=["POST"])
@jwt_required()
@role_required("admin", "receptionist")
def create_patient():
    """Register a new patient."""
    data = request.get_json() or {}

    # Generate unique patient ID
    last_patient = Patient.query.order_by(Patient.id.desc()).first()
    next_id = (last_patient.id + 1) if last_patient else 1
    patient_id_str = f"P{next_id:04d}"

    try:
        dob = datetime.strptime(data.get("date_of_birth"), "%Y-%m-%d").date()
    except Exception:
        return error_response("Invalid date of birth (YYYY-MM-DD)", "INVALID_DATE", 400)

    patient = Patient(
        patient_id=patient_id_str,
        first_name=data.get("first_name", "").strip(),
        last_name=data.get("last_name", "").strip(),
        date_of_birth=dob,
        gender=data.get("gender", "other"),
        blood_group=data.get("blood_group"),
        phone=data.get("phone", "").strip(),
        email=data.get("email"),
        address=data.get("address"),
        city=data.get("city"),
        state=data.get("state"),
        zip_code=data.get("zip_code"),
        allergies=data.get("allergies"),
        existing_conditions=data.get("existing_conditions"),
        medical_history=data.get("medical_history"),
        emergency_contact_name=data.get("emergency_contact_name"),
        emergency_contact_phone=data.get("emergency_contact_phone"),
        emergency_contact_relation=data.get("emergency_contact_relation"),
        insurance_provider=data.get("insurance_provider"),
        insurance_id=data.get("insurance_id"),
        is_active=True,
    )

    db.session.add(patient)
    db.session.commit()

    return success_response(data=patient.to_dict(detailed=True), message="Patient registered successfully", status_code=201)


@patients_bp.route("/<int:patient_id>", methods=["PUT"])
@jwt_required()
@role_required("admin", "receptionist", "doctor")
def update_patient(patient_id):
    """Update patient info."""
    patient = Patient.query.get(patient_id)
    if not patient:
        return error_response("Patient not found", "NOT_FOUND", 404)

    data = request.get_json() or {}

    for field in ["first_name", "last_name", "gender", "blood_group", "phone", "email",
                  "address", "city", "state", "zip_code", "allergies", "existing_conditions",
                  "medical_history", "emergency_contact_name", "emergency_contact_phone",
                  "emergency_contact_relation", "insurance_provider", "insurance_id"]:
        if field in data:
            setattr(patient, field, data[field])

    if "date_of_birth" in data and data["date_of_birth"]:
        try:
            patient.date_of_birth = datetime.strptime(data["date_of_birth"], "%Y-%m-%d").date()
        except Exception:
            pass

    db.session.commit()
    return success_response(data=patient.to_dict(detailed=True), message="Patient updated successfully")
