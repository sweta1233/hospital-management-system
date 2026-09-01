"""Appointment management routes."""
from datetime import datetime, time, date, timedelta
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db, socketio
from app.models.user import User
from app.models.appointment import Appointment
from app.models.doctor import Doctor, DoctorAvailability
from app.models.patient import Patient
from app.models.notification import Notification
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.auth import role_required

appointments_bp = Blueprint("appointments", __name__)


@appointments_bp.route("/available-slots", methods=["GET"])
@jwt_required()
def get_available_slots():
    """
    Get 1-month (up to 35 days) advance time slot grid for a doctor,
    annotating each slot with its availability and real-time locked status.
    """
    doctor_id = request.args.get("doctor_id", type=int)
    start_date_str = request.args.get("start_date")
    days_count = request.args.get("days", default=30, type=int)
    days_count = min(max(days_count, 1), 45)  # clamp between 1 and 45 days

    if not doctor_id:
        return error_response("doctor_id parameter is required.", "MISSING_DOCTOR_ID", 400)

    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return error_response("Doctor not found.", "NOT_FOUND", 404)

    today = date.today()
    if start_date_str:
        try:
            start_d = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except Exception:
            start_d = today
    else:
        start_d = today

    end_d = start_d + timedelta(days=days_count - 1)

    # Fetch all booked appointments for this doctor in this date window
    booked_appts = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date >= start_d,
        Appointment.appointment_date <= end_d,
        Appointment.status.notin_([Appointment.STATUS_CANCELLED]),
    ).all()

    # Map of (date_str, time_str) -> appointment info
    booked_map = {}
    for appt in booked_appts:
        d_str = appt.appointment_date.isoformat()
        t_str = appt.start_time.strftime("%H:%M")
        booked_map[(d_str, t_str)] = {
            "appointment_id": appt.id,
            "patient_id": appt.patient_id,
            "patient_name": appt.patient.full_name if appt.patient else "Booked Patient",
            "status": appt.status,
        }

    # Fetch custom doctor availabilities if any
    availabilities = DoctorAvailability.query.filter_by(doctor_id=doctor_id, is_active=True).all()
    avail_by_weekday = {}
    for a in availabilities:
        avail_by_weekday[a.day_of_week] = a

    default_times = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
        "16:00", "16:30", "17:00", "17:30", "18:00"
    ]

    now_time = datetime.now().time()
    days_data = []

    for i in range(days_count):
        cur_date = start_d + timedelta(days=i)
        cur_date_str = cur_date.isoformat()
        weekday = cur_date.weekday()  # 0 = Monday ... 6 = Sunday

        # Determine daily slots
        daily_slot_times = list(default_times)
        if weekday in avail_by_weekday:
            custom_avail = avail_by_weekday[weekday]
            if custom_avail.start_time and custom_avail.end_time:
                generated = []
                dur = custom_avail.slot_duration or 30
                curr = datetime.combine(cur_date, custom_avail.start_time)
                end_curr = datetime.combine(cur_date, custom_avail.end_time)
                while curr + timedelta(minutes=dur) <= end_curr:
                    generated.append(curr.strftime("%H:%M"))
                    curr += timedelta(minutes=dur)
                if generated:
                    daily_slot_times = generated

        # Compute slot states
        slots = []
        available_count = 0
        booked_count = 0

        for t_str in daily_slot_times:
            is_booked = (cur_date_str, t_str) in booked_map

            # Check if past
            is_past = False
            if cur_date < today:
                is_past = True
            elif cur_date == today:
                try:
                    slot_t = datetime.strptime(t_str, "%H:%M").time()
                    if slot_t <= now_time:
                        is_past = True
                except Exception:
                    pass

            is_available = (not is_booked) and (not is_past)
            if is_available:
                available_count += 1
            if is_booked:
                booked_count += 1

            # Calculate end time (30 min interval)
            try:
                start_dt = datetime.strptime(t_str, "%H:%M")
                end_t_str = (start_dt + timedelta(minutes=30)).strftime("%H:%M")
            except Exception:
                end_t_str = t_str

            booking_info = booked_map.get((cur_date_str, t_str))
            slots.append({
                "time": t_str,
                "start_time": t_str,
                "end_time": end_t_str,
                "is_available": is_available,
                "is_booked": is_booked,
                "is_past": is_past,
                "booked_by_patient_id": booking_info["patient_id"] if booking_info else None,
                "status": booking_info["status"] if booking_info else ("past" if is_past else "open"),
            })

        days_data.append({
            "date": cur_date_str,
            "day_name": cur_date.strftime("%A"),
            "formatted_date": cur_date.strftime("%b %d, %Y"),
            "total_slots": len(slots),
            "available_slots": available_count,
            "booked_slots": booked_count,
            "is_today": cur_date == today,
            "is_past_day": cur_date < today,
            "slots": slots,
        })

    return success_response(
        data={
            "doctor": doctor.to_dict(),
            "start_date": start_d.isoformat(),
            "end_date": end_d.isoformat(),
            "days_count": days_count,
            "schedule": days_data,
        },
        message="Available slots loaded successfully"
    )


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
        start_dt = datetime.combine(appt_date, start_t)
        if end_time_str:
            try:
                end_t = datetime.strptime(end_time_str, "%H:%M").time()
            except Exception:
                end_t = (start_dt + timedelta(minutes=30)).time()
        else:
            end_t = (start_dt + timedelta(minutes=30)).time()
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
