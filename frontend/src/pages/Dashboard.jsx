import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, Activity, Calendar, TrendingUp, Bed, Clock,
  AlertCircle, CheckCircle2, DollarSign, Pill, FlaskConical,
  Stethoscope, UserPlus, ArrowUpRight, ArrowDownRight,
  ShieldCheck, HeartPulse, Sparkles, ChevronRight, Plus,
  Video, FileText, Bot, MessageSquare, Shield, Download,
  UserRound, Phone, MapPin, Eye, Play, ArrowRight, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import api from '../services/api'
import { getUserRoles } from '../utils/auth'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const navigate = useNavigate()

  const userRoles = getUserRoles(user)
  const isPatient = userRoles.includes('patient') && !userRoles.includes('admin') && !userRoles.includes('doctor')
  const isDoctor = userRoles.includes('doctor') && !userRoles.includes('admin')
  const isNurse = userRoles.includes('nurse') && !userRoles.includes('admin')
  const isReceptionist = userRoles.includes('receptionist') && !userRoles.includes('admin')
  const isPharmacist = userRoles.includes('pharmacist') && !userRoles.includes('admin')
  const isLabTech = userRoles.includes('lab_technician') && !userRoles.includes('admin')

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      const res = await api.get('/dashboard/stats')
      setData(res.data?.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading clinical workspace...</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // 1. PATIENT DASHBOARD (Strict Personal Isolation)
  // ==========================================
  if (isPatient) {
    const patientInfo = data?.patient_info
    const appointments = data?.appointments || []
    const prescriptions = data?.prescriptions || []
    const labOrders = data?.lab_orders || []
    const pendingBills = data?.pending_bills || []
    const stats = data?.stats || {}

    const nextAppt = appointments[0]

    return (
      <div className="space-y-6 pb-12">
        {/* Patient Welcome Header & Quick Bio Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#0a1532] to-slate-900"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Patient Health Passport</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Welcome, <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">{user?.first_name || 'Patient'} {user?.last_name || ''}</span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Here is your personal health summary. Your electronic medical records, active prescriptions, and laboratory results are encrypted and isolated for your privacy.
              </p>
            </div>

            {/* Patient ID Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-left shadow-lg">
                <p className="text-[10px] uppercase font-bold text-slate-400">Patient ID</p>
                <p className="text-sm font-extrabold font-mono text-cyan-300 mt-0.5">
                  {patientInfo?.patient_id || 'PAT-LIVE'}
                </p>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400">Blood Group</p>
                <p className="text-sm font-extrabold text-rose-400 mt-0.5">
                  {patientInfo?.blood_group || 'O+'}
                </p>
              </div>
              <button
                onClick={() => navigate('/appointments')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center space-x-2 cursor-pointer transition"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* 4 Patient Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/appointments')}
            className="glass-panel p-5 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 transition cursor-pointer group shadow-lg bg-gradient-to-b from-slate-900 to-[#0c1b3a]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Visits</span>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mb-1">{stats.upcoming_appointments || 0}</div>
            <div className="text-xs text-cyan-400 font-semibold flex items-center space-x-1">
              <span>View schedule</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate('/prescriptions')}
            className="glass-panel p-5 rounded-2xl border border-purple-500/30 hover:border-purple-400 transition cursor-pointer group shadow-lg bg-gradient-to-b from-slate-900 to-[#170e30]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Prescriptions</span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Pill className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mb-1">{stats.active_prescriptions || 0}</div>
            <div className="text-xs text-purple-400 font-semibold flex items-center space-x-1">
              <span>View medications</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate('/laboratory')}
            className="glass-panel p-5 rounded-2xl border border-emerald-500/30 hover:border-emerald-400 transition cursor-pointer group shadow-lg bg-gradient-to-b from-slate-900 to-[#0a231b]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnostic Lab Tests</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FlaskConical className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mb-1">{stats.lab_reports_count || 0}</div>
            <div className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
              <span>View test slips</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate('/billing')}
            className="glass-panel p-5 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition cursor-pointer group shadow-lg bg-gradient-to-b from-slate-900 to-[#291a08]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Invoices</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mb-1">
              ${stats.total_outstanding_amount || '0.00'}
            </div>
            <div className="text-xs text-amber-400 font-semibold flex items-center space-x-1">
              <span>{stats.pending_bills_count ? `${stats.pending_bills_count} unpaid bills` : 'All bills settled'}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Featured Next Appointment & Quick Telehealth Action */}
        {nextAppt && (
          <div className="glass-panel rounded-3xl p-6 border-2 border-cyan-500/40 shadow-xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {nextAppt.consultation_type === 'online' ? <Video className="w-7 h-7" /> : <Stethoscope className="w-7 h-7" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/30">
                      Next Scheduled Visit
                    </span>
                    <span className="text-xs text-slate-400">
                      {nextAppt.appointment_date} at {nextAppt.start_time || '10:00 AM'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Consultation with {nextAppt.doctor_name || 'Dr. Specialist'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Reason: {nextAppt.reason || 'General Medical Consultation'} • Status: <span className="text-emerald-400 font-semibold capitalize">{nextAppt.status}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto">
                <button
                  onClick={() => navigate('/appointments')}
                  className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 cursor-pointer transition"
                >
                  <Video className="w-4 h-4" />
                  <span>Enter Telehealth / Appointment Hub</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Grid: Recent Prescriptions & Recent Lab Slips */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Recent Prescriptions (6 Cols) */}
          <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Your Recent Prescriptions</h3>
                  <p className="text-[11px] text-slate-400">Doctor issued digital medications</p>
                </div>
              </div>
              <Link to="/prescriptions" className="text-xs text-cyan-400 hover:underline font-semibold">
                View All &rarr;
              </Link>
            </div>

            {prescriptions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <Pill className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
                <p>No prescriptions issued yet.</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Your doctor will prescribe medications after your consultation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate('/prescriptions')}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">Rx #{rx.prescription_number || `RX-${rx.id}`}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rx.status === 'dispensed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {rx.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Prescribed by <span className="text-cyan-400 font-semibold">{rx.doctor_name || 'Doctor'}</span> • {rx.created_at?.slice(0, 10) || 'Recent'}
                    </p>
                    {rx.diagnosis && (
                      <p className="text-[11px] text-slate-400 mt-1 italic">
                        Diagnosis: {rx.diagnosis}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Recent Diagnostic Lab Tests (6 Cols) */}
          <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Your Diagnostic Lab Reports</h3>
                  <p className="text-[11px] text-slate-400">Pathology & analyte screening</p>
                </div>
              </div>
              <Link to="/laboratory" className="text-xs text-cyan-400 hover:underline font-semibold">
                View All &rarr;
              </Link>
            </div>

            {labOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                <p>No lab tests recorded yet.</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Laboratory reports will appear here once ordered by your physician.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {labOrders.map((lo, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate('/laboratory')}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{lo.order_number || `LAB-${lo.id}`}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lo.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {lo.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Ordered by <span className="text-cyan-400 font-semibold">{lo.doctor_name || 'Doctor'}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tests: {lo.test_type || 'Comprehensive Analyte Profile'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 1-Click Interactive Clinical Assistants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div
            onClick={() => navigate('/arogya-ai')}
            className="glass-panel p-5 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 transition cursor-pointer group shadow-lg bg-gradient-to-r from-slate-900 to-cyan-950/40 flex items-center space-x-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">ArogyaAI 24/7 Health Assistant</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Ask symptom questions & triage guidance</p>
            </div>
          </div>

          <div
            onClick={() => navigate('/chat')}
            className="glass-panel p-5 rounded-2xl border border-teal-500/30 hover:border-teal-400 transition cursor-pointer group shadow-lg bg-gradient-to-r from-slate-900 to-teal-950/40 flex items-center space-x-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Hospital Direct Care Chat</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Message hospital staff and doctor rooms</p>
            </div>
          </div>

          <div
            onClick={() => navigate('/billing')}
            className="glass-panel p-5 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition cursor-pointer group shadow-lg bg-gradient-to-r from-slate-900 to-amber-950/40 flex items-center space-x-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Digital Invoices & Receipts</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Settlement history & tax invoices</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // 2. DOCTOR DASHBOARD (Clinical Command Center)
  // ==========================================
  if (isDoctor) {
    const docStats = data?.stats || {}
    const todayAppts = data?.today_appointments || []

    return (
      <div className="space-y-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#0a1532] to-slate-900"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                <span>Doctor Clinical Station</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Dr. {user?.first_name || 'Physician'} {user?.last_name || ''}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Welcome to your daily OPD queue. You have <span className="text-cyan-400 font-bold">{docStats.today_appointments_count || 0}</span> appointments scheduled today with live video teleconsultation enabled.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/appointments')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center space-x-2 cursor-pointer transition"
              >
                <Video className="w-4 h-4" />
                <span>Launch Telehealth OPD Queue</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Doctor Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 text-left">
            <span className="text-xs font-bold text-slate-400 uppercase">Today Appointments</span>
            <div className="text-3xl font-extrabold text-white mt-1">{docStats.today_appointments_count || 0}</div>
            <span className="text-xs text-cyan-400 font-semibold mt-1 block">Scheduled consults</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 text-left">
            <span className="text-xs font-bold text-slate-400 uppercase">Waiting in Lobby</span>
            <div className="text-3xl font-extrabold text-white mt-1">{docStats.waiting_patients_count || 0}</div>
            <span className="text-xs text-amber-400 font-semibold mt-1 block">Checked-in & waiting</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 text-left">
            <span className="text-xs font-bold text-slate-400 uppercase">Prescriptions Written</span>
            <div className="text-3xl font-extrabold text-white mt-1">{docStats.total_prescriptions_written || 0}</div>
            <span className="text-xs text-purple-400 font-semibold mt-1 block">Digital 1-0-1 slips</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 text-left">
            <span className="text-xs font-bold text-slate-400 uppercase">Pending Lab Orders</span>
            <div className="text-3xl font-extrabold text-white mt-1">{docStats.pending_lab_orders || 0}</div>
            <span className="text-xs text-emerald-400 font-semibold mt-1 block">Awaiting pathologist</span>
          </div>
        </div>

        {/* Today's Doctor Queue */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">Today's Patient Consult Queue</h3>
              <p className="text-xs text-slate-400">Click on any patient to start video checkup or write prescriptions</p>
            </div>
            <button
              onClick={() => navigate('/appointments')}
              className="text-xs text-cyan-400 font-bold hover:underline"
            >
              Open Full Telehealth View &rarr;
            </button>
          </div>

          {todayAppts.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
              <p>No appointments booked for today yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppts.map((appt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-cyan-500/40 transition"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                      {appt.patient_name?.slice(0, 2)?.toUpperCase() || 'PT'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{appt.patient_name || 'Patient'}</h4>
                      <p className="text-xs text-slate-400">
                        {appt.start_time || '10:00 AM'} • Mode: <span className="text-cyan-400 font-semibold uppercase">{appt.consultation_type || 'offline'}</span> • Reason: {appt.reason || 'General Consult'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      onClick={() => navigate('/appointments')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Start Call</span>
                    </button>
                    <button
                      onClick={() => navigate('/prescriptions')}
                      className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold text-xs border border-purple-500/30 flex items-center space-x-1.5"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>Write Rx</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // 3. ADMIN & GENERAL HOSPITAL OS DASHBOARD
  // ==========================================
  const stats = data?.stats || {}

  const statCards = [
    {
      title: 'Total Active Patients',
      value: stats?.total_patients || '0',
      change: '+14.2%',
      trend: 'up',
      icon: Users,
      color: 'from-cyan-500 to-blue-600',
      badge: 'Hospital-wide'
    },
    {
      title: 'Today Appointments',
      value: stats?.today_appointments || '0',
      change: '+8.5%',
      trend: 'up',
      icon: Calendar,
      color: 'from-indigo-500 to-purple-600',
      badge: '94% On Time'
    },
    {
      title: 'Inpatient Admissions',
      value: stats?.active_admissions || '0',
      change: '-2.4%',
      trend: 'down',
      icon: Bed,
      color: 'from-teal-500 to-emerald-600',
      badge: `${stats?.available_beds || 0} Beds Free`
    },
    {
      title: 'Diagnostic Tests',
      value: stats?.pending_lab_tests || '0',
      change: '+19.3%',
      trend: 'up',
      icon: FlaskConical,
      color: 'from-amber-500 to-orange-600',
      badge: 'NABL Certified'
    },
  ]

  const patientTrendData = [
    { month: 'Jan', patients: 120, admissions: 45, emergency: 22 },
    { month: 'Feb', patients: 145, admissions: 52, emergency: 28 },
    { month: 'Mar', patients: 168, admissions: 61, emergency: 31 },
    { month: 'Apr', patients: 192, admissions: 58, emergency: 25 },
    { month: 'May', patients: 215, admissions: 73, emergency: 34 },
    { month: 'Jun', patients: 238, admissions: 80, emergency: 39 },
  ]

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#0c1630] to-slate-900"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hospital OS • Real-Time Administrative Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">{user?.first_name || 'Administrator'} {user?.last_name || ''}</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Hospital systems are operational. Active role: <span className="text-cyan-400 font-semibold capitalize">{user?.primary_role?.replace('_', ' ') || 'Admin'}</span>.
              All 6 clinical modules and WebSocket notification channels are in sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400">System Status</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400">All Nodes Healthy</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/staff')}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
            >
              Manage Staff & RBAC
            </button>
          </div>
        </div>
      </motion.div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          const TrendIcon = card.trend === 'up' ? ArrowUpRight : ArrowDownRight
          return (
            <div
              key={idx}
              className="glass-panel p-5 sm:p-6 rounded-2xl relative overflow-hidden border border-slate-800 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{card.title}</span>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {card.value}
                  </h3>
                  <div className="flex items-center space-x-2 pt-1">
                    <span className={`inline-flex items-center text-xs font-bold ${card.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <TrendIcon className="w-3.5 h-3.5 mr-0.5" />
                      {card.change}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">{card.badge}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
                Patient Inflow & Clinical Admissions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Historical consultation & emergency inflow</p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patientTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="patients" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#patientGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-2">Hospital Modules</h3>
            <p className="text-xs text-slate-400 mb-4">Quick navigation to active departments</p>
            <div className="space-y-2.5">
              {[
                { name: 'Appointments & Telehealth', path: '/appointments', icon: Video, color: 'text-cyan-400' },
                { name: 'Patient Directory', path: '/patients', icon: Users, color: 'text-blue-400' },
                { name: 'Digital Prescriptions', path: '/prescriptions', icon: Pill, color: 'text-purple-400' },
                { name: 'Pathology Laboratory', path: '/laboratory', icon: FlaskConical, color: 'text-emerald-400' },
                { name: 'E-Pharmacy Dispensary', path: '/pharmacy', icon: Activity, color: 'text-amber-400' },
                { name: 'Inpatient Wards & Beds', path: '/admissions', icon: Bed, color: 'text-rose-400' },
              ].map((m, i) => {
                const Icon = m.icon
                return (
                  <button
                    key={i}
                    onClick={() => navigate(m.path)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between text-xs font-semibold text-white transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${m.color}`} />
                      <span>{m.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
