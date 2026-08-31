"""Dashboard metrics routes."""
from datetime import date, datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.admission import Admission, Bed
from app.models.billing import Bill
from app.models.medicine import Medicine
from app.models.laboratory import LabOrder
from app.models.prescription import Prescription
from app.utils.responses import success_response

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    """Return dashboard metrics tailored specifically to the current user role."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    primary_role = user.get_primary_role() if user else "patient"

    today = date.today()

    if primary_role == "admin":
        total_patients = Patient.query.filter_by(is_active=True).count()
        total_doctors = Doctor.query.filter_by(is_active=True).count()
        today_appts = Appointment.query.filter_by(appointment_date=today).count()
        active_admissions = Admission.query.filter_by(status=Admission.STATUS_ADMITTED).count()
        available_beds = Bed.query.filter_by(is_occupied=False, is_active=True).count()
        low_stock_meds = Medicine.query.filter(Medicine.current_stock <= Medicine.min_stock_level, Medicine.is_active == True).count()
        pending_lab_tests = LabOrder.query.filter(LabOrder.status.in_([LabOrder.STATUS_ORDERED, LabOrder.STATUS_PROCESSING])).count()

        return success_response(data={
            "role": "admin",
            "stats": {
                "total_patients": total_patients,
                "total_doctors": total_doctors,
                "today_appointments": today_appts,
                "active_admissions": active_admissions,
                "available_beds": available_beds,
                "low_stock_medicines": low_stock_meds,
                "pending_lab_tests": pending_lab_tests,
            }
        })

    elif primary_role == "doctor":
        doctor = Doctor.query.filter_by(user_id=user_id).first()
        doc_id = doctor.id if doctor else None

        today_appts = Appointment.query.filter_by(doctor_id=doc_id, appointment_date=today).all() if doc_id else []
        waiting = [a for a in today_appts if a.status == Appointment.STATUS_CHECKED_IN]
        pending_lab = LabOrder.query.filter_by(doctor_id=doc_id, status=LabOrder.STATUS_ORDERED).count() if doc_id else 0
        total_prescriptions = Prescription.query.filter_by(doctor_id=doc_id).count() if doc_id else 0

        return success_response(data={
            "role": "doctor",
            "doctor_info": doctor.to_dict() if doctor else None,
            "stats": {
                "today_appointments_count": len(today_appts),
                "waiting_patients_count": len(waiting),
                "pending_lab_orders": pending_lab,
                "total_prescriptions_written": total_prescriptions,
            },
            "today_appointments": [a.to_dict() for a in today_appts],
        })

    elif primary_role == "nurse":
        active_admissions = Admission.query.filter_by(status=Admission.STATUS_ADMITTED).all()
        today_appts = Appointment.query.filter_by(appointment_date=today).count()
        available_beds = Bed.query.filter_by(is_occupied=False, is_active=True).count()

        return success_response(data={
            "role": "nurse",
            "stats": {
                "admitted_patients": len(active_admissions),
                "today_appointments": today_appts,
                "available_beds": available_beds,
            },
            "admissions": [a.to_dict() for a in active_admissions[:10]],
        })

    elif primary_role == "pharmacist":
        pending_prescriptions = Prescription.query.filter_by(status=Prescription.STATUS_PENDING).count()
        dispensed_today = Prescription.query.filter_by(status=Prescription.STATUS_DISPENSED).count()
        low_stock_meds = Medicine.query.filter(Medicine.current_stock <= Medicine.min_stock_level, Medicine.is_active == True).count()
        total_medicines = Medicine.query.filter_by(is_active=True).count()

        return success_response(data={
            "role": "pharmacist",
            "stats": {
                "pending_prescriptions": pending_prescriptions,
                "dispensed_today": dispensed_today,
                "low_stock_medicines": low_stock_meds,
                "total_medicines": total_medicines,
            }
        })

    elif primary_role == "lab_technician":
        pending_orders = LabOrder.query.filter_by(status=LabOrder.STATUS_ORDERED).count()
        processing_orders = LabOrder.query.filter_by(status=LabOrder.STATUS_PROCESSING).count()
        completed_orders = LabOrder.query.filter_by(status=LabOrder.STATUS_COMPLETED).count()

        return success_response(data={
            "role": "lab_technician",
            "stats": {
                "pending_orders": pending_orders,
                "processing_orders": processing_orders,
                "completed_orders": completed_orders,
            }
        })

    elif primary_role == "receptionist":
        today_appts = Appointment.query.filter_by(appointment_date=today).count()
        checked_in = Appointment.query.filter_by(appointment_date=today, status=Appointment.STATUS_CHECKED_IN).count()
        available_beds = Bed.query.filter_by(is_occupied=False, is_active=True).count()
        pending_bills = Bill.query.filter_by(status=Bill.STATUS_PENDING).count()

        return success_response(data={
            "role": "receptionist",
            "stats": {
                "today_appointments": today_appts,
                "checked_in_today": checked_in,
                "available_beds": available_beds,
                "pending_bills": pending_bills,
            }
        })

    else:  # Patient Role (Strict Patient Isolation)
        patient = Patient.query.filter_by(user_id=user_id).first()
        p_id = patient.id if patient else None

        upcoming_appts = (
            Appointment.query.filter(
                Appointment.patient_id == p_id,
                Appointment.appointment_date >= today
            ).order_by(Appointment.appointment_date.asc(), Appointment.start_time.asc()).all()
            if p_id else []
        )

        recent_prescriptions = (
            Prescription.query.filter_by(patient_id=p_id)
            .order_by(Prescription.created_at.desc())
            .limit(5)
            .all()
            if p_id else []
        )

        recent_lab_orders = (
            LabOrder.query.filter_by(patient_id=p_id)
            .order_by(LabOrder.created_at.desc())
            .limit(5)
            .all()
            if p_id else []
        )

        pending_bills_objs = (
            Bill.query.filter_by(patient_id=p_id, status=Bill.STATUS_PENDING).all()
            if p_id else []
        )
        total_due = sum(float(b.total_amount or 0) - float(b.paid_amount or 0) for b in pending_bills_objs)

        return success_response(data={
            "role": "patient",
            "patient_info": patient.to_dict() if patient else None,
            "stats": {
                "upcoming_appointments": len(upcoming_appts),
                "active_prescriptions": len(recent_prescriptions),
                "lab_reports_count": len(recent_lab_orders),
                "pending_bills_count": len(pending_bills_objs),
                "total_outstanding_amount": round(total_due, 2),
            },
            "appointments": [a.to_dict() for a in upcoming_appts],
            "prescriptions": [p.to_dict() for p in recent_prescriptions],
            "lab_orders": [lo.to_dict() for lo in recent_lab_orders],
            "pending_bills": [b.to_dict() for b in pending_bills_objs],
        })
