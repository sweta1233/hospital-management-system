import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartPulse, Eye, EyeOff, Lock, Mail, ArrowRight, Phone,
  CheckCircle2, Shield, AlertCircle, ArrowLeft, UserRound,
  KeyRound, RefreshCw, Smartphone, Sparkles, Video, FileText,
  Activity, Award, ShieldCheck, Zap
} from 'lucide-react'
import { loginSuccess } from '../store/slices/authSlice'
import api from '../services/api'
import { initSocket } from '../services/socket'

export default function PatientLoginPage() {
  const [authMode, setAuthMode] = useState('otp') // Default to quick OTP for real patients
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
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

  // Standard password login
  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfoMsg('')

    try {
      const res = await api.post('/auth/patient/login', {
        email: emailOrPhone,
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
    if (!emailOrPhone.trim()) {
      setError('Please enter your email address or mobile phone number.')
      return
    }

    setOtpLoading(true)
    setError('')
    setInfoMsg('')

    try {
      const res = await api.post('/auth/send-otp', {
        identifier: emailOrPhone.trim(),
        portal: 'patient',
      })
      setOtpSent(true)
      setInfoMsg(res.data?.message || 'A 6-digit verification code has been dispatched!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your email or phone number.')
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
        identifier: emailOrPhone.trim(),
        otp_code: otpCode.trim(),
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060c1d] via-[#0b142c] to-[#081028] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Multi-Color Ambient Glow Spheres */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/20 blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute top-1/2 -right-32 w-[450px] h-[450px] rounded-full bg-purple-600/20 blur-[160px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute -bottom-32 left-1/3 w-[400px] h-[400px] rounded-full bg-emerald-500/15 blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none" />

      {/* Main Dual-Panel Container */}
      <div className="max-w-5xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Colorful Clinical Highlights (5 Cols) */}
        <div className="lg:col-span-5 hidden lg:flex flex-col justify-between space-y-6 p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#0d1b3e]/90 to-slate-950/90 border border-cyan-500/30 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Top Back & Brand */}
          <div>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center space-x-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hospital Home</span>
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                <HeartPulse className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Arogya<span className="gradient-text ml-1">HMS</span>
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                  Patient Health Portal
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-white leading-snug">
              Instant Access to Your <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Health Records</span>
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Login to view your medical consultations, download laboratory diagnostic reports, view digital prescriptions, and connect with your doctors in HD video.
            </p>
          </div>

          {/* Feature Badges Grid */}
          <div className="space-y-3">
            {[
              { icon: Video, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', title: 'Live Doctor Telehealth', sub: 'Instant Video Checkup' },
              { icon: FileText, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', title: 'Diagnostic Lab Reports', sub: 'Pathology & Analyte Results' },
              { icon: ShieldCheck, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', title: 'Encrypted Health Passport', sub: '100% Confidential & Secure' },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
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
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>HIPAA Compliant Security</span>
            </span>
            <span className="font-mono text-cyan-400">24/7 Available</span>
          </div>
        </div>

        {/* Right Side: Multi-Colored Interactive Login Form Card (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 lg:p-9 border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 backdrop-blur-2xl relative overflow-hidden bg-gradient-to-b from-slate-900/95 via-[#0c1630]/95 to-slate-950/95">
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
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
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
                Welcome to <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">Your Health Portal</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Enter your registered email address or mobile number to proceed.
              </p>
            </div>

            {/* Multi-Color Mode Switcher Tabs */}
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
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>One-Time Passcode (OTP)</span>
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
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2.5 shadow-md"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Info Message */}
            <AnimatePresence>
              {infoMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{infoMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fast OTP Login Form */}
            {authMode === 'otp' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Your Registered Email or Mobile Number *
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={emailOrPhone}
                        onChange={(e) => {
                          setEmailOrPhone(e.target.value)
                          setOtpSent(false)
                        }}
                        placeholder="e.g. your_email@gmail.com or 9876543210"
                        className="w-full pl-10 pr-3 py-3 rounded-2xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none border border-slate-700 focus:border-cyan-400 font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || !emailOrPhone.trim()}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-cyan-500/25"
                    >
                      {otpLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>{otpSent ? 'Resend Code' : 'Send Code'}</span>
                      )}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleVerifyOtp}
                    className="space-y-4 pt-2"
                  >
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Enter 6-Digit Passcode *
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          maxLength={6}
                          required
                          autoFocus
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                          className="w-full pl-10 pr-4 py-3.5 rounded-2xl glass-input text-lg font-mono font-bold tracking-[8px] text-center text-cyan-300 placeholder-slate-600 focus:outline-none border-2 border-cyan-500/50 focus:border-cyan-400 bg-slate-950"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                        Code valid for 10 minutes. Check your inbox or phone SMS.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full py-3.5 px-4 rounded-2xl gradient-btn text-white font-bold text-sm tracking-wide shadow-xl shadow-cyan-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Verifying Passcode...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </div>
            )}

            {/* Password Login Form */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Email Address or Phone Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="patient@email.com or +1234567890"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none border border-slate-700 focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-11 py-3 rounded-2xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none border border-slate-700 focus:border-indigo-400"
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
                    <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-800 text-indigo-500 mr-2 focus:ring-0" />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="text-indigo-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Links */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
              <span className="text-slate-400">
                New patient?{' '}
                <Link to="/patient/register" className="text-cyan-400 font-bold hover:underline">
                  Register Account
                </Link>
              </span>
              <Link to="/staff/login" className="text-slate-400 hover:text-slate-200 transition font-medium">
                Hospital Staff Login &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
