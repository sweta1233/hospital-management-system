import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartPulse, Eye, EyeOff, Lock, Mail, ArrowRight, Phone,
  CheckCircle2, Shield, AlertCircle, ArrowLeft, UserRound,
  KeyRound, RefreshCw, Smartphone, Sparkles, Video, FileText,
  Activity, Award, ShieldCheck, Zap, Stethoscope, ChevronRight
} from 'lucide-react'
import { loginSuccess } from '../store/slices/authSlice'
import api from '../services/api'
import { initSocket } from '../services/socket'
import DiscreteOtpInput from '../components/DiscreteOtpInput'
import AppBackdrop from '../components/AppBackdrop'

export default function PatientLoginPage() {
  const [authMode, setAuthMode] = useState('otp') // Default to quick OTP
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
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
  const location = useLocation()

  // Pre-fill identifier & message from registration redirect
  useEffect(() => {
    if (location.state?.emailOrPhone) {
      setEmailOrPhone(location.state.emailOrPhone)
    }
    if (location.state?.message) {
      setInfoMsg(location.state.message)
    }
  }, [location.state])

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

  // Standard password login
  const handlePasswordLogin = async (e) => {
    e?.preventDefault()
    setLoading(true)
    setError('')
    setInfoMsg('')

    try {
      const res = await api.post('/auth/patient/login', {
        email: emailOrPhone.trim(),
        password
      })

      dispatch(loginSuccess(res.data.data))
      if (res.data.data?.access_token) {
        initSocket(res.data.data.access_token)
      }
      navigate('/patient/dashboard')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid credentials or server connection error.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Request OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault()
    const cleanIdentifier = emailOrPhone.trim()
    if (!cleanIdentifier) {
      setError('Please enter your email address or 10-digit mobile number.')
      return
    }

    setOtpLoading(true)
    setError('')
    setInfoMsg('')
    setOtpCode('')

    try {
      const res = await api.post('/auth/send-otp', {
        identifier: cleanIdentifier,
        portal: 'patient',
      })
      setOtpSent(true)
      setCountdown(30)
      const data = res.data?.data || {}
      setDispatchInfo(data.dispatch_info || null)
      setInfoMsg(res.data?.message || 'A 6-digit verification code has been dispatched!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your email or phone number.')
    } finally {
      setOtpLoading(false)
    }
  }

  // Verify OTP and Login
  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otpCode
    if (!code || code.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/verify-otp', {
        identifier: emailOrPhone.trim(),
        otp_code: code.trim(),
        portal: 'patient',
      })

      dispatch(loginSuccess(res.data.data))
      if (res.data.data?.access_token) {
        initSocket(res.data.data.access_token)
      }
      navigate('/patient/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.')
    } finally {
      setLoading(false)
    }
  }

  // Masked identifier for privacy
  const getMaskedTarget = () => {
    const raw = emailOrPhone.trim()
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
    <div className="min-h-screen text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden bg-[#080c14] selection:bg-cyan-500 selection:text-white">
      {/* ── 5 AI Background Visuals Ambient Backdrop with Opacity ── */}
      <AppBackdrop opacity="opacity-35" showSwitcher={false} />

      {/* Main Dual-Panel Container */}
      <div className="max-w-5xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Futuristic AI Clinical Highlights (5 Cols) */}
        <div className="lg:col-span-5 hidden lg:flex flex-col justify-between space-y-6 p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          {/* Subtle Ambient Scanline */}
          <div className="absolute inset-0 ai-scanline opacity-20 pointer-events-none" />

          {/* Top Back & Brand */}
          <div className="relative z-10">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center space-x-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Hospital Home</span>
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 pulse-ring-emerald">
                <HeartPulse className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Arogya<span className="gradient-text ml-1">HMS</span>
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Patient Health Portal
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-white leading-snug">
              Instant Access to Your <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Medical Records</span>
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Login to access doctor consultations, pathology reports, digital e-prescriptions, and 2-way video telehealth with instant OTP.
            </p>
          </div>

          {/* Feature Badges Grid */}
          <div className="space-y-3 relative z-10">
            {[
              { icon: Smartphone, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', title: '1-Click Fast OTP Login', sub: 'Real SMS & Email Verification' },
              { icon: Video, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', title: 'Live Doctor Telehealth', sub: 'Instant Video Consultations' },
              { icon: FileText, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', title: 'Diagnostic Lab Reports', sub: 'Instant Analyte Analysis & Rx' },
              { icon: ShieldCheck, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', title: '256-Bit Encrypted Records', sub: 'HIPAA & NABH Compliant' },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md hover:border-cyan-500/40 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{f.title}</h4>
                    <span className="text-[10px] text-slate-400">{f.sub}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Trust Banner */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>100% Patient Privacy Guaranteed</span>
            </span>
            <span className="font-mono text-cyan-400">24/7 Available</span>
          </div>
        </div>

        {/* Right Side: Interactive 6-Digit OTP / Password Login Card (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 lg:p-9 border border-cyan-500/40 shadow-2xl backdrop-blur-2xl relative overflow-hidden bg-slate-900/95">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Mobile Header (Shown on small screens) */}
            <div className="lg:hidden mb-6 flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
                  A
                </div>
                <span className="text-sm font-bold text-white">Arogya HMS</span>
              </div>
            </div>

            {/* Title Header */}
            <div className="mb-6">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Patient Portal Sign In</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome to <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Arogya Portal</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Enter your mobile phone number or email address for instant 6-digit OTP verification.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-2xl bg-slate-950/90 p-1.5 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp')
                  setError('')
                  setInfoMsg('')
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  authMode === 'otp'
                    ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Quick 6-Digit OTP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('password')
                  setError('')
                  setInfoMsg('')
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  authMode === 'password'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Password Login</span>
              </button>
            </div>

            {/* Error Notification */}
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

            {/* Info / Success Notification */}
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
                        🧪 Sandbox Testing Code: <strong className="text-white text-sm tracking-wider">{dispatchInfo.otp_code}</strong>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MODE 1: 6-DIGIT OTP AUTHENTICATION */}
            {authMode === 'otp' && (
              <div>
                {!otpSent ? (
                  // Step 1: Input Identifier
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                        Mobile Phone or Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={emailOrPhone}
                          onChange={(e) => setEmailOrPhone(e.target.value)}
                          placeholder="e.g. 9876543210 or user@email.com"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition"
                          required
                          autoFocus
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center space-x-1">
                        <span>We'll dispatch a real 6-digit numeric verification code to your device.</span>
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                    >
                      {otpLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching 6-Digit Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send 6-Digit Verification Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  // Step 2: 6-Box Discrete OTP Entry
                  <div className="space-y-5">
                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Verification Code Sent To:
                        </span>
                        <span className="text-sm font-mono font-bold text-cyan-300">
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
                        className="text-xs text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    {/* Flipkart / Amazon Style 6-Box Discrete Input */}
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2 text-center">
                        Enter 6-Digit Code
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
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying & Logging In...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify & Enter Patient Portal</span>
                        </>
                      )}
                    </button>

                    {/* Resend Section */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <span>Didn't receive the code?</span>
                      <button
                        type="button"
                        disabled={countdown > 0 || otpLoading}
                        onClick={handleSendOtp}
                        className="font-bold text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${otpLoading ? 'animate-spin' : ''}`} />
                        <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: STANDARD EMAIL / PASSWORD LOGIN */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                    Email Address or Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="patient@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password
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
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
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
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Actions & Register Navigation */}
            <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-3">
              <p className="text-xs text-slate-400">
                New patient at Arogya Hospital?{' '}
                <Link
                  to="/patient/register"
                  className="font-bold text-cyan-400 hover:text-cyan-300 underline"
                >
                  Create Patient Account
                </Link>
              </p>

              <div className="flex items-center justify-center space-x-4 text-[11px] text-slate-500">
                <Link to="/staff/login" className="hover:text-purple-400 transition">
                  Hospital Staff Login &rarr;
                </Link>
                <span>&bull;</span>
                <Link to="/cancer-detection" className="hover:text-emerald-400 transition">
                  Cancer AI Diagnostics &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
