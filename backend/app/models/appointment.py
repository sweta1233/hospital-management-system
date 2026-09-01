"""Appointment model."""
from datetime import datetime, timezone
from app.extensions import db


class Appointment(db.Model):
    __tablename__ = "appointments"

    STATUS_SCHEDULED = "scheduled"
    STATUS_CONFIRMED = "confirmed"
    STATUS_CHECKED_IN = "checked_in"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"
    STATUS_NO_SHOW = "no_show"

    VALID_STATUSES = [
        STATUS_SCHEDULED, STATUS_CONFIRMED, STATUS_CHECKED_IN,
        STATUS_COMPLETED, STATUS_CANCELLED, STATUS_NO_SHOW,
    ]

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    appointment_date = db.Column(db.Date, nullable=False, index=True)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), default=STATUS_SCHEDULED, nullable=False, index=True)
    reason = db.Column(db.Text)
    notes = db.Column(db.Text)
    cancellation_reason = db.Column(db.Text)
    booked_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Prevent double-booking: same doctor, same date, same start_time
    __table_args__ = (
        db.UniqueConstraint("doctor_id", "appointment_date", "start_time", name="uq_appointment_slot"),
    )

    # Relationships
    patient = db.relationship("Patient", back_populates="appointments")
    doctor = db.relationship("Doctor", back_populates="appointments")
    booked_by = db.relationship("User", foreign_keys=[booked_by_user_id])

    def __repr__(self):
        return f"<Appointment {self.id} {self.appointment_date} {self.status}>"

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": self.patient.full_name if self.patient else None,
            "patient_pid": self.patient.patient_id if self.patient else None,
            "patient_user_id": self.patient.user_id if (self.patient and self.patient.user_id) else None,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.user.full_name if self.doctor and self.doctor.user else None,
            "doctor_user_id": self.doctor.user_id if (self.doctor and self.doctor.user) else None,
            "doctor_specialization": self.doctor.specialization if self.doctor else None,
            "appointment_date": self.appointment_date.isoformat() if self.appointment_date else None,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
            "status": self.status,
            "reason": self.reason,
            "notes": self.notes,
            "cancellation_reason": self.cancellation_reason,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
