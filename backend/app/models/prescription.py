"""Prescription and PrescriptionItem models."""
from datetime import datetime, timezone
from app.extensions import db


class Prescription(db.Model):
    __tablename__ = "prescriptions"

    STATUS_PENDING = "pending"
    STATUS_DISPENSED = "dispensed"
    STATUS_CANCELLED = "cancelled"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)

    status = db.Column(db.String(20), default=STATUS_PENDING, nullable=False, index=True)
    notes = db.Column(db.Text)
    prescribed_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    dispensed_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    dispensed_date = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    patient = db.relationship("Patient", back_populates="prescriptions")
    doctor = db.relationship("Doctor", back_populates="prescriptions")
    appointment = db.relationship("Appointment")
    dispensed_by = db.relationship("User", foreign_keys=[dispensed_by_user_id])
    items = db.relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self, with_items=True):
        data = {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": self.patient.full_name if self.patient else None,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.user.full_name if self.doctor and self.doctor.user else None,
            "appointment_id": self.appointment_id,
            "status": self.status,
            "notes": self.notes,
            "prescribed_date": self.prescribed_date.isoformat(),
            "dispensed_by_user_id": self.dispensed_by_user_id,
            "dispensed_by_name": self.dispensed_by.full_name if self.dispensed_by else None,
            "dispensed_date": self.dispensed_date.isoformat() if self.dispensed_date else None,
            "created_at": self.created_at.isoformat(),
        }
        if with_items:
            data["items"] = [item.to_dict() for item in self.items]
        return data


class PrescriptionItem(db.Model):
    __tablename__ = "prescription_items"

    id = db.Column(db.Integer, primary_key=True)
    prescription_id = db.Column(db.Integer, db.ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    medicine_id = db.Column(db.Integer, db.ForeignKey("medicines.id", ondelete="SET NULL"), nullable=True)

    medicine_name = db.Column(db.String(200), nullable=False)  # Snapshot name
    dosage = db.Column(db.String(50), nullable=False)  # e.g. "500mg"
    frequency = db.Column(db.String(100), nullable=False)  # e.g. "2 times/day"
    duration = db.Column(db.String(50), nullable=False)  # e.g. "5 days"
    quantity = db.Column(db.Integer, nullable=False)  # total tablets/units
    instructions = db.Column(db.Text)  # "After food", "Before bed"

    is_dispensed = db.Column(db.Boolean, default=False, nullable=False)
    dispensed_quantity = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    prescription = db.relationship("Prescription", back_populates="items")
    medicine = db.relationship("Medicine")

    def to_dict(self):
        return {
            "id": self.id,
            "prescription_id": self.prescription_id,
            "medicine_id": self.medicine_id,
            "medicine_name": self.medicine_name,
            "dosage": self.dosage,
            "frequency": self.frequency,
            "duration": self.duration,
            "quantity": self.quantity,
            "instructions": self.instructions,
            "is_dispensed": self.is_dispensed,
            "dispensed_quantity": self.dispensed_quantity,
        }
