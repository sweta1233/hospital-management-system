"""Doctor management routes."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.models.doctor import Doctor
from app.utils.responses import success_response, paginated_response
from app.utils.auth import role_required

doctors_bp = Blueprint("doctors", __name__)


@doctors_bp.route("", methods=["GET"])
@jwt_required()
def get_doctors():
    """List doctors."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    specialization = request.args.get("specialization")

    query = Doctor.query.filter_by(is_active=True)
    if specialization:
        query = query.filter_by(specialization=specialization)

    total = query.count()
    doctors = query.offset((page - 1) * per_page).limit(per_page).all()

    return paginated_response(
        items=[d.to_dict() for d in doctors],
        total=total,
        page=page,
        per_page=per_page,
    )


@doctors_bp.route("/<int:doctor_id>", methods=["GET"])
@jwt_required()
def get_doctor(doctor_id):
    """Get doctor details."""
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return {"success": False, "message": "Doctor not found"}, 404
    return success_response(data=doctor.to_dict())
