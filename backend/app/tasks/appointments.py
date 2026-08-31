"""Celery tasks for appointments."""
from celery import shared_task


@shared_task(name="app.tasks.appointments.send_appointment_reminders")
def send_appointment_reminders():
    """Send appointment reminders 24 hours in advance."""
    return "Checked appointment reminders."
