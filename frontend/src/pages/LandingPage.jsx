import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HeartPulse, Calendar, Video, Activity, Microscope, Pill,
  Shield, ArrowRight, Sparkles, Zap, UserCheck, UserRound,
  Bot, Award, CheckCircle2
} from 'lucide-react'
import AppBackdrop from '../components/AppBackdrop'
import HospitalJourneyAnimation from '../components/HospitalJourneyAnimation'
import MedicalTechHologram from '../components/MedicalTechHologram'

export default function LandingPage() {
  const navigate = useNavigate()

  const departments = [
    { name: 'Cardiology', icon: HeartPulse, color: 'from-rose-500 to-red-600', patients: '1,240+', badge: 'Heart Care' },
    { name: 'Neurology', icon: Activity, color: 'from-purple-500 to-indigo-600', patients: '980+', badge: 'Brain & Spine' },
    { name: 'Telemedicine', icon: Video, color: 'from-cyan-500 to-blue-600', patients: '2,450+', badge: 'HD Video' },
    { name: 'Pediatrics', icon: UserRound, color: 'from-amber-500 to-orange-600', patients: '1,120+', badge: 'Child Care' },
    { name: 'Pathology Lab', icon: Microscope, color: 'from-emerald-500 to-teal-600', patients: '3,890+', badge: 'NABL Certified' },
    { name: 'Emergency 24/7', icon: Shield, color: 'from-rose-600 to-pink-700', patients: '4,500+', badge: 'Trauma Ready' },
  ]

  const features = [
    {
      title: 'HD Video Telehealth',
      tag: '1080p Encrypted',
      icon: Video,
      color: 'from-cyan-500 to-blue-600',
      border: 'hover:border-cyan-500/60',
    },
    {
      title: 'Smart E-Prescription',
      tag: '1-0-1 Multi-Dosage',
      icon: Pill,
      color: 'from-purple-500 to-indigo-600',
      border: 'hover:border-purple-500/60',
    },
    {
      title: 'NABL Pathology Slips',
      tag: 'Auto Reference Ranges',
      icon: Microscope,
      color: 'from-emerald-500 to-teal-600',
      border: 'hover:border-emerald-500/60',
    },
    {
      title: 'ArogyaAI 24/7 Triage',
      tag: 'Neural Diagnostic',
      icon: Bot,
      color: 'from-amber-500 to-orange-600',
      border: 'hover:border-amber-500/60',
    },
  ]

  const stats = [
    { value: '50,000+', label: 'Treated Patients', sub: '99.4% Success', color: 'from-emerald-400 to-cyan-400' },
    { value: '99.8%', label: 'Diagnostic Precision', sub: 'NABL Certified', color: 'from-purple-400 to-rose-400' },
    { value: '100% Private', label: 'HIPAA & SSL Isolated', sub: 'Encrypted Cloud', color: 'from-cyan-400 to-indigo-400' },
    { value: '24/7/365', label: 'Emergency Network', sub: 'Specialists On Duty', color: 'from-amber-400 to-rose-400' },
  ]

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* ── 5 AI-Generated Uploaded Background Images with High-Visibility Layer ── */}
      <AppBackdrop opacity="opacity-45" showSwitcher={true} />

      <div className="relative z-10">
        {/* Main Header / Navigation */}
        <header className="border-b border-slate-800/80 backdrop-blur-xl bg-slate-950/70 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
            <div className="flex items-center justify-between">
              {/* Brand Logo */}
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <HeartPulse className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight flex items-center">
                    Arogya<span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent ml-1">HMS</span>
                  </h1>
                  <p className="text-[10px] font-extrabold text-emerald-400 tracking-widest uppercase">
                    AI Hospital & Telehealth
                  </p>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => navigate('/patient/login')}
                  className="px-4 sm:px-5 py-2 rounded-2xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 transition shadow-lg shadow-emerald-500/25 cursor-pointer border border-emerald-400/40 flex items-center space-x-1.5"
                >
                  <UserRound className="w-4 h-4" />
                  <span>Patient Login</span>
                </button>

                <button
                  onClick={() => navigate('/staff/login')}
                  className="px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-xs sm:text-sm font-bold text-purple-200 border border-purple-500/40 transition cursor-pointer shadow-md flex items-center space-x-1.5"
                >
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Staff Portal</span>
                </button>

                <button
                  onClick={() => navigate('/patient/register')}
                  className="hidden sm:inline-flex px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-500/25 items-center space-x-1.5 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Visit</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ── Hero Section with Punchy Copy & 3D Medical Hologram ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 lg:pt-10 lg:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Hero Text & CTAs (6 Cols) */}
            <div className="lg:col-span-6 text-left space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-lg"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Next-Gen AI Hospital & Telehealth Network</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight"
              >
                Smart Clinical Care. <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 via-cyan-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
                  Instant AI Precision.
                </span>
              </motion.h1>

              {/* Punchy Feature Chips */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-wrap gap-2 pt-1"
              >
                <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-cyan-400" /> 1080p Telehealth
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-purple-400" /> 1-0-1 Digital Rx
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <Microscope className="w-3.5 h-3.5 text-emerald-400" /> NABL Lab Slips
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-amber-400" /> 24/7 AI Triage
                </span>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap items-center gap-3 pt-2"
              >
                <button
                  onClick={() => navigate('/patient/login')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/30 flex items-center space-x-2 group cursor-pointer transition transform hover:-translate-y-0.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Patient Login / OTP</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/staff/register')}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-extrabold text-sm border border-purple-400/40 transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-purple-900/30 transform hover:-translate-y-0.5"
                >
                  <UserCheck className="w-4 h-4 text-white" />
                  <span>Join Hospital Staff</span>
                </button>
              </motion.div>

              {/* Quick Trust Highlights */}
              <div className="grid grid-cols-3 gap-2.5 pt-2 max-w-md">
                <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 text-center">
                  <span className="block text-sm font-black text-emerald-300">100% HIPAA</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Data Privacy</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-purple-500/30 text-center">
                  <span className="block text-sm font-black text-purple-300">HD Video</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Teleconsult</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-rose-500/30 text-center">
                  <span className="block text-sm font-black text-rose-300">Instant Rx</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold">1-0-1 Schedule</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual: Holographic Medical Tech Studio (6 Cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-6 relative"
            >
              <MedicalTechHologram onAction={() => navigate('/patient/login')} />
            </motion.div>
          </div>

          {/* Interactive Animated Hospital Process Journey */}
          <div className="w-full my-8">
            <HospitalJourneyAnimation onExploreAction={() => navigate('/patient/login')} />
          </div>

          {/* Clean Numerical Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="glass-panel p-4 rounded-2xl border border-slate-800 text-center hover:border-emerald-500/50 transition shadow-xl bg-slate-900/80"
              >
                <div className={`text-xl sm:text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-0.5`}>
                  {stat.value}
                </div>
                <div className="text-xs font-bold text-white">{stat.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Connected Clinical Modules (Streamlined & Clean) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-800/80">
          <div className="text-center max-w-xl mx-auto mb-6">
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full-Spectrum Medical Architecture</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Connected Clinical Modules
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, idx) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  viewport={{ once: true }}
                  onClick={() => navigate('/patient/login')}
                  className={`glass-panel rounded-2xl p-4 border border-slate-800 ${f.border} transition-all duration-300 group shadow-xl cursor-pointer bg-slate-900/80 flex items-center space-x-3.5`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${f.color} text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">{f.title}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">{f.tag}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ── Specialized Medical Centers ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-800/80">
          <div className="text-center max-w-lg mx-auto mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white mb-1">Specialized Medical Centers</h2>
            <p className="text-xs text-slate-400">Board-certified specialists across critical disciplines</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {departments.map((dept, idx) => {
              const Icon = dept.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  viewport={{ once: true }}
                  onClick={() => navigate('/patient/login')}
                  className="glass-panel rounded-2xl p-3.5 border border-slate-800 text-center hover:border-emerald-500/50 transition group cursor-pointer shadow-lg bg-slate-900/70"
                >
                  <div className={`w-11 h-11 mx-auto mb-2 rounded-xl bg-gradient-to-tr ${dept.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-white">{dept.name}</h3>
                  <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">{dept.patients}</span>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ── Sleek Footer ── */}
        <footer className="border-t border-slate-800/90 bg-slate-950/90 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-white text-xs sm:text-sm">Arogya Hospital Management System</span>
                <p className="text-[10px] text-slate-400">Electronic Medical Records & Telehealth</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs text-slate-400 font-medium">
              <button onClick={() => navigate('/patient/login')} className="hover:text-emerald-400 transition cursor-pointer">
                Patient Portal
              </button>
              <span>&bull;</span>
              <button onClick={() => navigate('/staff/login')} className="hover:text-purple-400 transition cursor-pointer">
                Staff Login
              </button>
              <span>&bull;</span>
              <button onClick={() => navigate('/staff/register')} className="hover:text-rose-400 transition cursor-pointer">
                Staff Register
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
