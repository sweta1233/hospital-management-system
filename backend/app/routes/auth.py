"""Authentication blueprint with complete patient registration and staff login."""
from datetime import datetime, timezone, timedelta, date
from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from app.extensions import db, bcrypt, limiter
from app.models.user import User, Role
from app.models.patient import Patient
from app.utils.responses import success_response, error_response
from app.utils.auth import audit_log
import secrets
import re

auth_bp = Blueprint("auth", __name__)


def generate_patient_id():
    """Generate unique patient ID like PAT000001"""
    try:
        last_patient = Patient.query.order_by(Patient.id.desc()).first()
        if last_patient and last_patient.patient_id:
            num = int(last_patient.patient_id.replace("PAT", ""))
            return f"PAT{num + 1:06d}"
    except Exception:
        pass
    import time
    return f"PAT{int(time.time()) % 1000000:06d}"


@auth_bp.route("/register", methods=["POST"])
@auth_bp.route("/patient/register", methods=["POST"])
def patient_register():
    """
    Patient self-registration
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
            - first_name
            - last_name
            - phone
          properties:
            email:
              type: string
            password:
              type: string
            confirm_password:
              type: string
            first_name:
              type: string
            last_name:
              type: string
            phone:
              type: string
            date_of_birth:
              type: string
              format: date
            gender:
              type: string
              enum: [male, female, other]
            blood_group:
              type: string
            address:
              type: string
            emergency_contact_name:
              type: string
            emergency_contact_phone:
              type: string
    responses:
      201:
        description: Patient registered successfully
      400:
        description: Invalid data or email already in use
    """
    data = request.get_json() or {}

    # Extract and validate fields
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")
    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    phone = data.get("phone", "").strip()
    date_of_birth = data.get("date_of_birth", "2000-01-01").strip() or "2000-01-01"
    gender = data.get("gender", "other").strip().lower() or "other"
    blood_group = data.get("blood_group", "").strip()
    address = data.get("address", "").strip()
    emergency_contact_name = data.get("emergency_contact_name", "").strip()
    emergency_contact_phone = data.get("emergency_contact_phone", "").strip()

    # Validation
    if not all([email, password, first_name, last_name, phone]):
        return error_response("All required fields must be filled (email, password, first_name, last_name, phone)", "MISSING_FIELDS", 400)

    # Email validation
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return error_response("Invalid email format", "INVALID_EMAIL", 400)

    # Password validation
    if len(password) < 8:
        return error_response("Password must be at least 8 characters long", "WEAK_PASSWORD", 400)

    if confirm_password and password != confirm_password:
        return error_response("Passwords do not match", "PASSWORD_MISMATCH", 400)

    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return error_response("This email is already registered. Please login or use a different email.", "EMAIL_EXISTS", 400)

    # Check if phone already exists
    if Patient.query.filter_by(phone=phone).first():
        return error_response("This phone number is already registered", "PHONE_EXISTS", 400)

    # Gender validation
    if gender not in ['male', 'female', 'other']:
        return error_response("Gender must be male, female, or other", "INVALID_GENDER", 400)

    try:
        # Parse date of birth
        from datetime import datetime
        dob = datetime.strptime(date_of_birth, "%Y-%m-%d").date()

        # Check age (must be at least 1 year old)
        today = datetime.now().date()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        if age < 1 or age > 120:
            return error_response("Invalid date of birth", "INVALID_DOB", 400)

    except ValueError:
        return error_response("Invalid date format. Use YYYY-MM-DD", "INVALID_DATE_FORMAT", 400)

    try:
        # Pre-compute patient ID
        new_patient_id = generate_patient_id()

        # Create User account
        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

        user = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            is_active=True,
        )

        # Assign patient role
        patient_role = Role.query.filter_by(name="patient").first()
        if not patient_role:
            # Create patient role if it doesn't exist
            patient_role = Role(name="patient", description="Patient")
            db.session.add(patient_role)
            db.session.flush()

        user.roles.append(patient_role)
        db.session.add(user)
        db.session.flush()

        # Create Patient profile
        patient = Patient(
            patient_id=new_patient_id,
            user_id=user.id,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=dob,
            gender=gender,
            blood_group=blood_group or None,
            phone=phone,
            email=email,
            address=address or None,
            emergency_contact_name=emergency_contact_name or None,
            emergency_contact_phone=emergency_contact_phone or None,
            is_active=True,
        )
        db.session.add(patient)
        db.session.commit()

        # Auto-login: generate tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return success_response(
            data={
                "user": user.to_dict(),
                "patient": patient.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
            },
            message="Registration successful! Welcome to the hospital portal.",
            status_code=201
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f"Registration failed: {str(e)}", "REGISTRATION_ERROR", 500)


