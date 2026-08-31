"""CLI commands for Flask app management."""
import click
from flask import Flask


def register_commands(app: Flask):
    """Register CLI commands."""

    @app.cli.command("init-db")
    @click.option("--seed", is_flag=True, help="Seed with full demo data after initializing.")
    def init_db_command(seed):
        """Create database tables and default roles/admin."""
        from app.extensions import db, bcrypt
        from app.models.user import User, Role
        import os

        click.echo("Creating database tables...")
        db.create_all()
        click.echo("✓ Database tables created.")

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
                click.echo(f"  + Created role: {name}")

        db.session.commit()
        click.echo("✓ Default roles ready.")

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
            click.echo(f"✓ Created default admin user: {admin_email}")
        else:
            click.echo(f"✓ Admin user already exists ({admin_email})")

        if seed:
            from app.utils.seed import run_seed
            click.echo("Seeding demo data...")
            run_seed()
            click.echo("✓ Database seeded successfully!")

    @app.cli.command("seed")
    def seed_command():
        """Seed the database with initial data (drops & recreates schema)."""
        from app.utils.seed import run_seed
        click.echo("Seeding database (dropping and rebuilding schema)...")
        run_seed()
        click.echo("✓ Database seeded successfully!")

    @app.cli.command("create-roles")
    def create_roles_command():
        """Create default roles."""
        from app.extensions import db
        from app.models.user import Role

        roles = [
            ("admin", "System administrator with full access"),
            ("doctor", "Medical doctor"),
            ("nurse", "Nursing staff"),
            ("receptionist", "Front desk receptionist"),
            ("pharmacist", "Pharmacy staff"),
            ("lab_technician", "Laboratory technician"),
            ("patient", "Patient"),
        ]

        for name, desc in roles:
            existing = Role.query.filter_by(name=name).first()
            if not existing:
                role = Role(name=name, description=desc)
                db.session.add(role)
                click.echo(f"Created role: {name}")
            else:
                click.echo(f"Role already exists: {name}")

        db.session.commit()
        click.echo("✓ Roles created!")
