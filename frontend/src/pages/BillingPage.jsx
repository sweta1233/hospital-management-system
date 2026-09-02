import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, DollarSign, CheckCircle2, Clock, AlertCircle,
  Plus, Search, Filter, FileText, User, Calendar, Trash2,
  Receipt, ArrowUpRight, Banknote, QrCode, Star, Download,
  Printer, X, ChevronRight, Pill, Sparkles, Stethoscope, Bed, FlaskConical
} from 'lucide-react'
import api from '../services/api'
import { hasAnyRole } from '../utils/auth'

const ITEM_TYPES = [
  { id: 'consultation', label: 'Consultation Fee', icon: Stethoscope, defaultPrice: 50 },
  { id: 'lab_test', label: 'Laboratory Test', icon: FlaskConical, defaultPrice: 30 },
  { id: 'medicine', label: 'Pharmacy / Medicine', icon: Pill, defaultPrice: 15 },
  { id: 'room_charge', label: 'Room / Bed Charges', icon: Bed, defaultPrice: 100 },
  { id: 'procedure', label: 'Clinical Procedure', icon: FileText, defaultPrice: 75 },
  { id: 'other', label: 'Other Service', icon: Receipt, defaultPrice: 20 },
]

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, color: 'text-blue-400' },
  { id: 'upi', label: 'UPI / QR Code', icon: QrCode, color: 'text-emerald-400' },
  { id: 'cash', label: 'Cash at Counter', icon: Banknote, color: 'text-amber-400' },
  { id: 'insurance', label: 'Insurance / Third Party', icon: Star, color: 'text-purple-400' },
]

