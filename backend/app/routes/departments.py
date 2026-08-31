"""Department management routes."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.department import Department
from app.utils.responses import success_response, error_response
from app.utils.auth import role_required

departments_bp = Blueprint("departments", __name__)


@departments_bp.route("", methods=["GET"])
@jwt_required()
def get_departments():
    """List all departments."""
    departments = Department.query.filter_by(is_active=True).all()
    return success_response(data=[d.to_dict() for d in departments])


@departments_bp.route("/<int:dept_id>", methods=["GET"])
@jwt_required()
def get_department(dept_id):
    """Get department details."""
    dept = Department.query.get(dept_id)
    if not dept:
        return error_response("Department not found", "NOT_FOUND", 404)
    return success_response(data=dept.to_dict())


@departments_bp.route("", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_department():
    """Create a new department."""
    data = request.get_json() or {}
    dept = Department(
        name=data.get("name"),
        description=data.get("description"),
        is_active=True,
    )
    db.session.add(dept)
    db.session.commit()
    return success_response(data=dept.to_dict(), message="Department created", status_code=201)
