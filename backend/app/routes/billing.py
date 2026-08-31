"""Billing and payments routes."""
from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.billing import Bill, BillItem, Payment
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.auth import role_required

billing_bp = Blueprint("billing", __name__)


@billing_bp.route("", methods=["GET"])
@jwt_required()
def get_bills():
    """List bills with filters."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    patient_id = request.args.get("patient_id", type=int)
    status = request.args.get("status")

    query = Bill.query
    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    if status:
        query = query.filter_by(status=status)

    total = query.count()
    bills = query.order_by(Bill.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return paginated_response(
        items=[b.to_dict() for b in bills],
        total=total,
        page=page,
        per_page=per_page,
    )


@billing_bp.route("/<int:bill_id>", methods=["GET"])
@jwt_required()
def get_bill(bill_id):
    """Get single bill details."""
    bill = Bill.query.get(bill_id)
    if not bill:
        return error_response("Bill not found", "NOT_FOUND", 404)
    return success_response(data=bill.to_dict(with_items=True))


@billing_bp.route("", methods=["POST"])
@jwt_required()
@role_required("receptionist", "admin")
def create_bill():
    """Generate a new bill."""
    data = request.get_json() or {}
    user_id = int(get_jwt_identity())

    bill_num = f"INV{datetime.now().strftime('%Y%m%d%H%M%S')}"

    bill = Bill(
        bill_number=bill_num,
        patient_id=data.get("patient_id"),
        appointment_id=data.get("appointment_id"),
        admission_id=data.get("admission_id"),
        discount_amount=data.get("discount_amount", 0.0),
        tax_amount=data.get("tax_amount", 0.0),
        notes=data.get("notes"),
        generated_by_user_id=user_id,
        status=Bill.STATUS_PENDING,
    )
    db.session.add(bill)
    db.session.flush()

    for item_data in data.get("items", []):
        qty = item_data.get("quantity", 1)
        unit_p = float(item_data.get("unit_price", 0))
        item = BillItem(
            bill_id=bill.id,
            item_type=item_data.get("item_type", "other"),
            description=item_data.get("description", ""),
            quantity=qty,
            unit_price=unit_p,
            total_price=qty * unit_p,
        )
        db.session.add(item)

    db.session.flush()
    bill.recalculate()
    db.session.commit()

    return success_response(data=bill.to_dict(with_items=True), message="Bill generated successfully", status_code=201)


@billing_bp.route("/<int:bill_id>/payments", methods=["POST"])
@jwt_required()
@role_required("receptionist", "admin")
def record_payment(bill_id):
    """Record a payment towards a bill."""
    bill = Bill.query.get(bill_id)
    if not bill:
        return error_response("Bill not found", "NOT_FOUND", 404)

    data = request.get_json() or {}
    user_id = int(get_jwt_identity())

    pay_num = f"PAY{datetime.now().strftime('%Y%m%d%H%M%S')}"
    amount = float(data.get("amount", 0))

    payment = Payment(
        payment_number=pay_num,
        bill_id=bill.id,
        amount=amount,
        payment_method=data.get("payment_method", "cash"),
        transaction_reference=data.get("transaction_reference"),
        notes=data.get("notes"),
        status=Payment.STATUS_COMPLETED,
        collected_by_user_id=user_id,
    )
    db.session.add(payment)
    db.session.flush()

    bill.recalculate()
    db.session.commit()

    return success_response(data=bill.to_dict(with_items=True), message="Payment recorded successfully")
