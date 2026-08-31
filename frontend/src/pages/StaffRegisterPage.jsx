import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Eye, EyeOff, Lock, Mail, Phone, User, ArrowRight,
  CheckCircle2, Stethoscope, HeartPulse, Building2, Pill,
  FlaskConical, ArrowLeft, ShieldAlert, Award, FileText,
  DollarSign, Briefcase, Microscope, Activity
} from 'lucide-react'
import { loginSuccess } from '../store/slices/authSlice'
import api from '../services/api'
import { initSocket } from '../services/socket'
import { getUserRoles } from '../utils/auth'

export default function StaffRegisterPage() {
  const [role, setRole] = useState('doctor')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Clinical & Role Specific
  const [specialization, setSpecialization] = useState('General Medicine')
  const [qualification, setQualification] = useState('MBBS, MD')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [consultationFee, setConsultationFee] = useState('50.00')
  const [experienceYears, setExperienceYears] = useState('3')
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])

  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    // Load departments
    api.get('/departments')
      .then((res) => {
        if (res.data?.data) {
          setDepartments(res.data.data)
          if (res.data.data.length > 0) {
            setDepartmentId(res.data.data[0].id)
          }
        }
      })
      .catch(() => {})
  }, [])

  const rolesList = [
    { id: 'doctor', name: 'Doctor / Physician', icon: Stethoscope, desc: 'Consultations & EMR', color: 'from-cyan-500 via-teal-500 to-blue-600', ring: 'ring-cyan-500' },
    { id: 'nurse', name: 'Registered Nurse', icon: HeartPulse, desc: 'Vitals & Inpatient Care', color: 'from-rose-500 via-pink-500 to-rose-600', ring: 'ring-rose-500' },
    { id: 'pharmacist', name: 'Pharmacist', icon: Pill, desc: 'Prescription Dispensary', color: 'from-purple-500 via-violet-500 to-indigo-600', ring: 'ring-purple-500' },
    { id: 'lab_technician', name: 'Lab Technician', icon: FlaskConical, desc: 'Diagnostics & Pathology', color: 'from-emerald-500 via-teal-500 to-green-600', ring: 'ring-emerald-500' },
    { id: 'receptionist', name: 'Receptionist', icon: Building2, desc: 'Appointments & Check-in', color: 'from-amber-500 via-orange-500 to-yellow-600', ring: 'ring-amber-500' },
    { id: 'admin', name: 'Administrator', icon: Shield, desc: 'Hospital Operations', color: 'from-blue-500 via-indigo-500 to-blue-600', ring: 'ring-blue-500' },
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role,
        department_id: departmentId ? Number(departmentId) : null,
      }

      if (role === 'doctor') {
        payload.specialization = specialization
        payload.qualification = qualification
        payload.license_number = licenseNumber.trim() || `MED-${Math.floor(10000 + Math.random() * 90000)}`
        payload.consultation_fee = parseFloat(consultationFee) || 50.0
      } else if (role === 'nurse') {
        payload.qualification = qualification
        payload.experience_years = parseInt(experienceYears, 10) || 2
      }

      const res = await api.post('/auth/staff/register', payload)
      const authData = res.data?.data

      if (authData) {
        setSuccessMsg('Staff account created successfully! Signing in...')
        dispatch(loginSuccess(authData))
        if (authData.access_token) {
          initSocket(authData.access_token)
        }
        setTimeout(() => {
          redirectByRole(authData.user)
        }, 1200)
      } else {
        setSuccessMsg('Registration complete! Please log in.')
        setTimeout(() => navigate('/staff/login'), 1500)
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please check your details and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden selection:bg-cyan-500 selection:text-white">
      {/* ======================================================== */}
      {/* MULTI-COLOR AMBIENT GLOWS & REDUCED OPACITY BACKGROUND ART */}
      {/* ======================================================== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[170px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/3 -right-40 w-[650px] h-[650px] rounded-full bg-purple-600/20 blur-[180px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full bg-emerald-500/15 blur-[170px] animate-pulse" style={{ animationDuration: '7s' }} />

        {/* AI Medical Holographic Grid (Reduced Opacity) */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07] stroke-cyan-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="register-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="1.5" fill="#38bdf8" />
              <path d="M 50 0 L 50 100 M 0 50 L 100 50" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="#818cf8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#register-grid)" />
        </svg>

        {/* Floating Icons with Reduced Opacity */}
        <div className="absolute top-20 right-12 opacity-10 text-cyan-400">
          <Activity className="w-56 h-56 animate-pulse" />
        </div>
        <div className="absolute bottom-20 left-12 opacity-10 text-purple-400">
          <Microscope className="w-52 h-52" />
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto relative z-10 space-y-6">
        {/* Back Button & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/staff/login')}
            className="flex items-center space-x-2 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Back to Staff Login</span>
          </button>

          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Hospital Staff Onboarding Portal</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-panel rounded-3xl p-6 sm:p-10 border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/60 relative bg-slate-900/90 backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-slate-800">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Hospital Staff <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Registration</span>
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Join the clinical and operational team. Select your role to set up your clinical credentials.
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Select Your Role / Profession
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rolesList.map((r) => {
                const Icon = r.icon
                const isSelected = role === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRole(r.id)
                      if (r.id === 'doctor') {
                        setSpecialization('General Medicine')
                        setQualification('MBBS, MD')
                      } else if (r.id === 'nurse') {
                        setQualification('B.Sc Nursing / RN')
                      }
                    }}
                    className={`p-3.5 rounded-2xl text-left transition-all border flex items-center space-x-3 cursor-pointer ${
                      isSelected
                        ? `bg-slate-800 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/40`
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${r.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{r.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notifications */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-3"
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-3"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>1. Personal & Contact Information</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Robert"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Chen"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hospital / Work Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor.chen@hospital.local"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Role Specific Credentials */}
            {(role === 'doctor' || role === 'nurse') && (
              <div className="pt-2">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <Award className="w-4 h-4" />
                  <span>2. Clinical Credentials & Department</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {role === 'doctor' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Specialization *</label>
                      <input
                        type="text"
                        required
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g. Cardiology / General Medicine"
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Qualifications *</label>
                    <input
                      type="text"
                      required
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder={role === 'doctor' ? 'e.g. MBBS, MD, FACC' : 'e.g. B.Sc Nursing, RN'}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {role === 'doctor' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Medical License No.</label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="e.g. MED-84920"
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {role === 'doctor' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Consultation Fee ($)</label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          step="0.01"
                          value={consultationFee}
                          onChange={(e) => setConsultationFee(e.target.value)}
                          placeholder="50.00"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {role === 'nurse' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Years of Clinical Experience</label>
                      <input
                        type="number"
                        min="0"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        placeholder="3"
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {departments.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Department</label>
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 focus:outline-none bg-slate-900"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Passwords */}
            <div className="pt-2">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>3. Account Security</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type your password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registering Staff Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Staff Registration</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <div>
              Already registered?{' '}
              <Link to="/staff/login" className="text-cyan-400 hover:underline font-semibold">
                Sign In to Staff Portal
              </Link>
            </div>
            <div>
              Patient self-registration:{' '}
              <Link to="/patient/register" className="text-slate-300 hover:text-white underline">
                Patient Portal
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