@auth_bp.route("/staff/register", methods=["POST"])
def staff_register():
    """
    Hospital staff self-registration for Doctors, Nurses, Receptionists, Pharmacists, Lab Techs, and Admins.
    ---
    tags:
      - Authentication
    """
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    phone = data.get("phone", "").strip()
    role_name = data.get("role", "").strip().lower()

    if not all([email, password, first_name, last_name, role_name]):
        return error_response("All basic fields (First Name, Last Name, Email, Phone, Password, Role) are required", "MISSING_FIELDS", 400)

    # Email format
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return error_response("Invalid email address format", "INVALID_EMAIL", 400)

    if User.query.filter_by(email=email).first():
        return error_response("An account with this email already exists. Please log in.", "EMAIL_EXISTS", 400)

    valid_roles = ["doctor", "nurse", "receptionist", "pharmacist", "lab_technician", "admin"]
    if role_name not in valid_roles:
        return error_response(f"Invalid role. Must be one of: {', '.join(valid_roles)}", "INVALID_ROLE", 400)

    if len(password) < 8:
        return error_response("Password must be at least 8 characters long", "WEAK_PASSWORD", 400)

    try:
        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        user = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            is_active=True,
        )

        role = Role.query.filter_by(name=role_name).first()
        if not role:
            role = Role(name=role_name, description=role_name.replace("_", " ").title())
            db.session.add(role)
            db.session.flush()

        user.roles.append(role)
        db.session.add(user)
        db.session.flush()

        # Role specific clinical profile instantiation
        if role_name == "doctor":
            from app.models.doctor import Doctor
            specialization = data.get("specialization", "General Medicine")
            qualification = data.get("qualification", "MBBS, MD")
            license_number = data.get("license_number", f"LIC-{user.id:05d}")
            consultation_fee = float(data.get("consultation_fee", 50.0))
            department_id = data.get("department_id")
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

        elif role_name == "nurse":
            from app.models.nurse import Nurse
            qualification = data.get("qualification", "B.Sc Nursing / RN")
            experience_years = int(data.get("experience_years", 2))
            department_id = data.get("department_id")
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

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return success_response(
            data={
                "user": user.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
            },
            message=f"{role_name.replace('_', ' ').title()} account registered successfully!",
            status_code=201,
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f"Staff registration failed: {str(e)}", "REGISTRATION_ERROR", 500)


