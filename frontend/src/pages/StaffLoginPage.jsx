import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle2,
  Stethoscope, HeartPulse, Building2, Pill, FlaskConical,
  ShieldAlert, ArrowLeft, UserCheck, Activity, KeyRound,
  Smartphone, Sparkles, UserPlus, Microscope, RefreshCw,
  Award, ShieldCheck, ChevronRight, AlertCircle
} from 'lucide-react'
import { loginSuccess } from '../store/slices/authSlice'
import api from '../services/api'
import { initSocket } from '../services/socket'
import { getUserRoles } from '../utils/auth'
import DiscreteOtpInput from '../components/DiscreteOtpInput'
import AppBackdrop from '../components/AppBackdrop'

export default function StaffLoginPage() {
  const [authMode, setAuthMode] = useState('password') // 'password' | 'otp'
  const [email, setEmail] = useState('admin@hms.local')
  const [password, setPassword] = useState('Password@123')
  const [showPassword, setShowPassword] = useState(false)

  // OTP state
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [dispatchInfo, setDispatchInfo] = useState(null)

  const [error, setError] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Resend Countdown Timer
  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

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
    e?.preventDefault()
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
        err.response?.data?.message || 'Invalid credentials or unauthorized staff account.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Request Staff OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setError('Please enter your staff email address.')
      return
    }

    setOtpLoading(true)
    setError('')
    setInfoMsg('')
    setOtpCode('')

    try {
      const res = await api.post('/auth/send-otp', {
        identifier: cleanEmail,
        portal: 'staff',
      })
      setOtpSent(true)
      setCountdown(30)
      const data = res.data?.data || {}
      setDispatchInfo(data.dispatch_info || null)
      setInfoMsg(res.data?.message || 'A 6-digit staff verification code has been dispatched!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP to this staff account.')
    } finally {
      setOtpLoading(false)
    }
  }

  // Verify Staff OTP
  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otpCode
    if (!code || code.trim().length !== 6) {
      setError('Please enter the complete 6-digit OTP code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/verify-otp', {
        identifier: email.trim(),
        otp_code: code.trim(),
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

  // Masked identifier for privacy
  const getMaskedTarget = () => {
    const raw = email.trim()
    if (!raw) return ''
    if (raw.includes('@')) {
      const [user, domain] = raw.split('@')
      const maskedUser = user.length > 2 ? user[0] + '••••' + user.slice(-1) : user + '•••'
      return `${maskedUser}@${domain}`
    }
    const digits = raw.replace(/\D/g, '')
    if (digits.length >= 10) {
      return `+91 ${digits.slice(-10, -8)}••••••${digits.slice(-2)}`
    }
    return raw
  }

  return (
    <div className="min-h-screen text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden bg-[#080c14] selection:bg-purple-500 selection:text-white">
      {/* ── 5 AI Background Visuals Ambient Backdrop with Low Opacity ── */}
      <AppBackdrop opacity="opacity-15" showSwitcher={false} />

      <div className="max-w-5xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Clinical Roles Selector (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5 p-7 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute inset-0 ai-scanline opacity-20 pointer-events-none" />

          {/* Brand & Top Bar */}
          <div className="relative z-10">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center space-x-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition cursor-pointer mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Hospital Home</span>
            </button>

            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Arogya<span className="gradient-text ml-1">HMS</span>
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Clinical & Staff Gateway
                </p>
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-white leading-snug">
              Authorized Hospital <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Operations Access</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Select a quick demo role or enter your verified credentials for encrypted clinical workstation access.
            </p>
          </div>

          {/* Quick Demo Role Cards Grid */}
          <div className="space-y-2 relative z-10">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center justify-between">
              <span>Quick Demo Workstations</span>
              <span className="text-purple-400 font-normal">Click to Autofill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc, i) => {
                const Icon = acc.icon
                const isSelected = email === acc.email
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email)
                      setPassword('Password@123')
                      setError('')
                      setInfoMsg('')
                      setOtpSent(false)
                    }}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-400 shadow-md shadow-purple-500/20'
                        : 'bg-slate-900/60 border-slate-800 hover:border-purple-500/40 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-tr ${acc.color} text-white shadow-sm flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{acc.role}</div>
                      <div className="text-[9px] text-slate-400 truncate">{acc.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Security & Compliance Footer */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role-Based Access Control</span>
            </span>
            <span className="font-mono text-purple-400">SSL 256-Bit</span>
          </div>
        </div>

        {/* Right Side: Interactive Staff Login Form (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 lg:p-9 border border-purple-500/40 shadow-2xl backdrop-blur-2xl relative overflow-hidden bg-slate-900/95">
            {/* Corner Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Mobile Top Header */}
            <div className="lg:hidden mb-6 flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  S
                </div>
                <span className="text-sm font-bold text-white">Staff Portal</span>
              </div>
            </div>

            {/* Form Title */}
            <div className="mb-6">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Hospital Personnel Terminal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Staff Authentication
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Enter your authorized clinical credentials or request a 6-digit staff OTP.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-2xl bg-slate-950/90 p-1.5 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password')
                  setError('')
                  setInfoMsg('')
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  authMode === 'password'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Password Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp')
                  setError('')
                  setInfoMsg('')
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  authMode === 'otp'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>6-Digit Staff OTP</span>
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-start space-x-2.5 text-rose-300 text-xs shadow-lg"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success / Info Message */}
            <AnimatePresence>
              {infoMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-start space-x-2.5 text-emerald-300 text-xs shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{infoMsg}</p>
                    {dispatchInfo?.dev_mode && dispatchInfo?.otp_code && (
                      <p className="mt-1 font-mono text-[11px] bg-slate-900/90 p-1.5 rounded-lg border border-emerald-500/30 text-emerald-200">
                        🧪 Sandbox Staff Code: <strong className="text-white text-sm tracking-wider">{dispatchInfo.otp_code}</strong>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PASSWORD LOGIN FORM */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                    Staff Institutional Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@hms.local"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                    Security Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-purple-500/25 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating Staff...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Clinical Workstation</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OTP LOGIN FORM */}
            {authMode === 'otp' && (
              <div>
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                        Staff Email or Verified Phone
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="doctor@hms.local or 9876543210"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-purple-500/25 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                    >
                      {otpLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching Staff Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send 6-Digit Staff OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Staff OTP Dispatched To:
                        </span>
                        <span className="text-sm font-mono font-bold text-purple-300">
                          {getMaskedTarget()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false)
                          setOtpCode('')
                          setError('')
                          setInfoMsg('')
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300 underline font-semibold cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2 text-center">
                        Enter 6-Digit Staff OTP
                      </label>
                      <DiscreteOtpInput
                        value={otpCode}
                        onChange={(code) => setOtpCode(code)}
                        onComplete={(code) => handleVerifyOtp(code)}
                        disabled={loading}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleVerifyOtp(otpCode)}
                      disabled={loading || otpCode.length !== 6}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-purple-500/25 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Staff Access...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify & Access Workstation</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <span>Didn't receive the staff code?</span>
                      <button
                        type="button"
                        disabled={countdown > 0 || otpLoading}
                        onClick={handleSendOtp}
                        className="font-bold text-purple-400 hover:text-purple-300 disabled:text-slate-600 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${otpLoading ? 'animate-spin' : ''}`} />
                        <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend Staff OTP'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Register Links */}
            <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-3">
              <p className="text-xs text-slate-400">
                Need to onboard a new clinical staff member?{' '}
                <Link
                  to="/staff/register"
                  className="font-bold text-purple-400 hover:text-purple-300 underline"
                >
                  Register Staff Account
                </Link>
              </p>

              <div className="flex items-center justify-center space-x-4 text-[11px] text-slate-500">
                <Link to="/patient/login" className="hover:text-cyan-400 transition">
                  Patient Portal Login &rarr;
                </Link>
                <span>&bull;</span>
                <Link to="/" className="hover:text-slate-300 transition">
                  Hospital Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
