"""Department model."""
from datetime import datetime, timezone
from app.extensions import db


class Department(db.Model):
    __tablename__ = "departments"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    head_doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    doctors = db.relationship("Doctor", back_populates="department", foreign_keys="Doctor.department_id", lazy="dynamic")

    def __repr__(self):
        return f"<Department {self.name}>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "head_doctor_id": self.head_doctor_id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }
