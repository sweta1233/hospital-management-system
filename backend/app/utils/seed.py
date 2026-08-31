"""Database seed data for development."""
import random
from datetime import datetime, date, time, timedelta, timezone
from app.extensions import db, bcrypt
from app.models.user import User, Role
from app.models.department import Department
from app.models.patient import Patient
from app.models.doctor import Doctor, DoctorAvailability
from app.models.nurse import Nurse
from app.models.appointment import Appointment
from app.models.medicine import Medicine
from app.models.laboratory import LabTest
from app.models.admission import Ward, Room, Bed


def run_seed():
    """Seed the database with realistic test data."""
    # ── Clear existing data (dev only!) ──
    # Drop tables manually to avoid circular dependency issues
    from sqlalchemy import text
    db.session.execute(text("DROP SCHEMA public CASCADE"))
    db.session.execute(text("CREATE SCHEMA public"))
    db.session.commit()
    db.create_all()

    # ── 1. Create Roles ──
    roles_data = [
        ("admin", "System administrator"),
        ("doctor", "Medical doctor"),
        ("nurse", "Nursing staff"),
        ("receptionist", "Front desk"),
        ("pharmacist", "Pharmacy staff"),
        ("lab_technician", "Laboratory technician"),
        ("patient", "Patient"),
    ]
    roles = {}
    for name, desc in roles_data:
        role = Role(name=name, description=desc)
        db.session.add(role)
        roles[name] = role
    db.session.commit()

    # ── 2. Create Users ──
    password_hash = bcrypt.generate_password_hash("Password@123").decode("utf-8")

    admin_user = User(
        email="admin@hms.local",
        password_hash=password_hash,
        first_name="Admin",
        last_name="User",
        phone="+1234567890",
        is_active=True,
        is_verified=True,
    )
    admin_user.roles.append(roles["admin"])
    db.session.add(admin_user)

    # Doctors
    doctor1_user = User(
        email="dr.smith@hms.local",
        password_hash=password_hash,
        first_name="John",
        last_name="Smith",
        phone="+1234567891",
        is_active=True,
        is_verified=True,
    )
    doctor1_user.roles.append(roles["doctor"])
    db.session.add(doctor1_user)

    doctor2_user = User(
        email="dr.patel@hms.local",
        password_hash=password_hash,
        first_name="Priya",
        last_name="Patel",
        phone="+1234567892",
        is_active=True,
        is_verified=True,
    )
    doctor2_user.roles.append(roles["doctor"])
    db.session.add(doctor2_user)

    # Nurse
    nurse_user = User(
        email="nurse.jones@hms.local",
        password_hash=password_hash,
        first_name="Sarah",
        last_name="Jones",
        phone="+1234567893",
        is_active=True,
        is_verified=True,
    )
    nurse_user.roles.append(roles["nurse"])
    db.session.add(nurse_user)

    # Receptionist
    reception_user = User(
        email="reception@hms.local",
        password_hash=password_hash,
        first_name="Emily",
        last_name="Brown",
        phone="+1234567894",
        is_active=True,
        is_verified=True,
    )
    reception_user.roles.append(roles["receptionist"])
    db.session.add(reception_user)

    # Pharmacist
    pharma_user = User(
        email="pharma@hms.local",
        password_hash=password_hash,
        first_name="Michael",
        last_name="Chen",
        phone="+1234567895",
        is_active=True,
        is_verified=True,
    )
    pharma_user.roles.append(roles["pharmacist"])
    db.session.add(pharma_user)

    # Lab Technician
    lab_user = User(
        email="labtech@hms.local",
        password_hash=password_hash,
        first_name="David",
        last_name="Wilson",
        phone="+1234567896",
        is_active=True,
        is_verified=True,
    )
    lab_user.roles.append(roles["lab_technician"])
    db.session.add(lab_user)

    # Patient
    patient_user = User(
        email="patient@hms.local",
        password_hash=password_hash,
        first_name="Rahul",
        last_name="Sharma",
        phone="+1234567897",
        is_active=True,
        is_verified=True,
    )
    patient_user.roles.append(roles["patient"])
    db.session.add(patient_user)

    db.session.commit()

    # ── 3. Departments ──
    departments_data = [
        ("Cardiology", "Heart and cardiovascular system"),
        ("Neurology", "Brain and nervous system"),
        ("Orthopedics", "Bones and joints"),
        ("Pediatrics", "Children's health"),
        ("General Medicine", "General medical care"),
    ]
    departments = []
    for name, desc in departments_data:
        dept = Department(name=name, description=desc, is_active=True)
        db.session.add(dept)
        departments.append(dept)
    db.session.commit()

    # ── 4. Doctors ──
    doctor1 = Doctor(
        user_id=doctor1_user.id,
        department_id=departments[0].id,
        employee_id="DOC001",
        specialization="Cardiologist",
        qualification="MD, DM Cardiology",
        experience_years=15,
        license_number="MCI12345",
        consultation_fee=500,
        is_active=True,
    )
    db.session.add(doctor1)

    doctor2 = Doctor(
        user_id=doctor2_user.id,
        department_id=departments[1].id,
        employee_id="DOC002",
        specialization="Neurologist",
        qualification="MD, DM Neurology",
        experience_years=10,
        license_number="MCI12346",
        consultation_fee=600,
        is_active=True,
    )
    db.session.add(doctor2)
    db.session.commit()

    # Add availability for doctors (Mon-Fri, 9 AM - 5 PM)
    for doctor in [doctor1, doctor2]:
        for day in range(5):  # Monday to Friday
            avail = DoctorAvailability(
                doctor_id=doctor.id,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration=30,
                is_active=True,
            )
            db.session.add(avail)
    db.session.commit()

    # ── 5. Nurse ──
    nurse = Nurse(
        user_id=nurse_user.id,
        department_id=departments[0].id,
        employee_id="NUR001",
        qualification="BSc Nursing",
        experience_years=5,
        is_active=True,
    )
    db.session.add(nurse)
    db.session.commit()

    # ── 6. Patients ──
    patients_data = [
        ("P001", "Rahul", "Sharma", date(1985, 5, 15), "male", "O+", "+1234567897", "rahul@example.com"),
        ("P002", "Anjali", "Verma", date(1990, 8, 22), "female", "A+", "+1234567898", "anjali@example.com"),
        ("P003", "Vikram", "Singh", date(1978, 12, 10), "male", "B+", "+1234567899", "vikram@example.com"),
        ("P004", "Sneha", "Reddy", date(1995, 3, 5), "female", "AB+", "+1234567800", "sneha@example.com"),
        ("P005", "Amit", "Kumar", date(1982, 7, 18), "male", "O-", "+1234567801", "amit@example.com"),
    ]
    patients = []
    for pid, fname, lname, dob, gender, bg, phone, email in patients_data:
        patient = Patient(
            patient_id=pid,
            user_id=patient_user.id if pid == "P001" else None,
            first_name=fname,
            last_name=lname,
            date_of_birth=dob,
            gender=gender,
            blood_group=bg,
            phone=phone,
            email=email,
            address=f"123 Street, City",
            city="Mumbai",
            state="Maharashtra",
            zip_code="400001",
            is_active=True,
        )
        db.session.add(patient)
        patients.append(patient)
    db.session.commit()

    # ── 7. Medicines ──
    medicines_data = [
        ("Paracetamol", "Acetaminophen", "Painkiller", "PharmaCo", 5.0, 100, 20),
        ("Amoxicillin", "Amoxicillin", "Antibiotic", "MediCorp", 12.0, 80, 15),
        ("Ibuprofen", "Ibuprofen", "NSAID", "PharmaCo", 8.0, 120, 25),
        ("Aspirin", "Acetylsalicylic Acid", "Antiplatelet", "HealthPharma", 3.0, 200, 30),
        ("Metformin", "Metformin", "Antidiabetic", "DiabCare", 10.0, 150, 20),
    ]
    for name, generic, cat, mfr, price, stock, min_stock in medicines_data:
        med = Medicine(
            name=name,
            generic_name=generic,
            category=cat,
            manufacturer=mfr,
            unit_price=price,
            current_stock=stock,
            min_stock_level=min_stock,
            unit="tablets",
            requires_prescription=True,
            is_active=True,
        )
        db.session.add(med)
    db.session.commit()

    # ── 8. Lab Tests ──
    lab_tests_data = [
        ("CBC", "Complete Blood Count", "Hematology", 300, "4.5 - 11.0 x10^9/L", "x10^9/L", 24),
        ("FBS", "Fasting Blood Sugar", "Biochemistry", 150, "70 - 100 mg/dL", "mg/dL", 6),
        ("LFT", "Liver Function Test", "Biochemistry", 500, "Various", "Various", 24),
        ("XRAY", "X-Ray Chest PA", "Radiology", 400, "N/A", "N/A", 2),
        ("ECG", "Electrocardiogram", "Cardiology", 200, "Normal Sinus Rhythm", "N/A", 1),
    ]
    for code, name, cat, price, nrange, unit, tat in lab_tests_data:
        test = LabTest(
            test_code=code,
            name=name,
            category=cat,
            price=price,
            normal_range=nrange,
            unit=unit,
            turnaround_time_hours=tat,
            is_active=True,
        )
        db.session.add(test)
    db.session.commit()

    # ── 9. Wards, Rooms, Beds ──
    ward1 = Ward(name="General Ward", ward_type="General", floor="1st Floor", is_active=True)
    ward2 = Ward(name="ICU", ward_type="ICU", floor="2nd Floor", is_active=True)
    db.session.add_all([ward1, ward2])
    db.session.commit()

    room1 = Room(ward_id=ward1.id, room_number="101", room_type="Double", rate_per_day=500, is_active=True)
    room2 = Room(ward_id=ward1.id, room_number="102", room_type="Single", rate_per_day=800, is_active=True)
    room3 = Room(ward_id=ward2.id, room_number="201", room_type="ICU", rate_per_day=2000, is_active=True)
    db.session.add_all([room1, room2, room3])
    db.session.commit()

    for room in [room1, room2]:
        bed1 = Bed(room_id=room.id, bed_number="A", is_occupied=False, is_active=True)
        bed2 = Bed(room_id=room.id, bed_number="B", is_occupied=False, is_active=True)
        db.session.add_all([bed1, bed2])

    bed_icu = Bed(room_id=room3.id, bed_number="A", is_occupied=False, is_active=True)
    db.session.add(bed_icu)
    db.session.commit()

    # ── 10. Appointments ──
    tomorrow = date.today() + timedelta(days=1)
    appt1 = Appointment(
        patient_id=patients[0].id,
        doctor_id=doctor1.id,
        appointment_date=tomorrow,
        start_time=time(10, 0),
        end_time=time(10, 30),
        status=Appointment.STATUS_SCHEDULED,
        reason="Regular checkup",
        booked_by_user_id=reception_user.id,
    )
    appt2 = Appointment(
        patient_id=patients[1].id,
        doctor_id=doctor2.id,
        appointment_date=tomorrow,
        start_time=time(11, 0),
        end_time=time(11, 30),
        status=Appointment.STATUS_SCHEDULED,
        reason="Headache consultation",
        booked_by_user_id=reception_user.id,
    )
    db.session.add_all([appt1, appt2])
    db.session.commit()

    print("✓ Seed data created successfully!")
    print("\n=== Demo Credentials ===")
    print("Admin:        admin@hms.local        / Password@123")
    print("Doctor:       dr.smith@hms.local     / Password@123")
    print("Nurse:        nurse.jones@hms.local  / Password@123")
    print("Receptionist: reception@hms.local    / Password@123")
    print("Pharmacist:   pharma@hms.local       / Password@123")
    print("Lab Tech:     labtech@hms.local      / Password@123")
    print("Patient:      patient@hms.local      / Password@123")
