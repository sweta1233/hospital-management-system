# 🚀 Deployment Guide: Hospital Management System (HMS)

### 🌐 Live Production Links
- **Frontend (Vercel)**: [https://hospital-management-system-bay-ten.vercel.app](https://hospital-management-system-bay-ten.vercel.app)
- **Backend API (Render)**: [https://hms-backend-vw82.onrender.com](https://hms-backend-vw82.onrender.com)
- **Swagger Documentation**: [https://hms-backend-vw82.onrender.com/docs](https://hms-backend-vw82.onrender.com/docs)
- **GitHub Repository**: [https://github.com/sweta1233/hospital-management-system](https://github.com/sweta1233/hospital-management-system)

---

## 📋 Architecture Overview

- **Frontend**: React 18 + Vite + Tailwind CSS + Redux Toolkit ➔ Deployed on **Vercel**
- **Backend API**: Flask 3 + Flask-SocketIO (Eventlet) + Flask-JWT-Extended + Celery ➔ Deployed on **Render**
- **Database**: PostgreSQL (Managed Database on **Render** / Neon / Supabase)
- **Cache / Broker**: Redis (Optional / Render Redis or Upstash)

---

## Step 1: Push to GitHub

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `hospital-management-system`).
2. In your local terminal, add the remote and push:

```bash
# Set main branch
git branch -M main

# Add your GitHub repository as remote (replace with your repo URL)
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git

# Push the codebase
git push -u origin main
```

---

## Step 2: Deploy Database & Backend on Render

### Option A: Automatic 1-Click Deploy (Render Blueprint - Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** ➔ **Blueprint**.
3. Connect your GitHub repository (`hospital-management-system`).
4. Render will read `render.yaml` and automatically configure:
   - **hms-postgres**: Managed PostgreSQL Database
   - **hms-backend**: Python Web Service with auto database migrations & demo data seeding
5. Click **Apply**.
6. Once deployed, note your backend URL (e.g., `https://hms-backend-xxxx.onrender.com`).

---

### Option B: Manual Deploy on Render

#### 1. Create PostgreSQL Database on Render
1. Go to **Render Dashboard** ➔ **New +** ➔ **PostgreSQL**.
2. Set:
   - **Name**: `hms-postgres`
   - **Database**: `hms_db`
   - **User**: `hms_user`
   - **Region**: Oregon (or nearest to you)
   - **Plan**: Free
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (or External Database URL if needed).

#### 2. Create Web Service for Flask Backend
1. Go to **Render Dashboard** ➔ **New +** ➔ **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name**: `hms-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python`
   - **Region**: Same as your database (e.g., Oregon)
   - **Branch**: `main`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt && python init_db.py`
   - **Start Command**: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT run:app`
   - **Plan**: Free
4. Under **Environment Variables**, add:
   | Key | Value | Description |
   |-----|-------|------------- |
   | `PYTHON_VERSION` | `3.11.9` | Python runtime version |
   | `FLASK_ENV` | `production` | Production environment |
   | `SECRET_KEY` | *(Click Generate)* | Session secret key |
   | `JWT_SECRET_KEY` | *(Click Generate)* | JWT signing key |
   | `DATABASE_URL` | *Paste your Render PostgreSQL connection string* | PostgreSQL URL |
   | `CORS_ORIGINS` | `*` *(or your Vercel URL once deployed)* | Allowed CORS domains |
   | `SOCKETIO_ASYNC_MODE` | `eventlet` | Async WebSocket mode |
   | `RATELIMIT_STORAGE_URI`| `memory://` | Rate limiter storage |
   | `SEED_DB` | `true` | Seeds initial demo accounts |
   | `ADMIN_EMAIL` | `admin@hms.local` | Default Admin Email |
   | `ADMIN_PASSWORD` | `Admin@123456` | Default Admin Password |

5. Click **Create Web Service**.
6. When deployment finishes, test the health check endpoint: `https://<YOUR-RENDER-BACKEND-URL>/api/health`

---

## Step 3: Deploy Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import your GitHub repository (`hospital-management-system`).
3. In the project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `frontend` (or leave at `./` since root `vercel.json` is configured).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   | Key | Value | Example |
   |-----|-------|---------|
   | `VITE_API_URL` | `https://<YOUR-RENDER-BACKEND-URL>/api` | `https://hms-backend-xxxx.onrender.com/api` |
   | `VITE_SOCKET_URL` | `https://<YOUR-RENDER-BACKEND-URL>` | `https://hms-backend-xxxx.onrender.com` |

5. Click **Deploy**.
6. Once deployed, copy your Vercel URL (e.g. `https://hospital-management-system-xxxx.vercel.app`).

---

## Step 4: Link Frontend & Backend CORS

1. Go back to your **Render Web Service** ➔ **Environment**.
2. Update `CORS_ORIGINS` to include your Vercel domain:
   ```env
   CORS_ORIGINS=https://<YOUR-VERCEL-DOMAIN>.vercel.app,http://localhost:5173
   ```
3. Save changes (Render will automatically redeploy).

---

## 🔑 Default Seed Accounts & Logins

When `SEED_DB=true` or after running `init_db.py`:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@hms.local` | `Admin@123456` |
| **Doctor** | `dr.smith@hms.local` | `Password@123` |
| **Doctor** | `dr.patel@hms.local` | `Password@123` |
| **Nurse** | `nurse.jones@hms.local` | `Password@123` |
| **Receptionist** | `reception@hms.local` | `Password@123` |
| **Pharmacist** | `pharma@hms.local` | `Password@123` |
| **Lab Technician** | `labtech@hms.local` | `Password@123` |
| **Patient** | `patient@hms.local` | `Password@123` |

---

## 🛠️ Verification Checklist

- [ ] Backend health check responds: `GET /api/health` ➔ `{"status": "healthy"}`
- [ ] Swagger API Documentation: `GET /docs`
- [ ] Frontend loads on Vercel without routing errors on page refresh
- [ ] Login works with `admin@hms.local` / `Admin@123456`
- [ ] Real-time notifications and chat work over WebSockets
