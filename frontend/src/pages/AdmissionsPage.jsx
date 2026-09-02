import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bed, Plus, User, Stethoscope, Calendar, LogOut,
  X, ClipboardPlus, Hash, Building2, AlertCircle,
  CheckCircle2, Clock
} from 'lucide-react'
import api from '../services/api'
import { useSelector } from 'react-redux'
import { hasAnyRole } from '../utils/auth'

const WARDS = ['General Ward', 'ICU', 'Pediatric', 'Maternity', 'Orthopedic', 'Cardiac ICU', 'Private Room']

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [discharging, setDischarging] = useState(null)
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [successMsg, setSuccessMsg] = useState('')

  const user = useSelector((s) => s.auth.user)
  const canAdmit = hasAnyRole(user, ['admin', 'doctor', 'receptionist'])

  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    ward_name: WARDS[0],
    bed_number: '',
    reason: '',
    admission_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const fetchAdmissions = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admissions?per_page=50')
      setAdmissions(res.data?.data?.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMeta = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        api.get('/patients?per_page=100'),
        api.get('/doctors?per_page=100'),
      ])
      setPatients(pRes.data?.data?.items || [])
      const docList = dRes.data?.data?.items || []
      setDoctors(docList)
      setForm(prev => ({
        ...prev,
        patient_id: pRes.data?.data?.items?.[0]?.id || '',
        doctor_id: docList?.[0]?.id || '',
      }))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchAdmissions()
    fetchMeta()
  }, [])

  const handleAdmit = async (e) => {
    e.preventDefault()
    if (!form.bed_number.trim()) {
      alert('Please enter a bed number.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/admissions', {
        patient_id: form.patient_id,
        doctor_id: form.doctor_id,
        ward_name: form.ward_name,
        bed_number: form.bed_number,
        reason: form.reason,
        admission_date: form.admission_date,
        notes: form.notes,
      })
      setShowModal(false)
      setSuccessMsg('Patient admitted successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
      fetchAdmissions()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to admit patient. Check if bed is already occupied.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDischarge = async (admissionId) => {
    if (!window.confirm('Discharge this patient? This action will release the bed.')) return
    setDischarging(admissionId)
    try {
      await api.put(`/admissions/${admissionId}/discharge`, {
        discharge_date: new Date().toISOString().split('T')[0],
        discharge_notes: 'Discharged by clinical staff',
      })
      setSuccessMsg('Patient discharged successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
      fetchAdmissions()
    } catch (err) {
      alert(err.response?.data?.message || 'Discharge failed')
    } finally {
      setDischarging(null)
    }
  }

  const activeCount = admissions.filter(a => !a.discharge_date).length
  const dischargedCount = admissions.filter(a => a.discharge_date).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent text-slate-100">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-3 border border-emerald-500/30">
              <Bed className="h-6 w-6" />
            </div>
            Inpatient Admissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ward bed management, patient admissions & discharge records
          </p>
        </div>
        {canAdmit && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" /> Admit Patient
          </button>
        )}
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Beds Used', value: activeCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Discharged Today', value: dischargedCount, color: 'text-slate-300', bg: 'bg-slate-800/60 border-slate-700/50' },
          { label: 'All Records', value: admissions.length, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
        ].map((s) => (
          <div key={s.label} className={`glass-panel rounded-2xl p-4 border ${s.bg}`}>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-400">Loading admissions...</p>
            </div>
          ) : admissions.length === 0 ? (
            <div className="text-center py-16">
              <Bed className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No active admissions</p>
              <p className="text-xs text-slate-500 mt-1">Click "Admit Patient" to add a new inpatient record</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Bed Assignment</th>
                  <th className="px-5 py-3.5">Attending Doctor</th>
                  <th className="px-5 py-3.5">Admission Date</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {admissions.map((adm, idx) => (
                  <motion.tr
                    key={adm.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="hover:bg-slate-800/40 transition"
                  >
                    <td className="px-5 py-4 font-semibold text-white">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-800/50 flex items-center justify-center text-emerald-400 font-bold text-xs">
                          {adm.patient_name?.[0] || 'P'}
                        </div>
                        <div>
                          <span className="block">{adm.patient_name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">ID #{adm.patient_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      <div className="flex items-center space-x-1.5 font-medium">
                        <Bed className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{adm.ward_name} — Bed {adm.bed_number}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{adm.doctor_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-[11px]">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(adm.admission_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 max-w-[140px] truncate">
                      {adm.reason || 'Not specified'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        adm.discharge_date
                          ? 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {adm.discharge_date ? 'Discharged' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!adm.discharge_date && canAdmit && (
                        <button
                          onClick={() => handleDischarge(adm.id)}
                          disabled={discharging === adm.id}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 font-semibold transition text-[11px] inline-flex items-center disabled:opacity-50"
                        >
                          {discharging === adm.id ? (
                            <div className="w-3 h-3 border border-rose-400/30 border-t-rose-400 rounded-full animate-spin mr-1" />
                          ) : (
                            <LogOut className="w-3 h-3 mr-1" />
                          )}
                          Discharge
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Admit Patient Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <ClipboardPlus className="w-5 h-5 mr-2 text-emerald-400" />
                  Admit New Patient
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdmit} className="space-y-4 text-xs">
                {/* Patient */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Select Patient *
                  </label>
                  <select
                    required
                    value={form.patient_id}
                    onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                  >
                    <option value="" className="bg-slate-900">Select a patient...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900">
                        {p.full_name} ({p.patient_id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center">
                    <Stethoscope className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Attending Doctor *
                  </label>
                  <select
                    required
                    value={form.doctor_id}
                    onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900">
                        {d.full_name} — {d.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ward + Bed */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Ward *
                    </label>
                    <select
                      required
                      value={form.ward_name}
                      onChange={(e) => setForm({ ...form, ward_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                    >
                      {WARDS.map((w) => (
                        <option key={w} value={w} className="bg-slate-900">{w}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center">
                      <Hash className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Bed Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A-12"
                      value={form.bed_number}
                      onChange={(e) => setForm({ ...form, bed_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Admission Date */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Admission Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.admission_date}
                    onChange={(e) => setForm({ ...form, admission_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-400" /> Reason for Admission *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Post-operative care, Fracture, Fever..."
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Clinical Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Additional clinical notes or instructions..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Admitting...</span>
                      </>
                    ) : (
                      <>
                        <Bed className="w-3.5 h-3.5" />
                        <span>Confirm Admission</span>
                      </>
                    )}
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
