"""Notification model."""
from datetime import datetime, timezone
from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    TYPE_APPOINTMENT = "appointment"
    TYPE_LAB_RESULT = "lab_result"
    TYPE_PRESCRIPTION = "prescription"
    TYPE_BILLING = "billing"
    TYPE_ADMISSION = "admission"
    TYPE_GENERAL = "general"
    TYPE_ALERT = "alert"
    TYPE_REMINDER = "reminder"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notification_type = db.Column(db.String(30), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    link_url = db.Column(db.String(255))  # Optional frontend route
    extra_data = db.Column(db.JSON)  # Store related IDs, extra data
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    read_at = db.Column(db.DateTime)

    user = db.relationship("User", back_populates="notifications")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "notification_type": self.notification_type,
            "title": self.title,
            "message": self.message,
            "is_read": self.is_read,
            "link_url": self.link_url,
            "extra_data": self.extra_data,
            "created_at": self.created_at.isoformat(),
            "read_at": self.read_at.isoformat() if self.read_at else None,
        }
