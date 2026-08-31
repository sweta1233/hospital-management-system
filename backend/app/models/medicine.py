"""Medicine and InventoryTransaction models."""
from datetime import datetime, timezone
from app.extensions import db


class Medicine(db.Model):
    __tablename__ = "medicines"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    generic_name = db.Column(db.String(200))
    category = db.Column(db.String(100))  # Antibiotic, Painkiller, etc.
    manufacturer = db.Column(db.String(200))
    description = db.Column(db.Text)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    current_stock = db.Column(db.Integer, default=0, nullable=False)
    min_stock_level = db.Column(db.Integer, default=10, nullable=False)
    unit = db.Column(db.String(20), default="tablets")  # tablets, ml, units, etc.

    requires_prescription = db.Column(db.Boolean, default=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    transactions = db.relationship("InventoryTransaction", back_populates="medicine", lazy="dynamic")
    prescription_items = db.relationship("PrescriptionItem", back_populates="medicine", lazy="dynamic")

    def __repr__(self):
        return f"<Medicine {self.name}>"

    @property
    def is_low_stock(self):
        return self.current_stock <= self.min_stock_level

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "generic_name": self.generic_name,
            "category": self.category,
            "manufacturer": self.manufacturer,
            "description": self.description,
            "unit_price": float(self.unit_price) if self.unit_price else 0.0,
            "current_stock": self.current_stock,
            "min_stock_level": self.min_stock_level,
            "unit": self.unit,
            "is_low_stock": self.is_low_stock,
            "requires_prescription": self.requires_prescription,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }


class InventoryTransaction(db.Model):
    __tablename__ = "inventory_transactions"

    TYPE_STOCK_IN = "stock_in"
    TYPE_DISPENSE = "dispense"
    TYPE_ADJUSTMENT = "adjustment"
    TYPE_EXPIRED = "expired"
    TYPE_DAMAGED = "damaged"

    id = db.Column(db.Integer, primary_key=True)
    medicine_id = db.Column(db.Integer, db.ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type = db.Column(db.String(20), nullable=False, index=True)  # stock_in, dispense, adjustment, etc.
    quantity = db.Column(db.Integer, nullable=False)  # positive for stock_in, negative for dispense
    batch_number = db.Column(db.String(50))
    expiry_date = db.Column(db.Date)
    supplier = db.Column(db.String(200))
    cost_per_unit = db.Column(db.Numeric(10, 2))
    notes = db.Column(db.Text)

    performed_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    prescription_item_id = db.Column(db.Integer, db.ForeignKey("prescription_items.id", ondelete="SET NULL"), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    medicine = db.relationship("Medicine", back_populates="transactions")
    performed_by = db.relationship("User")
    prescription_item = db.relationship("PrescriptionItem")

    def to_dict(self):
        return {
            "id": self.id,
            "medicine_id": self.medicine_id,
            "medicine_name": self.medicine.name if self.medicine else None,
            "transaction_type": self.transaction_type,
            "quantity": self.quantity,
            "batch_number": self.batch_number,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "supplier": self.supplier,
            "cost_per_unit": float(self.cost_per_unit) if self.cost_per_unit else None,
            "notes": self.notes,
            "performed_by_user_id": self.performed_by_user_id,
            "performed_by_name": self.performed_by.full_name if self.performed_by else None,
            "created_at": self.created_at.isoformat(),
        }
