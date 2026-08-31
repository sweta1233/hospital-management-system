import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle2,
  Stethoscope, HeartPulse, Building2, Pill, FlaskConical,
  ShieldAlert, ArrowLeft, UserCheck, Activity, KeyRound,
  Smartphone, Sparkles, UserPlus, Microscope
} from 'lucide-react'
import { loginSuccess } from '../store/slices/authSlice'
import api from '../services/api'
import { initSocket } from '../services/socket'
import { getUserRoles } from '../utils/auth'

export default function StaffLoginPage() {
  const [authMode, setAuthMode] = useState('password') // 'password' | 'otp'
  const [email, setEmail] = useState('admin@hms.local')
  const [password, setPassword] = useState('Password@123')
  const [showPassword, setShowPassword] = useState(false)

  // OTP state
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  const [error, setError] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const demoAccounts = [
    { role: 'Admin', email: 'admin@hms.local', icon: Shield, desc: 'Full System Access', color: 'from-blue-500 via-indigo-500 to-blue-600', ring: 'ring-blue-500' },
    { role: 'Doctor', email: 'dr.smith@hms.local', icon: Stethoscope, desc: 'EMR & Consults', color: 'from-cyan-500 via-teal-500 to-blue-600', ring: 'ring-cyan-500' },
    { role: 'Nurse', email: 'nurse.jones@hms.local', icon: HeartPulse, desc: 'Vitals & Care', color: 'from-rose-500 via-pink-500 to-rose-600', ring: 'ring-rose-500' },
    { role: 'Reception', email: 'reception@hms.local', icon: Building2, desc: 'Front Desk', color: 'from-amber-500 via-orange-500 to-yellow-600', ring: 'ring-amber-500' },
    { role: 'Pharmacy', email: 'pharma@hms.local', icon: Pill, desc: 'Dispensary', color: 'from-purple-500 via-violet-500 to-indigo-600', ring: 'ring-purple-500' },
    { role: 'Lab Tech', email: 'labtech@hms.local', icon: FlaskConical, desc: 'Diagnostics', color: 'from-emerald-500 via-teal-500 to-green-600', ring: 'ring-emerald-500' },
  ]

  const redirectByRole = (user) => {
    const userRoles = getUserRoles(user)
    if (userRoles.includes('admin')) {
      navigate('/admin/dashboard')
    } else if (userRoles.includes('doctor')) {
      navigate('/doctor/dashboard')
    } else if (userRoles.includes('nurse')) {
      navigate('/nurse/dashboard')
    } else if (userRoles.includes('receptionist')) {
      navigate('/receptionist/dashboard')
    } else if (userRoles.includes('pharmacist')) {
      navigate('/pharmacy/dashboard')
    } else if (userRoles.includes('lab_technician')) {
      navigate('/laboratory/dashboard')
    } else {
      navigate('/dashboard')
    }
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfoMsg('')

    try {
      const res = await api.post('/auth/staff/login', {
        email: email.trim().toLowerCase(),
        password,
      })

      const authData = res.data?.data
      if (!authData) {
        throw new Error('Invalid server response format')
      }

      dispatch(loginSuccess(authData))
      if (authData.access_token) {
        initSocket(authData.access_token)
      }

      redirectByRole(authData.user)
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Invalid credentials or server connection error.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Request Staff OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault()
    if (!email.trim()) {
      setError('Please enter your staff email or phone number first.')
      return
    }

    setOtpLoading(true)
    setError('')
    setInfoMsg('')

    try {
      const res = await api.post('/auth/send-otp', {
        identifier: email.trim(),
        portal: 'staff',
      })
      setOtpSent(true)
      setInfoMsg(res.data?.message || 'A 6-digit verification code has been dispatched to your official email/SMS.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please verify your staff email/phone.')
    } finally {
      setOtpLoading(false)
    }
  }

  // Verify OTP and Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/verify-otp', {
        identifier: email.trim(),
        otp_code: otpCode.trim(),
        portal: 'staff',
      })

      const authData = res.data?.data
      if (!authData) throw new Error('Invalid server response')

      dispatch(loginSuccess(authData))
      if (authData.access_token) {
        initSocket(authData.access_token)
      }

      redirectByRole(authData.user)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden selection:bg-cyan-500 selection:text-white">
      {/* ======================================================== */}
      {/* MULTI-COLOR AMBIENT LIGHTING & REDUCED OPACITY BACKGROUND ART */}
      {/* ======================================================== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[170px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/3 -right-40 w-[650px] h-[650px] rounded-full bg-purple-600/20 blur-[180px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full bg-rose-500/15 blur-[170px] animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-600/10 blur-[190px]" />

        {/* AI Medical Holographic Grid (Reduced Opacity) */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07] stroke-cyan-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="staff-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="1.5" fill="#38bdf8" />
              <path d="M 50 0 L 50 100 M 0 50 L 100 50" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="#818cf8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#staff-grid)" />
        </svg>

        {/* Floating Icons with Reduced Opacity */}
        <div className="absolute top-16 right-16 opacity-10 text-cyan-400">
          <Stethoscope className="w-56 h-56 animate-pulse" />
        </div>
        <div className="absolute bottom-12 left-12 opacity-10 text-purple-400">
          <Microscope className="w-52 h-52" />
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Side: Branding & Quick Switcher */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="lg:col-span-7 space-y-6 text-left"
        >
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Back to Home</span>
          </button>

          {/* Badge */}
          <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Clinical & Administrative Hospital Staff</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Hospital Staff <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Authentication Portal</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
            Secure clinical access for doctors, nurses, pathologists, pharmacists, and administrators with strict role-based authorization.
          </p>

          {/* 1-Click Role Switcher */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Quick Demo Sign-In Profiles
                </span>
              </div>
              <Link
                to="/staff/register"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register New Staff</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon
                const isSelected = email === acc.email
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email)
                      setPassword('Password@123')
                      setOtpSent(false)
                    }}
                    className={`p-3 rounded-2xl text-left transition-all border flex items-center space-x-2.5 cursor-pointer ${
                      isSelected
                        ? `bg-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/40`
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${acc.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-white truncate">{acc.role}</p>
                      <p className="text-[10px] text-slate-400 truncate">{acc.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Right Side: Staff Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="lg:col-span-5"
        >
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/60 relative bg-slate-900/90 backdrop-blur-2xl">
            {/* Top Emblem */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Staff Login</h2>
                  <p className="text-xs text-cyan-300 mt-0.5">Clinical access control</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> RBAC Active
              </span>
            </div>

            {/* Login Mode Toggle */}
            <div className="flex rounded-2xl bg-slate-950/90 p-1.5 border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password')
                  setError('')
                  setInfoMsg('')
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  authMode === 'password'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp')
                  setError('')
                  setInfoMsg('')
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  authMode === 'otp'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>OTP Verification</span>
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2.5"
                >
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Message */}
            <AnimatePresence>
              {infoMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{infoMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password Login Form */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Staff Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@hospital.org or phone"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-3 rounded-2xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center text-slate-400 hover:text-slate-300 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-800 text-cyan-500 mr-2 focus:ring-0" />
                    Remember credentials
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-cyan-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Staff Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Staff Portal</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OTP Login Form */}
            {authMode === 'otp' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Staff Email or Phone Number
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setOtpSent(false)
                        }}
                        placeholder="doctor@hospital.org or phone"
                        className="w-full pl-10 pr-3 py-3 rounded-2xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || !email.trim()}
                      className="px-4 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center space-x-1.5 cursor-pointer shadow-md shadow-cyan-600/20"
                    >
                      {otpLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>{otpSent ? 'Resend' : 'Send OTP'}</span>
                      )}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Enter 6-Digit Verification Code
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-center text-lg tracking-widest font-mono text-cyan-300 placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length < 6}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Enter Staff Portal</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Register New Staff Button & Patient Portal Link */}
            <div className="mt-6 pt-5 border-t border-slate-800 space-y-3 text-center">
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-center">
                <p className="text-xs text-slate-300 mb-2">New Doctor, Nurse, Pharmacist, or Staff?</p>
                <Link
                  to="/staff/register"
                  className="inline-flex items-center justify-center space-x-1.5 w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs border border-purple-400/30 transition shadow-md"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Register New Staff Account</span>
                </Link>
              </div>

              <p className="text-xs text-slate-400">
                Are you a patient?{' '}
                <Link
                  to="/patient/login"
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Go to Patient Portal
                </Link>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center text-slate-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400 mr-1.5" /> HIPAA Certified
              </span>
              <span className="flex items-center text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> 256-Bit SSL
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
