"""Patient model."""
from datetime import datetime, timezone
from app.extensions import db


class Patient(db.Model):
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.String(20), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Demographics
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(10), nullable=False)  # male / female / other
    blood_group = db.Column(db.String(5))  # A+, B-, O+, AB+ ...
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), index=True)
    address = db.Column(db.Text)
    city = db.Column(db.String(80))
    state = db.Column(db.String(80))
    zip_code = db.Column(db.String(10))

    # Medical info
    allergies = db.Column(db.Text)          # comma-separated or free text
    existing_conditions = db.Column(db.Text)
    medical_history = db.Column(db.Text)

    # Emergency contact
    emergency_contact_name = db.Column(db.String(120))
    emergency_contact_phone = db.Column(db.String(20))
    emergency_contact_relation = db.Column(db.String(50))

    # Insurance
    insurance_provider = db.Column(db.String(100))
    insurance_id = db.Column(db.String(50))
    insurance_expiry = db.Column(db.Date)

    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    registration_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = db.relationship("User", foreign_keys=[user_id])
    appointments = db.relationship("Appointment", back_populates="patient", lazy="dynamic")
    medical_records = db.relationship("MedicalRecord", back_populates="patient", lazy="dynamic")
    vitals = db.relationship("Vital", back_populates="patient", lazy="dynamic")
    prescriptions = db.relationship("Prescription", back_populates="patient", lazy="dynamic")
    lab_orders = db.relationship("LabOrder", back_populates="patient", lazy="dynamic")
    admissions = db.relationship("Admission", back_populates="patient", lazy="dynamic")
    bills = db.relationship("Bill", back_populates="patient", lazy="dynamic")

    def __repr__(self):
        return f"<Patient {self.patient_id} {self.first_name} {self.last_name}>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self):
        from datetime import date
        today = date.today()
        dob = self.date_of_birth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    def to_dict(self, detailed=False):
        data = {
            "id": self.id,
            "patient_id": self.patient_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "age": self.age,
            "gender": self.gender,
            "blood_group": self.blood_group,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip_code": self.zip_code,
            "is_active": self.is_active,
            "registration_date": self.registration_date.isoformat(),
            "created_at": self.created_at.isoformat(),
        }
        if detailed:
            data.update({
                "allergies": self.allergies,
                "existing_conditions": self.existing_conditions,
                "medical_history": self.medical_history,
                "emergency_contact_name": self.emergency_contact_name,
                "emergency_contact_phone": self.emergency_contact_phone,
                "emergency_contact_relation": self.emergency_contact_relation,
                "insurance_provider": self.insurance_provider,
                "insurance_id": self.insurance_id,
                "insurance_expiry": self.insurance_expiry.isoformat() if self.insurance_expiry else None,
            })
        return data
