"""Medicine management routes."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.medicine import Medicine, InventoryTransaction
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.auth import role_required

medicines_bp = Blueprint("medicines", __name__)


@medicines_bp.route("", methods=["GET"])
@jwt_required()
def get_medicines():
    """List medicines."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 100, type=int)
    search = request.args.get("search", "").strip()
    category = request.args.get("category")

    query = Medicine.query.filter_by(is_active=True)
    if search:
        query = query.filter(Medicine.name.ilike(f"%{search}%") | Medicine.generic_name.ilike(f"%{search}%"))
    if category and category != "all":
        query = query.filter_by(category=category)

    total = query.count()
    medicines = query.order_by(Medicine.name.asc()).offset((page - 1) * per_page).limit(per_page).all()

    return paginated_response(
        items=[m.to_dict() for m in medicines],
        total=total,
        page=page,
        per_page=per_page,
    )


@medicines_bp.route("", methods=["POST"])
@jwt_required()
@role_required("admin", "pharmacist", "doctor")
def create_medicine():
    """Add a new medicine to inventory."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    if not name:
        return error_response("Medicine name is required", "NAME_REQUIRED", 400)

    try:
        unit_price = float(data.get("unit_price", 0.0))
        current_stock = int(data.get("current_stock", 0))
        min_stock_level = int(data.get("min_stock_level", 10))
    except (ValueError, TypeError):
        return error_response("Invalid numerical values for price or stock", "INVALID_NUMBERS", 400)

    medicine = Medicine(
        name=name,
        generic_name=data.get("generic_name", "").strip() or None,
        category=data.get("category", "General"),
        manufacturer=data.get("manufacturer", "").strip() or "Standard Pharmaceuticals",
        description=data.get("description", "").strip() or None,
        unit_price=unit_price,
        current_stock=current_stock,
        min_stock_level=min_stock_level,
        unit=data.get("unit", "tablets"),
        requires_prescription=bool(data.get("requires_prescription", True)),
        is_active=True,
    )
    db.session.add(medicine)
    db.session.commit()
    return success_response(data=medicine.to_dict(), message=f"Medicine '{medicine.name}' added to pharmacy inventory successfully!", status_code=201)
