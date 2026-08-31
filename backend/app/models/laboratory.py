"""Laboratory models: LabTest, LabOrder, LabResult."""
from datetime import datetime, timezone
from app.extensions import db


class LabTest(db.Model):
    """Catalog of available laboratory tests."""
    __tablename__ = "lab_tests"

    id = db.Column(db.Integer, primary_key=True)
    test_code = db.Column(db.String(20), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100))  # Hematology, Biochemistry, Radiology, etc.
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    normal_range = db.Column(db.String(200))  # e.g. "4.5 - 11.0 x10^9/L"
    unit = db.Column(db.String(50))  # e.g. "mg/dL", "g/dL"
    turnaround_time_hours = db.Column(db.Integer, default=24)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "test_code": self.test_code,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "price": float(self.price) if self.price else 0.0,
            "normal_range": self.normal_range,
            "unit": self.unit,
            "turnaround_time_hours": self.turnaround_time_hours,
            "is_active": self.is_active,
        }


class LabOrder(db.Model):
    """Test order placed by a doctor."""
    __tablename__ = "lab_orders"

    STATUS_ORDERED = "ordered"
    STATUS_SAMPLE_COLLECTED = "sample_collected"
    STATUS_PROCESSING = "processing"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"

    VALID_STATUSES = [
        STATUS_ORDERED, STATUS_SAMPLE_COLLECTED,
        STATUS_PROCESSING, STATUS_COMPLETED, STATUS_CANCELLED,
    ]

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(30), unique=True, nullable=False, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True, index=True)
    test_id = db.Column(db.Integer, db.ForeignKey("lab_tests.id", ondelete="RESTRICT"), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)

    status = db.Column(db.String(30), default=STATUS_ORDERED, nullable=False, index=True)
    priority = db.Column(db.String(20), default="normal")  # normal / urgent / stat
    clinical_indication = db.Column(db.Text)
    order_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    sample_collected_at = db.Column(db.DateTime)
    sample_collected_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    completed_at = db.Column(db.DateTime)
    technician_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    patient = db.relationship("Patient", back_populates="lab_orders")
    doctor = db.relationship("Doctor", back_populates="lab_orders")
    test = db.relationship("LabTest")
    technician = db.relationship("User", foreign_keys=[technician_id])
    results = db.relationship("LabResult", back_populates="order", cascade="all, delete-orphan")

    def to_dict(self, with_results=True):
        data = {
            "id": self.id,
            "order_number": self.order_number,
            "patient_id": self.patient_id,
            "patient_name": self.patient.full_name if self.patient else None,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.user.full_name if self.doctor and self.doctor.user else None,
            "test_id": self.test_id,
            "test_name": self.test.name if self.test else None,
            "test_code": self.test.test_code if self.test else None,
            "category": self.test.category if self.test else None,
            "status": self.status,
            "priority": self.priority,
            "clinical_indication": self.clinical_indication,
            "order_date": self.order_date.isoformat(),
            "sample_collected_at": self.sample_collected_at.isoformat() if self.sample_collected_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "technician_name": self.technician.full_name if self.technician else None,
            "created_at": self.created_at.isoformat(),
        }
        if with_results and self.results:
            data["results"] = [r.to_dict() for r in self.results]
        return data


class LabResult(db.Model):
    """Result data for an individual lab order."""
    __tablename__ = "lab_results"

    id = db.Column(db.Integer, primary_key=True)
    lab_order_id = db.Column(db.Integer, db.ForeignKey("lab_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    parameter_name = db.Column(db.String(100), nullable=False)
    result_value = db.Column(db.String(100), nullable=False)
    unit = db.Column(db.String(50))
    reference_range = db.Column(db.String(100))
    is_abnormal = db.Column(db.Boolean, default=False)
    technician_notes = db.Column(db.Text)
    report_file_url = db.Column(db.String(255))  # Path to uploaded PDF / image
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    order = db.relationship("LabOrder", back_populates="results")

    def to_dict(self):
        return {
            "id": self.id,
            "lab_order_id": self.lab_order_id,
            "parameter_name": self.parameter_name,
            "result_value": self.result_value,
            "unit": self.unit,
            "reference_range": self.reference_range,
            "is_abnormal": self.is_abnormal,
            "technician_notes": self.technician_notes,
            "report_file_url": self.report_file_url,
            "created_at": self.created_at.isoformat(),
        }
