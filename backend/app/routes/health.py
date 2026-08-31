"""Health check endpoint."""
from flask import Blueprint
from sqlalchemy import text
from app.extensions import db
from app.utils.responses import success_response

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint
    ---
    tags:
      - Health
    responses:
      200:
        description: Service is healthy
    """
    db_status = "unknown"
    try:
        db.session.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    return success_response(
        data={
            "status": "healthy" if db_status == "connected" else "degraded",
            "database": db_status,
        },
        message="HMS API is running"
    )
