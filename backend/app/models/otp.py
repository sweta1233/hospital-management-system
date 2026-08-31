"""OTP model for email and phone verification."""
from datetime import datetime, timezone
from app.extensions import db


class OTP(db.Model):
    __tablename__ = "otps"

    id = db.Column(db.Integer, primary_key=True)
    identifier = db.Column(db.String(120), nullable=False, index=True)  # email or phone number
    otp_code = db.Column(db.String(10), nullable=False)
    purpose = db.Column(db.String(50), default="login", nullable=False)  # "login", "reset_password", "register"
    channel = db.Column(db.String(20), default="email", nullable=False)  # "email", "phone"
    is_used = db.Column(db.Boolean, default=False, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def is_valid(self, code: str) -> bool:
        """Check if OTP is valid and unexpired."""
        now = datetime.now(timezone.utc)
        expires = self.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return not self.is_used and self.otp_code == code and expires > now
