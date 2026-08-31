import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill, Stethoscope, User, Clock, CheckCircle2, Package,
  FileText, Plus, Eye, Printer, Download, Check, AlertCircle,
  X, Trash2, Building2, ShieldCheck, HeartPulse, Sparkles,
  Calendar, Award, Activity
} from 'lucide-react'
import api from '../services/api'
import { hasAnyRole } from '../utils/auth'

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRx, setSelectedRx] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [patients, setPatients] = useState([])
  const [medicines, setMedicines] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [dispensingId, setDispensingId] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  // Create Form
  const [newPatientId, setNewPatientId] = useState('')
  const [newDiagnosis, setNewDiagnosis] = useState('')
  const [items, setItems] = useState([
    { medicine_name: 'Amoxicillin 500mg', dosage: '500mg', frequency: '1-0-1', duration: '5 days', quantity: 10, instructions: 'Take after meals' }
  ])
  const [creating, setCreating] = useState(false)

  const user = useSelector((state) => state.auth.user)
  const isPatient = hasAnyRole(user, ['patient'])
  const isDoctor = hasAnyRole(user, ['doctor', 'admin'])
  const isPharmacist = hasAnyRole(user, ['pharmacist', 'admin'])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/prescriptions?status=${statusFilter}&per_page=50`)
      setPrescriptions(res.data?.data?.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMeta = async () => {
    if (isDoctor) {
      try {
        const patRes = await api.get('/patients?per_page=100')
        const patList = patRes.data?.data?.items || []
        setPatients(patList)
        if (patList.length > 0) {
          setNewPatientId(patList[0].id)
        }
      } catch (e) {}

      try {
        const medRes = await api.get('/medicines?per_page=100')
        setMedicines(medRes.data?.data?.items || [])
      } catch (e) {}
    }
  }

  useEffect(() => {
    fetchPrescriptions()
  }, [statusFilter])

  useEffect(() => {
    fetchMeta()
  }, [])

  const handleDispense = async (rxId) => {
    setDispensingId(rxId)
    try {
      await api.post(`/prescriptions/${rxId}/dispense`)
      setSuccessMsg(`Prescription #${rxId} dispensed successfully! Pharmacy stock updated.`)
      setTimeout(() => setSuccessMsg(''), 4000)
      fetchPrescriptions()
      if (selectedRx && selectedRx.id === rxId) {
        setSelectedRx((prev) => ({ ...prev, status: 'dispensed' }))
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Dispensing failed.')
    } finally {
      setDispensingId(null)
    }
  }

  const handleCreatePrescription = async (e) => {
    e.preventDefault()
    if (!newPatientId) {
      alert('Please select a patient.')
      return
    }
    setCreating(true)
    try {
      const payload = {
        patient_id: parseInt(newPatientId, 10),
        notes: newDiagnosis.trim() || 'General Medical Prescription',
        items: items.map((it) => ({
          medicine_name: it.medicine_name,
          dosage: it.dosage,
          frequency: it.frequency,
          duration: it.duration,
          quantity: parseInt(it.quantity, 10) || 1,
          instructions: it.instructions,
        })),
      }
      await api.post('/prescriptions', payload)
      setSuccessMsg('New prescription issued successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
      setShowCreateModal(false)
      setNewDiagnosis('')
      setItems([
        { medicine_name: 'Amoxicillin 500mg', dosage: '500mg', frequency: '1-0-1', duration: '5 days', quantity: 10, instructions: 'Take after meals' }
      ])
      fetchPrescriptions()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue prescription.')
    } finally {
      setCreating(false)
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      { medicine_name: '', dosage: '500mg', frequency: '1-0-1', duration: '5 days', quantity: 10, instructions: 'After meals' }
    ])
  }

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const updateItem = (idx, field, val) => {
    const updated = [...items]
    updated[idx][field] = val
    setItems(updated)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#070d1e] text-slate-100 relative selection:bg-purple-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-pink-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Digital Pharmacology & E-Rx Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center">
              {isPatient ? 'My Health Prescriptions (Rx)' : 'Clinical Prescription Management'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isPatient
                ? 'View your verified clinical prescriptions, 1-0-1 daily dosage schedules, and download medical slips'
                : 'Doctor medication charting, electronic Rx generation, and real-time pharmacy dispensation'}
            </p>
          </div>

          {isDoctor && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 rounded-2xl btn-purple text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-2" /> Issue New Prescription
            </button>
          )}
        </div>

        {/* Success Notification */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2.5 shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Glass Table Card */}
        <div className="glass-panel rounded-3xl border-2 border-purple-500/30 overflow-hidden shadow-2xl bg-slate-900/90 backdrop-blur-2xl">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-3 bg-slate-950/60">
            <div className="flex space-x-2">
              {[
                { key: '', label: 'All Orders' },
                { key: 'pending', label: 'Pending Dispensation' },
                { key: 'dispensed', label: 'Dispensed & Fulfilled' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === key
                      ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Total Records: <strong className="text-purple-400 font-bold">{prescriptions.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-3 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-400 font-medium">Loading clinical prescriptions database...</p>
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-16">
                <Pill className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-300">No prescriptions found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {isPatient ? "You don't have any prescribed medications recorded." : "No prescription orders matching current filter."}
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-4">Rx ID & Patient</th>
                    <th className="px-5 py-4">Prescribed By</th>
                    <th className="px-5 py-4">Date Issued</th>
                    <th className="px-5 py-4">Diagnosis & Medications</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {prescriptions.map((rx, idx) => {
                    const isDispensed = rx.status === 'dispensed'
                    return (
                      <motion.tr
                        key={rx.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        className="hover:bg-slate-800/50 transition group"
                      >
                        <td className="px-5 py-4 font-bold text-white">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                              {rx.patient_name?.[0]?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <span className="text-sm font-extrabold text-white block">{rx.patient_name}</span>
                              <span className="text-[10px] text-purple-400 font-mono">
                                Rx #{rx.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                            <Stethoscope className="w-4 h-4 text-purple-400" />
                            <span>{rx.doctor_name || 'Attending Physician'}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-400 text-xs font-mono">
                          <div className="flex items-center space-x-1 text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{new Date(rx.prescribed_date).toLocaleDateString()}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          <p className="text-slate-200 font-bold truncate max-w-[220px]">
                            {rx.notes || 'Clinical Prescription'}
                          </p>
                          <p className="text-[11px] text-cyan-400 mt-0.5 font-medium">
                            {rx.items?.length || 0} item(s): {rx.items?.map(i => i.medicine_name).slice(0, 2).join(', ') || 'Medications'}
                            {rx.items?.length > 2 && '...'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center ${
                            isDispensed
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {isDispensed ? <><Check className="w-3 h-3 mr-1" />Dispensed</> : 'Pending Pharmacy'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setSelectedRx(rx)}
                              className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold transition text-xs inline-flex items-center cursor-pointer shadow-sm"
                              title="View Official Digital Prescription Slip"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              <span>View Slip</span>
                            </button>

                            {isPharmacist && !isDispensed && (
                              <button
                                onClick={() => handleDispense(rx.id)}
                                disabled={dispensingId === rx.id}
                                className="px-3.5 py-2 rounded-xl btn-emerald text-white font-extrabold transition text-xs inline-flex items-center cursor-pointer shadow-md"
                              >
                                <Package className="w-3.5 h-3.5 mr-1" />
                                <span>{dispensingId === rx.id ? 'Dispensing...' : 'Dispense'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Prescription Slip Preview / Print Modal */}
        <AnimatePresence>
          {selectedRx && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel bg-slate-900/95 w-full max-w-2xl rounded-3xl p-6 sm:p-8 border-2 border-purple-500/40 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6 text-slate-100"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/40">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base">Official Electronic Prescription (Rx)</h3>
                      <p className="text-[11px] text-purple-400 font-semibold">Central Hospital Dispensary</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.print()}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      title="Print Prescription Slip"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedRx(null)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Printable Rx Sheet */}
                <div className="p-6 rounded-3xl bg-slate-950 border-2 border-slate-800 space-y-6" id="printable-rx">
                  {/* Hospital Letterhead */}
                  <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                          A
                        </div>
                        <h2 className="text-base font-black text-white">Arogya Multispeciality Hospital</h2>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                        Department of Clinical Medicine & Telehealth Network
                      </p>
                      <p className="text-[11px] text-emerald-400 font-mono">
                        Emergency: +1 (800) 555-0199 &bull; Verified Digital E-Prescription
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono text-xs font-black block">
                        Rx #{selectedRx.id}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block font-mono">
                        Date: {new Date(selectedRx.prescribed_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Patient & Doctor Demographics */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block mb-1">
                        Patient Details
                      </span>
                      <p className="font-extrabold text-white text-sm">{selectedRx.patient_name}</p>
                      <p className="text-slate-400 font-mono">Patient ID: #{selectedRx.patient_id}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block mb-1">
                        Attending Physician
                      </span>
                      <p className="font-extrabold text-purple-400 text-sm">{selectedRx.doctor_name || 'Dr. Attending Physician'}</p>
                      <p className="text-slate-400">Clinical OPD / Telehealth</p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider block mb-1">
                      Clinical Diagnosis & Chief Notes:
                    </span>
                    <p className="text-xs text-slate-200 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 font-medium">
                      {selectedRx.notes || 'Routine consultation and symptomatic treatment.'}
                    </p>
                  </div>

                  {/* Rx Symbol & Medication Table */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-purple-400 font-serif text-3xl font-black">
                      <span>℞</span>
                      <span className="text-xs font-sans font-extrabold uppercase tracking-wider text-slate-300 pt-1">
                        Prescribed Medications
                      </span>
                    </div>

                    <table className="w-full text-left text-xs border border-slate-800 rounded-2xl overflow-hidden">
                      <thead className="bg-slate-900 text-[10px] font-extrabold text-slate-400 uppercase">
                        <tr>
                          <th className="p-3">Medicine Name</th>
                          <th className="p-3">Dosage</th>
                          <th className="p-3">Frequency</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {selectedRx.items && selectedRx.items.length > 0 ? (
                          selectedRx.items.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-900/40">
                              <td className="p-3 font-extrabold text-white">{item.medicine_name}</td>
                              <td className="p-3 text-slate-300 font-medium">{item.dosage}</td>
                              <td className="p-3 text-cyan-400 font-mono font-bold">{item.frequency}</td>
                              <td className="p-3 text-slate-300 font-medium">{item.duration}</td>
                              <td className="p-3 text-slate-400 italic">{item.instructions || 'After meals'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="p-4 text-center text-slate-500">
                              No medication items attached.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Signature & Status */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Digitally Authenticated & Encrypted</span>
                    </div>

                    <div className="text-right">
                      <div className="font-serif italic text-purple-400 font-black text-sm">
                        {selectedRx.doctor_name || 'Dr. Medical Officer'}
                      </div>
                      <span className="text-[10px] text-slate-500 block font-mono">Official Medical Digital Stamp</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2">
                  {isPharmacist && selectedRx.status !== 'dispensed' && (
                    <button
                      onClick={() => handleDispense(selectedRx.id)}
                      className="px-6 py-3 rounded-2xl btn-emerald text-white font-extrabold text-xs shadow-lg cursor-pointer"
                    >
                      Dispense Medications
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedRx(null)}
                    className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs ml-auto cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Doctor Issue Prescription Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel bg-slate-900/95 w-full max-w-2xl rounded-3xl p-6 sm:p-8 border-2 border-purple-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base">Issue New Medical Prescription</h3>
                      <p className="text-xs text-purple-400 font-semibold">Doctor Clinical Prescription Form</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreatePrescription} className="space-y-4 text-xs">
                  {/* Patient Selection */}
                  <div>
                    <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">Select Patient *</label>
                    <select
                      required
                      value={newPatientId}
                      onChange={(e) => setNewPatientId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl glass-input text-slate-100 focus:outline-none bg-slate-900 text-sm font-medium"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} ({p.patient_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                      Diagnosis & Clinical Impression *
                    </label>
                    <textarea
                      rows="2"
                      value={newDiagnosis}
                      onChange={(e) => setNewDiagnosis(e.target.value)}
                      placeholder="e.g. Acute Bronchitis, Normal Vital Signs"
                      className="w-full px-4 py-3 rounded-2xl glass-input text-slate-100 focus:outline-none text-xs"
                    />
                  </div>

                  {/* Medicine Items List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">
                        Prescribed Medications
                      </label>
                      <button
                        type="button"
                        onClick={addItem}
                        className="text-xs text-purple-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Medicine</span>
                      </button>
                    </div>

                    {items.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-2">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Medicine Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Paracetamol 500mg"
                              value={item.medicine_name}
                              onChange={(e) => updateItem(idx, 'medicine_name', e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white font-bold focus:outline-none"
                            />
                          </div>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-rose-400 hover:text-rose-300 p-2 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Dosage</label>
                            <input
                              type="text"
                              value={item.dosage}
                              onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                              className="w-full px-2.5 py-2 rounded-xl glass-input text-xs text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Frequency</label>
                            <input
                              type="text"
                              value={item.frequency}
                              onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                              placeholder="1-0-1"
                              className="w-full px-2.5 py-2 rounded-xl glass-input text-xs text-slate-200 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Duration</label>
                            <input
                              type="text"
                              value={item.duration}
                              onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                              placeholder="5 days"
                              className="w-full px-2.5 py-2 rounded-xl glass-input text-xs text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                              className="w-full px-2.5 py-2 rounded-xl glass-input text-xs text-slate-200"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Instructions / Meal Advice</label>
                          <input
                            type="text"
                            value={item.instructions}
                            onChange={(e) => updateItem(idx, 'instructions', e.target.value)}
                            placeholder="Take after breakfast & dinner"
                            className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-slate-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-6 py-3 rounded-2xl btn-purple text-white font-extrabold text-xs shadow-lg disabled:opacity-50 cursor-pointer"
                    >
                      {creating ? 'Saving & Signing...' : 'Sign & Issue Prescription'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
