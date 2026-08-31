"""WebSocket event handlers using Flask-SocketIO."""
from datetime import datetime, timezone
from flask import request
from flask_socketio import emit, join_room, leave_room
from app.extensions import socketio, db
from app.models.user import User
from app.models.chat import ChatRoomMember, ChatMessage


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
