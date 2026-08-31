"""MedicalRecord model."""
from datetime import datetime, timezone
from app.extensions import db


class MedicalRecord(db.Model):
    __tablename__ = "medical_records"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)

    diagnosis = db.Column(db.Text, nullable=False)
    symptoms = db.Column(db.Text)
    clinical_notes = db.Column(db.Text)
    treatment_plan = db.Column(db.Text)
    follow_up_date = db.Column(db.Date)
    follow_up_instructions = db.Column(db.Text)

    icd_code = db.Column(db.String(20))  # ICD-10 diagnosis code
    is_confidential = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    patient = db.relationship("Patient", back_populates="medical_records")
    doctor = db.relationship("Doctor", back_populates="medical_records")
    appointment = db.relationship("Appointment")

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": self.patient.full_name if self.patient else None,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.user.full_name if self.doctor and self.doctor.user else None,
            "appointment_id": self.appointment_id,
            "diagnosis": self.diagnosis,
            "symptoms": self.symptoms,
            "clinical_notes": self.clinical_notes,
            "treatment_plan": self.treatment_plan,
            "follow_up_date": self.follow_up_date.isoformat() if self.follow_up_date else None,
            "follow_up_instructions": self.follow_up_instructions,
            "icd_code": self.icd_code,
            "is_confidential": self.is_confidential,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