export default function BillingPage() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(null) // bill object
  const [viewingBill, setViewingBill] = useState(null)

  // Action states
  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionError, setActionError] = useState('')

  // Create Bill Form State
  const [formData, setFormData] = useState({
    patient_id: '',
    discount_amount: 0,
    tax_amount: 0,
    notes: '',
    items: [
      { item_type: 'consultation', description: 'Specialist Doctor Consultation', quantity: 1, unit_price: 50 },
    ],
  })

  // Payment Form State
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('card')
  const [payRef, setPayRef] = useState('')
  const [payNotes, setPayNotes] = useState('')

  const user = useSelector((state) => state.auth.user)
  const canManageBilling = hasAnyRole(user, ['admin', 'receptionist'])
  const isPatient = hasAnyRole(user, ['patient'])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const res = await api.get('/billing?per_page=50')
      setBills(res.data?.data?.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMeta = async () => {
    if (canManageBilling) {
      try {
        const [patRes, presRes] = await Promise.all([
          api.get('/patients?per_page=100').catch(() => ({ data: { data: { items: [] } } })),
          api.get('/prescriptions?per_page=100').catch(() => ({ data: { data: { items: [] } } })),
        ])
        const patList = patRes.data?.data?.items || []
        setPatients(patList)
        setPrescriptions(presRes.data?.data?.items || [])

        if (patList.length > 0 && !formData.patient_id) {
          setFormData((prev) => ({ ...prev, patient_id: patList[0].id }))
        }
      } catch (err) {
        console.error('Metadata fetch error:', err)
      }
    }
  }

  useEffect(() => {
    fetchBills()
    fetchMeta()
  }, [])

  // Calculate Subtotals
  const calculateSubtotal = () => {
    return formData.items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0)
  }

  const calculateGrandTotal = () => {
    const sub = calculateSubtotal()
    const tax = Number(formData.tax_amount) || 0
    const disc = Number(formData.discount_amount) || 0
    return Math.max(0, sub + tax - disc)
  }

  // Handle Item Row Changes
  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items]
    updated[index][field] = value
    setFormData({ ...formData, items: updated })
  }

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { item_type: 'other', description: '', quantity: 1, unit_price: 20 },
      ],
    })
  }

  const removeItemRow = (index) => {
    if (formData.items.length <= 1) return
    const updated = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: updated })
  }

  // Attach Prescription Medicines into Bill Items
  const attachPrescription = (pres) => {
    if (!pres || !pres.items || pres.items.length === 0) return

    const newItems = pres.items.map((it) => ({
      item_type: 'medicine',
      description: `Medication: ${it.medicine_name || 'Rx Item'} (${it.dosage || ''} - ${it.frequency || ''})`,
      quantity: it.quantity || 1,
      unit_price: 15,
    }))

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, ...newItems],
    }))

    setActionSuccess(`Attached ${newItems.length} items from Prescription #${pres.id}`)
    setTimeout(() => setActionSuccess(''), 3000)
  }

  // Submit Create Bill
  const handleCreateBill = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setActionError('')

    try {
      const payload = {
        patient_id: parseInt(formData.patient_id),
        discount_amount: parseFloat(formData.discount_amount) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        notes: formData.notes,
        items: formData.items.map((it) => ({
          item_type: it.item_type,
          description: it.description || it.item_type,
          quantity: parseInt(it.quantity) || 1,
          unit_price: parseFloat(it.unit_price) || 0,
        })),
      }

      await api.post('/billing', payload)
      setActionSuccess('New invoice created successfully!')
      setTimeout(() => setActionSuccess(''), 3000)
      setShowCreateModal(false)
      fetchBills()
      // Reset form
      setFormData({
        patient_id: patients[0]?.id || '',
        discount_amount: 0,
        tax_amount: 0,
        notes: '',
        items: [{ item_type: 'consultation', description: 'Specialist Consultation', quantity: 1, unit_price: 50 }],
      })
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create bill')
    } finally {
      setSubmitting(false)
    }
  }

  // Submit Record Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!showPaymentModal) return
    setPaying(true)
    setActionError('')

    try {
      await api.post(`/billing/${showPaymentModal.id}/payments`, {
        amount: parseFloat(payAmount),
        payment_method: payMethod,
        transaction_reference: payRef,
        notes: payNotes,
      })

      setActionSuccess(`Payment of $${payAmount} recorded successfully!`)
      setTimeout(() => setActionSuccess(''), 3000)
      setShowPaymentModal(null)
      fetchBills()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Payment processing failed')
    } finally {
      setPaying(false)
    }
  }

  // Open Payment Modal helper
  const openPaymentModal = (bill) => {
    setShowPaymentModal(bill)
    setPayAmount(bill.due_amount || bill.total_amount)
    setPayMethod('card')
    setPayRef('')
    setPayNotes('')
  }

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      !search ||
      b.bill_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.patient_name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Summary Metrics
  const totalBilled = bills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0)
  const totalCollected = bills.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0)
  const totalDues = bills.reduce((sum, b) => sum + (Number(b.due_amount) || 0), 0)

  // Filtered Patient Prescriptions for the selected patient in Modal
  const patientPrescriptions = prescriptions.filter(
    (p) => String(p.patient_id) === String(formData.patient_id)
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent text-slate-100">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
            <Receipt className="w-3.5 h-3.5" />
            <span>Revenue & Invoicing Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center">
            Billing & Patient Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Generate itemized invoices, record payments, and monitor outstanding hospital dues
          </p>
        </div>

        {canManageBilling && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Bill</span>
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
            <h3 className="text-2xl font-bold text-white mt-1">${totalBilled.toLocaleString()}</h3>
            <span className="text-[11px] text-slate-500">{bills.length} total bills</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Collected</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">${totalCollected.toLocaleString()}</h3>
            <span className="text-[11px] text-slate-500">Recorded revenue</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Outstanding Dues</p>
            <h3 className="text-2xl font-bold text-rose-400 mt-1">${totalDues.toLocaleString()}</h3>
            <span className="text-[11px] text-slate-500">Pending collections</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-center space-x-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices by invoice number (#INV) or patient name..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm text-slate-100 focus:outline-none"
          >
            <option value="">All Invoice Statuses</option>
            <option value="pending">Pending Payment</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Fully Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-400">Loading invoice registers...</p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No invoices found</p>
              <p className="text-xs text-slate-500 mt-1">Generate a bill or modify your search filter</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Invoice Details</th>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Grand Total</th>
                  <th className="px-5 py-3.5">Paid</th>
                  <th className="px-5 py-3.5">Due Balance</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredBills.map((bill, idx) => (
                  <motion.tr
                    key={bill.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="hover:bg-slate-800/40 transition"
                  >
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-amber-400">{bill.bill_number}</div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {bill.created_at ? new Date(bill.created_at).toLocaleDateString() : 'Recent'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-white">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800/50 flex items-center justify-center text-cyan-400 font-bold text-xs">
                          {bill.patient_name?.[0] || 'P'}
                        </div>
                        <div>
                          <span>{bill.patient_name || 'Walk-in Patient'}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">Patient #{bill.patient_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-100 text-sm">
                      ${bill.total_amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-5 py-4 text-emerald-400 font-semibold">
                      ${bill.paid_amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-5 py-4 font-bold text-rose-400">
                      ${bill.due_amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center ${
                          bill.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : bill.status === 'partially_paid'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {bill.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setViewingBill(bill)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] font-semibold flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        {canManageBilling && bill.due_amount > 0 && (
                          <button
                            onClick={() => openPaymentModal(bill)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold transition text-[11px] flex items-center space-x-1 cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Collect</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE BILL MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Generate Patient Invoice</h3>
                    <p className="text-xs text-slate-400">Add consultations, tests, room charges, and attach prescription items</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
                {/* Patient Selector */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Patient *</label>
                  <select
                    required
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                  >
                    <option value="">Select registered patient...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900">
                        {p.full_name} ({p.patient_id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prescription Quick-Attach helper */}
                {patientPrescriptions.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                        <Pill className="w-3.5 h-3.5 mr-1" />
                        Patient Active Prescriptions ({patientPrescriptions.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {patientPrescriptions.map((pres) => (
                        <button
                          key={pres.id}
                          type="button"
                          onClick={() => attachPrescription(pres)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition text-[11px] flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-cyan-400" />
                          <span>Attach Rx #{pres.id} ({pres.items?.length || 0} meds)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Line Items Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                      Billable Line Items *
                    </label>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-semibold flex items-center space-x-1 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-12 gap-2 items-center"
                      >
                        {/* Item Type */}
                        <div className="col-span-3">
                          <select
                            value={item.item_type}
                            onChange={(e) => {
                              const found = ITEM_TYPES.find((t) => t.id === e.target.value)
                              const updated = [...formData.items]
                              updated[idx].item_type = e.target.value
                              if (found) updated[idx].unit_price = found.defaultPrice
                              setFormData({ ...formData, items: updated })
                            }}
                            className="w-full px-2 py-1.5 rounded-lg glass-input text-slate-100 text-[11px] focus:outline-none"
                          >
                            {ITEM_TYPES.map((t) => (
                              <option key={t.id} value={t.id} className="bg-slate-900">
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Description */}
                        <div className="col-span-4">
                          <input
                            type="text"
                            required
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg glass-input text-slate-100 text-[11px] focus:outline-none"
                          />
                        </div>

                        {/* Qty */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg glass-input text-slate-100 text-[11px] focus:outline-none"
                          />
                        </div>

                        {/* Price */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="Price ($)"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg glass-input text-slate-100 text-[11px] focus:outline-none"
                          />
                        </div>

                        {/* Delete */}
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            disabled={formData.items.length <= 1}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Adjustments & Totals */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                        Tax Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.tax_amount}
                        onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                        Discount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.discount_amount}
                        onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Tax / Levies</span>
                      <span>+${(Number(formData.tax_amount) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Discount</span>
                      <span>-${(Number(formData.discount_amount) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-slate-800">
                      <span>Grand Total Amount</span>
                      <span className="text-amber-400">${calculateGrandTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Invoice Notes / Instructions</label>
                  <textarea
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="E.g. Payable within 14 days, insurance claim pending..."
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Generating...' : `Create Bill ($${calculateGrandTotal().toFixed(2)})`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECORD PAYMENT MODAL */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Record Invoice Payment</h3>
                    <p className="text-xs text-slate-400">Invoice #{showPaymentModal.bill_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Patient</span>
                    <span className="font-semibold text-white">{showPaymentModal.patient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Billed</span>
                    <span className="font-semibold text-slate-200">${showPaymentModal.total_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Outstanding Due</span>
                    <span className="font-bold text-rose-400">${showPaymentModal.due_amount}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount to Pay ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={showPaymentModal.due_amount}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 text-sm font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-2">Payment Method *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map(({ id, label, icon: Icon, color }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPayMethod(id)}
                        className={`p-2.5 rounded-xl text-left border transition flex items-center space-x-2 ${
                          payMethod === id
                            ? 'bg-slate-800 border-emerald-500/60'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-white font-semibold text-[11px]">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Transaction Ref / Cheque #</label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="E.g. TXN98765432 or POS Receipt"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paying || Number(payAmount) <= 0}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {paying ? 'Recording...' : `Confirm $${payAmount} Payment`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW BILL DETAILS MODAL */}
      <AnimatePresence>
        {viewingBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-xl rounded-3xl p-6 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Hospital Invoice</span>
                  <h3 className="text-xl font-bold text-white font-mono">{viewingBill.bill_number}</h3>
                </div>
                <button
                  onClick={() => setViewingBill(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] font-bold block">Billed To</span>
                    <p className="font-bold text-white mt-0.5">{viewingBill.patient_name || 'Patient'}</p>
                    <p className="text-slate-400 text-[11px]">Patient #{viewingBill.patient_id}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 uppercase text-[10px] font-bold block">Status & Date</span>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        viewingBill.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {viewingBill.status?.replace('_', ' ')}
                    </span>
                    <p className="text-slate-400 text-[10px] mt-1">
                      {viewingBill.created_at ? new Date(viewingBill.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>

                {/* Items Breakdown */}
                {viewingBill.items && viewingBill.items.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                      Line Items
                    </h4>
                    <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden">
                      {viewingBill.items.map((it, i) => (
                        <div key={i} className="p-3 bg-slate-900/40 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-white block">{it.description}</span>
                            <span className="text-[10px] text-slate-400">
                              Type: {it.item_type} · Qty: {it.quantity} @ ${it.unit_price}
                            </span>
                          </div>
                          <span className="font-bold text-slate-200">${it.total_price || it.quantity * it.unit_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Tax</span>
                    <span>${viewingBill.tax_amount || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Discount</span>
                    <span>-${viewingBill.discount_amount || 0}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                    <span>Total Amount</span>
                    <span className="text-amber-400">${viewingBill.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Paid Amount</span>
                    <span>${viewingBill.paid_amount}</span>
                  </div>
                  <div className="flex justify-between text-rose-400 font-bold">
                    <span>Balance Due</span>
                    <span>${viewingBill.due_amount}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center space-x-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    onClick={() => setViewingBill(null)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
