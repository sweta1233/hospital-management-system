"""Chat routes."""
from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db, socketio
from app.models.chat import ChatRoom, ChatRoomMember, ChatMessage
from app.models.user import User
from app.utils.responses import success_response, error_response, paginated_response

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/rooms", methods=["GET"])
@jwt_required()
def get_rooms():
    """Get all chat rooms for current user with enriched details."""
    user_id = int(get_jwt_identity())
    memberships = ChatRoomMember.query.filter_by(user_id=user_id).all()

    room_list = []
    for m in memberships:
        if not m.room:
            continue
        room_dict = m.room.to_dict()
        room_dict["unread_count"] = m.unread_count

        # If direct room, resolve other member's display name and roles
        if m.room.room_type == ChatRoom.ROOM_TYPE_DIRECT:
            other_member = ChatRoomMember.query.filter(
                ChatRoomMember.room_id == m.room_id,
                ChatRoomMember.user_id != user_id
            ).first()
            if other_member and other_member.user:
                roles = [r.name for r in other_member.user.roles]
                room_dict["display_name"] = f"{other_member.user.full_name} ({', '.join(roles).title() if roles else 'User'})"
                room_dict["other_user_id"] = other_member.user_id
                room_dict["other_user_email"] = other_member.user.email
            else:
                room_dict["display_name"] = "Hospital Direct Chat"
        else:
            room_dict["display_name"] = m.room.name or "Group Chat"

        room_list.append(room_dict)

    # Sort rooms by updated_at descending
    room_list.sort(key=lambda x: x.get("updated_at") or "", reverse=True)
    return success_response(data=room_list)


