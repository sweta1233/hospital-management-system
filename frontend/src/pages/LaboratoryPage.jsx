import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, Upload, FileText, CheckCircle2, Clock,
  Plus, Eye, Printer, Download, Check, AlertTriangle,
  X, Stethoscope, User, ShieldCheck, Activity, Award
} from 'lucide-react'
import api from '../services/api'
import { hasAnyRole } from '../utils/auth'

export default function LaboratoryPage() {
  const [labOrders, setLabOrders] = useState([])
  const [labTests, setLabTests] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Doctor Order Test Modal
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderPatientId, setOrderPatientId] = useState('')
  const [orderTestId, setOrderTestId] = useState('')
  const [orderPriority, setOrderPriority] = useState('normal')
  const [orderIndication, setOrderIndication] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)

  // Lab Tech Results Entry Modal
  const [resultOrder, setResultOrder] = useState(null)
  const [parameterName, setParameterName] = useState('')
  const [resultValue, setResultValue] = useState('')
  const [resultUnit, setResultUnit] = useState('')
  const [referenceRange, setReferenceRange] = useState('')
  const [isAbnormal, setIsAbnormal] = useState(false)
  const [techNotes, setTechNotes] = useState('')
  const [submittingResults, setSubmittingResults] = useState(false)

  const user = useSelector((state) => state.auth.user)
  const isPatient = hasAnyRole(user, ['patient'])
  const isDoctor = hasAnyRole(user, ['doctor', 'admin'])
  const isLabTech = hasAnyRole(user, ['lab_technician', 'admin'])

  const fetchLabOrders = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/laboratory/orders?status=${statusFilter}&per_page=50`)
      setLabOrders(res.data?.data?.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMeta = async () => {
    try {
      const testRes = await api.get('/laboratory/tests')
      const testList = testRes.data?.data || []
      setLabTests(testList)
      if (testList.length > 0) {
        setOrderTestId(testList[0].id)
      }
    } catch (e) {}

    if (isDoctor) {
      try {
        const patRes = await api.get('/patients?per_page=100')
        const patList = patRes.data?.data?.items || []
        setPatients(patList)
        if (patList.length > 0) {
          setOrderPatientId(patList[0].id)
        }
      } catch (e) {}
    }
  }

  useEffect(() => {
    fetchLabOrders()
  }, [statusFilter])

  useEffect(() => {
    fetchMeta()
  }, [])

  const handleOrderTest = async (e) => {
    e.preventDefault()
    if (!orderPatientId || !orderTestId) {
      alert('Please select both patient and laboratory test.')
      return
    }
    setSubmittingOrder(true)
    try {
      await api.post('/laboratory/orders', {
        patient_id: parseInt(orderPatientId, 10),
        test_id: parseInt(orderTestId, 10),
        priority: orderPriority,
        clinical_indication: orderIndication.trim() || 'Diagnostic Investigation',
      })
      setSuccessMsg('Laboratory test ordered successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
      setShowOrderModal(false)
      setOrderIndication('')
      fetchLabOrders()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to order lab test.')
    } finally {
      setSubmittingOrder(false)
    }
  }

  const openResultsModal = (order) => {
    setResultOrder(order)
    setParameterName(order.test_name || 'Analyte Value')
    setResultValue('')
    setResultUnit(order.unit || '')
    setReferenceRange(order.normal_range || '')
    setIsAbnormal(false)
    setTechNotes('Test verified and authenticated in hospital diagnostic laboratory.')
  }

  const handleSubmitResults = async (e) => {
    e.preventDefault()
    if (!resultOrder || !resultValue.trim()) {
      alert('Please enter the laboratory test result value.')
      return
    }
    setSubmittingResults(true)
    try {
      await api.post(`/laboratory/orders/${resultOrder.id}/results`, {
        results: [
          {
            parameter_name: parameterName.trim() || resultOrder.test_name,
            result_value: resultValue.trim(),
            unit: resultUnit.trim(),
            reference_range: referenceRange.trim(),
            is_abnormal: isAbnormal,
            technician_notes: techNotes.trim(),
          }
        ]
      })
      setSuccessMsg(`Results recorded and report completed for Order #${resultOrder.order_number || resultOrder.id}!`)
      setTimeout(() => setSuccessMsg(''), 4000)
      setResultOrder(null)
      fetchLabOrders()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit lab results.')
    } finally {
      setSubmittingResults(false)
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/laboratory/orders/${orderId}/status`, { status: newStatus })
      setSuccessMsg(`Order status updated to ${newStatus.replace('_', ' ')}!`)
      setTimeout(() => setSuccessMsg(''), 3000)
      fetchLabOrders()
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-[#0b132b] via-[#0f172a] to-[#0b132b] text-slate-100">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-600 flex items-center justify-center text-white mr-3 shadow-lg shadow-cyan-500/20">
              <FlaskConical className="h-5 w-5" />
            </div>
            <span>{isPatient ? 'My Laboratory Reports & Diagnostics' : 'Clinical Pathology & Laboratory'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isPatient
              ? 'View and print your official medical diagnostic and pathology test reports'
              : 'Doctor test ordering, specimen tracking, parameter analysis & report generation'}
          </p>
        </div>

        {isDoctor && (
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2.5 rounded-xl gradient-btn text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" /> Order Laboratory Test
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
            className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2.5 shadow-md"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Glass Table */}
      <div className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex space-x-2">
            {[
              { key: '', label: 'All Orders' },
              { key: 'ordered', label: 'Ordered / Pending Sample' },
              { key: 'sample_collected', label: 'Sample Collected' },
              { key: 'completed', label: 'Completed Reports' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  statusFilter === key
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-md'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Total Orders: <strong className="text-cyan-400">{labOrders.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-400">Loading laboratory records...</p>
            </div>
          ) : labOrders.length === 0 ? (
            <div className="text-center py-16">
              <FlaskConical className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No laboratory orders found</p>
              <p className="text-xs text-slate-500 mt-1">
                {isPatient ? "You do not have any pending or completed laboratory tests." : "No orders matching current filter."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Order ID & Test</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Ordered By</th>
                  <th className="px-5 py-3.5">Priority / Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {labOrders.map((order, idx) => {
                  const isCompleted = order.status === 'completed'
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.02 }}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="px-5 py-4 font-semibold text-white">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800/50 flex items-center justify-center text-cyan-400 font-bold text-xs">
                            <FlaskConical className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm">{order.test_name || 'Diagnostic Test'}</span>
                            <span className="block text-[10px] text-cyan-400 font-mono">
                              {order.order_number || `ORD-${order.id}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        <div className="font-semibold text-white">{order.patient_name}</div>
                        <span className="text-[10px] text-slate-400">ID: #{order.patient_id}</span>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        <div className="flex items-center space-x-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{order.doctor_name || 'Dr. Attending'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-400 text-[11px]">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          order.priority === 'urgent' || order.priority === 'stat'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {order.priority || 'Normal'}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-1">
                          {new Date(order.order_date).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : order.status === 'sample_collected'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* View Report Button */}
                          {isCompleted ? (
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold transition text-xs inline-flex items-center cursor-pointer shadow-sm"
                              title="View Diagnostic Report"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              <span>View Report</span>
                            </button>
                          ) : isLabTech ? (
                            <div className="flex items-center space-x-1.5">
                              {order.status === 'ordered' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'sample_collected')}
                                  className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold cursor-pointer"
                                >
                                  Collect Sample
                                </button>
                              )}
                              <button
                                onClick={() => openResultsModal(order)}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-white font-bold transition text-xs inline-flex items-center cursor-pointer shadow-md shadow-cyan-500/20"
                              >
                                <Upload className="w-3.5 h-3.5 mr-1" />
                                <span>Enter Results</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-400 italic">Processing in Lab...</span>
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

      {/* Official Diagnostic Report Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6 text-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">Diagnostic Pathology Report</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Print Report"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Diagnostic Sheet */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6" id="printable-report">
                {/* Letterhead */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                        L
                      </div>
                      <h2 className="text-base font-extrabold text-white">Central Diagnostic Laboratories</h2>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      NABL Accredited Clinical Pathology & Molecular Testing
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Report Ref: {selectedOrder.order_number || `ORD-${selectedOrder.id}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold block">
                      FINAL REPORT
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Date: {new Date(selectedOrder.completed_at || selectedOrder.order_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Patient & Doctor Demographics */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">
                      Patient Details
                    </span>
                    <p className="font-bold text-white text-sm">{selectedOrder.patient_name}</p>
                    <p className="text-slate-400">Patient ID: #{selectedOrder.patient_id}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">
                      Referring Physician
                    </span>
                    <p className="font-bold text-cyan-400 text-sm">{selectedOrder.doctor_name || 'Dr. Attending'}</p>
                    <p className="text-slate-400">Test: {selectedOrder.test_name}</p>
                  </div>
                </div>

                {/* Test Results Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Laboratory Findings & Analyte Values
                  </h4>

                  <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                    <thead className="bg-slate-900 text-[10px] font-bold text-slate-400 uppercase">
                      <tr>
                        <th className="p-3">Parameter / Analyte</th>
                        <th className="p-3">Observed Value</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3">Reference Range</th>
                        <th className="p-3">Evaluation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {selectedOrder.results && selectedOrder.results.length > 0 ? (
                        selectedOrder.results.map((res, i) => (
                          <tr key={i} className="hover:bg-slate-900/40">
                            <td className="p-3 font-bold text-white">{res.parameter_name}</td>
                            <td className="p-3 font-mono font-bold text-cyan-300 text-sm">{res.result_value}</td>
                            <td className="p-3 text-slate-300">{res.unit || '-'}</td>
                            <td className="p-3 text-slate-400 font-mono">{res.reference_range || '-'}</td>
                            <td className="p-3">
                              {res.is_abnormal ? (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold inline-flex items-center">
                                  <AlertTriangle className="w-3 h-3 mr-1" /> Abnormal
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold inline-flex items-center">
                                  <Check className="w-3 h-3 mr-1" /> Normal
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-4 text-center text-slate-500">
                            No parameter results attached.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Technician Notes */}
                {selectedOrder.results?.[0]?.technician_notes && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Pathologist / Technician Remarks:
                    </span>
                    <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      {selectedOrder.results[0].technician_notes}
                    </p>
                  </div>
                )}

                {/* Signature Authentication */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified by Senior Clinical Pathologist</span>
                  </div>

                  <div className="text-right">
                    <div className="font-serif italic text-cyan-400 font-bold text-sm">
                      {selectedOrder.technician_name || 'Senior Laboratory Officer'}
                    </div>
                    <span className="text-[10px] text-slate-500 block">Authorized Lab Signature</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Doctor Order Lab Test Modal */}
      <AnimatePresence>
        {showOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <FlaskConical className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">Order Laboratory Diagnostic Test</h3>
                </div>
                <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleOrderTest} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Patient *</label>
                  <select
                    required
                    value={orderPatientId}
                    onChange={(e) => setOrderPatientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.patient_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Laboratory Test *</label>
                  <select
                    required
                    value={orderTestId}
                    onChange={(e) => setOrderTestId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                  >
                    {labTests.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category}) — ${t.price || 0}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['normal', 'urgent', 'stat'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setOrderPriority(p)}
                        className={`py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer border ${
                          orderPriority === p
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Clinical Indication / Diagnostic Objective
                  </label>
                  <textarea
                    rows="2"
                    value={orderIndication}
                    onChange={(e) => setOrderIndication(e.target.value)}
                    placeholder="e.g. Rule out bacterial infection, persistent fever"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="px-6 py-2.5 rounded-xl gradient-btn text-white font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingOrder ? 'Submitting Order...' : 'Submit Lab Order'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lab Technician Enter Results Modal */}
      <AnimatePresence>
        {resultOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="font-bold text-white text-base">Record Test Results</h3>
                    <p className="text-xs text-slate-400">
                      Order: {resultOrder.test_name} for <strong className="text-white">{resultOrder.patient_name}</strong>
                    </p>
                  </div>
                </div>
                <button onClick={() => setResultOrder(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitResults} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Parameter / Analyte Name *</label>
                  <input
                    type="text"
                    required
                    value={parameterName}
                    onChange={(e) => setParameterName(e.target.value)}
                    placeholder="e.g. Hemoglobin / Serum Creatinine"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none font-semibold"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Observed Value *</label>
                    <input
                      type="text"
                      required
                      value={resultValue}
                      onChange={(e) => setResultValue(e.target.value)}
                      placeholder="e.g. 13.8"
                      className="w-full px-3 py-2.5 rounded-xl glass-input text-cyan-300 font-bold text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Unit</label>
                    <input
                      type="text"
                      value={resultUnit}
                      onChange={(e) => setResultUnit(e.target.value)}
                      placeholder="e.g. g/dL"
                      className="w-full px-3 py-2.5 rounded-xl glass-input text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Normal Range</label>
                    <input
                      type="text"
                      value={referenceRange}
                      onChange={(e) => setReferenceRange(e.target.value)}
                      placeholder="e.g. 12.0 - 16.0"
                      className="w-full px-3 py-2.5 rounded-xl glass-input text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Abnormality Flag */}
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <input
                    type="checkbox"
                    id="isAbnormal"
                    checked={isAbnormal}
                    onChange={(e) => setIsAbnormal(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isAbnormal" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    Flag as <span className="text-rose-400 font-bold">Abnormal / Critical Value</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Technician / Pathologist Notes</label>
                  <textarea
                    rows="2"
                    value={techNotes}
                    onChange={(e) => setTechNotes(e.target.value)}
                    placeholder="Observations, sample condition, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setResultOrder(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingResults}
                    className="px-6 py-2.5 rounded-xl gradient-btn text-white font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingResults ? 'Publishing Report...' : 'Publish & Finalize Report'}
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
