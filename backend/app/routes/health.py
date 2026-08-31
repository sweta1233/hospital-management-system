"""Health check endpoint."""
from flask import Blueprint
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
    return success_response(data={"status": "healthy"}, message="HMS API is running")
