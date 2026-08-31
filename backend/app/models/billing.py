"""Billing, BillItem, and Payment models."""
from datetime import datetime, timezone
from decimal import Decimal
from app.extensions import db


class Bill(db.Model):
    __tablename__ = "bills"

    STATUS_PENDING = "pending"
    STATUS_PARTIALLY_PAID = "partially_paid"
    STATUS_PAID = "paid"
    STATUS_CANCELLED = "cancelled"

    VALID_STATUSES = [STATUS_PENDING, STATUS_PARTIALLY_PAID, STATUS_PAID, STATUS_CANCELLED]

    id = db.Column(db.Integer, primary_key=True)
    bill_number = db.Column(db.String(30), unique=True, nullable=False, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    admission_id = db.Column(db.Integer, db.ForeignKey("admissions.id", ondelete="SET NULL"), nullable=True)

    subtotal = db.Column(db.Numeric(10, 2), default=0.0, nullable=False)
    discount_amount = db.Column(db.Numeric(10, 2), default=0.0, nullable=False)
    tax_amount = db.Column(db.Numeric(10, 2), default=0.0, nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), default=0.0, nullable=False)
    paid_amount = db.Column(db.Numeric(10, 2), default=0.0, nullable=False)
    balance_due = db.Column(db.Numeric(10, 2), default=0.0, nullable=False)

    status = db.Column(db.String(20), default=STATUS_PENDING, nullable=False, index=True)
    notes = db.Column(db.Text)
    due_date = db.Column(db.Date)
    generated_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    patient = db.relationship("Patient", back_populates="bills")
    appointment = db.relationship("Appointment")
    admission = db.relationship("Admission")
    generated_by = db.relationship("User", foreign_keys=[generated_by_user_id])
    items = db.relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")
    payments = db.relationship("Payment", back_populates="bill", cascade="all, delete-orphan")

    def recalculate(self):
        """Recalculate totals from line items."""
        self.subtotal = sum((Decimal(str(item.total_price or 0)) for item in self.items), Decimal("0.00"))
        discount = Decimal(str(self.discount_amount or 0))
        tax = Decimal(str(self.tax_amount or 0))
        self.total_amount = max(Decimal("0.00"), self.subtotal - discount + tax)
        self.paid_amount = sum((Decimal(str(p.amount or 0)) for p in self.payments if p.status == Payment.STATUS_COMPLETED), Decimal("0.00"))
        self.balance_due = max(Decimal("0.00"), self.total_amount - self.paid_amount)
        if self.balance_due == Decimal("0.00") and self.total_amount > Decimal("0.00"):
            self.status = self.STATUS_PAID
        elif self.paid_amount > Decimal("0.00"):
            self.status = self.STATUS_PARTIALLY_PAID
        else:
            self.status = self.STATUS_PENDING

    def to_dict(self, with_items=True):
        data = {
            "id": self.id,
            "bill_number": self.bill_number,
            "patient_id": self.patient_id,
            "patient_name": self.patient.full_name if self.patient else None,
            "patient_pid": self.patient.patient_id if self.patient else None,
            "appointment_id": self.appointment_id,
            "admission_id": self.admission_id,
            "subtotal": float(self.subtotal),
            "discount_amount": float(self.discount_amount),
            "tax_amount": float(self.tax_amount),
            "total_amount": float(self.total_amount),
            "paid_amount": float(self.paid_amount),
            "balance_due": float(self.balance_due),
            "status": self.status,
            "notes": self.notes,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat(),
        }
        if with_items:
            data["items"] = [item.to_dict() for item in self.items]
            data["payments"] = [p.to_dict() for p in self.payments]
        return data


class BillItem(db.Model):
    __tablename__ = "bill_items"

    ITEM_CONSULTATION = "consultation"
    ITEM_LAB_TEST = "lab_test"
    ITEM_MEDICINE = "medicine"
    ITEM_ROOM_CHARGE = "room_charge"
    ITEM_PROCEDURE = "procedure"
    ITEM_OTHER = "other"

    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey("bills.id", ondelete="CASCADE"), nullable=False, index=True)
    item_type = db.Column(db.String(30), nullable=False)  # consultation, lab_test, medicine, room_charge, procedure, other
    description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)

    bill = db.relationship("Bill", back_populates="items")

    def to_dict(self):
        return {
            "id": self.id,
            "bill_id": self.bill_id,
            "item_type": self.item_type,
            "description": self.description,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
            "total_price": float(self.total_price),
        }


class Payment(db.Model):
    __tablename__ = "payments"

    METHOD_CASH = "cash"
    METHOD_CREDIT_CARD = "credit_card"
    METHOD_DEBIT_CARD = "debit_card"
    METHOD_INSURANCE = "insurance"
    METHOD_UPI = "upi"
    METHOD_BANK_TRANSFER = "bank_transfer"

    STATUS_COMPLETED = "completed"
    STATUS_PENDING = "pending"
    STATUS_FAILED = "failed"
    STATUS_REFUNDED = "refunded"

    id = db.Column(db.Integer, primary_key=True)
    payment_number = db.Column(db.String(30), unique=True, nullable=False, index=True)
    bill_id = db.Column(db.Integer, db.ForeignKey("bills.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(30), nullable=False)
    status = db.Column(db.String(20), default=STATUS_COMPLETED, nullable=False)
    transaction_reference = db.Column(db.String(100))
    notes = db.Column(db.Text)
    collected_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    bill = db.relationship("Bill", back_populates="payments")
    collected_by = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "payment_number": self.payment_number,
            "bill_id": self.bill_id,
            "amount": float(self.amount),
            "payment_method": self.payment_method,
            "status": self.status,
            "transaction_reference": self.transaction_reference,
            "collected_by_name": self.collected_by.full_name if self.collected_by else None,
            "created_at": self.created_at.isoformat(),
        }
