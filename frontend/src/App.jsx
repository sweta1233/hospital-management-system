import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout, setUser } from './store/slices/authSlice'
import { initSocket, disconnectSocket } from './services/socket'
import api from './services/api'
import { getUserRoles, hasAnyRole } from './utils/auth'
import Sidebar from './components/Sidebar'
import NotificationModal from './components/NotificationModal'
import IncomingCallModal from './components/IncomingCallModal'
import AppBackdrop from './components/AppBackdrop'

// Public Auth & Landing Pages
import LandingPage from './pages/LandingPage'
import PatientLoginPage from './pages/PatientLoginPage'
import PatientRegisterPage from './pages/PatientRegisterPage'
import StaffLoginPage from './pages/StaffLoginPage'
import StaffRegisterPage from './pages/StaffRegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

// Protected Clinical Pages
import Dashboard from './pages/Dashboard'
import StaffManagementPage from './pages/StaffManagementPage'
import PatientsPage from './pages/PatientsPage'
import AppointmentsPage from './pages/AppointmentsPage'
import PrescriptionsPage from './pages/PrescriptionsPage'
import PharmacyPage from './pages/PharmacyPage'
import LaboratoryPage from './pages/LaboratoryPage'
import AdmissionsPage from './pages/AdmissionsPage'
import BillingPage from './pages/BillingPage'
import ChatPage from './pages/ChatPage'
import ArogyaAIPage from './pages/ArogyaAIPage'
import CancerPredictionPage from './pages/CancerPredictionPage'

import { Bell, LogOut, Menu, ShieldAlert } from 'lucide-react'

// --- Layout Component ---
function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    disconnectSocket()
    dispatch(logout())
    navigate('/')
  }

  const primaryRole = user?.primary_role || getUserRoles(user)[0] || 'User'

  return (
    <div className="flex h-screen bg-[#080c14] relative overflow-hidden">
      <AppBackdrop opacity="opacity-40" showSwitcher={true} />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64 relative z-10">
        {/* Header */}
        <header className="h-16 glass-panel border-b border-slate-800/60 flex items-center justify-between px-6 z-10 backdrop-blur-xl bg-slate-950/70">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-cyan-400 transition"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            <button
              onClick={() => setNotifOpen(true)}
              className="p-2.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 rounded-xl transition relative group cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-sm shadow-cyan-400 animate-pulse" />
            </button>

            <div className="h-6 w-px bg-slate-700" />

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white">
                  {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Portal User'}
                </p>
                <p className="text-xs text-cyan-400 font-medium capitalize">
                  {primaryRole.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-950/30 transition group cursor-pointer"
                title="Logout"
              >
                <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#080c14]/40 backdrop-blur-sm">
          {children}
        </main>
      </div>

      <NotificationModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <IncomingCallModal />
    </div>
  )
}

// Protected Route Guard with Optional Role Requirements
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/patient/login" replace />
  }

  // If user object is still hydrating, let it through
  if (!user && isAuthenticated) {
    return <Layout>{children}</Layout>
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = hasAnyRole(user, allowedRoles)

    if (!hasRole) {
      return (
        <Layout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-sm text-slate-400 max-w-md mb-6">
              You do not have permission to access this module. If you believe this is an error, please contact hospital administration.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2.5 rounded-xl gradient-btn text-white text-sm font-semibold cursor-pointer"
            >
              Go Back
            </button>
          </div>
        </Layout>
      )
    }
  }

  return <Layout>{children}</Layout>
}

export default function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  // Fetch current user details on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res.data?.data) {
            dispatch(setUser(res.data.data))
            initSocket(token, res.data.data)
          }
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            dispatch(logout())
          }
        })
    }
  }, [dispatch])

  // Initialize/re-sync socket whenever auth user updates
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('access_token')
      if (token) {
        initSocket(token, user)
      }
    }
  }, [isAuthenticated, user])

  // Determine user home dashboard
  const userRoles = getUserRoles(user)
  let homeRedirect = '/dashboard'
  if (userRoles.includes('admin')) homeRedirect = '/admin/dashboard'
  else if (userRoles.includes('doctor')) homeRedirect = '/doctor/dashboard'
  else if (userRoles.includes('nurse')) homeRedirect = '/nurse/dashboard'
  else if (userRoles.includes('receptionist')) homeRedirect = '/receptionist/dashboard'
  else if (userRoles.includes('pharmacist')) homeRedirect = '/pharmacy/dashboard'
  else if (userRoles.includes('lab_technician')) homeRedirect = '/laboratory/dashboard'
  else if (userRoles.includes('patient')) homeRedirect = '/patient/dashboard'

  return (
    <Routes>
      {/* Public Landing & Authentication */}
      <Route path="/" element={isAuthenticated ? <Navigate to={homeRedirect} replace /> : <LandingPage />} />
      <Route path="/patient/register" element={<PatientRegisterPage />} />
      <Route path="/patient/login" element={<PatientLoginPage />} />
      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route path="/staff/register" element={<StaffRegisterPage />} />
      <Route path="/login" element={<Navigate to="/staff/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected App Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={['patient', 'admin']}><Dashboard /></ProtectedRoute>} />
      <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor', 'admin']}><Dashboard /></ProtectedRoute>} />
      <Route path="/nurse/dashboard" element={<ProtectedRoute allowedRoles={['nurse', 'admin']}><Dashboard /></ProtectedRoute>} />
      <Route path="/receptionist/dashboard" element={<ProtectedRoute allowedRoles={['receptionist', 'admin']}><Dashboard /></ProtectedRoute>} />
      <Route path="/pharmacy/dashboard" element={<ProtectedRoute allowedRoles={['pharmacist', 'admin']}><PharmacyPage /></ProtectedRoute>} />
      <Route path="/laboratory/dashboard" element={<ProtectedRoute allowedRoles={['lab_technician', 'admin']}><LaboratoryPage /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />

      {/* Staff Management (Admin only) */}
      <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['admin']}><StaffManagementPage /></ProtectedRoute>} />

      {/* Clinical Modules */}
      <Route path="/patients" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']}><PatientsPage /></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'receptionist', 'patient']}><AppointmentsPage /></ProtectedRoute>} />
      <Route path="/prescriptions" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'pharmacist', 'patient']}><PrescriptionsPage /></ProtectedRoute>} />
      <Route path="/pharmacy" element={<ProtectedRoute allowedRoles={['admin', 'pharmacist']}><PharmacyPage /></ProtectedRoute>} />
      <Route path="/laboratory" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'lab_technician', 'patient']}><LaboratoryPage /></ProtectedRoute>} />
      <Route path="/admissions" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']}><AdmissionsPage /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute allowedRoles={['admin', 'receptionist', 'patient']}><BillingPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/arogya-ai" element={<ProtectedRoute><ArogyaAIPage /></ProtectedRoute>} />
      <Route path="/cancer-prediction" element={<ProtectedRoute><CancerPredictionPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
