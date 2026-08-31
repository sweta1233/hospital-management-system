import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartPulse, Calendar, Stethoscope, Users, Phone, Mail, MapPin,
  Clock, Award, Shield, Activity, Microscope, Pill, BedDouble,
  ArrowRight, CheckCircle2, Star, Building2, UserRound, Video,
  Sparkles, FileText, Bot, ShieldCheck, Zap, UserCheck, Play,
  PlusCircle, HeartHandshake, Syringe, Radio, ShieldAlert, Cpu,
  Eye, Check, ChevronRight
} from 'lucide-react'
import HospitalJourneyAnimation from '../components/HospitalJourneyAnimation'

export default function LandingPage() {
  const navigate = useNavigate()
  const [pulseCount, setPulseCount] = useState(78)

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount(75 + Math.floor(Math.random() * 8))
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const departments = [
    { name: 'Cardiology', icon: HeartPulse, color: 'from-rose-500 via-pink-500 to-rose-600', border: 'hover:border-rose-500/60', patients: '1,240+', badge: 'Heart Care' },
    { name: 'Neurology', icon: Activity, color: 'from-purple-500 via-violet-500 to-indigo-600', border: 'hover:border-purple-500/60', patients: '980+', badge: 'Brain & Spine' },
    { name: 'Telemedicine & OPD', icon: Video, color: 'from-cyan-500 via-teal-500 to-blue-600', border: 'hover:border-cyan-500/60', patients: '2,450+', badge: 'HD Video' },
    { name: 'Pediatrics', icon: UserRound, color: 'from-amber-500 via-orange-500 to-yellow-600', border: 'hover:border-amber-500/60', patients: '1,120+', badge: 'Child Care' },
    { name: 'Pathology & Lab', icon: Microscope, color: 'from-emerald-500 via-teal-500 to-green-600', border: 'hover:border-emerald-500/60', patients: '3,890+', badge: 'NABL Certified' },
    { name: 'Emergency 24/7', icon: Shield, color: 'from-red-500 via-rose-600 to-pink-700', border: 'hover:border-red-500/60', patients: '4,500+', badge: 'Trauma Care' },
  ]

  const features = [
    {
      title: 'HD Video Teleconsultation',
      desc: 'Connect with board-certified physicians through encrypted HD video consultations with real-time EMR charting.',
      icon: Video,
      badge: 'Telehealth Live',
      badgeColor: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/80',
      iconBg: 'from-cyan-500 via-teal-500 to-blue-600',
      cardBorder: 'hover:border-cyan-500/60 hover:shadow-cyan-500/20',
    },
    {
      title: 'In-Checkup Prescription Writer',
      desc: 'Doctors write digital prescriptions with automated multi-dosage (1-0-1) frequency schedules during consultations.',
      icon: Pill,
      badge: 'Instant Digital Rx',
      badgeColor: 'text-purple-300 border-purple-500/40 bg-purple-950/80',
      iconBg: 'from-purple-500 via-violet-500 to-indigo-600',
      cardBorder: 'hover:border-purple-500/60 hover:shadow-purple-500/20',
    },
    {
      title: 'Pathology & Lab Report Analytics',
      desc: 'Real-time blood analyte testing, automated reference range analysis, and secure patient report downloads.',
      icon: Microscope,
      badge: 'NABL Certified',
      badgeColor: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/80',
      iconBg: 'from-emerald-500 via-teal-500 to-green-600',
      cardBorder: 'hover:border-emerald-500/60 hover:shadow-emerald-500/20',
    },
    {
      title: 'ArogyaAI 24/7 Triage Assistant',
      desc: 'Intelligent AI medical assistant offering symptom triage, medication explanations, and emergency triage advice.',
      icon: Bot,
      badge: 'ArogyaAI Powered',
      badgeColor: 'text-amber-300 border-amber-500/40 bg-amber-950/80',
      iconBg: 'from-amber-500 via-orange-500 to-yellow-600',
      cardBorder: 'hover:border-amber-500/60 hover:shadow-amber-500/20',
    },
    {
      title: 'Strict Patient Privacy Isolation',
      desc: 'Role-based access control guaranteeing patients access strictly their own medical records and lab slips.',
      icon: ShieldCheck,
      badge: 'HIPAA & SSL Encrypted',
      badgeColor: 'text-blue-300 border-blue-500/40 bg-blue-950/80',
      iconBg: 'from-blue-500 via-indigo-500 to-violet-600',
      cardBorder: 'hover:border-blue-500/60 hover:shadow-blue-500/20',
    },
    {
      title: 'Smart E-Pharmacy & Inpatient Wards',
      desc: 'Automated medication stock alerts, electronic dispensing, and real-time ICU/Ward bed allocation tracking.',
      icon: BedDouble,
      badge: 'Connected Care',
      badgeColor: 'text-rose-300 border-rose-500/40 bg-rose-950/80',
      iconBg: 'from-rose-500 via-pink-500 to-red-600',
      cardBorder: 'hover:border-rose-500/60 hover:shadow-rose-500/20',
    }
  ]

  const stats = [
    { value: '50,000+', label: 'Treated Patients', sub: '99.4% Positive Feedback', color: 'from-emerald-400 via-teal-300 to-cyan-400' },
    { value: '99.8%', label: 'Diagnostic Precision', sub: 'NABL Certified Testing', color: 'from-purple-400 via-pink-300 to-rose-400' },
    { value: '100% Private', label: 'Patient Data Isolation', sub: 'HIPAA & 256-Bit SSL', color: 'from-cyan-400 via-blue-300 to-indigo-400' },
    { value: '24/7/365', label: 'Emergency & Telehealth', sub: 'Specialists On Duty', color: 'from-amber-400 via-orange-300 to-rose-400' },
  ]

  return (
    <div className="min-h-screen bg-[#060b18] text-slate-100 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* ======================================================== */}
      {/* MULTI-COLOR AMBIENT GLOWS & RICH MEDICAL BACKGROUND ART  */}
      {/* ======================================================== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Dynamic Vibrant Multi-Color Light Orbs */}
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-emerald-500/20 blur-[160px] animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute top-1/4 -right-32 w-[700px] h-[700px] rounded-full bg-purple-600/25 blur-[180px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] rounded-full bg-rose-500/20 blur-[170px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute -bottom-40 right-1/3 w-[750px] h-[750px] rounded-full bg-amber-500/15 blur-[190px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-3/4 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[170px] animate-pulse" style={{ animationDuration: '8s' }} />

        {/* AI Medical Isometric Grid & Molecular Constellation Vector Pattern (Reduced Opacity) */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.09] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="30%" stopColor="#06b6d4" />
              <stop offset="70%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <pattern id="medical-cyber-grid" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="2" fill="#34d399" />
              <circle cx="10" cy="10" r="1.5" fill="#f43f5e" />
              <circle cx="110" cy="110" r="1.5" fill="#a78bfa" />
              <path d="M 60 0 L 60 120 M 0 60 L 120 60" fill="none" stroke="url(#grid-grad)" strokeWidth="0.5" strokeDasharray="4 4" />
              <circle cx="60" cy="60" r="35" fill="none" stroke="#38bdf8" strokeWidth="0.4" />
              <polygon points="60,25 90,60 60,95 30,60" fill="none" stroke="#f59e0b" strokeWidth="0.3" strokeDasharray="2 2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#medical-cyber-grid)" />
        </svg>

        {/* Floating Decorative Medical Symbols with Low Opacity */}
        <div className="absolute top-24 right-16 opacity-15 text-emerald-400">
          <HeartPulse className="w-56 h-56 animate-pulse" />
        </div>
        <div className="absolute top-1/2 left-8 opacity-10 text-purple-400">
          <Microscope className="w-64 h-64" />
        </div>
        <div className="absolute bottom-28 right-20 opacity-15 text-rose-400">
          <Activity className="w-60 h-60 animate-pulse" />
        </div>
      </div>

      <div className="relative z-10">
        {/* Real-time Hospital Status Ticker (Multi-Color) */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-purple-950 border-b border-emerald-500/30 py-2 px-4 text-[11px] font-medium text-slate-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-4">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Live Medical Network</span>
            </div>
            <div className="flex items-center space-x-6 text-slate-300 flex-shrink-0 text-xs font-semibold">
              <span className="text-rose-400 flex items-center gap-1">🚨 24/7 Trauma Emergency Active</span>
              <span className="text-emerald-400 flex items-center gap-1">👩‍⚕️ 48 Specialist Doctors Online</span>
              <span className="text-purple-400 flex items-center gap-1">🧪 Pathology Lab Express</span>
              <span className="text-cyan-400 flex items-center gap-1">💊 E-Pharmacy Dispensary Ready</span>
              <span className="text-amber-400 flex items-center gap-1">📹 HD Teleconsultation Active</span>
            </div>
            <div className="flex items-center space-x-2 text-emerald-300 font-mono flex-shrink-0 text-[11px] font-bold bg-emerald-950/90 px-3 py-0.5 rounded-full border border-emerald-500/40">
              <span>SYSTEM 100% OPERATIONAL</span>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <header className="border-b border-slate-800/90 backdrop-blur-xl bg-slate-950/80 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
            <div className="flex items-center justify-between">
              {/* Brand Logo */}
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <HeartPulse className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight flex items-center">
                    Arogya<span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent ml-1">HMS</span>
                  </h1>
                  <p className="text-[10px] font-extrabold text-emerald-400 tracking-widest uppercase">
                    Smart Hospital & Telehealth Network
                  </p>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => navigate('/patient/login')}
                  className="px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 transition shadow-lg shadow-emerald-500/25 cursor-pointer border border-emerald-400/40 flex items-center space-x-1.5"
                >
                  <UserRound className="w-4 h-4" />
                  <span>Patient Login</span>
                </button>

                <button
                  onClick={() => navigate('/staff/login')}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 hover:from-purple-900 hover:to-slate-800 text-xs sm:text-sm font-bold text-purple-200 border border-purple-500/40 transition cursor-pointer shadow-md flex items-center space-x-1.5"
                >
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Staff Portal</span>
                </button>

                <button
                  onClick={() => navigate('/patient/register')}
                  className="hidden sm:inline-flex px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-500/25 items-center space-x-1.5 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Visit</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section - Multi-Color Aesthetic */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Hero Text & CTAs (7 Cols) */}
            <div className="lg:col-span-7 text-left space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-950/90 via-slate-900 to-purple-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-lg shadow-emerald-950"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Next-Generation Multi-Disciplinary Healthcare</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight"
              >
                Advanced Clinical Care <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 via-cyan-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
                  Driven by Real Technology
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-normal"
              >
                Connect instantly with doctors over encrypted HD video teleconsultations, receive digital prescriptions, access automated pathology lab slips, and manage admissions with strict patient privacy.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap items-center gap-3.5 pt-2"
              >
                <button
                  onClick={() => navigate('/patient/login')}
                  className="px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/30 flex items-center space-x-2 group cursor-pointer transition transform hover:-translate-y-0.5"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Patient Login / Book Visit</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/staff/register')}
                  className="px-6 sm:px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-extrabold text-sm sm:text-base border border-purple-400/40 transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-purple-900/30 transform hover:-translate-y-0.5"
                >
                  <UserCheck className="w-5 h-5 text-white" />
                  <span>Join as Hospital Staff</span>
                </button>
              </motion.div>

              {/* Key Multi-Color Badges */}
              <div className="grid grid-cols-3 gap-3 pt-3 max-w-lg">
                <div className="p-3 rounded-2xl bg-gradient-to-b from-emerald-950/60 to-slate-900 border border-emerald-500/30 text-center">
                  <span className="block text-base font-black text-emerald-300">100%</span>
                  <span className="text-[10px] text-slate-300 uppercase font-bold">Strict Privacy</span>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-b from-purple-950/60 to-slate-900 border border-purple-500/30 text-center">
                  <span className="block text-base font-black text-purple-300">HD Video</span>
                  <span className="text-[10px] text-slate-300 uppercase font-bold">Teleconsult</span>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-b from-rose-950/60 to-slate-900 border border-rose-500/30 text-center">
                  <span className="block text-base font-black text-rose-300">Instant</span>
                  <span className="text-[10px] text-slate-300 uppercase font-bold">Lab Slips</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card: Interactive Clinical Telehealth Showcase (5 Cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              {/* Vibrant Ambient Glow Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 via-purple-600/30 to-rose-500/30 rounded-3xl blur-2xl transform -rotate-1" />

              <div className="relative glass-panel rounded-3xl p-6 border-2 border-emerald-500/50 shadow-2xl bg-slate-900/95 backdrop-blur-2xl">
                {/* Doctor Telehealth Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-500/25">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-white text-sm">Dr. Sarah Smith, MD</h3>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <p className="text-[11px] text-emerald-300 font-semibold">Chief of Telemedicine & OPD</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    ONLINE NOW
                  </span>
                </div>

                {/* Animated ECG Pulse Line */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>Live Patient Vitals (ECG)</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-extrabold">{pulseCount} BPM • Normal Sinus</span>
                  </div>
                  <div className="h-10 w-full overflow-hidden flex items-center">
                    <svg viewBox="0 0 500 60" className="w-full h-full stroke-emerald-400 fill-none stroke-2">
                      <path d="M0,30 L60,30 L75,10 L90,50 L105,25 L120,35 L135,30 L200,30 L215,10 L230,50 L245,25 L260,35 L275,30 L350,30 L365,10 L380,50 L395,25 L410,35 L425,30 L500,30" className="animate-pulse" />
                    </svg>
                  </div>
                </div>

                {/* Quick Consultation Preview Widget (Multi-Color) */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/40">
                    <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold mb-1">
                      <Video className="w-4 h-4 text-purple-400" />
                      <span>HD Video Call</span>
                    </div>
                    <p className="text-[11px] text-slate-300">1-Click Telehealth Session</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-500/40">
                    <div className="flex items-center space-x-2 text-rose-300 text-xs font-bold mb-1">
                      <Pill className="w-4 h-4 text-rose-400" />
                      <span>Digital Rx 1-0-1</span>
                    </div>
                    <p className="text-[11px] text-slate-300">Multi-Dosage Schedules</p>
                  </div>
                </div>

                {/* Interactive Portal Launch CTA */}
                <button
                  onClick={() => navigate('/patient/login')}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 cursor-pointer transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Patient Telehealth Consult</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Interactive Animated Hospital Process Journey */}
          <div className="w-full my-12">
            <HospitalJourneyAnimation onExploreAction={() => navigate('/patient/login')} />
          </div>

          {/* Quick Statistics Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="glass-panel p-5 rounded-3xl border border-slate-800 text-center hover:border-emerald-500/50 transition shadow-xl relative overflow-hidden group bg-slate-900/80"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
                <div className={`text-2xl sm:text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">{stat.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Clinical Capabilities & System Modules */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/80">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full-Spectrum Healthcare Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3">
              Designed for Doctors, Pathologists, and Patients
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Complete clinical fidelity with strict privacy isolation and real-time electronic medical records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, idx) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  viewport={{ once: true }}
                  className={`glass-panel rounded-3xl p-6 border border-slate-800 ${f.cardBorder} transition-all duration-300 group shadow-xl relative overflow-hidden bg-slate-900/80`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${f.iconBg} text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${f.badgeColor}`}>
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Clinical Departments Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/80">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Specialized Medical Centers</h2>
            <p className="text-xs sm:text-sm text-slate-300">Board-certified specialists across critical disciplines</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {departments.map((dept, idx) => {
              const Icon = dept.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  viewport={{ once: true }}
                  onClick={() => navigate('/patient/login')}
                  className={`glass-panel rounded-2xl p-5 border border-slate-800 text-center ${dept.border} transition group cursor-pointer shadow-lg bg-slate-900/70`}
                >
                  <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr ${dept.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xs font-bold text-white">{dept.name}</h3>
                  <span className="text-[10px] text-emerald-400 font-mono block mt-1">{dept.patients} Treated</span>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/90 bg-slate-950 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-white text-sm">Arogya Hospital Management System</span>
                <p className="text-[11px] text-slate-400">Advanced Electronic Medical Records & Telehealth</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs text-slate-300 font-medium">
              <button onClick={() => navigate('/patient/login')} className="hover:text-emerald-400 transition cursor-pointer">
                Patient Portal
              </button>
              <span>&bull;</span>
              <button onClick={() => navigate('/staff/login')} className="hover:text-purple-400 transition cursor-pointer">
                Staff Login
              </button>
              <span>&bull;</span>
              <button onClick={() => navigate('/staff/register')} className="hover:text-rose-400 transition cursor-pointer">
                Staff Self-Register
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
