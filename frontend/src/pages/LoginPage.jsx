import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartPulse, Shield, Eye, EyeOff, Lock, Mail, ArrowRight,
  Activity, Sparkles, CheckCircle2, UserCheck, Stethoscope,
  Building2, Pill, FlaskConical, Users, ShieldAlert, Check
} from 'lucide-react'
import { loginSuccess } from '../store/slices/authSlice'
import api from '../services/api'
import { initSocket } from '../services/socket'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@hms.local')
  const [password, setPassword] = useState('Password@123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      dispatch(loginSuccess(res.data.data))
      initSocket(res.data.data.access_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or connection error')
    } finally {
      setLoading(false)
    }
  }

  const demoAccounts = [
    { role: 'Admin', email: 'admin@hms.local', icon: Shield, desc: 'Full System Access', color: 'from-blue-500 to-indigo-600', ring: 'ring-blue-500' },
    { role: 'Doctor', email: 'dr.smith@hms.local', icon: Stethoscope, desc: 'EMR & Consults', color: 'from-cyan-500 to-teal-600', ring: 'ring-cyan-500' },
    { role: 'Nurse', email: 'nurse.jones@hms.local', icon: HeartPulse, desc: 'Vitals & Care', color: 'from-rose-500 to-pink-600', ring: 'ring-rose-500' },
    { role: 'Reception', email: 'reception@hms.local', icon: Building2, desc: 'Front Desk', color: 'from-amber-500 to-orange-600', ring: 'ring-amber-500' },
    { role: 'Pharmacy', email: 'pharma@hms.local', icon: Pill, desc: 'Dispensary', color: 'from-purple-500 to-violet-600', ring: 'ring-purple-500' },
    { role: 'Lab Tech', email: 'labtech@hms.local', icon: FlaskConical, desc: 'Diagnostics', color: 'from-emerald-500 to-green-600', ring: 'ring-emerald-500' },
    { role: 'Patient', email: 'patient@hms.local', icon: Users, desc: 'Health Portal', color: 'from-sky-500 to-blue-600', ring: 'ring-sky-500' },
  ]

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden selection:bg-cyan-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-600/15 blur-[160px] pointer-events-none animate-glow" />
      <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-indigo-600/15 blur-[180px] pointer-events-none animate-glow" style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[150px] pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

        {/* Left Side: Product Branding & Features */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="lg:col-span-7 space-y-6 text-left"
        >
          {/* Badge */}
          <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Next-Generation Hospital OS</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Intelligent Clinical <br />
            <span className="gradient-text">Hospital Management</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed">
            Enterprise cloud platform unifying Electronic Medical Records (EMR), automated prescription dispensing, real-time WebSocket alerts, and ward management.
          </p>

          {/* Feature Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { title: 'Electronic EMR', desc: 'Secure patient histories & vitals', icon: Activity, color: 'text-cyan-400' },
              { title: 'Real-time Sync', desc: 'Live doctor & lab alerts', icon: HeartPulse, color: 'text-rose-400' },
              { title: '7 Clinical Roles', desc: 'Role-based access control', icon: Shield, color: 'text-indigo-400' },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition">
                  <Icon className={`w-6 h-6 ${item.color} mb-2.5`} />
                  <h4 className="font-bold text-sm text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">{item.desc}</p>
                </div>
              )
            })}
          </div>

          {/* 1-Click Role Switcher */}
          <div className="pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1-Click Quick Demo Sign-In
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    }}
                    className={`p-2.5 rounded-xl text-left transition-all border flex items-center space-x-2.5 ${
                      isSelected
                        ? `bg-slate-800 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ${acc.ring}`
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${acc.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
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

        {/* Right Side: High-End Glassmorphic Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="lg:col-span-5"
        >
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/60 shadow-2xl relative">
            {/* Top Emblem */}
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-800/80">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                  <HeartPulse className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Staff Portal</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Secure authentication system</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Online
              </span>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2.5"
                >
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@hospital.org"
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
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
                    className="w-full pl-10 pr-11 py-3 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
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
                <button
                  type="button"
                  onClick={() => setPassword('Password@123')}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  Reset: Password@123
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl gradient-btn text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Clinical Access...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Clinical Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
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
