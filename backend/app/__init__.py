import os
import redis as redis_lib
from flask import Flask
from dotenv import load_dotenv

from app.config import config
from app.extensions import db, migrate, jwt, bcrypt, cors, socketio, limiter

load_dotenv()

# JWT token blocklist (stored in Redis)
_redis_client = None


def get_redis():
    global _redis_client
    if _redis_client is None:
        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
        _redis_client = redis_lib.from_url(redis_url, decode_responses=True)
    return _redis_client


def create_app(config_name: str | None = None) -> Flask:
    """Application factory."""
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config.get(config_name, config["default"]))

    # Ensure upload dirs exist
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "lab"), exist_ok=True)
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "docs"), exist_ok=True)

    # ── Extensions ─────────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )
    async_mode = app.config.get("SOCKETIO_ASYNC_MODE") or os.environ.get("SOCKETIO_ASYNC_MODE")
    if async_mode == "eventlet":
        try:
            import eventlet
            import eventlet.green.threading  # noqa: F401
        except Exception:
            async_mode = "threading"

    socketio.init_app(
        app,
        cors_allowed_origins=app.config["SOCKETIO_CORS_ALLOWED_ORIGINS"],
        async_mode=async_mode,
        logger=False,
        engineio_logger=False,
    )
    limiter.init_app(app)

    # ── JWT token blocklist callback ───────────────────────
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        try:
            r = get_redis()
            token_in_redis = r.get(f"blocklist:{jti}")
            return token_in_redis is not None
        except Exception:
            return False

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {"success": False, "message": "Token has expired", "error": "TOKEN_EXPIRED"}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {"success": False, "message": "Invalid token", "error": "INVALID_TOKEN"}, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {"success": False, "message": "Authorization token is required", "error": "MISSING_TOKEN"}, 401

    # ── Import models so Flask-Migrate picks them up ───────
    with app.app_context():
        from app.models import (  # noqa: F401
            user, patient, doctor, department, nurse, appointment,
            medical_record, vital, prescription, medicine, laboratory,
            admission, billing, notification, chat, audit, otp,
        )

    # ── Register blueprints ────────────────────────────────
    from app.routes.auth import auth_bp
    from app.routes.staff import staff_bp
    from app.routes.users import users_bp
    from app.routes.patients import patients_bp
    from app.routes.doctors import doctors_bp
    from app.routes.departments import departments_bp
    from app.routes.appointments import appointments_bp
    from app.routes.medical_records import medical_records_bp
    from app.routes.vitals import vitals_bp
    from app.routes.prescriptions import prescriptions_bp
    from app.routes.medicines import medicines_bp
    from app.routes.inventory import inventory_bp
    from app.routes.laboratory import laboratory_bp
    from app.routes.admissions import admissions_bp
    from app.routes.billing import billing_bp
    from app.routes.notifications import notifications_bp
    from app.routes.chat import chat_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.health import health_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(staff_bp, url_prefix="/api/staff")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(patients_bp, url_prefix="/api/patients")
    app.register_blueprint(doctors_bp, url_prefix="/api/doctors")
    app.register_blueprint(departments_bp, url_prefix="/api/departments")
    app.register_blueprint(appointments_bp, url_prefix="/api/appointments")
    app.register_blueprint(medical_records_bp, url_prefix="/api/medical-records")
    app.register_blueprint(vitals_bp, url_prefix="/api/vitals")
    app.register_blueprint(prescriptions_bp, url_prefix="/api/prescriptions")
    app.register_blueprint(medicines_bp, url_prefix="/api/medicines")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(laboratory_bp, url_prefix="/api/laboratory")
    app.register_blueprint(admissions_bp, url_prefix="/api/admissions")
    app.register_blueprint(billing_bp, url_prefix="/api/billing")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    # ── Register SocketIO events ───────────────────────────
    from app.websocket import events  # noqa: F401

    # ── Error handlers ─────────────────────────────────────
    from app.errors.handlers import register_error_handlers
    register_error_handlers(app)

    # ── CLI commands ───────────────────────────────────────
    from app.utils.cli import register_commands
    register_commands(app)

    # ── Swagger/OpenAPI docs ───────────────────────────────
    from flasgger import Swagger
    app.config["SWAGGER"] = {
        "title": "Hospital Management System API",
        "version": "1.0.0",
        "description": "Complete REST API for HMS",
        "uiversion": 3,
        "specs_route": "/docs",
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'",
            }
        },
    }
    Swagger(app)

    return app
