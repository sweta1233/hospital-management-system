# 🏥 Hospital Management System (HMS)

**A production-quality, full-stack Hospital Management System** built with modern technologies: React + Vite, Python Flask, PostgreSQL, Redis, Celery, WebSockets, Docker.

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Demo Accounts](#demo-accounts)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Security Features](#security-features)
- [Real-Time Features](#real-time-features)
- [Background Jobs](#background-jobs)
- [Testing](#testing)
- [Deployment](#deployment)
- [Development](#development)

---

## 🎯 Overview

This Hospital Management System is a comprehensive, enterprise-grade solution for managing hospital operations including patient records, appointments, prescriptions, laboratory tests, billing, inventory, and real-time communication.

**Built with enterprise best practices:**
- ✅ Role-based access control (RBAC)
- ✅ JWT authentication with refresh tokens
- ✅ Real-time WebSocket notifications
- ✅ Background job processing
- ✅ API documentation (Swagger/OpenAPI)
- ✅ Docker containerization
- ✅ Database migrations
- ✅ Comprehensive error handling
- ✅ Audit logging
- ✅ Responsive UI design

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication (access + refresh tokens)
- Password hashing with bcrypt
- Role-based access control (7 distinct roles)
- Rate limiting on sensitive endpoints
- Session management
- Password change & reset functionality

### 👥 User Roles
1. **Admin** - Full system access, user management, audit logs, settings
2. **Doctor** - Patient consultations, medical records, prescriptions, lab orders
3. **Nurse** - Patient vitals, nursing notes, ward management
4. **Receptionist** - Patient registration, appointments, admissions, billing
5. **Pharmacist** - Prescription dispensing, inventory management, stock alerts
6. **Lab Technician** - Test order processing, sample tracking, result uploads
7. **Patient** - View appointments, medical records, prescriptions, bills

### 🏥 Clinical Modules

#### Patient Management
- Complete patient registration (demographics, insurance, emergency contacts)
- Medical history tracking
- Allergy & condition documentation
- Patient timeline view
- Search & filter patients
- Patient ID auto-generation

#### Appointment System
- Doctor availability management
- Appointment scheduling with conflict prevention
- Status workflow: scheduled → confirmed → checked_in → completed
- Real-time check-in notifications
- Appointment cancellation with reasons
- Calendar view integration

#### Medical Records (EMR)
- Diagnosis recording with ICD codes
- Clinical notes & observations
- Treatment plans
- Follow-up scheduling
- Confidentiality flags
- Full medical history access

#### Vital Signs Monitoring
- Blood pressure, heart rate, temperature
- Respiratory rate, oxygen saturation
- Height, weight, BMI calculation
- Historical trends & charts
- Nurse/doctor recording

#### Prescription Management
- Multi-item prescriptions
- Dosage, frequency, duration tracking
- Dispensing workflow
- Automatic inventory deduction
- Prescription history
- Real-time pharmacist notifications

#### Pharmacy & Inventory
- Medicine catalog management
- Stock level tracking
- Low-stock alerts (Celery background task)
- Expiry date monitoring
- Batch number tracking
- Stock-in/stock-out transactions
- Inventory audit trail

#### Laboratory Management
- Lab test catalog (CBC, Blood Sugar, X-Ray, etc.)
- Test ordering by doctors
- Sample collection workflow
- Result entry & file uploads
- Status tracking: ordered → sample_collected → processing → completed
- Real-time result notifications
- Report generation

#### Admission & Bed Management
- Ward, Room, Bed hierarchy
- Bed availability tracking
- Patient admission workflow
- Bed assignment with conflict prevention
- Discharge process
- Room rate calculation

#### Billing & Payments
- Multi-item bill generation (consultations, tests, medicines, room charges)
- Tax & discount calculation
- Payment recording (cash, card, UPI, insurance)
- Payment status tracking
- Invoice generation
- Outstanding balance monitoring

### 🔔 Real-Time Features (WebSockets)

- **Personal notifications**: User-specific notification room (`user_{id}`)
- **Role broadcasts**: Notifications to all staff of a role (`role_pharmacist`)
- **Chat system**: Direct messaging between staff and patients
- **Typing indicators**: Real-time typing status in chat
- **Live updates**:
  - New appointments
  - Patient check-ins
  - Lab result completions
  - Prescription creations
  - Low stock alerts

### ⚙️ Background Jobs (Celery)

Scheduled tasks using Celery + Redis:
- **Daily 8 AM**: Low stock medicine alerts
- **Daily 8 AM**: Medicine expiry warnings (30 days)
- **Hourly**: Appointment reminders (24h advance)
- **Daily midnight**: Token cleanup & housekeeping

### 📊 Dashboard Metrics

Role-specific dashboards with real-time statistics:
- **Admin**: Total patients, doctors, appointments, admissions, available beds, low stock count
- **Doctor**: Today's appointments, waiting patients, pending lab orders
- **Nurse**: Admitted patients, pending vitals
- **Receptionist**: Check-ins, admissions, pending bills
- **Pharmacist**: Pending prescriptions, low stock medicines
- **Lab Tech**: Pending & processing test orders
- **Patient**: Upcoming appointments, pending bills

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| React Router v6 | Client-side routing |
| Redux Toolkit | State management |
| Tailwind CSS | Utility-first styling |
| Axios | HTTP client with interceptors |
| Socket.IO Client | WebSocket real-time communication |
| Recharts | Data visualization & charts |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.11 | Runtime |
| Flask | Web framework |
| Flask-SQLAlchemy | ORM for PostgreSQL |
| Flask-Migrate | Database migrations (Alembic) |
| Flask-JWT-Extended | JWT authentication |
| Flask-Bcrypt | Password hashing |
| Flask-CORS | Cross-origin resource sharing |
| Flask-SocketIO | WebSocket server |
| Flask-Limiter | Rate limiting |
| Marshmallow | Request/response validation |
| Flasgger | Swagger/OpenAPI documentation |
| Celery | Distributed task queue |
| Gunicorn + Eventlet | Production WSGI server |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| PostgreSQL 15 | Primary relational database |
| Redis 7 | Cache, Celery broker, session store |
| Docker & Docker Compose | Containerization & orchestration |
| Nginx | Reverse proxy for frontend |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                   (React + Vite App)                         │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ HTTP/REST + WebSocket
                │
┌───────────────▼─────────────────────────────────────────────┐
│                      Nginx (Port 5173)                       │
│              Frontend Static Files + Proxy                   │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ /api/* → backend:5000
                │ /socket.io → backend:5000 (WebSocket)
                │
┌───────────────▼─────────────────────────────────────────────┐
│             Flask Backend (Port 5000)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Routes (17 Blueprints)                           │   │
│  │ • auth, users, patients, doctors, appointments       │   │
│  │ • medical_records, vitals, prescriptions, medicines  │   │
│  │ • inventory, laboratory, admissions, billing         │   │
│  │ • notifications, chat, dashboard, health             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WebSocket Events (Flask-SocketIO)                    │   │
│  │ • connect/disconnect, join rooms, send_message       │   │
│  │ • typing indicators, real-time notifications         │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────┬────────────────────┬────────────────────────┘
                │                    │
                │                    │
    ┌───────────▼─────────┐   ┌──────▼──────────┐
    │   PostgreSQL DB     │   │   Redis Cache   │
    │   (Port 5432)       │   │   (Port 6379)   │
    │                     │   │                 │
    │ • 26 Tables         │   │ • Session store │
    │ • Foreign keys      │   │ • Celery broker │
    │ • Indexes           │   │ • Rate limiter  │
    │ • Constraints       │   └─────────────────┘
    └─────────────────────┘
                │
    ┌───────────▼─────────────────────────────────┐
    │       Celery Workers + Beat Scheduler        │
    │                                              │
    │  Tasks:                                      │
    │  • check_low_stock (daily 8 AM)             │
    │  • check_medicine_expiry (daily 8 AM)       │
    │  • send_appointment_reminders (hourly)      │
    │  • cleanup_expired_data (daily midnight)    │
    └──────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- (Optional for local dev) Python 3.11+, Node.js 20+, PostgreSQL 15+, Redis 7+

### Run with Docker (Recommended)

1. **Clone the repository:**
```bash
git clone <repo-url>
cd hospital-management-system
```

2. **Start all services:**
```bash
docker compose up --build
```

3. **Seed the database:**
```bash
docker exec -it hms-backend flask seed
```

4. **Access the application:**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:5000
   - **API Docs (Swagger)**: http://localhost:5000/docs

The `docker compose up` command starts:
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis server (port 6379)
- **backend**: Flask API server (port 5000)
- **celery_worker**: Background task worker
- **celery_beat**: Task scheduler
- **frontend**: Nginx serving React app (port 5173)

---

## 🔑 Demo Accounts

All demo accounts use password: **`Password@123`**

| Role | Email | Description |
|------|-------|-------------|
| Admin | `admin@hms.local` | Full system access |
| Doctor | `dr.smith@hms.local` | Cardiologist - Can create prescriptions, medical records, lab orders |
| Nurse | `nurse.jones@hms.local` | Can record vitals, view patient assignments |
| Receptionist | `reception@hms.local` | Can register patients, book appointments, manage billing |
| Pharmacist | `pharma@hms.local` | Can dispense prescriptions, manage inventory |
| Lab Tech | `labtech@hms.local` | Can process test orders, upload results |
| Patient | `patient@hms.local` | Can view own appointments, records, bills |

**Quick login from UI**: The login page has quick-fill buttons for each demo account.

---

## 📚 API Documentation

Interactive Swagger UI available at: **http://localhost:5000/docs**

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new patient account
- `POST /api/auth/login` - Login (returns access + refresh tokens)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/change-password` - Change password

#### Patients
- `GET /api/patients` - List patients (search, pagination)
- `POST /api/patients` - Register new patient
- `GET /api/patients/{id}` - Get patient details
- `PUT /api/patients/{id}` - Update patient

#### Appointments
- `GET /api/appointments` - List appointments (filters: date, doctor, status)
- `POST /api/appointments` - Book appointment (with conflict check)
- `PUT /api/appointments/{id}/status` - Update status (check-in, complete, cancel)

#### Prescriptions
- `GET /api/prescriptions` - List prescriptions
- `POST /api/prescriptions` - Create prescription with items
- `POST /api/prescriptions/{id}/dispense` - Mark as dispensed (pharmacist)

#### Laboratory
- `GET /api/laboratory/tests` - List available lab tests
- `GET /api/laboratory/orders` - List lab orders
- `POST /api/laboratory/orders` - Order a test (doctor)
- `PUT /api/laboratory/orders/{id}/status` - Update order status
- `POST /api/laboratory/orders/{id}/results` - Add results & complete

#### Billing
- `GET /api/billing` - List bills
- `POST /api/billing` - Generate bill
- `POST /api/billing/{id}/payments` - Record payment

#### Dashboard
- `GET /api/dashboard/stats` - Get role-specific dashboard metrics

*See `/docs` for complete API reference with request/response schemas.*

---

## 📁 Project Structure

```
hospital-management-system/
├── backend/
│   ├── app/
│   │   ├── __init__.py              # Flask app factory
│   │   ├── config.py                # Config classes (Dev/Prod/Test)
│   │   ├── extensions.py            # db, jwt, socketio, celery, limiter
│   │   ├── models/                  # SQLAlchemy models (26 files)
│   │   │   ├── user.py, patient.py, doctor.py, appointment.py
│   │   │   ├── prescription.py, medicine.py, laboratory.py
│   │   │   ├── admission.py, billing.py, notification.py
│   │   │   ├── chat.py, audit.py, etc.
│   │   ├── routes/                  # API blueprints (17 files)
│   │   │   ├── auth.py, patients.py, appointments.py
│   │   │   ├── prescriptions.py, laboratory.py, billing.py, etc.
│   │   ├── services/                # Business logic layer
│   │   ├── schemas/                 # Marshmallow validation schemas
│   │   ├── websocket/               # SocketIO event handlers
│   │   │   └── events.py
│   │   ├── tasks/                   # Celery background tasks
│   │   │   ├── pharmacy.py, appointments.py, cleanup.py
│   │   ├── utils/                   # Helpers
│   │   │   ├── auth.py (role_required, get_current_user)
│   │   │   ├── responses.py (success_response, error_response)
│   │   │   ├── seed.py (database seeding)
│   │   │   └── cli.py (Flask commands)
│   │   └── errors/                  # Global error handlers
│   │       └── handlers.py
│   ├── migrations/                  # Alembic/Flask-Migrate
│   ├── tests/                       # Pytest suite
│   │   ├── conftest.py, test_auth.py, test_appointments.py
│   ├── uploads/                     # File uploads (lab reports, etc.)
│   ├── requirements.txt
│   ├── celery_worker.py
│   └── run.py
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ui/ (Button, Card, Table, Modal, etc.)
│   │   │   └── layout/ (Sidebar, Navbar, NotificationBell)
│   │   ├── pages/                   # Route pages
│   │   │   ├── auth/ (Login, Register)
│   │   │   ├── admin/, doctor/, nurse/, patient/, etc.
│   │   ├── layouts/                 # Layout wrappers
│   │   │   ├── AuthedLayout.jsx, DashboardLayout.jsx
│   │   ├── services/                # API & Socket services
│   │   │   ├── api.js (Axios with interceptors)
│   │   │   └── socketService.js (Socket.IO client)
│   │   ├── store/                   # Redux Toolkit
│   │   │   ├── index.js
│   │   │   └── slices/ (authSlice, notificationSlice, chatSlice)
│   │   ├── router/                  # React Router config
│   │   │   └── index.jsx (routes + ProtectedRoute)
│   │   ├── utils/                   # Date helpers, formatters
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── nginx.conf
│
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── .env.example
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema

### Core Tables (26 Total)

#### User Management
- **users** - Authentication, profile
- **roles** - Role definitions
- **user_roles** - Many-to-many junction

#### Staff
- **doctors** - Doctor profiles, specialization
- **doctor_availability** - Weekly schedule slots
- **nurses** - Nurse profiles

#### Patients
- **patients** - Patient demographics, insurance

#### Clinical
- **appointments** - Scheduling with conflict prevention
- **medical_records** - Diagnoses, clinical notes
- **vitals** - BP, HR, temp, SpO2, weight
- **prescriptions** - Prescription headers
- **prescription_items** - Line items per prescription

#### Pharmacy
- **medicines** - Drug catalog
- **inventory_transactions** - Stock movements (in/out/adjustment)

#### Laboratory
- **lab_tests** - Test catalog (CBC, X-Ray, etc.)
- **lab_orders** - Test requests from doctors
- **lab_results** - Result values & reports

#### Inpatient
- **wards** - Ward definitions
- **rooms** - Rooms within wards
- **beds** - Bed inventory
- **admissions** - Patient admission records

#### Billing
- **bills** - Invoice headers
- **bill_items** - Line items
- **payments** - Payment transactions

#### Communication
- **notifications** - In-app notifications
- **chat_rooms** - Chat room metadata
- **chat_room_members** - Membership & unread count
- **chat_messages** - Persisted messages

#### Audit
- **audit_logs** - Action tracking (who, what, when)

---

## 🔒 Security Features

1. **Password Security**
   - Bcrypt hashing (never store plaintext)
   - Password strength validation
   - Passwords never returned in API responses

2. **JWT Authentication**
   - Access tokens: 15-minute expiration
   - Refresh tokens: 7-day expiration
   - Token blocklist in Redis
   - Automatic refresh on 401

3. **Authorization**
   - Role-based access control (RBAC)
   - `@role_required` decorator on protected routes
   - Admin role bypasses all restrictions

4. **Rate Limiting**
   - Login endpoint: 10 requests/minute
   - Redis-backed storage
   - Per-IP throttling

5. **Input Validation**
   - Marshmallow schemas validate all POST/PUT requests
   - SQL injection prevention via ORM
   - CORS whitelist configuration

6. **Audit Logging**
   - All sensitive actions logged to `audit_logs` table
   - Tracks: user, action, entity, timestamp, IP address

7. **File Uploads**
   - Type whitelist (pdf, png, jpg)
   - Size limit (10 MB)
   - UUID filename sanitization

---

## 🔔 Real-Time Features

### WebSocket Architecture

**Server**: Flask-SocketIO (Eventlet async mode)
**Client**: Socket.IO client library

**Room Strategy:**
- `user_{user_id}` - Personal notifications for a specific user
- `role_{role_name}` - Broadcast to all staff with a role (e.g., `role_pharmacist`)
- `chat_{room_id}` - Chat room messages

**Events:**
| Event | Trigger | Recipient |
|-------|---------|-----------|
| `appointment_updated` | Status change | Doctor + Patient (user rooms) |
| `patient_checked_in` | Check-in | Doctor (user room) |
| `prescription_created` | New prescription | All pharmacists (role_pharmacist) |
| `lab_order_created` | New lab order | All lab techs (role_lab_technician) |
| `lab_result_updated` | Result uploaded | Doctor + Patient (user rooms) |
| `notification` | Generic alert | User room |
| `receive_message` | Chat message | Chat room |
| `user_typing` | Typing indicator | Chat room (exclude self) |

**Connection Flow:**
1. Client connects with JWT in `auth` handshake
2. Emits `join_user_room` with user_id
3. Server validates & joins user to `user_{id}` + role rooms
4. Server broadcasts events to appropriate rooms

---

## ⚙️ Background Jobs

### Celery Configuration

**Broker & Backend:** Redis
**Task Serializer:** JSON
**Scheduler:** Celery Beat (persistent schedule)

### Scheduled Tasks

| Task | Schedule | Purpose |
|------|----------|---------|
| `check_low_stock` | Daily 8:00 AM | Alert pharmacists when `current_stock <= min_stock_level` |
| `check_medicine_expiry` | Daily 8:05 AM | Alert for medicines expiring within 30 days |
| `send_appointment_reminders` | Hourly | Notify patients/doctors 24h before appointments |
| `cleanup_expired_data` | Daily 00:00 | Prune expired JWT tokens, temporary files |

### Running Celery

**Worker:**
```bash
celery -A celery_worker worker --loglevel=info --concurrency=2
```

**Beat Scheduler:**
```bash
celery -A celery_worker beat --loglevel=info --scheduler celery.beat:PersistentScheduler
```

---

## 🧪 Testing

### Backend Tests (Pytest)

Run the test suite:
```bash
cd backend
pytest
```

Test coverage includes:
- Authentication flow (register, login, token refresh)
- Appointment conflict detection
- Prescription dispensing & inventory deduction
- Lab order workflow
- Bill calculation & payment
- WebSocket event handlers

### Frontend Tests (Vitest)

```bash
cd frontend
npm run test
```

---

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Set strong `SECRET_KEY` and `JWT_SECRET_KEY`
   - Update `DATABASE_URL` for production PostgreSQL
   - Configure `CORS_ORIGINS` to match frontend domain

2. **Database**
   - Run migrations: `flask db upgrade`
   - Seed initial data: `flask seed`

3. **Docker Compose**
   - Use `docker-compose.prod.yml` with production settings
   - Enable HTTPS with Let's Encrypt / reverse proxy (Traefik, Caddy)

4. **Security**
   - Enable rate limiting on all endpoints
   - Configure firewall rules
   - Regular security audits
   - Keep dependencies updated

5. **Monitoring**
   - Log aggregation (ELK, Loki)
   - APM (New Relic, Datadog)
   - Database backups (automated daily)

---

## 💻 Development

### Local Setup (Without Docker)

**1. Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure .env
cp ../.env.example .env
# Edit DATABASE_URL to point to local PostgreSQL

# Run migrations
flask db upgrade

# Seed database
flask seed

# Start Flask dev server
python run.py
```

**2. Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**3. Redis:**
```bash
# Via Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or via package manager
brew install redis  # macOS
redis-server
```

**4. Celery (Optional):**
```bash
cd backend
source venv/bin/activate

# Terminal 1: Worker
celery -A celery_worker worker --loglevel=info

# Terminal 2: Beat
celery -A celery_worker beat --loglevel=info
```

### Database Migrations

Create a new migration after model changes:
```bash
flask db migrate -m "Add new field to patients table"
flask db upgrade
```

Rollback:
```bash
flask db downgrade
```

---

## 📖 Additional Resources

- **API Documentation**: http://localhost:5000/docs (Swagger UI)
- **Flask Documentation**: https://flask.palletsprojects.com/
- **React Documentation**: https://react.dev/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Celery Docs**: https://docs.celeryq.dev/
- **Socket.IO Docs**: https://socket.io/docs/

---

## 📝 License

This project is built for educational and demonstration purposes.

---

## 👥 Contributors

Built by Claude Code (Anthropic) as a demonstration of a production-quality full-stack application.

---

## 🎉 Acknowledgments

This HMS demonstrates:
- Clean architecture & separation of concerns
- RESTful API design
- Real-time communication patterns
- Background job processing
- Database design best practices
- Modern frontend development with React
- Containerization & orchestration
- Security-first development
- Comprehensive testing strategies

Perfect as a reference for building scalable, production-ready healthcare applications! 🚀
