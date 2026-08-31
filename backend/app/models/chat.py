"""Chat models: ChatRoom, ChatRoomMember, ChatMessage."""
from datetime import datetime, timezone
from app.extensions import db


class ChatRoom(db.Model):
    __tablename__ = "chat_rooms"

    ROOM_TYPE_DIRECT = "direct"
    ROOM_TYPE_GROUP = "group"

    id = db.Column(db.Integer, primary_key=True)
    room_type = db.Column(db.String(20), default=ROOM_TYPE_DIRECT, nullable=False)
    name = db.Column(db.String(200))  # For group rooms
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    created_by = db.relationship("User", foreign_keys=[created_by_user_id])
    members = db.relationship("ChatRoomMember", back_populates="room", cascade="all, delete-orphan")
    messages = db.relationship("ChatMessage", back_populates="room", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "room_type": self.room_type,
            "name": self.name,
            "created_by_user_id": self.created_by_user_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "members": [m.to_dict() for m in self.members],
            "last_message": self.messages.order_by(ChatMessage.created_at.desc()).first().to_dict() if self.messages.count() > 0 else None,
        }


class ChatRoomMember(db.Model):
    __tablename__ = "chat_room_members"

    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    unread_count = db.Column(db.Integer, default=0, nullable=False)
    last_read_at = db.Column(db.DateTime)
    joined_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        db.UniqueConstraint("room_id", "user_id", name="uq_room_member"),
    )

    room = db.relationship("ChatRoom", back_populates="members")
    user = db.relationship("User", back_populates="chat_rooms")

    def to_dict(self):
        return {
            "id": self.id,
            "room_id": self.room_id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "user_email": self.user.email if self.user else None,
            "unread_count": self.unread_count,
            "last_read_at": self.last_read_at.isoformat() if self.last_read_at else None,
            "joined_at": self.joined_at.isoformat(),
        }


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    message = db.Column(db.Text, nullable=False)
    attachment_url = db.Column(db.String(255))
    is_system_message = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    room = db.relationship("ChatRoom", back_populates="messages")
    sender = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "room_id": self.room_id,
            "sender_user_id": self.sender_user_id,
            "sender_name": self.sender.full_name if self.sender else "System",
            "message": self.message,
            "attachment_url": self.attachment_url,
            "is_system_message": self.is_system_message,
            "created_at": self.created_at.isoformat(),
        }
