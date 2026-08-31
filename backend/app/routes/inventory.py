"""Inventory management routes."""
from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.medicine import Medicine, InventoryTransaction
from app.utils.responses import success_response, error_response
from app.utils.auth import role_required

inventory_bp = Blueprint("inventory", __name__)


@inventory_bp.route("/stock-in", methods=["POST"])
@jwt_required()
@role_required("pharmacist", "admin")
def stock_in():
    """Add stock to inventory."""
    data = request.get_json() or {}
    user_id = int(get_jwt_identity())
    medicine_id = data.get("medicine_id")
    quantity = data.get("quantity", 0)

    medicine = Medicine.query.get(medicine_id)
    if not medicine:
        return error_response("Medicine not found", "NOT_FOUND", 404)

    medicine.current_stock += quantity

    transaction = InventoryTransaction(
        medicine_id=medicine_id,
        transaction_type=InventoryTransaction.TYPE_STOCK_IN,
        quantity=quantity,
        batch_number=data.get("batch_number"),
        expiry_date=datetime.strptime(data["expiry_date"], "%Y-%m-%d").date() if data.get("expiry_date") else None,
        supplier=data.get("supplier"),
        cost_per_unit=data.get("cost_per_unit"),
        notes=data.get("notes"),
        performed_by_user_id=user_id,
    )
    db.session.add(transaction)
    db.session.commit()

    return success_response(data=transaction.to_dict(), message="Stock added successfully")


@inventory_bp.route("/transactions", methods=["GET"])
@jwt_required()
@role_required("pharmacist", "admin")
def get_transactions():
    """Get inventory transaction history."""
    medicine_id = request.args.get("medicine_id", type=int)
    query = InventoryTransaction.query
    if medicine_id:
        query = query.filter_by(medicine_id=medicine_id)

    transactions = query.order_by(InventoryTransaction.created_at.desc()).limit(100).all()
    return success_response(data=[t.to_dict() for t in transactions])
