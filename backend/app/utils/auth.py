"""Role-based access control and auth decorators."""
from functools import wraps
from flask import request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User
from app.utils.responses import error_response


def get_current_user() -> User | None:
    """Retrieve the currently authenticated User instance."""
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        return User.query.get(int(user_id))
    except Exception:
        return None


def role_required(*allowed_roles):
    """
    Decorator that enforces:
    1. Valid JWT is present
    2. User exists and is active
    3. User has at least one of the allowed_roles (or 'admin' which always passes)
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))

            if not user or not user.is_active:
                return error_response(
                    message="User account is inactive or not found",
                    error="ACCOUNT_INACTIVE",
                    status_code=403,
                )

            # Admins always pass all role checks
            if user.has_role("admin"):
                return fn(*args, **kwargs)

            # Check if user has any of the required roles
            user_role_names = {r.name for r in user.roles}
            if not any(r in user_role_names for r in allowed_roles):
                return error_response(
                    message=f"Access forbidden: required role(s): {', '.join(allowed_roles)}",
                    error="FORBIDDEN",
                    status_code=403,
                )

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def audit_log(action: str, entity_type: str = None, get_entity_id=None, description: str = None):
    """
    Decorator to automatically record an audit log entry.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            response = fn(*args, **kwargs)
            try:
                from app.extensions import db
                from app.models.audit import AuditLog
                user = get_current_user()

                entity_id = None
                if get_entity_id:
                    entity_id = get_entity_id(kwargs, response)

                log = AuditLog(
                    user_id=user.id if user else None,
                    action=action,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    description=description or f"{action} {entity_type or ''}",
                    ip_address=request.remote_addr,
                    user_agent=str(request.user_agent)[:255] if request.user_agent else None,
                )
                db.session.add(log)
                db.session.commit()
            except Exception:
                pass  # Non-blocking for audit logs
            return response
        return wrapper
    return decorator
