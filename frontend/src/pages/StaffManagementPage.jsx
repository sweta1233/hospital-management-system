import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Shield, Stethoscope, HeartPulse, Building2, Pill,
  FlaskConical, Search, CheckCircle2, XCircle, KeyRound, Edit2, Check,
  AlertCircle, RefreshCw, Eye, EyeOff, Lock, ChevronRight, ArrowLeft,
  Sparkles, Award, FileCheck, ShieldCheck, Mail, Phone, Calendar, Briefcase
} from 'lucide-react'
import api from '../services/api'
import { getUserRoles } from '../utils/auth'

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Modals & Stepper
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1) // 1: Info & Creds, 2: Role & Clinical Details, 3: Review & Permissions
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionError, setActionError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Create Staff Form
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'doctor',
    department_id: '',
    // Doctor Specific
    specialization: 'General Medicine',
    consultation_fee: 50,
    license_number: '',
    qualification: 'MD',
    // Nurse Specific
    experience_years: 2,
  })

  const roles = [
    { value: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'text-cyan-400', desc: 'Prescribe, diagnose, schedule consults & order lab tests' },
    { value: 'nurse', label: 'Nurse', icon: HeartPulse, color: 'text-rose-400', desc: 'Record vitals, patient monitoring & inpatient ward notes' },
    { value: 'receptionist', label: 'Receptionist', icon: Building2, color: 'text-amber-400', desc: 'Patient check-ins, appointment scheduling & billing collections' },
    { value: 'pharmacist', label: 'Pharmacist', icon: Pill, color: 'text-purple-400', desc: 'Dispense doctor prescriptions & manage drug inventory' },
    { value: 'lab_technician', label: 'Lab Technician', icon: FlaskConical, color: 'text-emerald-400', desc: 'Process sample tests, generate reports & upload results' },
    { value: 'admin', label: 'Administrator', icon: Shield, color: 'text-blue-400', desc: 'System governance, user provisioning & hospital audit logs' },
  ]

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const res = await api.get('/staff/users', {
        params: {
          search,
          role: roleFilter || undefined,
        },
      })
      setStaff(res.data?.data?.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments')
      const list = res.data?.data || []
      setDepartments(list)
      if (list.length > 0 && !formData.department_id) {
        setFormData((prev) => ({ ...prev, department_id: list[0].id }))
      }
    } catch (e) {
      console.warn('Departments fetch failed:', e)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [search, roleFilter])

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleCreateStaff = async (e) => {
    e.preventDefault()
    setActionError('')
    setActionSuccess('')
    setSubmitting(true)

    try {
      const payload = {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        consultation_fee: parseFloat(formData.consultation_fee) || 0,
        experience_years: parseInt(formData.experience_years) || 0,
      }

      await api.post('/staff/users', payload)
      setActionSuccess(`New ${formData.role} account provisioned & onboarded successfully!`)
      setTimeout(() => setActionSuccess(''), 4000)
      setShowCreateModal(false)
      setOnboardingStep(1)
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'doctor',
        department_id: departments[0]?.id || '',
        specialization: 'General Medicine',
        consultation_fee: 50,
        license_number: '',
        qualification: 'MD',
        experience_years: 2,
      })
      fetchStaff()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create staff account')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (user) => {
    setActionError('')
    setActionSuccess('')
    try {
      if (user.is_active) {
        await api.post(`/staff/users/${user.id}/deactivate`)
        setActionSuccess(`${user.first_name} ${user.last_name} deactivated`)
      } else {
        await api.post(`/staff/users/${user.id}/activate`)
        setActionSuccess(`${user.first_name} ${user.last_name} activated`)
      }
      fetchStaff()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!selectedUser || !newPassword) return

    setActionError('')
    setActionSuccess('')
    try {
      await api.post(`/staff/users/${selectedUser.id}/reset-password`, {
        new_password: newPassword,
      })
      setActionSuccess(`Password reset successfully for ${selectedUser.email}`)
      setShowResetModal(false)
      setNewPassword('')
      setSelectedUser(null)
    } catch (err) {
      setActionError(err.response?.data?.message || 'Password reset failed')
    }
  }

  const selectedRoleObj = roles.find((r) => r.value === formData.role) || roles[0]

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Hospital Administration & Credentialing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Staff Management & Onboarding</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Provision clinical practitioners, nurses, pharmacists, and support staff with RBAC credentials
          </p>
        </div>

        <button
          onClick={() => {
            setOnboardingStep(1)
            setShowCreateModal(true)
          }}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Onboard New Staff</span>
        </button>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm flex items-center space-x-3"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-center space-x-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, official email, or phone..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm text-slate-100 focus:outline-none"
          >
            <option value="">All Hospital Roles</option>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Staff Practitioner</th>
                <th className="px-5 py-3.5">Assigned Role</th>
                <th className="px-5 py-3.5">Official Contact</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-2" />
                    Loading staff registers...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    No staff records found matching your filters.
                  </td>
                </tr>
              ) : (
                staff.map((user) => {
                  const userRoles = getUserRoles(user)
                  const primaryRole = user.primary_role || userRoles[0] || 'staff'
                  const roleConfig = roles.find((r) => r.value === primaryRole) || {
                    label: primaryRole,
                    color: 'text-slate-400',
                  }

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-xs">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs sm:text-sm">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-[11px] text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 ${roleConfig.color}`}>
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[11px] text-slate-300">
                        {user.phone || 'No direct phone'}
                      </td>
                      <td className="px-5 py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-semibold text-rose-400">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowResetModal(true)
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Reset Credentials"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                              user.is_active
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MULTI-STEP ONBOARDING MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel max-w-xl w-full rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Staff Credentialing & Onboarding</h3>
                    <p className="text-xs text-slate-400">Step {onboardingStep} of 3</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Step Progress Bar */}
              <div className="flex items-center justify-between mb-6 px-2">
                {[
                  { step: 1, label: 'Identity' },
                  { step: 2, label: 'Role & Clinical' },
                  { step: 3, label: 'Review & Finish' },
                ].map((s) => (
                  <div key={s.step} className="flex items-center space-x-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        onboardingStep === s.step
                          ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                          : onboardingStep > s.step
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {onboardingStep > s.step ? <Check className="w-3.5 h-3.5" /> : s.step}
                    </div>
                    <span className={`text-xs font-semibold ${onboardingStep >= s.step ? 'text-slate-200' : 'text-slate-500'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                {/* STEP 1: IDENTITY & LOGIN CREDS */}
                {onboardingStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">First Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          placeholder="E.g. Rajesh"
                          className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          placeholder="E.g. Sharma"
                          className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Hospital Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="practitioner@aegis-hms.org"
                        className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Temporary Initial Password *</label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min. 8 characters"
                        className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">Staff will be asked to change on first login</span>
                    </div>

                    <div className="flex justify-end pt-3">
                      <button
                        type="button"
                        disabled={!formData.first_name || !formData.last_name || !formData.email || !formData.password}
                        onClick={() => setOnboardingStep(2)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs flex items-center space-x-1 disabled:opacity-40"
                      >
                        <span>Continue to Role & Clinical Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: ROLE & CLINICAL PARTICULARS */}
                {onboardingStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-2">Hospital Staff Role *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {roles.map((r) => {
                          const Icon = r.icon
                          return (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, role: r.value })}
                              className={`p-3 rounded-xl text-left border transition flex items-start space-x-2.5 ${
                                formData.role === r.value
                                  ? 'bg-slate-800 border-cyan-500/60'
                                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                              }`}
                            >
                              <Icon className={`w-4 h-4 mt-0.5 ${r.color}`} />
                              <div>
                                <p className="font-bold text-white text-xs">{r.label}</p>
                                <p className="text-[10px] text-slate-400 line-clamp-1">{r.desc}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Assigned Department / Ward</label>
                      <select
                        value={formData.department_id}
                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                      >
                        <option value="">General Hospital Pool</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id} className="bg-slate-900">
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* DOCTOR SPECIFIC FIELDS */}
                    {formData.role === 'doctor' && (
                      <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-3">
                        <span className="text-[10px] uppercase font-bold text-cyan-400 block">Doctor Clinical Profile</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Specialization</label>
                            <input
                              type="text"
                              value={formData.specialization}
                              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                              placeholder="Cardiology, Neurology..."
                              className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Consultation Fee ($)</label>
                            <input
                              type="number"
                              value={formData.consultation_fee}
                              onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                              placeholder="50"
                              className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Medical License #</label>
                            <input
                              type="text"
                              value={formData.license_number}
                              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                              placeholder="MCI-987654"
                              className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Qualification</label>
                            <input
                              type="text"
                              value={formData.qualification}
                              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                              placeholder="MBBS, MD, DM"
                              className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NURSE SPECIFIC FIELDS */}
                    {formData.role === 'nurse' && (
                      <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-3">
                        <span className="text-[10px] uppercase font-bold text-rose-400 block">Nurse Clinical Profile</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Qualification</label>
                            <input
                              type="text"
                              value={formData.qualification}
                              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                              placeholder="B.Sc Nursing / RN"
                              className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Years of Experience</label>
                            <input
                              type="number"
                              value={formData.experience_years}
                              onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                              placeholder="2"
                              className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-3">
                      <button
                        type="button"
                        onClick={() => setOnboardingStep(1)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setOnboardingStep(3)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold flex items-center space-x-1"
                      >
                        <span>Review & Finish</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW & ONBOARDING CONFIRMATION */}
                {onboardingStep === 3 && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                          {formData.first_name[0]}{formData.last_name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{formData.first_name} {formData.last_name}</h4>
                          <span className="text-[11px] text-slate-400">{formData.email}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-slate-500 block text-[10px]">ROLE</span>
                          <span className="font-semibold text-white uppercase">{formData.role}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">PHONE</span>
                          <span className="font-semibold text-slate-200">{formData.phone}</span>
                        </div>
                        {formData.role === 'doctor' && (
                          <>
                            <div>
                              <span className="text-slate-500 block text-[10px]">SPECIALIZATION</span>
                              <span className="font-semibold text-cyan-400">{formData.specialization}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">FEE</span>
                              <span className="font-semibold text-emerald-400">${formData.consultation_fee}</span>
                            </div>
                          </>
                        )}
                        {formData.role === 'nurse' && (
                          <>
                            <div>
                              <span className="text-slate-500 block text-[10px]">QUALIFICATION</span>
                              <span className="font-semibold text-rose-400">{formData.qualification}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">EXPERIENCE</span>
                              <span className="font-semibold text-slate-200">{formData.experience_years} years</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Onboarding Checklist Note */}
                    <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                      <span>Account will be immediately provisioned with RBAC credentials and authorized API access.</span>
                    </div>

                    <div className="flex justify-between pt-3">
                      <button
                        type="button"
                        onClick={() => setOnboardingStep(2)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? 'Provisioning...' : 'Complete Onboarding'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showResetModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel max-w-md w-full rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Reset Staff Password</h3>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Set a new password for <span className="text-cyan-400 font-semibold">{selectedUser.email}</span>.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl gradient-btn text-white text-sm font-bold shadow-lg shadow-cyan-500/25 transition cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
