import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Stethoscope, FlaskConical, Pill, CheckCircle2,
  HeartPulse, Activity, ArrowRight, Play, Pause, RotateCcw,
  Sparkles, ShieldCheck, User, Video, FileText, ChevronRight
} from 'lucide-react'

const STAGES = [
  {
    id: 1,
    title: '1. Arrival & Digital Triage',
    subtitle: 'Contactless Check-in & Registration',
    dept: 'Outpatient Reception & Triage',
    icon: Building2,
    color: 'from-blue-500 via-cyan-500 to-teal-500',
    accentColor: '#06b6d4',
    characterState: 'Arriving at hospital lobby...',
    dialogue: 'Patient arrives at reception kiosk, scans health card, and enters initial symptoms.',
    vitals: { hr: '88 bpm', bp: '135/85', spo2: '97%', temp: '99.1°F', status: 'Moderate Concern' },
    details: [
      'Digital token #OPD-2409 generated instantly',
      'Electronic medical record automatically retrieved',
      'Vital signs logged by triage nurse',
    ],
    badge: 'Triage Stage',
    badgeClass: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/80',
    borderClass: 'border-cyan-500/50 shadow-cyan-500/20'
  },
  {
    id: 2,
    title: '2. Doctor Consultation',
    subtitle: 'HD Video Call / Clinical Examination',
    dept: 'Department of Internal Medicine',
    icon: Stethoscope,
    color: 'from-purple-500 via-violet-500 to-indigo-600',
    accentColor: '#8b5cf6',
    characterState: 'Consulting with Dr. Smith...',
    dialogue: 'Doctor examines patient, reviews clinical history, and issues an instant electronic prescription (Rx).',
    vitals: { hr: '76 bpm', bp: '122/80', spo2: '98%', temp: '98.6°F', status: 'Under Examination' },
    details: [
      'Stethoscope & diagnostic clinical evaluation',
      'Digital prescription formatted with multi-dosage schedule (1-0-1)',
      'Diagnostic lab investigations ordered directly',
    ],
    badge: 'Physician Consult',
    badgeClass: 'text-purple-300 border-purple-500/40 bg-purple-950/80',
    borderClass: 'border-purple-500/50 shadow-purple-500/20'
  },
  {
    id: 3,
    title: '3. Pathology Laboratory',
    subtitle: 'Automated Diagnostic Testing',
    dept: 'Central Diagnostic & Pathology Lab',
    icon: FlaskConical,
    color: 'from-emerald-500 via-teal-500 to-green-600',
    accentColor: '#10b981',
    characterState: 'Diagnostic specimen analysis...',
    dialogue: 'Blood sample analyzed on automated clinical hematology counters with reference range verification.',
    vitals: { hr: '74 bpm', bp: '120/80', spo2: '99%', temp: '98.4°F', status: 'Pathology Normal' },
    details: [
      'Automated complete blood count & biochemistry',
      'High-precision analyte evaluation with abnormality flagging',
      'NABL-accredited digital report uploaded to patient portal',
    ],
    badge: 'Diagnostic Lab',
    badgeClass: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/80',
    borderClass: 'border-emerald-500/50 shadow-emerald-500/20'
  },
  {
    id: 4,
    title: '4. Smart E-Pharmacy',
    subtitle: 'Verified Medicine Dispensation',
    dept: 'Robotic Hospital Pharmacy',
    icon: Pill,
    color: 'from-rose-500 via-pink-500 to-red-600',
    accentColor: '#f43f5e',
    characterState: 'Collecting verified medicines...',
    dialogue: 'Pharmacist verifies doctor prescription, barcodes medicines, and packs dosage schedule (1-0-1).',
    vitals: { hr: '72 bpm', bp: '118/78', spo2: '99%', temp: '98.6°F', status: 'Medication Ready' },
    details: [
      'Direct cloud-synced prescription fulfillment',
      'Automated batch & expiry barcode validation',
      'Digital dosage directions and allergen review',
    ],
    badge: 'Pharmacy Dispense',
    badgeClass: 'text-rose-300 border-rose-500/40 bg-rose-950/80',
    borderClass: 'border-rose-500/50 shadow-rose-500/20'
  },
  {
    id: 5,
    title: '5. Complete Wellness',
    subtitle: 'Healthy Discharge & Continuous Care',
    dept: 'Patient Recovery & Home Monitoring',
    icon: CheckCircle2,
    color: 'from-amber-500 via-orange-500 to-yellow-600',
    accentColor: '#f59e0b',
    characterState: 'Fully recovered & healthy!',
    dialogue: 'Patient receives digital invoice receipt, post-treatment care summary, and automated telehealth checkup reminder.',
    vitals: { hr: '70 bpm', bp: '116/76', spo2: '100%', temp: '98.6°F', status: 'Optimal Health' },
    details: [
      'Digital discharge certificate & billing invoice generated',
      'ArogyaAI 24/7 post-care health monitoring enabled',
      'Follow-up appointment scheduled seamlessly',
    ],
    badge: 'Discharge & Recovery',
    badgeClass: 'text-amber-300 border-amber-500/40 bg-amber-950/80',
    borderClass: 'border-amber-500/50 shadow-amber-500/20'
  }
]

