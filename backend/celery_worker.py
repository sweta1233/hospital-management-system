"""Celery application for background jobs."""
import os
from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/1")
result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

celery_app = Celery(
    "hms",
    broker=broker_url,
    backend=result_backend,
    include=[
        "app.tasks.pharmacy",
        "app.tasks.appointments",
        "app.tasks.cleanup",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "check-low-stock-daily": {
            "task": "app.tasks.pharmacy.check_low_stock",
            "schedule": crontab(hour=8, minute=0),
        },
        "check-medicine-expiry-daily": {
            "task": "app.tasks.pharmacy.check_medicine_expiry",
            "schedule": crontab(hour=8, minute=5),
        },
        "appointment-reminders-hourly": {
            "task": "app.tasks.appointments.send_appointment_reminders",
            "schedule": crontab(minute=0),
        },
        "cleanup-expired-tokens-daily": {
            "task": "app.tasks.cleanup.cleanup_expired_data",
            "schedule": crontab(hour=0, minute=0),
        },
    },
)


def init_app(app):
    """Tie celery to the Flask app context so tasks can use db, etc."""
    celery_app.conf.update(app.config)

    class ContextTask(celery_app.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app.Task = ContextTask
    return celery_app


# Allow running: celery -A celery_worker worker
if __name__ == "__main__":
    celery_app.start()
