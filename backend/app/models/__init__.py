# Models package — import all models here so Flask-Migrate discovers them
from app.models.user import User, Role, user_roles  # noqa: F401
from app.models.department import Department  # noqa: F401
from app.models.patient import Patient  # noqa: F401
from app.models.doctor import Doctor, DoctorAvailability  # noqa: F401
from app.models.nurse import Nurse  # noqa: F401
from app.models.appointment import Appointment  # noqa: F401
from app.models.medical_record import MedicalRecord  # noqa: F401
from app.models.vital import Vital  # noqa: F401
from app.models.prescription import Prescription, PrescriptionItem  # noqa: F401
from app.models.medicine import Medicine, InventoryTransaction  # noqa: F401
from app.models.laboratory import LabTest, LabOrder, LabResult  # noqa: F401
from app.models.admission import Admission, Ward, Room, Bed  # noqa: F401
from app.models.billing import Bill, BillItem, Payment  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.chat import ChatRoom, ChatRoomMember, ChatMessage  # noqa: F401
from app.models.audit import AuditLog  # noqa: F401
from app.models.otp import OTP  # noqa: F401
