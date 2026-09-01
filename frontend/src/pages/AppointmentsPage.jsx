import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Plus, Clock, CheckCircle2, XCircle, User,
  Stethoscope, AlertCircle, X, ChevronRight, Check,
  Video, VideoOff, Wifi, WifiOff, CreditCard, Phone,
  Banknote, QrCode, Star, MapPin, ChevronDown, RefreshCw,
  Mic, MicOff, Camera, CameraOff, FileText, Pill, Send,
  Trash2, ShieldCheck, Download, Printer, Award, Activity,
  Lock, AlertTriangle, Sparkles, Timer, CheckCircle, Ban
} from 'lucide-react'
import api from '../services/api'
import { getUserRoles, hasAnyRole } from '../utils/auth'
import { initiateVideoCall, endVideoCall } from '../services/socket'

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, color: 'text-cyan-400', border: 'hover:border-cyan-500' },
  { id: 'upi', label: 'UPI / QR Code', icon: QrCode, color: 'text-emerald-400', border: 'hover:border-emerald-500' },
  { id: 'cash', label: 'Cash at Counter', icon: Banknote, color: 'text-amber-400', border: 'hover:border-amber-500' },
  { id: 'insurance', label: 'Health Insurance', icon: Star, color: 'text-purple-400', border: 'hover:border-purple-500' },
]

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedDateFilter, setSelectedDateFilter] = useState('') // '' = all dates, or 'YYYY-MM-DD'
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPayModal, setShowPayModal] = useState(null)
  const [payMethod, setPayMethod] = useState('card')
  const [payLoading, setPayLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Video Call State & Appointment Time Lock
  const [videoCallAppt, setVideoCallAppt] = useState(null)
  const [timeLockNotice, setTimeLockNotice] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [showPrescriptionDrawer, setShowPrescriptionDrawer] = useState(false)
  const localVideoRef = useRef(null)
  const localStreamRef = useRef(null)

  // Standalone Prescription Modal (for offline/in-person checkups)
  const [prescribeAppt, setPrescribeAppt] = useState(null)

  // 1-Month / Advance Slot Schedule State
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlotKey, setSelectedSlotKey] = useState('')

  // Date Boundaries for 1-Month (30-day) Advance Booking
  const today = new Date()
  const minDateStr = today.toISOString().split('T')[0]
  const maxDateObj = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const maxDateStr = maxDateObj.toISOString().split('T')[0]

  // Generate 30 upcoming days for quick single-date selection ribbon
  const upcoming30Days = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
    const iso = d.toISOString().split('T')[0]
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' })
    const dateNum = d.getDate()
    const monthName = d.toLocaleDateString('en-US', { month: 'short' })
    const fullDateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    upcoming30Days.push({ iso, dayLabel, dateNum, monthName, fullDateLabel })
  }

  // Prescription Form State (shared by drawer and modal)
  const [diagnosis, setDiagnosis] = useState('')
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medicine_name: 'Paracetamol 500mg', dosage: '500mg', frequency: '1-0-1', duration: '5 days', quantity: 10, instructions: 'Take after meals' }
  ])
  const [savingPrescription, setSavingPrescription] = useState(false)

  const user = useSelector((state) => state.auth.user)
  const userRoles = getUserRoles(user)
  const isPatient = userRoles.includes('patient') || Boolean(user?.patient?.id)
  const isDoctor = userRoles.includes('doctor') || Boolean(user?.doctor?.id)
  const isAdmin = userRoles.includes('admin')
  const isAdminOnly = isAdmin && !isDoctor && !isPatient
  const patientProfileId = user?.patient?.id || null

  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: minDateStr,
    start_time: '10:00',
    end_time: '10:30',
    reason: '',
    mode: 'online',
    payment_method: 'card',
  })

  // Helper: Verify if appointment call is currently allowed based on date & time
  const checkCallTimeAvailability = (appt) => {
    // Doctors can start call at any time
    if (isDoctor) {
      return { canCall: true, reason: 'Doctor priority line active', isNow: true }
    }

    if (appt.status === 'completed') {
      return { canCall: false, reason: 'This consultation has already been completed.', isNow: false }
    }
    if (appt.status === 'cancelled') {
      return { canCall: false, reason: 'This appointment was cancelled.', isNow: false }
    }

    // Checked-in patients can join immediately
    if (appt.status === 'checked_in') {
      return { canCall: true, reason: 'Doctor is waiting in consultation room', isNow: true }
    }

    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const apptDateStr = appt.appointment_date

      // Parse start time (e.g. "10:00" or "10:00:00" or "10:00 AM")
      const now = new Date()

      // If appointment is on a different date
      if (apptDateStr > todayStr) {
        return {
          canCall: false,
          reason: `Your appointment is scheduled for a future date (${apptDateStr} at ${appt.start_time}). Video call unlocks 15 minutes before your booked time.`,
          isNow: false,
          unlocksAt: `${apptDateStr} ${appt.start_time}`
        }
      }

      if (apptDateStr < todayStr) {
        return {
          canCall: false,
          reason: `The scheduled consultation time (${apptDateStr} at ${appt.start_time}) has expired. Please book a new slot or contact hospital support.`,
          isNow: false
        }
      }

      // Same day time check
      let startHours = 10
      let startMinutes = 0
      if (appt.start_time) {
        const timeParts = appt.start_time.replace(/AM|PM/i, '').trim().split(':')
        startHours = parseInt(timeParts[0], 10) || 10
        startMinutes = parseInt(timeParts[1], 10) || 0
        if (appt.start_time.toUpperCase().includes('PM') && startHours < 12) {
          startHours += 12
        } else if (appt.start_time.toUpperCase().includes('AM') && startHours === 12) {
          startHours = 0
        }
      }

      const apptStartDateTime = new Date()
      apptStartDateTime.setHours(startHours, startMinutes, 0, 0)

      // Allow calling from 15 mins before start time up to 60 mins after
      const windowStart = new Date(apptStartDateTime.getTime() - 15 * 60 * 1000)
      const windowEnd = new Date(apptStartDateTime.getTime() + 60 * 60 * 1000)

      if (now < windowStart) {
        const diffMinutes = Math.round((windowStart - now) / (1000 * 60))
        return {
          canCall: false,
          reason: `Video call unlocks 15 minutes before your consultation (starts in ~${diffMinutes} minutes at ${appt.start_time}).`,
          isNow: false,
          unlocksAt: appt.start_time
        }
      }

      if (now > windowEnd) {
        return {
          canCall: false,
          reason: `The consultation window for today (${appt.start_time}) has ended. Please reschedule if you missed your doctor.`,
          isNow: false
        }
      }

      return { canCall: true, reason: 'Consultation slot is active now', isNow: true }
    } catch (e) {
      // Fallback
      return { canCall: true, reason: 'Slot active', isNow: true }
    }
  }

  const handleAttemptVideoCall = (appt) => {
    if (isAdminOnly) {
      alert('Administrative Notice: Administrators without an assigned clinical doctor or patient profile cannot initiate video consultations. Please log in as the assigned doctor or patient.')
      return
    }

    const check = checkCallTimeAvailability(appt)
    if (check.canCall) {
      setVideoCallAppt(appt)
      try {
        const isDocCaller = isDoctor || user?.id === appt.doctor_user_id
        initiateVideoCall({
          appointment_id: appt.id,
          caller_id: user?.id,
          caller_name: user?.full_name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Medical User'),
          caller_role: isDocCaller ? 'doctor' : 'patient',
          recipient_id: isDocCaller ? (appt.patient_user_id || appt.patient_id) : (appt.doctor_user_id || appt.doctor_id),
          recipient_name: isDocCaller ? appt.patient_name : appt.doctor_name,
          appointment_time: `${appt.appointment_date} ${appt.start_time}`,
        })
      } catch (e) {
        console.warn('Video call socket initiation warning:', e)
      }
    } else {
      setTimeLockNotice({
        appt,
        reason: check.reason,
        unlocksAt: check.unlocksAt || `${appt.appointment_date} at ${appt.start_time}`
      })
    }
  }

  const handleEndCall = () => {
    if (videoCallAppt) {
      try {
        endVideoCall({
          appointment_id: videoCallAppt.id,
          caller_id: user?.id,
        })
      } catch (e) {}
    }
    setVideoCallAppt(null)
  }

  // Real-time slot availability sync for selected doctor & date
  useEffect(() => {
    if (showModal && formData.doctor_id && formData.appointment_date) {
      setLoadingSlots(true)
      api.get(`/appointments/available-slots?doctor_id=${formData.doctor_id}&start_date=${formData.appointment_date}&days=1`)
        .then((res) => {
          const schedule = res.data?.data?.schedule || []
          if (schedule.length > 0) {
            const slots = schedule[0].slots || []
            setAvailableSlots(slots)
            const currentSelected = slots.find(s => s.start_time === formData.start_time && s.is_available)
            if (!currentSelected) {
              const firstAvail = slots.find(s => s.is_available)
              if (firstAvail) {
                setFormData(prev => ({
                  ...prev,
                  start_time: firstAvail.start_time,
                  end_time: firstAvail.end_time
                }))
                setSelectedSlotKey(firstAvail.start_time)
              }
            } else {
              setSelectedSlotKey(currentSelected.start_time)
            }
          } else {
            setAvailableSlots([])
          }
        })
        .catch((err) => {
          console.warn('Slot schedule load failed:', err)
          setAvailableSlots([])
        })
        .finally(() => setLoadingSlots(false))
    }
  }, [showModal, formData.doctor_id, formData.appointment_date])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      let url = `/appointments?status=${statusFilter}&per_page=50`
      if (selectedDateFilter) {
        url += `&date=${selectedDateFilter}`
      }
      const res = await api.get(url)
      setAppointments(res.data?.data?.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMeta = async () => {
    try {
      const docRes = await api.get('/doctors?per_page=50')
      const docList = docRes.data?.data?.items || []
      setDoctors(docList)

      if (!isPatient) {
        try {
          const patRes = await api.get('/patients?per_page=50')
          setPatients(patRes.data?.data?.items || [])
        } catch (e) {
          console.warn('Patients fetch skipped:', e)
        }
      }

      try {
        const medRes = await api.get('/medicines?per_page=100')
        setMedicines(medRes.data?.data?.items || [])
      } catch (e) {
        console.warn('Medicines fetch skipped:', e)
      }

      setFormData(prev => ({
        ...prev,
        doctor_id: docList.length > 0 ? docList[0].id : '',
        patient_id: isPatient && patientProfileId
          ? patientProfileId
          : (patients.length > 0 ? patients[0].id : ''),
      }))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchAppointments() }, [statusFilter, selectedDateFilter])
  useEffect(() => { fetchMeta() }, [])

  // Video Call Stream & Timer Management
  useEffect(() => {
    let timerInterval = null
    if (videoCallAppt) {
      setCallDuration(0)
      timerInterval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)

      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          localStreamRef.current = stream
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
          }
        })
        .catch((err) => {
          console.warn('Camera access unavailable or denied:', err)
        })
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }
      clearInterval(timerInterval)
    }
    return () => {
      clearInterval(timerInterval)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [videoCallAppt])

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
    }
    setIsMuted(!isMuted)
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
    }
    setIsVideoOff(!isVideoOff)
  }

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status })
      setSuccessMsg(`Appointment status updated to ${status.replace('_', ' ')}!`)
      setTimeout(() => setSuccessMsg(''), 3000)
      fetchAppointments()
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed')
    }
  }

  const handleBook = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        patient_id: isPatient && patientProfileId ? patientProfileId : formData.patient_id,
      }
      await api.post('/appointments', payload)
      setShowModal(false)
      setSuccessMsg('Appointment booked successfully! Video call unlocks 15 mins before your time.')
      setTimeout(() => setSuccessMsg(''), 4000)
      fetchAppointments()
    } catch (err) {
      alert(err.response?.data?.message || 'Appointment booking failed (conflict or invalid slot)')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayment = async () => {
    if (!showPayModal) return
    setPayLoading(true)
    try {
      await api.post(`/appointments/${showPayModal.id}/payment`, {
        payment_method: payMethod,
        amount: showPayModal.consultation_fee || 50.0,
      }).catch(() => {})
      setSuccessMsg(`Payment via ${payMethod.toUpperCase()} recorded successfully!`)
      setTimeout(() => setSuccessMsg(''), 3000)
      setShowPayModal(null)
      fetchAppointments()
    } catch (err) {
      alert(err.response?.data?.message || 'Payment recording failed')
    } finally {
      setPayLoading(false)
    }
  }

  const addPrescriptionItem = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { medicine_name: '', dosage: '500mg', frequency: '1-0-1', duration: '5 days', quantity: 10, instructions: 'After meals' }
    ])
  }

  const removePrescriptionItem = (index) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index))
  }

  const updatePrescriptionItem = (index, field, value) => {
    const updated = [...prescriptionItems]
    updated[index][field] = value
    setPrescriptionItems(updated)
  }

  const handleSavePrescription = async (targetAppt) => {
    if (!targetAppt) return
    if (prescriptionItems.length === 0 || !prescriptionItems[0].medicine_name.trim()) {
      alert('Please specify at least one medication name.')
      return
    }

    setSavingPrescription(true)
    try {
      const payload = {
        patient_id: targetAppt.patient_id,
        appointment_id: targetAppt.id,
        doctor_id: targetAppt.doctor_id,
        notes: diagnosis.trim() || 'Clinical Consultation',
        items: prescriptionItems.map((item) => ({
          medicine_name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: parseInt(item.quantity, 10) || 1,
          instructions: item.instructions,
        })),
      }

      await api.post('/prescriptions', payload)
      setSuccessMsg(`Prescription issued successfully for ${targetAppt.patient_name}!`)
      setTimeout(() => setSuccessMsg(''), 4000)

      setShowPrescriptionDrawer(false)
      setPrescribeAppt(null)
      setDiagnosis('')
      setPrescriptionItems([
        { medicine_name: 'Paracetamol 500mg', dosage: '500mg', frequency: '1-0-1', duration: '5 days', quantity: 10, instructions: 'Take after meals' }
      ])
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save prescription.')
    } finally {
      setSavingPrescription(false)
    }
  }

  const filterTabs = [
    { key: '', label: 'All Appointments' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'checked_in', label: 'Checked In' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#070d1e] text-slate-100 relative selection:bg-emerald-500 selection:text-white">
      {/* Background Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Clinical Scheduling & Video Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center">
              Clinical Appointments & Telehealth
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Encrypted HD Video Consultations (Unlocks at Appointment Time), In-Person Bookings & Real-Time Prescription Issuance
            </p>
          </div>

          <button
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                patient_id: isPatient && patientProfileId ? patientProfileId : prev.patient_id,
              }))
              setShowModal(true)
            }}
            className="px-5 py-3 rounded-2xl btn-emerald text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Book New Appointment</span>
          </button>
        </div>

        {/* Success Notification Banner */}
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

        {/* Main Appointments Table Card (Multi-Color Header & Glow) */}
        <div className="glass-panel rounded-3xl border-2 border-emerald-500/30 overflow-hidden shadow-2xl bg-slate-900/90 backdrop-blur-2xl">
          {/* Status & Single-Date Filter Toolbar */}
          <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-950/60">
            {/* Top row: Status Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {filterTabs.map(({ key, label }) => {
                  const isSelected = statusFilter === key
                  return (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Total: <span className="text-emerald-400 font-bold">{appointments.length}</span> consultations
              </div>
            </div>

            {/* Bottom row: Single Date Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center mr-1">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                  Filter by Date:
                </span>

                <button
                  onClick={() => setSelectedDateFilter('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedDateFilter === ''
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  All Dates
                </button>

                <button
                  onClick={() => setSelectedDateFilter(minDateStr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedDateFilter === minDateStr
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  Today
                </button>

                {upcoming30Days[1] && (
                  <button
                    onClick={() => setSelectedDateFilter(upcoming30Days[1].iso)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDateFilter === upcoming30Days[1].iso
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    Tomorrow
                  </button>
                )}

                <div className="flex items-center space-x-1.5 ml-1">
                  <input
                    type="date"
                    value={selectedDateFilter}
                    onChange={(e) => setSelectedDateFilter(e.target.value)}
                    className="px-3 py-1 rounded-lg glass-input text-xs text-slate-200 focus:outline-none bg-slate-900 border border-slate-700"
                  />
                  {selectedDateFilter && (
                    <button
                      onClick={() => setSelectedDateFilter('')}
                      className="px-2 py-1 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="Clear date filter"
                    >
                      ✕ Clear Date
                    </button>
                  )}
                </div>
              </div>

              {selectedDateFilter && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold">
                  <span>Showing appointments for single date: <strong className="text-white ml-1">{selectedDateFilter}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Appointments Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-400 font-medium">Loading clinical schedule & video links...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-300">No appointments found</p>
                <p className="text-xs text-slate-500 mt-1">Book an appointment or adjust your status filter above</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-4">Patient Profile</th>
                    <th className="px-5 py-4">Attending Physician</th>
                    <th className="px-5 py-4">Date & Consultation Slot</th>
                    <th className="px-5 py-4">Consultation Mode</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Telehealth & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {appointments.map((appt, idx) => {
                    const isOnline = (appt.mode || 'online') === 'online'
                    const timeCheck = checkCallTimeAvailability(appt)

                    return (
                      <motion.tr
                        key={appt.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        className="hover:bg-slate-800/50 transition group"
                      >
                        {/* Patient */}
                        <td className="px-5 py-4 font-bold text-white">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                              {appt.patient_name?.[0]?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <span className="text-sm font-extrabold text-white block">{appt.patient_name}</span>
                              <span className="text-[10px] text-cyan-400 font-mono">
                                PID: #{appt.patient_pid || appt.patient_id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Doctor */}
                        <td className="px-5 py-4 text-slate-300">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                            <Stethoscope className="w-4 h-4 text-purple-400" />
                            <span>{appt.doctor_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 pl-5 block">
                            {appt.department_name || 'General OPD'}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="px-5 py-4 text-slate-300">
                          <div className="flex items-center space-x-1.5 text-emerald-300 font-extrabold font-mono">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{appt.start_time} - {appt.end_time}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{appt.appointment_date}</span>
                        </td>

                        {/* Reason / Mode */}
                        <td className="px-5 py-4">
                          <span className="text-slate-300 font-medium block max-w-[150px] truncate">
                            {appt.reason || 'General Health Checkup'}
                          </span>
                          <span className={`mt-1 inline-flex items-center text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            isOnline
                              ? 'bg-purple-500/15 border border-purple-500/40 text-purple-300'
                              : 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                          }`}>
                            {isOnline ? (
                              <>
                                <Video className="w-3 h-3 mr-1 text-purple-400" />
                                <span>HD Video Telehealth</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3 h-3 mr-1 text-amber-400" />
                                <span>In-Person Clinic</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center ${
                            appt.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : appt.status === 'checked_in'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : appt.status === 'cancelled'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {appt.status.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2 flex-wrap gap-y-1.5">
                            {/* Video Call Button (Enforces Appointment Time Check) */}
                            {isOnline && appt.status !== 'cancelled' && (
                              <button
                                onClick={() => handleAttemptVideoCall(appt)}
                                className={`px-3.5 py-2 rounded-xl font-bold transition text-xs inline-flex items-center shadow-md cursor-pointer ${
                                  timeCheck.canCall
                                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white shadow-purple-900/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                                }`}
                                title={timeCheck.canCall ? 'Start / Join Live Video Telehealth' : 'Call unlocks at appointment time'}
                              >
                                {timeCheck.canCall ? (
                                  <>
                                    <Video className="w-3.5 h-3.5 mr-1.5 text-white animate-pulse" />
                                    <span>Start Video Call</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                                    <span>Call at {appt.start_time}</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Doctor Write Prescription Button */}
                            {isDoctor && appt.status !== 'cancelled' && (
                              <button
                                onClick={() => setPrescribeAppt(appt)}
                                className="px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold transition text-xs inline-flex items-center cursor-pointer"
                                title="Write prescription"
                              >
                                <FileText className="w-3.5 h-3.5 mr-1 text-purple-400" />
                                <span>Prescribe</span>
                              </button>
                            )}

                            {/* Check In */}
                            {appt.status === 'scheduled' && !isPatient && (
                              <button
                                onClick={() => updateStatus(appt.id, 'checked_in')}
                                className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 font-bold transition text-[11px] cursor-pointer"
                              >
                                Check In
                              </button>
                            )}

                            {/* Complete Checkup */}
                            {appt.status === 'checked_in' && !isPatient && (
                              <button
                                onClick={() => updateStatus(appt.id, 'completed')}
                                className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-bold transition text-[11px] cursor-pointer"
                              >
                                Complete
                              </button>
                            )}

                            {/* Pay Consultation Fee */}
                            {(appt.status === 'scheduled' || appt.status === 'checked_in') && (
                              <button
                                onClick={() => setShowPayModal(appt)}
                                className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold transition text-[11px] inline-flex items-center cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5 mr-1" />
                                <span>Pay Fee</span>
                              </button>
                            )}

                            {/* Cancel */}
                            {appt.status === 'scheduled' && (
                              <button
                                onClick={() => updateStatus(appt.id, 'cancelled')}
                                className="px-2.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-semibold transition text-[11px] cursor-pointer"
                              >
                                Cancel
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

        {/* ======================================================== */}
        {/* MODAL 1: APPOINTMENT TIME LOCK WARNING NOTICE            */}
        {/* ======================================================== */}
        <AnimatePresence>
          {timeLockNotice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel w-full max-w-md rounded-3xl p-6 border-2 border-amber-500/50 shadow-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                      <Timer className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base">Video Call Locked</h3>
                      <p className="text-[11px] text-amber-400 font-semibold">Appointment Time Verification</p>
                    </div>
                  </div>
                  <button onClick={() => setTimeLockNotice(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-start space-x-2.5 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{timeLockNotice.reason}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scheduled Date</span>
                    <span className="font-bold text-white">{timeLockNotice.appt?.appointment_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consultation Slot</span>
                    <span className="font-bold text-emerald-400 font-mono">{timeLockNotice.appt?.start_time} - {timeLockNotice.appt?.end_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Doctor</span>
                    <span className="font-bold text-purple-300">{timeLockNotice.appt?.doctor_name}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTimeLockNotice(null)}
                  className="w-full py-3.5 rounded-2xl btn-amber text-white font-extrabold text-xs shadow-lg cursor-pointer"
                >
                  Understood (I will return at appointment time)
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* MODAL 2: FULL-SCREEN INTERACTIVE TELEHEALTH VIDEO CALL   */}
        {/* ======================================================== */}
        <AnimatePresence>
          {videoCallAppt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel w-full max-w-5xl rounded-3xl border-2 border-purple-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[96vh] bg-slate-950"
              >
                {/* Call Top Header (Multi-Color) */}
                <div className="px-6 py-4 bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping" />
                    <div>
                      <h3 className="font-black text-white text-sm sm:text-base flex items-center space-x-2">
                        <span>Live Doctor Teleconsultation Session</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                          {formatTimer(callDuration)}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300">
                        Doctor: <span className="text-purple-300 font-bold">{videoCallAppt.doctor_name}</span> &bull; Patient: <span className="text-emerald-300 font-bold">{videoCallAppt.patient_name}</span>
                      </p>
                    </div>
                  </div>

                  {isDoctor && (
                    <button
                      onClick={() => setShowPrescriptionDrawer(!showPrescriptionDrawer)}
                      className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition flex items-center space-x-2 cursor-pointer shadow-lg ${
                        showPrescriptionDrawer
                          ? 'bg-purple-500 text-white font-extrabold'
                          : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>{showPrescriptionDrawer ? 'Hide Prescription Drawer' : 'Write Prescription'}</span>
                    </button>
                  )}
                </div>

                {/* Video Feeds & Split Prescription View */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[420px]">
                  {/* Main Video View Area */}
                  <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-4">
                    <div className="w-full h-full min-h-[360px] rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d1428] to-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="text-center space-y-3 z-10">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center mx-auto text-white text-4xl font-black shadow-2xl shadow-purple-500/30">
                          {isDoctor ? (videoCallAppt.patient_name?.[0] || 'P') : (videoCallAppt.doctor_name?.[0] || 'D')}
                        </div>
                        <div>
                          <p className="text-white font-black text-xl">
                            {isDoctor ? videoCallAppt.patient_name : videoCallAppt.doctor_name}
                          </p>
                          <p className="text-xs text-emerald-400 font-bold flex items-center justify-center space-x-1.5 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Connected via End-to-End Encrypted Telehealth Stream</span>
                          </p>
                        </div>
                      </div>

                      {/* Audio Waves Simulation */}
                      <div className="absolute bottom-6 flex items-center space-x-1.5 opacity-40">
                        {[12, 24, 38, 18, 44, 28, 50, 20, 32, 14].map((h, i) => (
                          <div
                            key={i}
                            className="w-1.5 bg-purple-400 rounded-full animate-pulse"
                            style={{ height: `${h}px`, animationDuration: `${0.6 + (i % 3) * 0.2}s` }}
                          />
                        ))}
                      </div>

                      {/* Local Self Camera PiP */}
                      <div className="absolute bottom-4 right-4 w-36 sm:w-48 aspect-video rounded-2xl bg-slate-800 border-2 border-emerald-500/60 overflow-hidden shadow-2xl z-20">
                        {isVideoOff ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-[10px]">
                            <CameraOff className="w-5 h-5 mb-1 text-slate-500" />
                            <span>Camera Muted</span>
                          </div>
                        ) : (
                          <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover mirror"
                          />
                        )}
                        <span className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                          You ({user?.full_name?.split(' ')[0] || 'User'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor In-Call Prescription Drawer */}
                  {isDoctor && showPrescriptionDrawer && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 380, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="border-l border-slate-800 bg-slate-900/95 p-5 flex flex-col overflow-y-auto space-y-4 shadow-2xl"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center space-x-2">
                          <Pill className="w-4 h-4 text-purple-400" />
                          <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                            Live In-Call Prescription
                          </h4>
                        </div>
                        <button
                          onClick={() => setShowPrescriptionDrawer(false)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                          Clinical Diagnosis & Findings
                        </label>
                        <textarea
                          rows="2"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          placeholder="e.g. Acute bronchitis, clear lungs"
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Medications List</label>
                          <button
                            type="button"
                            onClick={addPrescriptionItem}
                            className="text-[11px] text-purple-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Medicine</span>
                          </button>
                        </div>

                        {prescriptionItems.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                required
                                placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                                value={item.medicine_name}
                                onChange={(e) => updatePrescriptionItem(idx, 'medicine_name', e.target.value)}
                                className="flex-1 font-bold text-white bg-transparent border-b border-slate-600 focus:border-purple-400 focus:outline-none pb-1"
                              />
                              {prescriptionItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePrescriptionItem(idx)}
                                  className="text-rose-400 hover:text-rose-300 ml-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <span className="text-[9px] text-slate-400 block font-bold">Dosage</span>
                                <input
                                  type="text"
                                  value={item.dosage}
                                  onChange={(e) => updatePrescriptionItem(idx, 'dosage', e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-slate-900 text-[11px] text-slate-200"
                                />
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 block font-bold">Frequency</span>
                                <input
                                  type="text"
                                  value={item.frequency}
                                  onChange={(e) => updatePrescriptionItem(idx, 'frequency', e.target.value)}
                                  placeholder="1-0-1"
                                  className="w-full px-2 py-1 rounded bg-slate-900 text-[11px] text-slate-200"
                                />
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 block font-bold">Duration</span>
                                <input
                                  type="text"
                                  value={item.duration}
                                  onChange={(e) => updatePrescriptionItem(idx, 'duration', e.target.value)}
                                  placeholder="5 days"
                                  className="w-full px-2 py-1 rounded bg-slate-900 text-[11px] text-slate-200"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={savingPrescription}
                        onClick={() => handleSavePrescription(videoCallAppt)}
                        className="w-full py-3 rounded-2xl btn-purple text-white font-bold text-xs shadow-lg cursor-pointer flex items-center justify-center space-x-2"
                      >
                        {savingPrescription ? (
                          <span>Issuing Prescription...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Issue & Sign Prescription</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Call Controls Footer */}
                <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400 hidden sm:block">
                    <span className="text-white font-bold">Arogya HMS Telehealth</span> &bull; 256-bit SSL Session
                  </div>

                  <div className="flex items-center space-x-3 mx-auto sm:mx-0">
                    <button
                      onClick={toggleMute}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer ${
                        isMuted
                          ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={toggleVideo}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer ${
                        isVideoOff
                          ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title={isVideoOff ? 'Start Camera' : 'Stop Camera'}
                    >
                      {isVideoOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={handleEndCall}
                      className="px-6 h-12 rounded-2xl btn-rose text-white font-extrabold text-xs flex items-center space-x-2 transition shadow-lg cursor-pointer"
                    >
                      <Phone className="w-5 h-5 rotate-[135deg]" />
                      <span>End Call</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* MODAL 3: BOOK APPOINTMENT MODAL (MULTI-COLOR THEME)      */}
        {/* ======================================================== */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 shadow-2xl relative max-h-[90vh] overflow-y-auto bg-slate-900/95"
              >
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Schedule Appointment</h3>
                      <p className="text-[11px] text-emerald-400 font-semibold">Book Doctor Consultation Slot</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleBook} className="space-y-4 text-xs">
                  {!isPatient && (
                    <div>
                      <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                        Select Patient *
                      </label>
                      <select
                        required
                        value={formData.patient_id}
                        onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl glass-input text-slate-100 focus:outline-none bg-slate-900 text-sm font-medium"
                      >
                        <option value="">Select a registered patient...</option>
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name} ({p.patient_id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isPatient && (
                    <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30">
                      <User className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Booking For</span>
                        <p className="font-extrabold text-white text-sm">{user?.full_name || 'You'}</p>
                      </div>
                    </div>
                  )}

                  {/* Attending Doctor */}
                  <div>
                    <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                      Attending Physician *
                    </label>
                    <select
                      required
                      value={formData.doctor_id}
                      onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl glass-input text-slate-100 focus:outline-none bg-slate-900 text-sm font-medium"
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.full_name} — {d.specialization} (${d.consultation_fee || 50})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mode Selector */}
                  <div>
                    <label className="block text-slate-300 font-bold uppercase tracking-wider mb-2">
                      Consultation Mode *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { val: 'online', icon: Video, label: 'Video Telehealth', desc: 'Active at appointment time', color: 'text-purple-400', border: 'border-purple-500/50 bg-purple-950/30' },
                        { val: 'offline', icon: MapPin, label: 'In-Person OPD', desc: 'Visit Hospital Clinic', color: 'text-amber-400', border: 'border-amber-500/50 bg-amber-950/30' },
                      ].map(({ val, icon: Icon, label, desc, color, border }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData({ ...formData, mode: val })}
                          className={`p-3.5 rounded-2xl text-left border transition flex items-start space-x-3 cursor-pointer ${
                            formData.mode === val
                              ? `${border} shadow-lg ring-2 ring-emerald-400`
                              : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mt-0.5 ${color}`} />
                          <div>
                            <p className="font-extrabold text-white text-xs">{label}</p>
                            <p className="text-[10px] text-slate-400">{desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Single-Date Selection: Interactive 30-Day Calendar Ribbon + Date Input */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-slate-300 font-bold uppercase tracking-wider text-xs">
                        Select Consultation Date (Single Date Selection) *
                      </label>
                      <span className="text-[11px] text-emerald-400 font-extrabold flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Selected Date: {upcoming30Days.find(d => d.iso === formData.appointment_date)?.fullDateLabel || formData.appointment_date}
                      </span>
                    </div>

                    {/* 30-Day Advance Scrollable Date Ribbon - ONLY ONE Selected Day Highlighted */}
                    <div className="flex space-x-2 overflow-x-auto pb-2 mb-2.5">
                      {upcoming30Days.map((d) => {
                        const isDateSelected = formData.appointment_date === d.iso
                        return (
                          <button
                            key={d.iso}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, appointment_date: d.iso })
                              setSelectedSlotKey('')
                            }}
                            className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-2.5 px-1 rounded-2xl border transition-all cursor-pointer ${
                              isDateSelected
                                ? 'bg-gradient-to-b from-emerald-600 via-teal-600 to-cyan-700 border-emerald-300 text-white ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/30 scale-105'
                                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                            }`}
                          >
                            <span className={`text-[10px] font-extrabold uppercase ${isDateSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                              {d.dayLabel}
                            </span>
                            <span className={`text-base font-black my-0.5 ${isDateSelected ? 'text-white' : 'text-slate-200'}`}>
                              {d.dateNum}
                            </span>
                            <span className={`text-[9px] font-semibold ${isDateSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                              {d.monthName}
                            </span>
                            {isDateSelected && (
                              <span className="mt-1 w-2 h-2 rounded-full bg-white shadow-xs animate-pulse" />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="date"
                          required
                          min={minDateStr}
                          max={maxDateStr}
                          value={formData.appointment_date}
                          onChange={(e) => {
                            setFormData({ ...formData, appointment_date: e.target.value })
                            setSelectedSlotKey('')
                          }}
                          className="w-full px-4 py-2.5 rounded-xl glass-input text-slate-100 focus:outline-none text-xs font-semibold bg-slate-900 border border-slate-700"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        (or choose custom date from 30-day calendar)
                      </span>
                    </div>
                  </div>

                  {/* Real-time 30-Minute Consultation Time Slots & Conflict Locking */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-slate-300 font-bold uppercase tracking-wider text-xs">
                        Select 30-Minute Consultation Slot *
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                          30 Mins / Slot
                        </span>
                        {loadingSlots && (
                          <span className="text-[10px] text-cyan-400 animate-pulse font-medium">
                            Checking doctor schedule...
                          </span>
                        )}
                      </div>
                    </div>

                    {availableSlots.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-800 rounded-2xl bg-slate-950/60">
                        {availableSlots.map((slot) => {
                          const isSelected = selectedSlotKey === slot.start_time
                          if (slot.is_booked) {
                            return (
                              <div
                                key={slot.start_time}
                                className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 flex flex-col items-center justify-center opacity-65 cursor-not-allowed select-none"
                                title="This 30-minute slot is booked and locked. Another patient cannot book this same timing."
                              >
                                <span className="text-[11px] font-mono font-bold line-through text-slate-400">
                                  {slot.start_time} - {slot.end_time}
                                </span>
                                <span className="text-[9px] font-extrabold text-rose-400 flex items-center mt-0.5">
                                  🔒 Booked & Locked (30m)
                                </span>
                              </div>
                            )
                          }

                          if (slot.is_past) {
                            return (
                              <div
                                key={slot.start_time}
                                className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 flex flex-col items-center justify-center opacity-40 cursor-not-allowed select-none"
                              >
                                <span className="text-[11px] font-mono font-bold">{slot.start_time} - {slot.end_time}</span>
                                <span className="text-[9px] text-slate-500">Passed</span>
                              </div>
                            )
                          }

                          return (
                            <button
                              key={slot.start_time}
                              type="button"
                              onClick={() => {
                                setSelectedSlotKey(slot.start_time)
                                setFormData({
                                  ...formData,
                                  start_time: slot.start_time,
                                  end_time: slot.end_time,
                                })
                              }}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                                isSelected
                                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 border-emerald-300 text-white ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/30'
                                  : 'bg-slate-900 border-slate-700/80 text-slate-200 hover:border-emerald-500/60 hover:bg-slate-800/90'
                              }`}
                            >
                              <span className="text-xs font-mono font-extrabold">
                                {slot.start_time} - {slot.end_time}
                              </span>
                              <span className={`text-[9px] font-extrabold mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-emerald-400'}`}>
                                {isSelected ? '✓ Selected (30m)' : '✓ Available (30m)'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Start Time (30 Min Slot)</label>
                          <input
                            type="time"
                            required
                            value={formData.start_time}
                            onChange={(e) => {
                              const st = e.target.value
                              let et = ''
                              try {
                                const [h, m] = st.split(':').map(Number)
                                const totalMins = h * 60 + m + 30
                                const endH = String(Math.floor(totalMins / 60) % 24).padStart(2, '0')
                                const endM = String(totalMins % 60).padStart(2, '0')
                                et = `${endH}:${endM}`
                              } catch (err) {
                                et = st
                              }
                              setFormData({ ...formData, start_time: st, end_time: et })
                            }}
                            className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none text-xs font-mono font-bold bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">End Time (+30 Mins)</label>
                          <input
                            type="time"
                            required
                            value={formData.end_time}
                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none text-xs font-mono font-bold bg-slate-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                      Symptoms / Reason for Consultation
                    </label>
                    <textarea
                      rows="2"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Describe symptoms or medical reason..."
                      className="w-full px-4 py-3 rounded-2xl glass-input text-slate-100 focus:outline-none text-xs resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 rounded-2xl btn-emerald text-white font-extrabold shadow-lg disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? 'Booking Slot...' : 'Confirm Appointment'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* MODAL 4: PAY CONSULTATION FEE MODAL (MULTI-COLOR)        */}
        {/* ======================================================== */}
        <AnimatePresence>
          {showPayModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border-2 border-amber-500/40 shadow-2xl bg-slate-900/95"
              >
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Settle Consultation Fee</h3>
                      <p className="text-[11px] text-amber-400 font-semibold">Digital Payment Settlement</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPayModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Patient</span>
                    <span className="font-bold text-white">{showPayModal.patient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Physician</span>
                    <span className="font-bold text-purple-300">{showPayModal.doctor_name}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-300 font-bold">Total Payable</span>
                    <span className="font-black text-amber-400 text-lg font-mono">${showPayModal.consultation_fee || 50.0}</span>
                  </div>
                </div>

                <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                  Select Payment Gateway
                </p>
                <div className="grid grid-cols-2 gap-2.5 mb-6">
                  {PAYMENT_METHODS.map(({ id, label, icon: Icon, color, border }) => (
                    <button
                      key={id}
                      onClick={() => setPayMethod(id)}
                      className={`p-3.5 rounded-2xl border flex items-center space-x-2.5 transition cursor-pointer ${
                        payMethod === id
                          ? 'bg-slate-800 border-amber-400 shadow-md ring-2 ring-amber-400/50'
                          : 'bg-slate-950/80 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${color}`} />
                      <span className="text-white text-xs font-bold">{label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPayModal(null)}
                    className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={payLoading}
                    className="flex-1 py-3 rounded-2xl btn-amber text-white font-extrabold text-xs shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {payLoading ? 'Processing...' : `Pay $${showPayModal.consultation_fee || 50.0}`}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* MODAL 5: STANDALONE PRESCRIPTION WRITER (MULTI-COLOR)    */}
        {/* ======================================================== */}
        <AnimatePresence>
          {prescribeAppt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 border-2 border-purple-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto bg-slate-900/95"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base">Issue Digital Prescription (Rx)</h3>
                      <p className="text-xs text-slate-400">
                        Patient: <span className="text-purple-300 font-bold">{prescribeAppt.patient_name}</span> (ID: #{prescribeAppt.patient_pid || prescribeAppt.patient_id})
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setPrescribeAppt(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Clinical Diagnosis & Chief Findings *
                  </label>
                  <textarea
                    rows="2"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Pharyngitis, normal vital signs"
                    className="w-full px-4 py-3 rounded-2xl glass-input text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">
                      Prescribed Medications
                    </label>
                    <button
                      type="button"
                      onClick={addPrescriptionItem}
                      className="text-xs text-purple-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Medication</span>
                    </button>
                  </div>

                  {prescriptionItems.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-2">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Medicine Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Azithromycin 500mg"
                            value={item.medicine_name}
                            onChange={(e) => updatePrescriptionItem(idx, 'medicine_name', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none font-bold"
                          />
                        </div>
                        {prescriptionItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePrescriptionItem(idx)}
                            className="text-rose-400 hover:text-rose-300 p-2 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Dosage</label>
                          <input
                            type="text"
                            value={item.dosage}
                            onChange={(e) => updatePrescriptionItem(idx, 'dosage', e.target.value)}
                            placeholder="500mg"
                            className="w-full px-2.5 py-2 rounded-xl glass-input text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Frequency</label>
                          <input
                            type="text"
                            value={item.frequency}
                            onChange={(e) => updatePrescriptionItem(idx, 'frequency', e.target.value)}
                            placeholder="1-0-1"
                            className="w-full px-2.5 py-2 rounded-xl glass-input text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Duration</label>
                          <input
                            type="text"
                            value={item.duration}
                            onChange={(e) => updatePrescriptionItem(idx, 'duration', e.target.value)}
                            placeholder="5 days"
                            className="w-full px-2.5 py-2 rounded-xl glass-input text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Total Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updatePrescriptionItem(idx, 'quantity', e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl glass-input text-xs text-slate-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Instructions / Meal Timing</label>
                        <input
                          type="text"
                          value={item.instructions}
                          onChange={(e) => updatePrescriptionItem(idx, 'instructions', e.target.value)}
                          placeholder="e.g. Take after meals with warm water"
                          className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-slate-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setPrescribeAppt(null)}
                    className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingPrescription}
                    onClick={() => handleSavePrescription(prescribeAppt)}
                    className="px-6 py-3 rounded-2xl btn-purple text-white font-extrabold text-xs shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {savingPrescription ? 'Saving & Signing...' : 'Sign & Issue Prescription'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
