"""Staff management routes (admin only)."""
from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db, bcrypt
from app.models.user import User, Role
from app.models.doctor import Doctor
from app.models.department import Department
from app.utils.responses import success_response, error_response
from app.utils.auth import role_required
from functools import wraps
import re

staff_bp = Blueprint("staff", __name__)


def admin_required(fn):
    """Decorator to require admin role"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or not user.has_role("admin"):
            return error_response("Admin access required", "UNAUTHORIZED", 403)
        return fn(*args, **kwargs)
    return wrapper


@staff_bp.route("/users", methods=["GET"])
@admin_required
def list_staff():
    """
    List all staff users
    ---
    tags:
      - Staff Management
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search", "").strip()
    role_filter = request.args.get("role", "").strip()

    query = User.query

    # Exclude patients from staff list
    if role_filter:
        role = Role.query.filter_by(name=role_filter).first()
        if role:
            query = query.filter(User.roles.contains(role))
    else:
        # Get all non-patient users
        patient_role = Role.query.filter_by(name="patient").first()
        if patient_role:
            query = query.filter(~User.roles.contains(patient_role))

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            db.or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term),
                User.phone.ilike(search_term),
            )
        )

    query = query.order_by(User.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return success_response(
        data={
            "items": [user.to_dict() for user in pagination.items],
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }
    )


@staff_bp.route("/users", methods=["POST"])
@admin_required
def create_staff():
    """
    Create a new staff user
    ---
    tags:
      - Staff Management
    """
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    phone = data.get("phone", "").strip()
    role_name = data.get("role", "").strip().lower()

    # Validation
    if not all([email, password, first_name, last_name, role_name]):
        return error_response("All fields are required", "MISSING_FIELDS", 400)

    # Email validation
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return error_response("Invalid email format", "INVALID_EMAIL", 400)

    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return error_response("Email already registered", "EMAIL_EXISTS", 400)

    # Validate role
    valid_roles = ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_technician"]
    if role_name not in valid_roles:
        return error_response(f"Invalid role. Must be one of: {', '.join(valid_roles)}", "INVALID_ROLE", 400)

    # Password validation
    if len(password) < 8:
        return error_response("Password must be at least 8 characters long", "WEAK_PASSWORD", 400)

    try:
        # Create user
        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

        user = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            is_active=True,
        )

        # Assign role
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            role = Role(name=role_name, description=role_name.replace("_", " ").title())
            db.session.add(role)
            db.session.flush()

        user.roles.append(role)
        db.session.add(user)
        db.session.commit()

        # If doctor, create doctor profile
        if role_name == "doctor":
            specialization = data.get("specialization", "General Medicine")
            department_id = data.get("department_id")
            consultation_fee = data.get("consultation_fee", 0)
            qualification = data.get("qualification", "MD")
            license_number = data.get("license_number", f"LIC-{user.id:05d}")
            employee_id = data.get("employee_id", f"DOC{user.id:04d}")

            doctor = Doctor(
                user_id=user.id,
                employee_id=employee_id,
                specialization=specialization,
                qualification=qualification,
                license_number=license_number,
                department_id=department_id,
                consultation_fee=consultation_fee,
                is_active=True,
            )
            db.session.add(doctor)
            db.session.commit()

        # If nurse, create nurse profile
        elif role_name == "nurse":
            from app.models.nurse import Nurse
            department_id = data.get("department_id")
            qualification = data.get("qualification", "B.Sc Nursing / RN")
            experience_years = int(data.get("experience_years", 2))
            employee_id = data.get("employee_id", f"NUR{user.id:04d}")

            nurse = Nurse(
                user_id=user.id,
                employee_id=employee_id,
                qualification=qualification,
                department_id=department_id,
                experience_years=experience_years,
                is_active=True,
            )
            db.session.add(nurse)
            db.session.commit()

        return success_response(
            data=user.to_dict(),
            message=f"{role_name.replace('_', ' ').title()} account created successfully",
            status_code=201
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to create staff account: {str(e)}", "CREATE_ERROR", 500)


@staff_bp.route("/users/<int:user_id>", methods=["GET"])
@admin_required
def get_staff_user(user_id):
    """
    Get staff user details
    ---
    tags:
      - Staff Management
    """
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", "USER_NOT_FOUND", 404)

    response_data = user.to_dict()

    # If doctor, include doctor profile
    if user.has_role("doctor"):
        doctor = Doctor.query.filter_by(user_id=user.id).first()
        if doctor:
            response_data["doctor_profile"] = doctor.to_dict()

    return success_response(data=response_data)


@staff_bp.route("/users/<int:user_id>", methods=["PUT"])
@admin_required
def update_staff_user(user_id):
    """
    Update staff user
    ---
    tags:
      - Staff Management
    """
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", "USER_NOT_FOUND", 404)

    data = request.get_json() or {}

    # Update basic fields
    if "first_name" in data:
        user.first_name = data["first_name"].strip()
    if "last_name" in data:
        user.last_name = data["last_name"].strip()
    if "phone" in data:
        user.phone = data["phone"].strip()
    if "is_active" in data:
        user.is_active = bool(data["is_active"])

    db.session.commit()

    return success_response(data=user.to_dict(), message="User updated successfully")


@staff_bp.route("/users/<int:user_id>/activate", methods=["POST"])
@admin_required
def activate_user(user_id):
    """
    Activate staff account
    ---
    tags:
      - Staff Management
    """
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", "USER_NOT_FOUND", 404)

    user.is_active = True
    db.session.commit()

    return success_response(message="User activated successfully")


@staff_bp.route("/users/<int:user_id>/deactivate", methods=["POST"])
@admin_required
def deactivate_user(user_id):
    """
    Deactivate staff account
    ---
    tags:
      - Staff Management
    """
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", "USER_NOT_FOUND", 404)

    # Don't allow deactivating self
    current_user_id = int(get_jwt_identity())
    if user.id == current_user_id:
        return error_response("Cannot deactivate your own account", "CANNOT_DEACTIVATE_SELF", 400)

    user.is_active = False
    db.session.commit()

    return success_response(message="User deactivated successfully")


@staff_bp.route("/users/<int:user_id>/reset-password", methods=["POST"])
@admin_required
def admin_reset_password(user_id):
    """
    Admin reset user password
    ---
    tags:
      - Staff Management
    """
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", "USER_NOT_FOUND", 404)

    data = request.get_json() or {}
    new_password = data.get("new_password", "")

    if not new_password or len(new_password) < 8:
        return error_response("Password must be at least 8 characters long", "WEAK_PASSWORD", 400)

    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()

    return success_response(message="Password reset successfully")


@staff_bp.route("/roles", methods=["GET"])
@admin_required
def list_roles():
    """
    List all available roles
    ---
    tags:
      - Staff Management
    """
    roles = Role.query.all()
    return success_response(data=[role.to_dict() for role in roles])