@auth_bp.route("/patient/login", methods=["POST"])
@limiter.limit("10/minute")
def patient_login():
    """
    Patient login
    ---
    tags:
      - Authentication
    """
    data = request.get_json() or {}
    email_or_phone = data.get("email", "").strip()
    password = data.get("password", "")

    if not email_or_phone or not password:
        return error_response("Email/phone and password are required", "MISSING_CREDENTIALS", 400)

    # Try to find user by email or phone
    user = User.query.filter_by(email=email_or_phone.lower()).first()

    if not user:
        # Try to find by phone through patient
        patient = Patient.query.filter_by(phone=email_or_phone).first()
        if patient and patient.user_id:
            user = User.query.get(patient.user_id)

    if not user:
        return error_response("Account not found. Please check your credentials or register.", "ACCOUNT_NOT_FOUND", 404)

    if not bcrypt.check_password_hash(user.password_hash, password):
        return error_response("Invalid password. Please try again.", "INVALID_PASSWORD", 401)

    if not user.is_active:
        return error_response("Your account has been deactivated. Please contact hospital administration.", "ACCOUNT_DISABLED", 403)

    # Verify user has patient role
    if not user.has_role("patient"):
        return error_response("This is not a patient account. Please use staff login.", "NOT_PATIENT", 403)

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    # Generate tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    # Get patient profile
    patient = Patient.query.filter_by(user_id=user.id).first()

    return success_response(
        data={
            "user": user.to_dict(),
            "patient": patient.to_dict() if patient else None,
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        message="Login successful! Welcome back.",
    )


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10/minute")
def login():
    """
    Universal login endpoint (works for both patient and staff).
    ---
    tags:
      - Authentication
    """
    data = request.get_json() or {}
    email_or_phone = data.get("email", "").strip()
    password = data.get("password", "")

    if not email_or_phone or not password:
        return error_response("Email/phone and password are required", "MISSING_CREDENTIALS", 400)

    user = User.query.filter_by(email=email_or_phone.lower()).first()
    if not user:
        patient = Patient.query.filter_by(phone=email_or_phone).first()
        if patient and patient.user_id:
            user = User.query.get(patient.user_id)

    if not user:
        return error_response("Account not found. Please check your credentials.", "ACCOUNT_NOT_FOUND", 404)

    if not bcrypt.check_password_hash(user.password_hash, password):
        return error_response("Invalid password. Please try again.", "INVALID_PASSWORD", 401)

    if not user.is_active:
        return error_response("Your account has been deactivated. Please contact support.", "ACCOUNT_DISABLED", 403)

    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    response_data = {
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }

    if user.has_role("patient"):
        patient = Patient.query.filter_by(user_id=user.id).first()
        if patient:
            response_data["patient"] = patient.to_dict()

    return success_response(
        data=response_data,
        message="Login successful! Welcome back."
    )


@auth_bp.route("/staff/login", methods=["POST"])
@limiter.limit("10/minute")
def staff_login():
    """
    Staff login (Admin, Doctor, Nurse, Receptionist, Pharmacist, Lab Tech)
    ---
    tags:
      - Authentication
    """
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return error_response("Email and password are required", "MISSING_CREDENTIALS", 400)

    user = User.query.filter_by(email=email).first()

    if not user:
        return error_response("Account not found. Please check your email.", "ACCOUNT_NOT_FOUND", 404)

    if not bcrypt.check_password_hash(user.password_hash, password):
        return error_response("Invalid password. Please try again.", "INVALID_PASSWORD", 401)

    if not user.is_active:
        return error_response("Your account has been deactivated. Please contact IT support.", "ACCOUNT_DISABLED", 403)

    # Verify user is staff (not just a patient)
    staff_roles = ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_technician"]
    if not any(user.has_role(role) for role in staff_roles):
        return error_response("This is not a staff account. Please use patient login.", "NOT_STAFF", 403)

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    # Generate tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return success_response(
        data={
            "user": user.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        message="Login successful! Welcome to the clinical portal.",
    )


@auth_bp.route("/forgot-password", methods=["POST"])
@limiter.limit("5/hour")
def forgot_password():
    """
    Request password reset token
    ---
    tags:
      - Authentication
    """
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return error_response("Email is required", "MISSING_EMAIL", 400)

    user = User.query.filter_by(email=email).first()

    # Always return success to prevent email enumeration
    if not user:
        return success_response(
            message="If an account exists with this email, you will receive password reset instructions."
        )

    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.session.commit()

    # TODO: Send email with reset link
    # For now, just return the token (in production, send via email)
    return success_response(
        data={"reset_token": reset_token},  # Remove this in production
        message="If an account exists with this email, you will receive password reset instructions."
    )


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """
    Reset password using token
    ---
    tags:
      - Authentication
    """
    data = request.get_json() or {}
    token = data.get("token", "").strip()
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not token or not new_password:
        return error_response("Token and new password are required", "MISSING_FIELDS", 400)

    if len(new_password) < 8:
        return error_response("Password must be at least 8 characters long", "WEAK_PASSWORD", 400)

    if confirm_password and new_password != confirm_password:
        return error_response("Passwords do not match", "PASSWORD_MISMATCH", 400)

    user = User.query.filter_by(password_reset_token=token).first()

    if not user:
        return error_response("Invalid or expired reset token", "INVALID_TOKEN", 400)

    # Check if token has expired
    if user.password_reset_expires:
        expires = user.password_reset_expires
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            return error_response("Reset token has expired. Please request a new one.", "EXPIRED_TOKEN", 400)

    # Update password
    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    user.password_reset_token = None
    user.password_reset_expires = None
    db.session.commit()

    return success_response(message="Password reset successful! You can now login with your new password.")


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token
    ---
    tags:
      - Authentication
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user or not user.is_active:
        return error_response("User not found or inactive", "USER_NOT_FOUND", 404)

    access_token = create_access_token(identity=str(user.id))
    return success_response(data={"access_token": access_token}, message="Token refreshed")


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """
    Get current logged in user details
    ---
    tags:
      - Authentication
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return error_response("User not found", "USER_NOT_FOUND", 404)

    response_data = user.to_dict()

    # If user is a patient, include patient profile
    if user.has_role("patient"):
        patient = Patient.query.filter_by(user_id=user.id).first()
        if patient:
            response_data["patient"] = patient.to_dict(detailed=True)

    return success_response(data=response_data)


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Logout user (token should be invalidated on client side)
    ---
    tags:
      - Authentication
    """
    # In a production system, you would add the token to a blocklist
    # For now, the client will remove the token
    return success_response(message="Logged out successfully")


@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    """
    Change user password
    ---
    tags:
      - Authentication
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    data = request.get_json() or {}
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not current_password or not new_password:
        return error_response("Current and new password are required", "MISSING_FIELDS", 400)

    if not bcrypt.check_password_hash(user.password_hash, current_password):
        return error_response("Current password is incorrect", "INVALID_PASSWORD", 400)

    if len(new_password) < 8:
        return error_response("New password must be at least 8 characters long", "WEAK_PASSWORD", 400)

    if confirm_password and new_password != confirm_password:
        return error_response("Passwords do not match", "PASSWORD_MISMATCH", 400)

    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()

    return success_response(message="Password changed successfully")


def find_user_by_identifier(identifier: str):
    """Find user by email or flexible phone lookup."""
    clean_id = identifier.strip()
    if not clean_id:
        return None, "email"
    if "@" in clean_id:
        return User.query.filter_by(email=clean_id.lower()).first(), "email"

    # Exact phone search
    user = User.query.filter_by(phone=clean_id).first()
    if not user:
        patient = Patient.query.filter_by(phone=clean_id).first()
        if patient and patient.user_id:
            user = User.query.get(patient.user_id)

    # Partial digit matching (e.g. ignoring +91 or dashes)
    if not user:
        digits = re.sub(r"\D", "", clean_id)
        if len(digits) >= 6:
            search_digits = digits[-10:] if len(digits) >= 10 else digits
            user = User.query.filter(User.phone.ilike(f"%{search_digits}%")).first()
            if not user:
                pat = Patient.query.filter(Patient.phone.ilike(f"%{search_digits}%")).first()
                if pat and pat.user_id:
                    user = User.query.get(pat.user_id)

    return user, "phone"


@auth_bp.route("/send-otp", methods=["POST"])
@limiter.limit("15/minute")
def send_otp():
    """
    Send a 6-digit OTP to user's email or phone for login.
    ---
    tags:
      - Authentication
    """
    from app.models.otp import OTP
    import random

    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip()
    portal = data.get("portal", "any").strip().lower()  # "patient", "staff", or "any"

    if not identifier:
        return error_response("Email or phone number is required", "MISSING_IDENTIFIER", 400)

    # Find matching user
    user, channel = find_user_by_identifier(identifier)

    if not user:
        if portal == "staff":
            return error_response(
                "Staff account not found with this email or phone. Please register as hospital staff first.",
                "STAFF_ACCOUNT_NOT_FOUND",
                404
            )
        # For patient portal: Auto-provision patient account for instant passwordless OTP onboarding
        try:
            temp_pass = f"Pass_{random.randint(100000, 999999)}!"
            first_name = "Patient"
            if "@" in identifier:
                first_name = identifier.split("@")[0].replace(".", " ").title()[:20]
            last_name = "User"

            user = User(
                email=identifier.lower() if "@" in identifier else f"patient_{int(datetime.now().timestamp())}@hms.local",
                phone=identifier if "@" not in identifier else None,
                password_hash=bcrypt.generate_password_hash(temp_pass).decode("utf-8"),
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_verified=False,
            )
            patient_role = Role.query.filter_by(name="patient").first()
            if not patient_role:
                patient_role = Role(name="patient", description="Patient")
                db.session.add(patient_role)
                db.session.flush()
            user.roles.append(patient_role)
            db.session.add(user)
            db.session.flush()

            patient_rec = Patient(
                patient_id=f"PAT{int(datetime.now().timestamp()) % 100000:05d}",
                user_id=user.id,
                first_name=first_name,
                last_name=last_name,
                email=user.email,
                phone=user.phone or "+1000000000",
                date_of_birth=date(1995, 1, 1),
                gender="other",
                is_active=True,
            )
            db.session.add(patient_rec)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return error_response(f"Could not initialize patient record: {str(e)}", "ONBOARDING_ERROR", 500)

    if not user.is_active:
        return error_response("Your account has been deactivated. Please contact administration.", "ACCOUNT_DISABLED", 403)

    # Portal validation
    if portal == "staff":
        staff_roles = ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_technician"]
        if not any(user.has_role(role) for role in staff_roles):
            return error_response("This account is not authorized for staff access.", "NOT_STAFF", 403)
    elif portal == "patient":
        if not user.has_role("patient"):
            return error_response("This account is not registered as a patient.", "NOT_PATIENT", 403)

    # Generate 6-digit OTP
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Invalidate previous unused OTPs for this identifier and user email/phone
    OTP.query.filter(
        (OTP.identifier == identifier.lower()) |
        (OTP.identifier == (user.email.lower() if user.email else "")) |
        (OTP.identifier == (user.phone if user.phone else ""))
    ).filter_by(is_used=False).update({"is_used": True}, synchronize_session=False)

    otp_record = OTP(
        identifier=identifier.lower(),
        otp_code=code,
        purpose="login",
        channel=channel,
        is_used=False,
        expires_at=expires_at,
    )
    db.session.add(otp_record)
    db.session.commit()

    # Dispatch real email/SMS notifications
    from app.services.notification_service import send_email_otp, send_sms_otp
    recipient_name = user.full_name if user else "Valued Patient"
    dispatch_res = {}
    if channel == "email":
        target_email = user.email or identifier
        dispatch_res = send_email_otp(to_email=target_email, otp_code=code, recipient_name=recipient_name)
    else:
        target_phone = user.phone or identifier
        dispatch_res = send_sms_otp(phone_number=target_phone, otp_code=code)

    print(f"==================================================")
    print(f"[OTP SERVICE] Sent OTP {code} to {channel}: {identifier} | Status: {dispatch_res}")
    print(f"==================================================")

    # Return response
    return success_response(
        data={
            "identifier": identifier,
            "channel": channel,
            "dispatch_info": {
                "delivered": dispatch_res.get("delivered", False),
                "method": dispatch_res.get("method", channel),
                "simulated": dispatch_res.get("simulated", False),
                "note": dispatch_res.get("note", None),
            },
            "expires_in_seconds": 600,
        },
        message=f"A 6-digit verification code has been sent to your {channel} ({identifier})."
    )


@auth_bp.route("/verify-otp", methods=["POST"])
@limiter.limit("20/minute")
def verify_otp():
    """
    Verify 6-digit OTP and issue JWT access & refresh tokens.
    ---
    tags:
      - Authentication
    """
    from app.models.otp import OTP

    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip()
    otp_code = data.get("otp_code", "").strip()
    portal = data.get("portal", "any").strip().lower()

    if not identifier or not otp_code:
        return error_response("Identifier and OTP code are required", "MISSING_FIELDS", 400)

    user, channel = find_user_by_identifier(identifier)

    # Find the latest unused OTP record by identifier or user email/phone
    query_identifiers = [identifier.lower()]
    if user:
        if user.email:
            query_identifiers.append(user.email.lower())
        if user.phone:
            query_identifiers.append(user.phone)

    otp_record = OTP.query.filter(
        OTP.identifier.in_(query_identifiers),
        OTP.is_used == False,
        OTP.purpose == "login"
    ).order_by(OTP.id.desc()).first()

    if not otp_record:
        return error_response("No OTP request found. Please request a new code.", "NO_OTP", 400)

    if not otp_record.is_valid(otp_code):
        now = datetime.now(timezone.utc)
        expires = otp_record.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires <= now:
            return error_response("OTP has expired. Please request a new code.", "OTP_EXPIRED", 400)
        return error_response("Invalid OTP code. Please check and try again.", "INVALID_OTP", 401)

    # Mark OTP as used
    otp_record.is_used = True
    db.session.commit()

    if not user or not user.is_active:
        return error_response("User account not found or inactive.", "USER_NOT_FOUND", 404)

    # Portal validation
    if portal == "staff":
        staff_roles = ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_technician"]
        if not any(user.has_role(role) for role in staff_roles):
            return error_response("This is not a staff account.", "NOT_STAFF", 403)
    elif portal == "patient":
        if not user.has_role("patient"):
            return error_response("This is not a patient account.", "NOT_PATIENT", 403)

    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    # Generate JWT tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    response_data = {
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }

    if user.has_role("patient"):
        patient = Patient.query.filter_by(user_id=user.id).first()
        if patient:
            response_data["patient"] = patient.to_dict(detailed=True)

    return success_response(
        data=response_data,
        message="OTP verified successfully! Welcome back."
    )

