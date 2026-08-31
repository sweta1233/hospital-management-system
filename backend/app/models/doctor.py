"""Doctor and DoctorAvailability models."""
from datetime import datetime, timezone
from app.extensions import db


class Doctor(db.Model):
    __tablename__ = "doctors"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    employee_id = db.Column(db.String(20), unique=True, nullable=False)

    # Professional info
    specialization = db.Column(db.String(100), nullable=False)
    qualification = db.Column(db.String(255))
    experience_years = db.Column(db.Integer, default=0)
    license_number = db.Column(db.String(50))
    consultation_fee = db.Column(db.Numeric(10, 2), default=0)

    # Contact / profile
    bio = db.Column(db.Text)
    profile_image = db.Column(db.String(255))

    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = db.relationship("User", foreign_keys=[user_id])
    department = db.relationship("Department", back_populates="doctors", foreign_keys=[department_id])
    availability = db.relationship("DoctorAvailability", back_populates="doctor", cascade="all, delete-orphan")
    appointments = db.relationship("Appointment", back_populates="doctor", lazy="dynamic")
    medical_records = db.relationship("MedicalRecord", back_populates="doctor", lazy="dynamic")
    prescriptions = db.relationship("Prescription", back_populates="doctor", lazy="dynamic")
    lab_orders = db.relationship("LabOrder", back_populates="doctor", lazy="dynamic")

    def __repr__(self):
        return f"<Doctor {self.employee_id} {self.specialization}>"

    def to_dict(self, with_user=True):
        data = {
            "id": self.id,
            "employee_id": self.employee_id,
            "specialization": self.specialization,
            "qualification": self.qualification,
            "experience_years": self.experience_years,
            "license_number": self.license_number,
            "consultation_fee": float(self.consultation_fee) if self.consultation_fee else 0.0,
            "bio": self.bio,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }
        if with_user and self.user:
            data.update({
                "user_id": self.user_id,
                "first_name": self.user.first_name,
                "last_name": self.user.last_name,
                "full_name": self.user.full_name,
                "email": self.user.email,
                "phone": self.user.phone,
            })
        return data


class DoctorAvailability(db.Model):
    """Stores weekly availability slots for doctors."""
    __tablename__ = "doctor_availability"

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Monday ... 6=Sunday
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    slot_duration = db.Column(db.Integer, default=30)  # minutes
    is_active = db.Column(db.Boolean, default=True)

    __table_args__ = (
        db.UniqueConstraint("doctor_id", "day_of_week", "start_time", name="uq_doctor_availability"),
    )

    doctor = db.relationship("Doctor", back_populates="availability")

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "day_of_week": self.day_of_week,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
            "slot_duration": self.slot_duration,
            "is_active": self.is_active,
        }
