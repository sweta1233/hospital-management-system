"""Standardized API response helper functions."""
from flask import jsonify


def success_response(data=None, message="Success", status_code=200):
    """Generate a standard success JSON response."""
    payload = {
        "success": True,
        "message": message,
    }
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status_code


def paginated_response(items, total, page, per_page, message="Success", status_code=200):
    """Generate a paginated success response."""
    pages = (total + per_page - 1) // per_page if per_page > 0 else 1
    return jsonify({
        "success": True,
        "message": message,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages,
            "has_next": page < pages,
            "has_prev": page > 1,
        }
    }), status_code


def error_response(message="An error occurred", error="ERROR", status_code=400, details=None):
    """Generate a standard error JSON response."""
    payload = {
        "success": False,
        "message": message,
        "error": error,
    }
    if details:
        payload["details"] = details
    return jsonify(payload), status_code
