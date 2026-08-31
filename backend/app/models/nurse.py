"""Nurse model."""
from datetime import datetime, timezone
from app.extensions import db


class Nurse(db.Model):
    __tablename__ = "nurses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    employee_id = db.Column(db.String(20), unique=True, nullable=False)
    qualification = db.Column(db.String(255))
    experience_years = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = db.relationship("User", foreign_keys=[user_id])
    department = db.relationship("Department")
    vitals = db.relationship("Vital", back_populates="nurse", lazy="dynamic")

    def __repr__(self):
        return f"<Nurse {self.employee_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "user_id": self.user_id,
            "full_name": self.user.full_name if self.user else None,
            "email": self.user.email if self.user else None,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else None,
            "qualification": self.qualification,
            "experience_years": self.experience_years,
            "is_active": self.is_active,
        }
