"""User management routes."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.models.user import User
from app.utils.responses import success_response, paginated_response
from app.utils.auth import role_required

users_bp = Blueprint("users", __name__)


@users_bp.route("", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_users():
    """List all users (admin only)."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    query = User.query.filter_by(is_active=True)
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return paginated_response(
        items=[u.to_dict() for u in users],
        total=total,
        page=page,
        per_page=per_page,
    )


@users_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_user(user_id):
    """Get single user."""
    user = User.query.get(user_id)
    if not user:
        return {"success": False, "message": "User not found"}, 404
    return success_response(data=user.to_dict())
