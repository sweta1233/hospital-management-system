"""User and Role models."""
from datetime import datetime, timezone
from app.extensions import db

# Many-to-many: users ↔ roles
user_roles = db.Table(
    "user_roles",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    db.Column("role_id", db.Integer, db.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<Role {self.name}>"

    def to_dict(self):
        return {"id": self.id, "name": self.name, "description": self.description}


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    phone = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    last_login = db.Column(db.DateTime)
    password_reset_token = db.Column(db.String(255))
    password_reset_expires = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    roles = db.relationship("Role", secondary=user_roles, lazy="subquery", backref=db.backref("users", lazy=True))
    notifications = db.relationship("Notification", back_populates="user", lazy="dynamic", cascade="all, delete-orphan")
    chat_rooms = db.relationship("ChatRoomMember", back_populates="user", lazy="dynamic")
    audit_logs = db.relationship("AuditLog", back_populates="user", lazy="dynamic")

    def __repr__(self):
        return f"<User {self.email}>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def has_role(self, role_name: str) -> bool:
        return any(r.name == role_name for r in self.roles)

    def get_primary_role(self) -> str | None:
        """Return the most-privileged role name."""
        priority = ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_technician", "patient"]
        for role in priority:
            if self.has_role(role):
                return role
        return self.roles[0].name if self.roles else None

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "phone": self.phone,
            "is_active": self.is_active,
            "roles": [r.to_dict() for r in self.roles],
            "primary_role": self.get_primary_role(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
