"""Backend tests for authentication, RBAC, and staff management."""
import pytest
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User, Role


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()

        # Seed roles
        for role_name in ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_technician", "patient"]:
            if not Role.query.filter_by(name=role_name).first():
                db.session.add(Role(name=role_name, description=role_name.title()))

        # Seed Admin user
        admin = User(
            email="admin@hms.local",
            password_hash=bcrypt.generate_password_hash("Admin@123").decode("utf-8"),
            first_name="System",
            last_name="Admin",
            phone="+1000000000",
            is_active=True,
        )
        admin_role = Role.query.filter_by(name="admin").first()
        admin.roles.append(admin_role)
        db.session.add(admin)
        db.session.commit()

        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def test_health_check(client):
    """Test health endpoint."""
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json["success"] is True


def test_patient_registration_and_login(client):
    """Test patient registration, profile auto-creation, and patient login."""
    # 1. Register new patient
    res = client.post("/api/auth/patient/register", json={
        "email": "jane.doe@example.com",
        "password": "Password@123",
        "first_name": "Jane",
        "last_name": "Doe",
        "phone": "+1987654321",
        "date_of_birth": "1995-05-15",
        "gender": "female",
        "blood_group": "O+",
        "address": "123 Main Street",
    })
    assert res.status_code == 201
    assert res.json["success"] is True
    assert "access_token" in res.json["data"]
    assert res.json["data"]["patient"]["first_name"] == "Jane"

    # 2. Patient Login
    res = client.post("/api/auth/patient/login", json={
        "email": "jane.doe@example.com",
        "password": "Password@123",
    })
    assert res.status_code == 200
    assert res.json["success"] is True
    assert "access_token" in res.json["data"]


def test_invalid_patient_credentials(client):
    """Test login failure with wrong password and nonexistent user."""
    # Wrong password
    res = client.post("/api/auth/patient/login", json={
        "email": "admin@hms.local",
        "password": "WrongPassword",
    })
    assert res.status_code in [401, 403]
    assert res.json["success"] is False

    # Nonexistent user
    res = client.post("/api/auth/patient/login", json={
        "email": "nonexistent@example.com",
        "password": "Password@123",
    })
    assert res.status_code == 404
    assert res.json["success"] is False


def test_staff_login_and_admin_rbac(client):
    """Test staff login and admin staff creation flow."""
    # 1. Admin logs into staff portal
    res = client.post("/api/auth/staff/login", json={
        "email": "admin@hms.local",
        "password": "Admin@123",
    })
    assert res.status_code == 200
    assert res.json["success"] is True
    admin_token = res.json["data"]["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Admin creates a Doctor account
    res = client.post("/api/staff/users", headers=headers, json={
        "email": "dr.house@hms.local",
        "password": "Doctor@123",
        "first_name": "Gregory",
        "last_name": "House",
        "phone": "+1555555555",
        "role": "doctor",
        "specialization": "Diagnostics",
        "consultation_fee": 150,
    })
    assert res.status_code == 201
    assert res.json["success"] is True
    doctor_id = res.json["data"]["id"]

    # 3. Doctor logs in via staff portal
    res = client.post("/api/auth/staff/login", json={
        "email": "dr.house@hms.local",
        "password": "Doctor@123",
    })
    assert res.status_code == 200
    assert res.json["success"] is True

    # 4. Admin deactivates doctor account
    res = client.post(f"/api/staff/users/{doctor_id}/deactivate", headers=headers)
    assert res.status_code == 200

    # 5. Deactivated doctor fails to login
    res = client.post("/api/auth/staff/login", json={
        "email": "dr.house@hms.local",
        "password": "Doctor@123",
    })
    assert res.status_code == 403
    assert "deactivated" in res.json["message"].lower()

    # 6. Admin activates doctor account back
    res = client.post(f"/api/staff/users/{doctor_id}/activate", headers=headers)
    assert res.status_code == 200

    # 7. Admin resets doctor password
    res = client.post(f"/api/staff/users/{doctor_id}/reset-password", headers=headers, json={
        "new_password": "NewPassword@123",
    })
    assert res.status_code == 200

    # 8. Doctor logs in with new password
    res = client.post("/api/auth/staff/login", json={
        "email": "dr.house@hms.local",
        "password": "NewPassword@123",
    })
    assert res.status_code == 200
    assert res.json["success"] is True


def test_forgot_and_reset_password(client):
    """Test forgot password and reset token flow."""
    # 1. Request reset token
    res = client.post("/api/auth/forgot-password", json={
        "email": "admin@hms.local",
    })
    assert res.status_code == 200
    token = res.json.get("data", {}).get("reset_token")
    assert token is not None

    # 2. Reset password using token
    res = client.post("/api/auth/reset-password", json={
        "token": token,
        "new_password": "AdminNewPass@123",
        "confirm_password": "AdminNewPass@123",
    })
    assert res.status_code == 200

    # 3. Login with new password
    res = client.post("/api/auth/staff/login", json={
        "email": "admin@hms.local",
        "password": "AdminNewPass@123",
    })
    assert res.status_code == 200
    assert res.json["success"] is True
