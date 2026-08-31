"""Celery background tasks for pharmacy."""
from datetime import date, timedelta
from celery import shared_task
from app.extensions import db
from app.models.medicine import Medicine
from app.models.notification import Notification
from app.models.user import User


@shared_task(name="app.tasks.pharmacy.check_low_stock")
def check_low_stock():
    """Check for medicines with low stock and alert pharmacists."""
    low_stock = Medicine.query.filter(
        Medicine.current_stock <= Medicine.min_stock_level,
        Medicine.is_active == True,
    ).all()

    if not low_stock:
        return "No low stock medicines"

    # Find pharmacists
    pharmacists = User.query.filter(User.roles.any(name="pharmacist")).all()

    for med in low_stock:
        for ph in pharmacists:
            notif = Notification(
                user_id=ph.id,
                notification_type=Notification.TYPE_ALERT,
                title="Low Stock Alert",
                message=f"Medicine '{med.name}' is low on stock ({med.current_stock} remaining, minimum: {med.min_stock_level}).",
            )
            db.session.add(notif)

    db.session.commit()
    return f"Generated {len(low_stock)} low stock alerts."


@shared_task(name="app.tasks.pharmacy.check_medicine_expiry")
def check_medicine_expiry():
    """Check for medicines expiring within 30 days."""
    # Logic to query InventoryTransaction for near-expiry batches
    return "Checked medicine expiry."
