"""WebSocket event handlers using Flask-SocketIO."""
from datetime import datetime, timezone, date, timedelta
from flask import request
from flask_socketio import emit, join_room, leave_room
from app.extensions import socketio, db
from app.models.user import User
from app.models.chat import ChatRoomMember, ChatMessage
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.patient import Patient


@socketio.on("connect")
def handle_connect():
    """Handle client connection."""
    pass


@socketio.on("disconnect")
def handle_disconnect():
    """Handle client disconnection."""
    pass


@socketio.on("join_user_room")
def handle_join_user_room(data):
    """Join personal notification room and role-based room."""
    user_id = data.get("user_id")
    if user_id:
        join_room(f"user_{user_id}")
        user = User.query.get(int(user_id))
        if user:
            for role in user.roles:
                join_room(f"role_{role.name}")
        emit("joined", {"status": "success", "room": f"user_{user_id}"})


@socketio.on("join_chat_room")
def handle_join_chat_room(data):
    """Join a chat room."""
    room_id = data.get("room_id")
    if room_id:
        join_room(f"chat_{room_id}")
        emit("room_joined", {"room_id": room_id})


@socketio.on("leave_chat_room")
def handle_leave_chat_room(data):
    """Leave a chat room."""
    room_id = data.get("room_id")
    if room_id:
        leave_room(f"chat_{room_id}")


@socketio.on("send_message")
def handle_send_message(data):
    """Handle sending a real-time chat message."""
    room_id = data.get("room_id")
    sender_id = data.get("sender_id")
    text = data.get("message", "").strip()

    if not room_id or not sender_id or not text:
        return

    # Persist message to database
    msg = ChatMessage(
        room_id=room_id,
        sender_user_id=sender_id,
        message=text,
    )
    db.session.add(msg)

    # Increment unread count for other members
    other_members = ChatRoomMember.query.filter(
        ChatRoomMember.room_id == room_id,
        ChatRoomMember.user_id != sender_id
    ).all()
    for m in other_members:
        m.unread_count += 1

    db.session.commit()

    # Broadcast to room
    emit("receive_message", msg.to_dict(), room=f"chat_{room_id}")


@socketio.on("typing")
def handle_typing(data):
    """Handle typing indicator."""
    room_id = data.get("room_id")
    user_name = data.get("user_name")
    if room_id:
        emit("user_typing", {"user_name": user_name}, room=f"chat_{room_id}", include_self=False)


@socketio.on("stop_typing")
def handle_stop_typing(data):
    """Handle stop typing indicator."""
    room_id = data.get("room_id")
    if room_id:
        emit("user_stop_typing", {}, room=f"chat_{room_id}", include_self=False)


# ============================================================================
# WEBRTC VIDEO CALL SIGNALING & REAL-TIME ALERTS
# ============================================================================

