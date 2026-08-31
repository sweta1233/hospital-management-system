"""Admission, Ward, Room, Bed models."""
from datetime import datetime, timezone
from app.extensions import db


class Ward(db.Model):
    __tablename__ = "wards"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    ward_type = db.Column(db.String(50))  # General, ICU, CCU, Maternity, Pediatric, etc.
    floor = db.Column(db.String(20))
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    rooms = db.relationship("Room", back_populates="ward", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "ward_type": self.ward_type,
            "floor": self.floor,
            "description": self.description,
            "is_active": self.is_active,
        }


class Room(db.Model):
    __tablename__ = "rooms"

    id = db.Column(db.Integer, primary_key=True)
    ward_id = db.Column(db.Integer, db.ForeignKey("wards.id", ondelete="CASCADE"), nullable=False)
    room_number = db.Column(db.String(20), nullable=False)
    room_type = db.Column(db.String(50))  # Single, Double, Deluxe, Suite
    rate_per_day = db.Column(db.Numeric(10, 2), default=0.0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("ward_id", "room_number", name="uq_ward_room"),
    )

    ward = db.relationship("Ward", back_populates="rooms")
    beds = db.relationship("Bed", back_populates="room", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "ward_id": self.ward_id,
            "ward_name": self.ward.name if self.ward else None,
            "room_number": self.room_number,
            "room_type": self.room_type,
            "rate_per_day": float(self.rate_per_day) if self.rate_per_day else 0.0,
            "is_active": self.is_active,
        }


class Bed(db.Model):
    __tablename__ = "beds"

    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    bed_number = db.Column(db.String(20), nullable=False)
    is_occupied = db.Column(db.Boolean, default=False, nullable=False, index=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("room_id", "bed_number", name="uq_room_bed"),
    )

    room = db.relationship("Room", back_populates="beds")
    admissions = db.relationship("Admission", back_populates="bed", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "room_id": self.room_id,
            "room_number": self.room.room_number if self.room else None,
            "ward_name": self.room.ward.name if self.room and self.room.ward else None,
            "bed_number": self.bed_number,
            "is_occupied": self.is_occupied,
            "is_active": self.is_active,
        }


class Admission(db.Model):
    __tablename__ = "admissions"

    STATUS_ADMITTED = "admitted"
    STATUS_DISCHARGED = "discharged"
    STATUS_TRANSFERRED = "transferred"

    id = db.Column(db.Integer, primary_key=True)
    admission_number = db.Column(db.String(30), unique=True, nullable=False, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    bed_id = db.Column(db.Integer, db.ForeignKey("beds.id", ondelete="RESTRICT"), nullable=False)
    attending_doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)

    status = db.Column(db.String(20), default=STATUS_ADMITTED, nullable=False, index=True)
    admission_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    discharge_date = db.Column(db.DateTime)
    admission_reason = db.Column(db.Text, nullable=False)
    discharge_summary = db.Column(db.Text)
    admitted_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    patient = db.relationship("Patient", back_populates="admissions")
    bed = db.relationship("Bed", back_populates="admissions")
    attending_doctor = db.relationship("Doctor")
    admitted_by = db.relationship("User", foreign_keys=[admitted_by_user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "admission_number": self.admission_number,
            "patient_id": self.patient_id,
            "patient_name": self.patient.full_name if self.patient else None,
            "bed_id": self.bed_id,
            "bed_number": self.bed.bed_number if self.bed else None,
            "room_number": self.bed.room.room_number if self.bed and self.bed.room else None,
            "ward_name": self.bed.room.ward.name if self.bed and self.bed.room and self.bed.room.ward else None,
            "attending_doctor_id": self.attending_doctor_id,
            "attending_doctor_name": self.attending_doctor.user.full_name if self.attending_doctor and self.attending_doctor.user else None,
            "status": self.status,
            "admission_date": self.admission_date.isoformat(),
            "discharge_date": self.discharge_date.isoformat() if self.discharge_date else None,
            "admission_reason": self.admission_reason,
            "discharge_summary": self.discharge_summary,
            "created_at": self.created_at.isoformat(),
        }