export default function HospitalJourneyAnimation({ onExploreAction }) {
  const [activeStep, setActiveStep] = useState(1)
  const [isPlaying, setIsPlaying] = useState(true)

  // Auto-play progression through the hospital
  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= STAGES.length ? 1 : prev + 1))
    }, 4500)
    return () => clearInterval(timer)
  }, [isPlaying])

  const currentStage = STAGES.find((s) => s.id === activeStep) || STAGES[0]

  return (
    <div className="w-full relative overflow-hidden rounded-3xl glass-panel border-2 border-emerald-500/40 p-4 sm:p-6 lg:p-8 shadow-2xl bg-gradient-to-b from-slate-900/95 via-[#0a1224]/95 to-slate-950/95">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner & Controls */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Interactive Real-World Patient Journey</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            How Healthcare Works at <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">Arogya HMS</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Watch the seamless end-to-end medical workflow as an animated patient journeys through our hospital departments.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-2 self-start md:self-auto bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
              isPlaying
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Auto-Tour</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Tour</span>
              </>
            )}
          </button>

          <button
            onClick={() => setActiveStep(1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Restart Journey"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hospital Stations Pathway (Interactive Steps) */}
      <div className="relative z-10 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAGES.map((stage) => {
            const Icon = stage.icon
            const isActive = stage.id === activeStep
            const isPassed = stage.id < activeStep

            return (
              <button
                key={stage.id}
                onClick={() => {
                  setActiveStep(stage.id)
                  setIsPlaying(false)
                }}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-300 relative group cursor-pointer ${
                  isActive
                    ? `bg-slate-900/95 ${stage.borderClass} shadow-lg scale-[1.02]`
                    : isPassed
                    ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 opacity-90'
                    : 'bg-slate-950/50 border-slate-800/60 opacity-60 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full shadow-md shadow-emerald-400 animate-ping" />
                )}

                <div className="flex items-center space-x-2.5 mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-110 ${
                      isActive
                        ? `bg-gradient-to-tr ${stage.color} text-white shadow-md`
                        : isPassed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                    Step 0{stage.id}
                  </span>
                </div>

                <div className={`text-xs font-bold leading-snug line-clamp-1 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {stage.title.split('. ')[1]}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {stage.dept}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Animated Hospital Scene */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: Animated Human Character & Visual Stage Simulator (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950/95 rounded-3xl border border-slate-800 p-5 sm:p-7 relative overflow-hidden shadow-inner min-h-[360px] flex flex-col justify-between">
          {/* Top Stage Bar */}
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Live Hospital Simulation
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {currentStage.dept}
            </span>
          </div>

          {/* Hospital Pathway Canvas with Animated Walking Character */}
          <div className="relative py-6 flex items-center justify-center min-h-[200px]">
            {/* Glowing Floor Track (Multi-Color) */}
            <div className="absolute inset-x-4 h-2 bg-gradient-to-r from-cyan-500 via-purple-500 via-rose-500 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] top-1/2 -translate-y-1/2" />

            {/* Department Markers Along Floor */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    s <= activeStep
                      ? 'bg-emerald-400 border-white shadow-[0_0_10px_#34d399]'
                      : 'bg-slate-900 border-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Animated Human Character Figure */}
            <motion.div
              key={activeStep}
              initial={{ scale: 0.8, x: -30, opacity: 0 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative z-20 flex flex-col items-center"
            >
              {/* Speech Bubble from Patient */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mb-3 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-emerald-500/50 text-emerald-200 text-xs font-semibold shadow-xl flex items-center space-x-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{currentStage.characterState}</span>
              </motion.div>

              {/* Patient Character Avatar with Walking Animation */}
              <div className="relative">
                {/* Multi-Color Aura */}
                <div
                  className="absolute -inset-3 rounded-full opacity-40 blur-md animate-pulse"
                  style={{ backgroundColor: currentStage.accentColor }}
                />

                {/* SVG Stylized Human Figure */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-900/95 border-2 border-emerald-400/80 p-3 shadow-2xl flex items-center justify-center relative z-10 backdrop-blur-md">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full text-emerald-300 drop-shadow-md"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Head */}
                    <circle cx="50" cy="22" r="12" className="fill-emerald-500/20 stroke-emerald-300" />
                    {/* Stethoscope / Badge Icon if in Doctor consult */}
                    {activeStep === 2 && (
                      <path d="M42 22 A8 8 0 0 0 58 22" stroke="#a855f7" strokeWidth="2.5" />
                    )}
                    {/* Body */}
                    <path d="M50 35 L50 64" stroke="#34d399" strokeWidth="6" />
                    {/* Arms (Animated Walk Swing) */}
                    <motion.path
                      animate={{
                        d: isPlaying
                          ? ['M50 42 L32 55', 'M50 42 L68 55', 'M50 42 L32 55']
                          : 'M50 42 L32 55',
                      }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                      stroke="#34d399"
                      strokeWidth="5"
                    />
                    <motion.path
                      animate={{
                        d: isPlaying
                          ? ['M50 42 L68 55', 'M50 42 L32 55', 'M50 42 L68 55']
                          : 'M50 42 L68 55',
                      }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                      stroke="#34d399"
                      strokeWidth="5"
                    />
                    {/* Legs (Animated Walk) */}
                    <motion.path
                      animate={{
                        d: isPlaying
                          ? ['M50 64 L34 90', 'M50 64 L50 90', 'M50 64 L34 90']
                          : 'M50 64 L38 90',
                      }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                      stroke="#059669"
                      strokeWidth="5.5"
                    />
                    <motion.path
                      animate={{
                        d: isPlaying
                          ? ['M50 64 L66 90', 'M50 64 L50 90', 'M50 64 L66 90']
                          : 'M50 64 L62 90',
                      }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                      stroke="#059669"
                      strokeWidth="5.5"
                    />
                  </svg>
                </div>
              </div>

              {/* Station Action Badge */}
              <div className={`mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${currentStage.badgeClass}`}>
                <span>{currentStage.badge}</span>
              </div>
            </motion.div>
          </div>

          {/* Bottom Live Dialogue Narrative */}
          <div className="pt-3 border-t border-slate-800/80">
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed italic">
              &ldquo;{currentStage.dialogue}&rdquo;
            </p>
          </div>
        </div>

        {/* Right Side: Real-Time Patient Vitals HUD & Process Details (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Patient Bio-Telemetry HUD Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/90 border border-emerald-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Live Patient Telemetry HUD
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                {currentStage.vitals.status}
              </span>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Heart Rate</span>
                <span className="text-sm font-bold font-mono text-rose-400 flex items-center mt-0.5">
                  <HeartPulse className="w-3.5 h-3.5 mr-1 animate-ping" /> {currentStage.vitals.hr}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Blood Pressure</span>
                <span className="text-sm font-bold font-mono text-cyan-300 block mt-0.5">
                  {currentStage.vitals.bp} <span className="text-[10px] text-slate-500">mmHg</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Oxygen SpO2</span>
                <span className="text-sm font-bold font-mono text-emerald-400 block mt-0.5">
                  {currentStage.vitals.spo2}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Body Temp</span>
                <span className="text-sm font-bold font-mono text-amber-300 block mt-0.5">
                  {currentStage.vitals.temp}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Steps Checklist */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mr-1.5" />
              Automated Hospital Protocol
            </h4>

            <ul className="space-y-2 text-xs text-slate-300">
              {currentStage.details.map((detail, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">
                    ✓
                  </div>
                  <span className="leading-snug">{detail}</span>
                </li>
              ))}
            </ul>

            {/* Quick Action Link */}
            <div className="pt-2">
              <button
                onClick={onExploreAction}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold text-xs flex items-center justify-center shadow-lg shadow-emerald-500/20 group cursor-pointer transition"
              >
                <span>Experience Real Patient Portal</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
