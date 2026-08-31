"""Vitals routes."""
from decimal import Decimal
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.vital import Vital
from app.models.nurse import Nurse
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.auth import role_required

vitals_bp = Blueprint("vitals", __name__)


@vitals_bp.route("", methods=["GET"])
@jwt_required()
def get_vitals():
    """List vitals, optionally filtered by patient_id."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    patient_id = request.args.get("patient_id", type=int)

    query = Vital.query
    if patient_id:
        query = query.filter_by(patient_id=patient_id)

    total = query.count()
    vitals = query.order_by(Vital.recorded_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return paginated_response(
        items=[v.to_dict() for v in vitals],
        total=total,
        page=page,
        per_page=per_page,
    )


@vitals_bp.route("", methods=["POST"])
@jwt_required()
@role_required("nurse", "doctor")
def create_vital():
    """Record patient vitals."""
    data = request.get_json() or {}
    user_id = int(get_jwt_identity())
    nurse = Nurse.query.filter_by(user_id=user_id).first()

    # Calculate BMI if height and weight are provided
    weight = data.get("weight")
    height = data.get("height")
    bmi = None
    if weight and height:
        try:
            h_m = float(height) / 100.0
            bmi = round(float(weight) / (h_m * h_m), 2)
        except Exception:
            pass

    vital = Vital(
        patient_id=data.get("patient_id"),
        nurse_id=nurse.id if nurse else None,
        appointment_id=data.get("appointment_id"),
        temperature=data.get("temperature"),
        blood_pressure_systolic=data.get("blood_pressure_systolic"),
        blood_pressure_diastolic=data.get("blood_pressure_diastolic"),
        heart_rate=data.get("heart_rate"),
        respiratory_rate=data.get("respiratory_rate"),
        oxygen_saturation=data.get("oxygen_saturation"),
        weight=weight,
        height=height,
        bmi=bmi,
        notes=data.get("notes"),
    )
    db.session.add(vital)
    db.session.commit()

    return success_response(data=vital.to_dict(), message="Vitals recorded", status_code=201)
