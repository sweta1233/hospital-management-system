"""Admissions and Beds routes."""
from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.admission import Admission, Ward, Room, Bed
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.auth import role_required

admissions_bp = Blueprint("admissions", __name__)


@admissions_bp.route("/wards", methods=["GET"])
@jwt_required()
def get_wards():
    """List all wards with rooms and beds."""
    wards = Ward.query.filter_by(is_active=True).all()
    result = []
    for w in wards:
        w_dict = w.to_dict()
        w_dict["rooms"] = []
        for r in w.rooms:
            r_dict = r.to_dict()
            r_dict["beds"] = [b.to_dict() for b in r.beds]
            w_dict["rooms"].append(r_dict)
        result.append(w_dict)
    return success_response(data=result)


@admissions_bp.route("", methods=["GET"])
@jwt_required()
def get_admissions():
    """List admissions."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")

    query = Admission.query
    if status:
        query = query.filter_by(status=status)

    total = query.count()
    admissions = query.order_by(Admission.admission_date.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return paginated_response(
        items=[a.to_dict() for a in admissions],
        total=total,
        page=page,
        per_page=per_page,
    )


@admissions_bp.route("", methods=["POST"])
@jwt_required()
@role_required("receptionist", "admin")
def admit_patient():
    """Admit a patient to a bed."""
    data = request.get_json() or {}
    user_id = int(get_jwt_identity())
    bed_id = data.get("bed_id")

    bed = Bed.query.get(bed_id)
    if not bed:
        return error_response("Bed not found", "NOT_FOUND", 404)
    if bed.is_occupied:
        return error_response("Bed is already occupied", "BED_OCCUPIED", 409)

    admission_num = f"ADM{datetime.now().strftime('%Y%m%d%H%M%S')}"

    admission = Admission(
        admission_number=admission_num,
        patient_id=data.get("patient_id"),
        bed_id=bed_id,
        attending_doctor_id=data.get("attending_doctor_id"),
        admission_reason=data.get("admission_reason", ""),
        admitted_by_user_id=user_id,
        status=Admission.STATUS_ADMITTED,
    )

    bed.is_occupied = True

    db.session.add(admission)
    db.session.commit()

    return success_response(data=admission.to_dict(), message="Patient admitted successfully", status_code=201)


@admissions_bp.route("/<int:admission_id>/discharge", methods=["PUT"])
@jwt_required()
@role_required("receptionist", "doctor", "admin")
def discharge_patient(admission_id):
    """Discharge a patient and free the bed."""
    admission = Admission.query.get(admission_id)
    if not admission:
        return error_response("Admission record not found", "NOT_FOUND", 404)

    data = request.get_json() or {}
    admission.status = Admission.STATUS_DISCHARGED
    admission.discharge_date = datetime.now(timezone.utc)
    admission.discharge_summary = data.get("discharge_summary")

    # Free the bed
    if admission.bed:
        admission.bed.is_occupied = False

    db.session.commit()

    return success_response(data=admission.to_dict(), message="Patient discharged successfully")
