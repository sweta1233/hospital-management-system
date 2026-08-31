"""Notifications routes."""
from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.notification import Notification
from app.utils.responses import success_response, error_response, paginated_response

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("", methods=["GET"])
@jwt_required()
def get_notifications():
    """Get current user's notifications."""
    user_id = int(get_jwt_identity())
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    unread_only = request.args.get("unread_only", "false").lower() == "true"

    query = Notification.query.filter_by(user_id=user_id)
    if unread_only:
        query = query.filter_by(is_read=False)

    total = query.count()
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    notifs = query.order_by(Notification.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "success": True,
        "message": "Notifications fetched",
        "data": {
            "items": [n.to_dict() for n in notifs],
            "unread_count": unread_count,
            "total": total,
            "page": page,
            "per_page": per_page,
        }
    }, 200


@notifications_bp.route("/<int:notif_id>/read", methods=["PATCH"])
@jwt_required()
def mark_read(notif_id):
    """Mark a notification as read."""
    user_id = int(get_jwt_identity())
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if not notif:
        return error_response("Notification not found", "NOT_FOUND", 404)

    notif.is_read = True
    notif.read_at = datetime.now(timezone.utc)
    db.session.commit()

    return success_response(message="Notification marked as read")


@notifications_bp.route("/all-read", methods=["POST"])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read for current user."""
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False).update({
        "is_read": True,
        "read_at": datetime.now(timezone.utc)
    })
    db.session.commit()
    return success_response(message="All notifications marked as read")