@socketio.on("video_call_initiate")
def handle_video_call_initiate(data):
    """
    Handle initiating a video/audio consultation call.
    Validates caller permissions and time windows, then rings the receiver's dashboard.
    """
    appointment_id = data.get("appointment_id")
    caller_id = data.get("caller_id")
    caller_name = data.get("caller_name", "Medical Caller")
    caller_role = data.get("caller_role", "patient")
    receiver_id = data.get("receiver_id") or data.get("recipient_id")
    receiver_name = data.get("receiver_name") or data.get("recipient_name", "User")
    call_type = data.get("call_type", "video")

    # If appointment is provided, auto-resolve recipient if missing or verify ID
    if appointment_id:
        appt = Appointment.query.get(int(appointment_id))
        if appt:
            if not receiver_id:
                if caller_role == "doctor" or (appt.doctor and appt.doctor.user_id == caller_id):
                    receiver_id = appt.patient.user_id if appt.patient else None
                    receiver_name = appt.patient.full_name if appt.patient else receiver_name
                else:
                    receiver_id = appt.doctor.user_id if appt.doctor else None
                    receiver_name = (appt.doctor.user.full_name if appt.doctor and appt.doctor.user else receiver_name)

    if not caller_id or not receiver_id:
        emit("call_error", {"message": "Invalid caller or recipient identification."})
        return

    # Check caller authority and appointment time lock
    if appointment_id:
        appt = Appointment.query.get(int(appointment_id))
        if appt:
            caller_user = User.query.get(int(caller_id))

            # 1. Admin Calling Role Enforcement:
            # Admins cannot call patients as doctors unless they hold a doctor profile or appointment assignment
            if caller_user and caller_user.has_role("admin") and not caller_user.has_role("doctor"):
                if not (appt.doctor and appt.doctor.user_id == caller_id):
                    emit("call_error", {
                        "message": "Administrative accounts cannot initiate clinical video calls without a designated doctor assignment."
                    })
                    return

            # 2. Patient Calling Time-Gating:
            # Patients can only call during scheduled appointment time (within 15 min pre-window up to active window)
            if caller_user and caller_user.has_role("patient") and not caller_user.has_role("doctor") and not caller_user.has_role("admin"):
                today = date.today()
                if appt.appointment_date > today:
                    emit("call_error", {
                        "message": f"Appointment is scheduled for {appt.appointment_date.isoformat()} at {appt.start_time.strftime('%H:%M')}. Video calling is unlocked 15 minutes before the start time."
                    })
                    return
                elif appt.appointment_date < today and appt.status != Appointment.STATUS_CHECKED_IN:
                    emit("call_error", {
                        "message": f"This appointment from {appt.appointment_date.isoformat()} has expired. Please book a new consultation slot."
                    })
                    return

                # Time window check on same day
                now_time = datetime.now().time()
                appt_start_dt = datetime.combine(today, appt.start_time)
                window_start = (appt_start_dt - timedelta(minutes=15)).time()
                window_end = (appt_start_dt + timedelta(minutes=75)).time()

                if now_time < window_start and appt.status != Appointment.STATUS_CHECKED_IN:
                    emit("call_error", {
                        "message": f"Consultation room unlocks 15 minutes before scheduled start time ({appt.start_time.strftime('%H:%M')})."
                    })
                    return

    # Caller joins the consultation call room
    call_room = f"call_{appointment_id}" if appointment_id else f"call_direct_{caller_id}_{receiver_id}"
    join_room(call_room)

    call_payload = {
        "appointment_id": appointment_id,
        "call_room": call_room,
        "caller_id": caller_id,
        "caller_name": caller_name,
        "caller_role": caller_role,
        "receiver_id": receiver_id,
        "receiver_name": receiver_name,
        "call_type": call_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Notify caller that ringing has started
    emit("call_initiating", {
        "status": "ringing",
        "appointment_id": appointment_id,
        "call_room": call_room,
        "receiver_id": receiver_id,
        "receiver_name": receiver_name,
    })

    # Alert the receiver's personal user room across their active dashboard/pages
    emit("incoming_call", call_payload, room=f"user_{receiver_id}")


@socketio.on("video_call_accept")
def handle_video_call_accept(data):
    """Handle call acceptance by doctor or patient."""
    appointment_id = data.get("appointment_id")
    caller_id = data.get("caller_id")
    user_id = data.get("user_id")
    user_name = data.get("user_name", "Participant")
    call_room = data.get("call_room") or (f"call_{appointment_id}" if appointment_id else None)

    if call_room:
        join_room(call_room)

    accept_payload = {
        "appointment_id": appointment_id,
        "call_room": call_room,
        "accepted_by_id": user_id,
        "accepted_by_name": user_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if call_room:
        emit("call_accepted", accept_payload, room=call_room)

    if caller_id:
        emit("call_accepted", accept_payload, room=f"user_{caller_id}")


@socketio.on("video_call_reject")
def handle_video_call_reject(data):
    """Handle call rejection / decline / busy signal."""
    appointment_id = data.get("appointment_id")
    caller_id = data.get("caller_id")
    call_room = data.get("call_room") or (f"call_{appointment_id}" if appointment_id else None)
    reason = data.get("reason", "Call declined by user.")

    reject_payload = {
        "appointment_id": appointment_id,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if caller_id:
        emit("call_rejected", reject_payload, room=f"user_{caller_id}")

    if call_room:
        emit("call_rejected", reject_payload, room=call_room)
        leave_room(call_room)


@socketio.on("video_call_end")
def handle_video_call_end(data):
    """Handle ending an active consultation call."""
    appointment_id = data.get("appointment_id")
    user_id = data.get("user_id")
    call_room = data.get("call_room") or (f"call_{appointment_id}" if appointment_id else None)

    end_payload = {
        "appointment_id": appointment_id,
        "ended_by_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if call_room:
        emit("call_ended", end_payload, room=call_room)
        leave_room(call_room)


@socketio.on("video_call_signal")
def handle_video_call_signal(data):
    """
    Forward WebRTC SDP Offer, SDP Answer, or ICE candidate packets
    directly to the target peer's user room or call room.
    """
    target_user_id = data.get("target_user_id")
    call_room = data.get("call_room")

    if target_user_id:
        emit("video_call_signal", data, room=f"user_{target_user_id}")
    elif call_room:
        emit("video_call_signal", data, room=call_room, include_self=False)