@chat_bp.route("/rooms", methods=["POST"])
@jwt_required()
def create_room():
    """Create a new direct or group chat room."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    recipient_id = data.get("recipient_id")

    if recipient_id:
        recipient_id = int(recipient_id)
        if recipient_id == user_id:
            return error_response("Cannot create a direct chat with yourself", "INVALID_RECIPIENT", 400)

        # Check if direct room already exists
        user_rooms = {m.room_id for m in ChatRoomMember.query.filter_by(user_id=user_id).all()}
        recipient_rooms = {m.room_id for m in ChatRoomMember.query.filter_by(user_id=recipient_id).all()}
        common = user_rooms.intersection(recipient_rooms)
        for r_id in common:
            room = ChatRoom.query.get(r_id)
            if room and room.room_type == ChatRoom.ROOM_TYPE_DIRECT:
                return success_response(data=room.to_dict(), message="Room already exists")

    room = ChatRoom(
        room_type=data.get("room_type", ChatRoom.ROOM_TYPE_DIRECT),
        name=data.get("name"),
        created_by_user_id=user_id,
    )
    db.session.add(room)
    db.session.flush()

    # Add creator
    db.session.add(ChatRoomMember(room_id=room.id, user_id=user_id))
    # Add recipient
    if recipient_id:
        db.session.add(ChatRoomMember(room_id=room.id, user_id=recipient_id))

    db.session.commit()
    return success_response(data=room.to_dict(), message="Room created", status_code=201)


@chat_bp.route("/direct", methods=["POST"])
@chat_bp.route("/direct/<int:target_user_id>", methods=["GET", "POST"])
@jwt_required()
def get_or_create_direct_room(target_user_id=None):
    """Get or create direct chat room with target user."""
    user_id = int(get_jwt_identity())
    if target_user_id is None:
        data = request.get_json() or {}
        target_user_id = data.get("target_user_id") or data.get("recipient_id")
        if target_user_id:
            try:
                target_user_id = int(target_user_id)
            except (ValueError, TypeError):
                target_user_id = None

    if not target_user_id:
        return error_response("Target user ID is required", "MISSING_PARAM", 400)

    if target_user_id == user_id:
        return error_response("Cannot create a direct chat with yourself", "INVALID_RECIPIENT", 400)

    user_rooms = {m.room_id for m in ChatRoomMember.query.filter_by(user_id=user_id).all()}
    recipient_rooms = {m.room_id for m in ChatRoomMember.query.filter_by(user_id=target_user_id).all()}
    common = user_rooms.intersection(recipient_rooms)
    for r_id in common:
        room = ChatRoom.query.get(r_id)
        if room and room.room_type == ChatRoom.ROOM_TYPE_DIRECT:
            return success_response(data=room.to_dict())

    room = ChatRoom(
        room_type=ChatRoom.ROOM_TYPE_DIRECT,
        created_by_user_id=user_id,
    )
    db.session.add(room)
    db.session.flush()

    db.session.add(ChatRoomMember(room_id=room.id, user_id=user_id))
    db.session.add(ChatRoomMember(room_id=room.id, user_id=target_user_id))
    db.session.commit()

    return success_response(data=room.to_dict(), message="Direct room created", status_code=201)


@chat_bp.route("/rooms/<int:room_id>/messages", methods=["GET"])
@jwt_required()
def get_messages(room_id):
    """Get messages for a room."""
    user_id = int(get_jwt_identity())
    member = ChatRoomMember.query.filter_by(room_id=room_id, user_id=user_id).first()
    if not member:
        return error_response("Not a member of this room", "FORBIDDEN", 403)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 100, type=int)

    query = ChatMessage.query.filter_by(room_id=room_id)
    total = query.count()
    messages = query.order_by(ChatMessage.created_at.asc()).offset((page - 1) * per_page).limit(per_page).all()

    # Reset unread count
    member.unread_count = 0
    member.last_read_at = datetime.now(timezone.utc)
    db.session.commit()

    return paginated_response(
        items=[m.to_dict() for m in messages],
        total=total,
        page=page,
        per_page=per_page,
    )


@chat_bp.route("/rooms/<int:room_id>/messages", methods=["POST"])
@jwt_required()
def post_message(room_id):
    """Send a message to a room via REST endpoint."""
    user_id = int(get_jwt_identity())
    member = ChatRoomMember.query.filter_by(room_id=room_id, user_id=user_id).first()
    if not member:
        return error_response("Not a member of this room", "FORBIDDEN", 403)

    data = request.get_json() or {}
    message_text = data.get("message", "").strip()
    attachment_url = data.get("attachment_url")

    if not message_text and not attachment_url:
        return error_response("Message content is required", "MISSING_CONTENT", 400)

    msg = ChatMessage(
        room_id=room_id,
        sender_user_id=user_id,
        message=message_text,
        attachment_url=attachment_url,
    )
    db.session.add(msg)

    # Update room updated_at
    room = ChatRoom.query.get(room_id)
    if room:
        room.updated_at = datetime.now(timezone.utc)

    # Increment unread count for other members
    other_members = ChatRoomMember.query.filter(
        ChatRoomMember.room_id == room_id,
        ChatRoomMember.user_id != user_id
    ).all()
    for m in other_members:
        m.unread_count += 1

    db.session.commit()

    msg_dict = msg.to_dict()

    # Broadcast to SocketIO room
    try:
        socketio.emit("receive_message", msg_dict, room=f"chat_{room_id}")
        for m in other_members:
            socketio.emit("new_notification", {
                "type": "chat",
                "title": f"New message from {msg.sender.full_name if msg.sender else 'User'}",
                "message": message_text[:80],
                "room_id": room_id,
            }, room=f"user_{m.user_id}")
    except Exception:
        pass

    return success_response(data=msg_dict, message="Message sent successfully", status_code=201)


@chat_bp.route("/contacts", methods=["GET"])
@jwt_required()
def get_contacts():
    """List searchable contacts (doctors, nurses, staff, and patients) for chat initiation."""
    user_id = int(get_jwt_identity())
    search = request.args.get("search", "").strip()

    query = User.query.filter(User.id != user_id, User.is_active.is_(True))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            db.or_(
                User.first_name.ilike(search_filter),
                User.last_name.ilike(search_filter),
                User.email.ilike(search_filter),
                User.phone.ilike(search_filter),
            )
        )

    users = query.order_by(User.first_name.asc()).limit(50).all()

    contacts = []
    for u in users:
        roles = [r.name for r in u.roles]
        contacts.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "avatar_url": None,
            "roles": roles,
            "role_display": ", ".join(roles).replace("_", " ").title() if roles else "User",
        })

    return success_response(data=contacts)
