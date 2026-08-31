"""Vital signs model."""
from datetime import datetime, timezone
from app.extensions import db


class Vital(db.Model):
    __tablename__ = "vitals"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    nurse_id = db.Column(db.Integer, db.ForeignKey("nurses.id", ondelete="SET NULL"), nullable=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)

    # Vital measurements
    temperature = db.Column(db.Numeric(4, 1))  # Celsius, e.g. 37.5
    blood_pressure_systolic = db.Column(db.Integer)  # mmHg
    blood_pressure_diastolic = db.Column(db.Integer)  # mmHg
    heart_rate = db.Column(db.Integer)  # bpm
    respiratory_rate = db.Column(db.Integer)  # breaths per minute
    oxygen_saturation = db.Column(db.Integer)  # SpO2 percentage
    weight = db.Column(db.Numeric(5, 2))  # kg
    height = db.Column(db.Numeric(5, 2))  # cm
    bmi = db.Column(db.Numeric(5, 2))

    notes = db.Column(db.Text)
    recorded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    patient = db.relationship("Patient", back_populates="vitals")
    nurse = db.relationship("Nurse", back_populates="vitals")
    appointment = db.relationship("Appointment")

    def __repr__(self):
        return f"<Vital {self.id} Patient:{self.patient_id} at {self.recorded_at}>"

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": self.patient.full_name if self.patient else None,
            "nurse_id": self.nurse_id,
            "nurse_name": self.nurse.user.full_name if self.nurse and self.nurse.user else None,
            "appointment_id": self.appointment_id,
            "temperature": float(self.temperature) if self.temperature else None,
            "blood_pressure_systolic": self.blood_pressure_systolic,
            "blood_pressure_diastolic": self.blood_pressure_diastolic,
            "blood_pressure": f"{self.blood_pressure_systolic}/{self.blood_pressure_diastolic}" if self.blood_pressure_systolic and self.blood_pressure_diastolic else None,
            "heart_rate": self.heart_rate,
            "respiratory_rate": self.respiratory_rate,
            "oxygen_saturation": self.oxygen_saturation,
            "weight": float(self.weight) if self.weight else None,
            "height": float(self.height) if self.height else None,
            "bmi": float(self.bmi) if self.bmi else None,
            "notes": self.notes,
            "recorded_at": self.recorded_at.isoformat(),
            "created_at": self.created_at.isoformat(),
        }
