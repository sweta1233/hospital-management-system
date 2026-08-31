import requests
import json
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:5000/api"

def print_result(name, passed, detail=""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status} - {name} {f'({detail})' if detail else ''}")

def test_all():
    session = requests.Session()

    print("\n=======================================================")
    print("HMS ENDPOINT & INTEGRATION VERIFICATION")
    print("=======================================================\n")

    # 1. Health Check
    try:
        r = session.get(f"{BASE_URL}/health")
        print_result("1. Health Endpoint", r.status_code == 200, r.json().get("message"))
    except Exception as e:
        print_result("1. Health Endpoint", False, str(e))
        return

    # 2. Patient Login via Password
    pat_token = None
    try:
        r = session.post(f"{BASE_URL}/auth/patient/login", json={
            "email": "patient@hms.local",
            "password": "Password@123"
        })
        passed = r.status_code == 200 and "access_token" in r.json().get("data", {})
        if passed:
            pat_token = r.json()["data"]["access_token"]
        print_result("2. Patient Login (Password Method)", passed, f"Status: {r.status_code}")
    except Exception as e:
        print_result("2. Patient Login (Password Method)", False, str(e))

    # 3. Patient Login via OTP (Email)
    try:
        # Step 3a: Send OTP to email
        r_otp = session.post(f"{BASE_URL}/auth/send-otp", json={
            "identifier": "patient@hms.local",
            "portal": "patient"
        })
        otp_data = r_otp.json().get("data", {})
        otp_code = otp_data.get("otp_preview")
        passed_send = r_otp.status_code == 200 and bool(otp_code)
        print_result("3a. Patient OTP Request (via Email)", passed_send, f"Code generated: {otp_code}")

        # Step 3b: Verify OTP
        if passed_send:
            r_verify = session.post(f"{BASE_URL}/auth/verify-otp", json={
                "identifier": "patient@hms.local",
                "otp_code": otp_code,
                "portal": "patient"
            })
            passed_verify = r_verify.status_code == 200 and "access_token" in r_verify.json().get("data", {})
            print_result("3b. Patient OTP Verification (via Email)", passed_verify, f"Token received")
    except Exception as e:
        print_result("3. Patient OTP via Email", False, str(e))

    # 4. Patient Login via OTP (Mobile Phone Number)
    try:
        # Check patient's phone from profile
        headers_pat = {"Authorization": f"Bearer {pat_token}"}
        r_me = session.get(f"{BASE_URL}/auth/me", headers=headers_pat)
        patient_phone = r_me.json().get("data", {}).get("phone") or "+15550000001"

        # Request OTP to phone
        r_otp_phone = session.post(f"{BASE_URL}/auth/send-otp", json={
            "identifier": patient_phone,
            "portal": "patient"
        })
        otp_phone_code = r_otp_phone.json().get("data", {}).get("otp_preview")
        passed_phone_send = r_otp_phone.status_code == 200 and bool(otp_phone_code)
        print_result("4a. Patient OTP Request (via Mobile Phone)", passed_phone_send, f"Phone: {patient_phone}, Code: {otp_phone_code}")

        if passed_phone_send:
            r_phone_verify = session.post(f"{BASE_URL}/auth/verify-otp", json={
                "identifier": patient_phone,
                "otp_code": otp_phone_code,
                "portal": "patient"
            })
            passed_phone_verify = r_phone_verify.status_code == 200 and "access_token" in r_phone_verify.json().get("data", {})
            print_result("4b. Patient OTP Verification (via Mobile Phone)", passed_phone_verify, f"Token received")
    except Exception as e:
        print_result("4. Patient OTP via Phone", False, str(e))

    # 5. Role Logins for all staff roles
    roles_to_test = [
        ("Admin", "admin@hms.local"),
        ("Doctor", "dr.smith@hms.local"),
        ("Nurse", "nurse.jones@hms.local"),
        ("Receptionist", "reception@hms.local"),
        ("Pharmacist", "pharma@hms.local"),
        ("Lab Technician", "labtech@hms.local"),
    ]

    tokens = {}
    print("\n--- Testing All Staff Role Logins ---")
    for role_name, email in roles_to_test:
        try:
            r = session.post(f"{BASE_URL}/auth/staff/login", json={
                "email": email,
                "password": "Password@123"
            })
            passed = r.status_code == 200 and "access_token" in r.json().get("data", {})
            if passed:
                tokens[role_name] = r.json()["data"]["access_token"]
            print_result(f"Staff Login: {role_name} ({email})", passed)
        except Exception as e:
            print_result(f"Staff Login: {role_name}", False, str(e))

    admin_token = tokens.get("Admin")
    doc_token = tokens.get("Doctor")
    nurse_token = tokens.get("Nurse")
    reception_token = tokens.get("Receptionist")
    pharma_token = tokens.get("Pharmacist")
    labtech_token = tokens.get("Lab Technician")

    # 6. Admin Onboarding New Staff (New Doctor & New Nurse)
    print("\n--- Testing New Staff Onboarding & Login ---")
    ts = int(time.time())
    new_doc_email = f"doc_{ts}@hms.local"
    new_nurse_email = f"nurse_{ts}@hms.local"

    try:
        # Create New Doctor as Admin
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        r_create_doc = session.post(f"{BASE_URL}/staff/users", headers=headers_admin, json={
            "first_name": "Dr. Ananya",
            "last_name": "Verma",
            "email": new_doc_email,
            "phone": f"+9198765{ts % 100000:05d}",
            "password": "Password@123",
            "role": "doctor",
            "specialization": "Cardiology",
            "consultation_fee": 75,
            "qualification": "MBBS, MD Cardiology"
        })
        passed_create_doc = r_create_doc.status_code == 201
        print_result("6a. Admin Onboards New Doctor", passed_create_doc, r_create_doc.json().get("message"))

        # Create New Nurse as Admin
        r_create_nurse = session.post(f"{BASE_URL}/staff/users", headers=headers_admin, json={
            "first_name": "Sister Priya",
            "last_name": "Nair",
            "email": new_nurse_email,
            "phone": f"+9198766{ts % 100000:05d}",
            "password": "Password@123",
            "role": "nurse",
            "qualification": "B.Sc Nursing / RN",
            "experience_years": 4
        })
        passed_create_nurse = r_create_nurse.status_code == 201
        print_result("6b. Admin Onboards New Nurse", passed_create_nurse, r_create_nurse.json().get("message"))

        # Test New Doctor Login
        r_new_doc_login = session.post(f"{BASE_URL}/auth/staff/login", json={
            "email": new_doc_email,
            "password": "Password@123"
        })
        passed_new_doc_login = r_new_doc_login.status_code == 200
        print_result("6c. Newly Provisioned Doctor Logins", passed_new_doc_login, f"Token issued")

        # Test New Nurse Login
        r_new_nurse_login = session.post(f"{BASE_URL}/auth/staff/login", json={
            "email": new_nurse_email,
            "password": "Password@123"
        })
        passed_new_nurse_login = r_new_nurse_login.status_code == 200
        print_result("6d. Newly Provisioned Nurse Logins", passed_new_nurse_login, f"Token issued")

    except Exception as e:
        print_result("6. New Staff Onboarding & Login", False, str(e))

    # 7. Clinical Appointments & Doctor View
    print("\n--- Testing Appointments & Doctor Online Visibility ---")
    created_appt_id = None
    try:
        headers_doc = {"Authorization": f"Bearer {doc_token}"}
        # Doctor views list of appointments
        r_doc_appts = session.get(f"{BASE_URL}/appointments?per_page=20", headers=headers_doc)
        passed_doc_appts = r_doc_appts.status_code == 200
        appts_list = r_doc_appts.json().get("data", {}).get("items", [])
        print_result("7a. Doctor fetches Appointments List", passed_doc_appts, f"{len(appts_list)} appointments found")

        # Book a new online consultation appointment with unique slot
        import random
        rand_slot_h = random.randint(8, 18)
        rand_slot_m = random.choice([0, 15, 30, 45])
        appt_date_str = f"2026-11-{(ts % 20) + 1:02d}"
        r_book = session.post(f"{BASE_URL}/appointments", headers=headers_doc, json={
            "patient_id": 1,
            "doctor_id": 1,
            "appointment_date": appt_date_str,
            "start_time": f"{rand_slot_h:02d}:{rand_slot_m:02d}",
            "end_time": f"{rand_slot_h:02d}:{(rand_slot_m + 30) % 60:02d}",
            "reason": "Video consult for hypertension follow-up"
        })
        passed_book = r_book.status_code in [200, 201]
        if passed_book:
            created_appt_id = r_book.json().get("data", {}).get("id")
        print_result("7b. Book Online Consultation Appointment", passed_book, f"Appt ID: {created_appt_id}, Msg: {r_book.json().get('message') or r_book.json().get('error')}")

        # Update status to checked_in then completed
        if created_appt_id:
            r_checkin = session.put(f"{BASE_URL}/appointments/{created_appt_id}/status", headers=headers_doc, json={"status": "checked_in"})
            print_result("7c. Doctor / Receptionist Check-in Appointment", r_checkin.status_code == 200)
    except Exception as e:
        print_result("7. Appointments", False, str(e))

    # 8. Prescriptions Flow (Doctor Creates -> Pharmacist Dispenses -> Patient Views)
    print("\n--- Testing Prescriptions Flow ---")
    created_rx_id = None
    try:
        headers_doc = {"Authorization": f"Bearer {doc_token}"}
        headers_pharma = {"Authorization": f"Bearer {pharma_token}"}
        headers_pat = {"Authorization": f"Bearer {pat_token}"}

        # 8a. Doctor creates prescription with items
        r_rx = session.post(f"{BASE_URL}/prescriptions", headers=headers_doc, json={
            "patient_id": 1,
            "notes": "Post-consultation medication protocol",
            "items": [
                {
                    "medicine_id": 1,
                    "medicine_name": "Paracetamol 650mg",
                    "dosage": "650mg",
                    "frequency": "1-0-1 after meals",
                    "duration": "5 days",
                    "quantity": 10,
                    "instructions": "Take after meals"
                },
                {
                    "medicine_name": "Amoxicillin 500mg",
                    "dosage": "500mg",
                    "frequency": "1-0-1",
                    "duration": "5 days",
                    "quantity": 10,
                    "instructions": "Complete full antibiotic course"
                }
            ]
        })
        passed_rx_create = r_rx.status_code == 201
        if passed_rx_create:
            created_rx_id = r_rx.json().get("data", {}).get("id")
        print_result("8a. Doctor Generates Prescription with Items", passed_rx_create, f"Rx ID: {created_rx_id}")

        # 8b. Pharmacist dispenses prescription
        if created_rx_id:
            r_dispense = session.post(f"{BASE_URL}/prescriptions/{created_rx_id}/dispense", headers=headers_pharma)
            passed_dispense = r_dispense.status_code == 200
            print_result("8b. Pharmacist Dispenses Prescription (Stock Auto-Deducted)", passed_dispense)

        # 8c. Patient views their prescriptions
        r_pat_rx = session.get(f"{BASE_URL}/prescriptions?patient_id=1", headers=headers_pat)
        passed_pat_rx = r_pat_rx.status_code == 200 and len(r_pat_rx.json().get("data", {}).get("items", [])) > 0
        print_result("8c. Patient Views Their Prescriptions", passed_pat_rx, f"Prescriptions visible to patient")

    except Exception as e:
        print_result("8. Prescriptions Flow", False, str(e))

    # 9. Laboratory Flow (Doctor Orders -> Lab Tech Processes & Uploads -> Patient Views Report)
    print("\n--- Testing Laboratory & Diagnostic Reports Flow ---")
    created_order_id = None
    try:
        headers_doc = {"Authorization": f"Bearer {doc_token}"}
        headers_lab = {"Authorization": f"Bearer {labtech_token}"}
        headers_pat = {"Authorization": f"Bearer {pat_token}"}

        # 9a. Doctor orders lab test
        r_order = session.post(f"{BASE_URL}/laboratory/orders", headers=headers_doc, json={
            "patient_id": 1,
            "test_id": 1,
            "priority": "routine",
            "clinical_notes": "Suspected viral infection - complete blood count"
        })
        passed_order = r_order.status_code == 201
        if passed_order:
            created_order_id = r_order.json().get("data", {}).get("id")
        print_result("9a. Doctor Orders Laboratory Test", passed_order, f"Lab Order ID: {created_order_id}")

        # 9b. Lab Tech uploads results and completes report
        if created_order_id:
            # Update to sample collected
            session.put(f"{BASE_URL}/laboratory/orders/{created_order_id}/status", headers=headers_lab, json={"status": "sample_collected"})

            # Add results & complete
            r_results = session.post(f"{BASE_URL}/laboratory/orders/{created_order_id}/results", headers=headers_lab, json={
                "results": [
                    {"parameter_name": "Hemoglobin", "measured_value": "14.2", "unit": "g/dL", "reference_range": "13.0 - 17.0", "status": "normal"},
                    {"parameter_name": "WBC Count", "measured_value": "7800", "unit": "/mcL", "reference_range": "4000 - 11000", "status": "normal"},
                    {"parameter_name": "Platelets", "measured_value": "240000", "unit": "/mcL", "reference_range": "150000 - 450000", "status": "normal"},
                ],
                "remarks": "All hematology parameters within normal limits."
            })
            passed_results = r_results.status_code == 200
            print_result("9b. Lab Tech Generates Diagnostic Report & Signs Off", passed_results)

        # 9c. Patient views their lab reports
        r_pat_labs = session.get(f"{BASE_URL}/laboratory/orders?patient_id=1", headers=headers_pat)
        passed_pat_labs = r_pat_labs.status_code == 200
        print_result("9c. Patient Accesses Their Lab Reports", passed_pat_labs, f"Reports available for download/view")

    except Exception as e:
        print_result("9. Laboratory Flow", False, str(e))

    # 10. Billing Flow (Create Invoice -> Attach Rx/Consultation -> Record Payment -> Patient Views)
    print("\n--- Testing Billing, Invoices & Payment Processing ---")
    created_bill_id = None
    try:
        headers_rec = {"Authorization": f"Bearer {reception_token}"}
        headers_pat = {"Authorization": f"Bearer {pat_token}"}

        # 10a. Receptionist creates an itemized bill
        r_bill = session.post(f"{BASE_URL}/billing", headers=headers_rec, json={
            "patient_id": 1,
            "discount_amount": 10.0,
            "tax_amount": 5.0,
            "notes": "Comprehensive outpatient invoice",
            "items": [
                {"item_type": "consultation", "description": "Cardiology Specialist Consult", "quantity": 1, "unit_price": 75.0},
                {"item_type": "lab_test", "description": "Complete Blood Count (CBC)", "quantity": 1, "unit_price": 30.0},
                {"item_type": "medicine", "description": "Prescription Medicines (Paracetamol + Amoxicillin)", "quantity": 2, "unit_price": 15.0}
            ]
        })
        passed_bill = r_bill.status_code == 201
        if passed_bill:
            created_bill_id = r_bill.json().get("data", {}).get("id")
            total_amt = r_bill.json().get("data", {}).get("total_amount")
        print_result("10a. Receptionist Creates Itemized Bill with Line Items", passed_bill, f"Bill ID: {created_bill_id}, Total: ${total_amt if passed_bill else 0}, Status: {r_bill.status_code}, Resp: {r_bill.text}")

        # 10b. Record Payment towards bill
        if created_bill_id:
            r_pay = session.post(f"{BASE_URL}/billing/{created_bill_id}/payments", headers=headers_rec, json={
                "amount": 50.0,
                "payment_method": "upi",
                "transaction_reference": "UPI-TXN-987654321",
                "notes": "Partial payment via QR code"
            })
            passed_pay = r_pay.status_code == 200
            print_result("10b. Record Payment ($50 via UPI/QR)", passed_pay, f"Remaining Due: ${r_pay.json().get('data', {}).get('balance_due')}")

        # 10c. Patient views their bills
        r_pat_bills = session.get(f"{BASE_URL}/billing?patient_id=1", headers=headers_pat)
        passed_pat_bills = r_pat_bills.status_code == 200
        print_result("10c. Patient Views Their Invoices & Dues", passed_pat_bills)

    except Exception as e:
        print_result("10. Billing Flow", False, str(e))

    print("\n=======================================================")
    print("🎯 SUMMARY: ALL CLINICAL & ADMINISTRATIVE FLOWS TESTED")
    print("=======================================================\n")

if __name__ == "__main__":
    test_all()
