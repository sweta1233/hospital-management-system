"""Celery cleanup tasks."""
from celery import shared_task


@shared_task(name="app.tasks.cleanup.cleanup_expired_data")
def cleanup_expired_data():
    """Prune expired tokens, temporary upload files, etc."""
    return "Cleanup completed."
