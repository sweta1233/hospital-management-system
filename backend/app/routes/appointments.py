"""Appointment management routes."""
from datetime import datetime, time, date
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db, socketio
from app.models.user import User
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.notification import Notification
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.auth import role_required

appointments_bp = Blueprint("appointments", __name__)


@appointments_bp.route("", methods=["GET"])
@jwt_required()
def get_appointments():
    """List appointments with filters."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    doctor_id = request.args.get("doctor_id", type=int)
    patient_id = request.args.get("patient_id", type=int)
    status = request.args.get("status")
    appt_date = request.args.get("date")

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    query = Appointment.query

    # Role-based scoping for patients
    if user and user.has_role("patient") and not user.has_role("admin"):
        pat = Patient.query.filter_by(user_id=user_id).first()
        if pat:
            query = query.filter_by(patient_id=pat.id)
    elif doctor_id:
        query = query.filter_by(doctor_id=doctor_id)

    if patient_id and (not user or not user.has_role("patient") or user.has_role("admin")):
        query = query.filter_by(patient_id=patient_id)
    if status:
        query = query.filter_by(status=status)
    if appt_date:
        try:
            d = datetime.strptime(appt_date, "%Y-%m-%d").date()
            query = query.filter_by(appointment_date=d)
        except Exception:
            pass

    total = query.count()
    appts = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.asc()).offset((page - 1) * per_page).limit(per_page).all()

    return paginated_response(
        items=[a.to_dict() for a in appts],
        total=total,
        page=page,
        per_page=per_page,
    )


@appointments_bp.route("", methods=["POST"])
@jwt_required()
def create_appointment():
    """Book a new appointment with conflict detection."""
    data = request.get_json() or {}
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    patient_id = data.get("patient_id")
    doctor_id = data.get("doctor_id")
    date_str = data.get("appointment_date")
    start_time_str = data.get("start_time")
    end_time_str = data.get("end_time")
    reason = data.get("reason") or data.get("reason_for_visit")

    # If patient is booking, automatically resolve patient_id from their user profile
    if user and user.has_role("patient") and not user.has_role("admin"):
        patient_obj = Patient.query.filter_by(user_id=user_id).first()
        if patient_obj:
            patient_id = patient_obj.id

    if not all([patient_id, doctor_id, date_str, start_time_str]):
        return error_response("Missing required appointment fields (patient, doctor, date, start_time)", "MISSING_FIELDS", 400)

    try:
        patient_id = int(patient_id)
        doctor_id = int(doctor_id)
        appt_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        start_t = datetime.strptime(start_time_str, "%H:%M").time()
        end_t = datetime.strptime(end_time_str, "%H:%M").time() if end_time_str else time(start_t.hour, (start_t.minute + 30) % 60)
    except Exception:
        return error_response("Invalid date or time format. Use YYYY-MM-DD and HH:MM", "INVALID_FORMAT", 400)

    # Check conflict
    conflict = Appointment.query.filter_by(
        doctor_id=doctor_id,
        appointment_date=appt_date,
        start_time=start_t,
    ).filter(Appointment.status.notin_([Appointment.STATUS_CANCELLED])).first()

    if conflict:
        return error_response("This time slot is already booked for the selected doctor.", "SLOT_UNAVAILABLE", 409)

    appointment = Appointment(
        patient_id=patient_id,
        doctor_id=doctor_id,
        appointment_date=appt_date,
        start_time=start_t,
        end_time=end_t,
        status=Appointment.STATUS_SCHEDULED,
        reason=reason,
        notes=data.get("notes"),
        booked_by_user_id=user_id,
    )

    db.session.add(appointment)
    db.session.commit()

    # Emit socket notification to doctor
    doctor = Doctor.query.get(doctor_id)
    if doctor and doctor.user_id:
        socketio.emit("appointment_updated", {
            "type": "new_appointment",
            "appointment": appointment.to_dict(),
        }, room=f"user_{doctor.user_id}")

    return success_response(data=appointment.to_dict(), message="Appointment booked successfully", status_code=201)


@appointments_bp.route("/<int:appointment_id>/status", methods=["PUT"])
@jwt_required()
def update_appointment_status(appointment_id):
    """Update appointment status (e.g. check-in, complete, cancel)."""
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return error_response("Appointment not found", "NOT_FOUND", 404)

    data = request.get_json() or {}
    new_status = data.get("status")

    if new_status not in Appointment.VALID_STATUSES:
        return error_response(f"Invalid status. Must be one of {Appointment.VALID_STATUSES}", "INVALID_STATUS", 400)

    appointment.status = new_status
    if new_status == Appointment.STATUS_CANCELLED:
        appointment.cancellation_reason = data.get("cancellation_reason")

    db.session.commit()

    # Emit real-time notification
    doctor = appointment.doctor
    if doctor and doctor.user_id:
        event_name = "patient_checked_in" if new_status == Appointment.STATUS_CHECKED_IN else "appointment_updated"
        socketio.emit(event_name, {
            "appointment": appointment.to_dict(),
            "status": new_status,
        }, room=f"user_{doctor.user_id}")

    return success_response(data=appointment.to_dict(), message=f"Appointment status updated to {new_status}")
