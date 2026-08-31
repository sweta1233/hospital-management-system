"""Laboratory routes."""
import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.extensions import db, socketio
from app.models.laboratory import LabTest, LabOrder, LabResult
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.user import User
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.auth import role_required

laboratory_bp = Blueprint("laboratory", __name__)


@laboratory_bp.route("/tests", methods=["GET"])
@jwt_required()
def get_lab_tests():
    """List available lab tests in catalog."""
    category = request.args.get("category")
    query = LabTest.query.filter_by(is_active=True)
    if category:
        query = query.filter_by(category=category)
    tests = query.order_by(LabTest.name.asc()).all()
    return success_response(data=[t.to_dict() for t in tests])


@laboratory_bp.route("/tests", methods=["POST"])
@jwt_required()
def create_lab_test():
    """Create a new lab test in the catalog (Lab Tech / Admin)."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    roles = [r.name for r in user.roles] if user else []

    if not any(r in ["lab_technician", "admin"] for r in roles):
        return error_response("Only lab technicians and administrators can configure tests", "FORBIDDEN", 403)

    data = request.get_json() or {}
    name = data.get("name", "").strip()
    if not name:
        return error_response("Test name is required", "MISSING_NAME", 400)

    test_code = data.get("test_code") or f"T-{uuid.uuid4().hex[:6].upper()}"

    test = LabTest(
        test_code=test_code,
        name=name,
        category=data.get("category", "General"),
        description=data.get("description", ""),
        price=float(data.get("price", 0.0)),
        normal_range=data.get("normal_range", ""),
        unit=data.get("unit", ""),
        turnaround_time_hours=int(data.get("turnaround_time_hours", 24)),
        is_active=True,
    )
    db.session.add(test)
    db.session.commit()

    return success_response(data=test.to_dict(), message="Lab test added to catalog", status_code=201)


@laboratory_bp.route("/orders", methods=["GET"])
@jwt_required()
def get_lab_orders():
    """List lab orders with strict patient privacy scoping."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    roles = [r.name for r in user.roles] if user else []

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")
    patient_id = request.args.get("patient_id", type=int)
    doctor_id = request.args.get("doctor_id", type=int)

    query = LabOrder.query

    # Strict Patient Privacy: Patients can ONLY view their own lab tests
    if "patient" in roles and not any(r in ["admin", "doctor", "lab_technician", "nurse"] for r in roles):
        patient = Patient.query.filter_by(user_id=user_id).first()
        if not patient:
            return paginated_response(items=[], total=0, page=page, per_page=per_page)
        query = query.filter_by(patient_id=patient.id)
    else:
        if patient_id:
            query = query.filter_by(patient_id=patient_id)
        if doctor_id:
            query = query.filter_by(doctor_id=doctor_id)

    if status:
        query = query.filter_by(status=status)

    total = query.count()
    orders = query.order_by(LabOrder.order_date.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return paginated_response(
        items=[o.to_dict(with_results=True) for o in orders],
        total=total,
        page=page,
        per_page=per_page,
    )


@laboratory_bp.route("/orders/<int:order_id>", methods=["GET"])
@jwt_required()
def get_lab_order_by_id(order_id):
    """Get single lab order with privacy verification."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    roles = [r.name for r in user.roles] if user else []

    order = LabOrder.query.get(order_id)
    if not order:
        return error_response("Lab order not found", "NOT_FOUND", 404)

    # Privacy check for patient
    if "patient" in roles and not any(r in ["admin", "doctor", "lab_technician", "nurse"] for r in roles):
        patient = Patient.query.filter_by(user_id=user_id).first()
        if not patient or order.patient_id != patient.id:
            return error_response("Access denied. You can only view your own lab reports.", "FORBIDDEN", 403)

    return success_response(data=order.to_dict(with_results=True))


@laboratory_bp.route("/orders", methods=["POST"])
@jwt_required()
def create_lab_order():
    """Order a laboratory test (Doctor or Admin)."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    roles = [r.name for r in user.roles] if user else []

    if not any(r in ["doctor", "admin"] for r in roles):
        return error_response("Only doctors or administrators can order lab tests", "FORBIDDEN", 403)

    data = request.get_json() or {}
    patient_id = data.get("patient_id")
    test_id = data.get("test_id")

    if not patient_id or not test_id:
        return error_response("Both Patient and Test are required", "MISSING_FIELDS", 400)

    doctor = Doctor.query.filter_by(user_id=user_id).first()
    doctor_id = doctor.id if doctor else data.get("doctor_id")

    order_num = f"LAB{datetime.now().strftime('%Y%m%d%H%M%S')}"

    order = LabOrder(
        order_number=order_num,
        patient_id=patient_id,
        doctor_id=doctor_id,
        test_id=test_id,
        appointment_id=data.get("appointment_id"),
        priority=data.get("priority", "normal"),
        clinical_indication=data.get("clinical_indication"),
        status=LabOrder.STATUS_ORDERED,
    )
    db.session.add(order)
    db.session.commit()

    # Emit socket notification to lab technicians
    try:
        socketio.emit("lab_order_created", {
            "order": order.to_dict(with_results=False),
        }, room="role_lab_technician")
    except Exception:
        pass

    return success_response(data=order.to_dict(with_results=True), message="Lab test ordered successfully", status_code=201)


@laboratory_bp.route("/orders/<int:order_id>/status", methods=["PUT"])
@jwt_required()
def update_order_status(order_id):
    """Update lab order status (Lab Tech / Admin)."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    roles = [r.name for r in user.roles] if user else []

    if not any(r in ["lab_technician", "admin"] for r in roles):
        return error_response("Only lab personnel can update order statuses", "FORBIDDEN", 403)

    order = LabOrder.query.get(order_id)
    if not order:
        return error_response("Order not found", "NOT_FOUND", 404)

    data = request.get_json() or {}
    new_status = data.get("status")

    if new_status not in LabOrder.VALID_STATUSES:
        return error_response("Invalid status provided", "INVALID_STATUS", 400)

    order.status = new_status

    if new_status == LabOrder.STATUS_SAMPLE_COLLECTED:
        order.sample_collected_at = datetime.now(timezone.utc)
        order.sample_collected_by_id = user_id
    elif new_status == LabOrder.STATUS_COMPLETED:
        order.completed_at = datetime.now(timezone.utc)
        order.technician_id = user_id

    db.session.commit()
    return success_response(data=order.to_dict(with_results=True), message=f"Order status updated to {new_status}")


@laboratory_bp.route("/orders/<int:order_id>/results", methods=["POST"])
@jwt_required()
def add_lab_result(order_id):
    """Record lab test results and mark order as completed (Lab Tech / Admin)."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    roles = [r.name for r in user.roles] if user else []

    if not any(r in ["lab_technician", "admin"] for r in roles):
        return error_response("Only lab personnel can record test results", "FORBIDDEN", 403)

    order = LabOrder.query.get(order_id)
    if not order:
        return error_response("Order not found", "NOT_FOUND", 404)

    data = request.get_json() or {}
    results_list = data.get("results", [])

    if not results_list:
        # If single result payload given directly
        if "result_value" in data:
            results_list = [data]
        else:
            return error_response("At least one test result parameter is required", "MISSING_RESULTS", 400)

    for res in results_list:
        result = LabResult(
            lab_order_id=order.id,
            parameter_name=res.get("parameter_name") or (order.test.name if order.test else "Diagnostic Result"),
            result_value=str(res.get("result_value", "")),
            unit=res.get("unit") or (order.test.unit if order.test else None),
            reference_range=res.get("reference_range") or (order.test.normal_range if order.test else None),
            is_abnormal=bool(res.get("is_abnormal", False)),
            technician_notes=res.get("technician_notes"),
            report_file_url=res.get("report_file_url"),
        )
        db.session.add(result)

    order.status = LabOrder.STATUS_COMPLETED
    order.completed_at = datetime.now(timezone.utc)
    order.technician_id = user_id

    db.session.commit()

    # Emit socket notification to doctor and patient
    try:
        order_dict = order.to_dict(with_results=True)
        if order.doctor and order.doctor.user_id:
            socketio.emit("lab_result_updated", {"order": order_dict}, room=f"user_{order.doctor.user_id}")
        patient = Patient.query.get(order.patient_id)
        if patient and patient.user_id:
            socketio.emit("new_notification", {
                "type": "laboratory",
                "title": "Laboratory Report Ready",
                "message": f"Your diagnostic report for {order.test.name if order.test else 'Lab Test'} is ready to view.",
                "order_id": order.id,
            }, room=f"user_{patient.user_id}")
    except Exception:
        pass

    return success_response(data=order.to_dict(with_results=True), message="Lab results recorded and report generated successfully")
