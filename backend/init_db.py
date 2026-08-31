"""Database initialization script for production deployments."""
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User, Role

app = create_app()

with app.app_context():
    print("Creating all database tables...")
    db.create_all()
    print("✓ Tables created.")

    roles_data = [
        ("admin", "System administrator with full access"),
        ("doctor", "Medical doctor"),
        ("nurse", "Nursing staff"),
        ("receptionist", "Front desk receptionist"),
        ("pharmacist", "Pharmacy staff"),
        ("lab_technician", "Laboratory technician"),
        ("patient", "Patient"),
    ]

    for name, desc in roles_data:
        existing = Role.query.filter_by(name=name).first()
        if not existing:
            role = Role(name=name, description=desc)
            db.session.add(role)
            print(f"  + Created role: {name}")

    db.session.commit()
    print("✓ Default roles ready.")

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@hms.local")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123456")
    admin_user = User.query.filter_by(email=admin_email).first()

    if not admin_user:
        admin_role = Role.query.filter_by(name="admin").first()
        password_hash = bcrypt.generate_password_hash(admin_password).decode("utf-8")
        admin_user = User(
            email=admin_email,
            password_hash=password_hash,
            first_name="System",
            last_name="Admin",
            phone="+1234567890",
            is_active=True,
            is_verified=True,
        )
        if admin_role:
            admin_user.roles.append(admin_role)
        db.session.add(admin_user)
        db.session.commit()
        print(f"✓ Created default admin user: {admin_email} / {admin_password}")
    else:
        print(f"✓ Admin user already exists: {admin_email}")

    # Optional seed if SEED_DB=true
    if os.environ.get("SEED_DB", "").lower() in ("true", "1", "yes"):
        from app.utils.seed import run_seed
        print("SEED_DB is set. Seeding full demo data...")
        run_seed()
        print("✓ Demo seed completed!")

    print("✓ Database initialization complete!")
