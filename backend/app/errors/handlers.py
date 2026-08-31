"""Global error handling for the Flask app."""
import logging
from flask import jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.exceptions import HTTPException
from app.utils.responses import error_response

logger = logging.getLogger(__name__)


def register_error_handlers(app):
    """Register all global error handlers on the Flask app."""

    @app.errorhandler(ValidationError)
    def handle_validation_error(e):
        return error_response(
            message="Validation failed",
            error="VALIDATION_ERROR",
            status_code=422,
            details=e.messages,
        )

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(e):
        from app.extensions import db
        db.session.rollback()
        logger.warning(f"IntegrityError: {e}")
        return error_response(
            message="A database integrity constraint was violated (e.g. duplicate key)",
            error="INTEGRITY_ERROR",
            status_code=409,
        )

    @app.errorhandler(SQLAlchemyError)
    def handle_sqlalchemy_error(e):
        from app.extensions import db
        db.session.rollback()
        logger.error(f"Database error: {e}", exc_info=True)
        return error_response(
            message="A database error occurred",
            error="DATABASE_ERROR",
            status_code=500,
        )

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        return error_response(
            message=e.description,
            error=e.name.upper().replace(" ", "_"),
            status_code=e.code,
        )

    @app.errorhandler(Exception)
    def handle_unexpected_error(e):
        logger.critical(f"Unhandled exception: {e}", exc_info=True)
        return error_response(
            message="An unexpected internal server error occurred",
            error="INTERNAL_SERVER_ERROR",
            status_code=500,
        )
