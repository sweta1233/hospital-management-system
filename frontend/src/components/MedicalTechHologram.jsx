import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Activity, Microscope, Pill, Stethoscope, Sparkles,
  ShieldCheck, ArrowRight, HeartPulse, CheckCircle2, Zap,
  Play, Radio, Volume2, Cpu, Eye, FileText
} from 'lucide-react'

export default function MedicalTechHologram({ onAction }) {
  const [activeTab, setActiveTab] = useState(0)
  const [bpm, setBpm] = useState(78)
  const [scanProgress, setScanProgress] = useState(99.8)

  useEffect(() => {
    const interval = setInterval(() => {
      setBpm(74 + Math.floor(Math.random() * 8))
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const modules = [
    {
      id: 'telehealth',
      title: 'HD Telehealth',
      short: 'Teleconsult',
      icon: Video,
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/50',
      glow: 'shadow-cyan-500/25',
      badge: 'Live Video Feed Active',
      statLabel: 'Latency',
      statVal: '18ms HD'
    },
    {
      id: 'ai-scanner',
      title: 'AI Diagnostic',
      short: 'AI Neural',
      icon: Activity,
      color: 'from-purple-500 to-indigo-600',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/50',
      glow: 'shadow-purple-500/25',
      badge: 'Neural Network 99.8%',
      statLabel: 'Confidence',
      statVal: '99.85%'
    },
    {
      id: 'pathology',
      title: 'Pathology Lab',
      short: 'NABL Lab',
      icon: Microscope,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/50',
      glow: 'shadow-emerald-500/25',
      badge: 'Automated Analyzers',
      statLabel: 'TAT',
      statVal: 'Instant'
    },
    {
      id: 'pharmacy',
      title: 'Smart Pharmacy',
      short: 'Robo-Rx',
      icon: Pill,
      color: 'from-rose-500 to-amber-600',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/50',
      glow: 'shadow-rose-500/25',
      badge: 'Barcode 1-0-1 Verified',
      statLabel: 'Precision',
      statVal: '100% Barcode'
    }
  ]

  const current = modules[activeTab]

  return (
    <div className="relative rounded-3xl p-5 sm:p-6 glass-panel border-2 border-emerald-500/40 shadow-2xl bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950/95 overflow-hidden">
      {/* Laser Scanning Line moving down */}
      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none animate-scan-beam z-30" />

      {/* Cyber Grid background */}
      <div className="absolute inset-0 ai-grid-overlay opacity-30 pointer-events-none" />

      {/* Header Tabs */}
      <div className="relative z-20 flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black uppercase tracking-widest text-white">
            AI Hologram Studio
          </span>
        </div>
        <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          {modules.map((m, idx) => {
            const Icon = m.icon
            const isActive = activeTab === idx
            return (
              <button
                key={m.id}
                onClick={() => setActiveTab(idx)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-r ${m.color} text-white shadow-md`
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{m.short}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Animated Visual Canvas */}
      <div className="relative z-20 my-5 min-h-[260px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* TAB 0: HD TELEHEALTH ANIMATION */}
          {activeTab === 0 && (
            <motion.div
              key="telehealth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center"
            >
              <div className="relative w-full max-w-sm rounded-2xl bg-slate-950/90 border border-cyan-500/40 p-4 shadow-xl">
                {/* Doctor Video Box */}
                <div className="relative h-32 rounded-xl bg-gradient-to-tr from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 overflow-hidden flex items-center justify-between px-4">
                  <div className="flex items-center space-x-3 z-10">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                        <Stethoscope className="w-8 h-8" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Dr. Sarah Smith, MD</h4>
                      <p className="text-[11px] text-cyan-300 font-semibold">Chief Tele-Physician</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                        1080p 60FPS Encrypted
                      </span>
                    </div>
                  </div>

                  {/* Audio visualizer bars */}
                  <div className="flex items-end space-x-1 h-10 pr-2">
                    <div className="w-1.5 bg-cyan-400 rounded-full animate-eq-1" />
                    <div className="w-1.5 bg-cyan-300 rounded-full animate-eq-2" />
                    <div className="w-1.5 bg-emerald-400 rounded-full animate-eq-3" />
                    <div className="w-1.5 bg-teal-400 rounded-full animate-eq-4" />
                    <div className="w-1.5 bg-cyan-400 rounded-full animate-eq-5" />
                  </div>
                </div>

                {/* Sub features */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>256-bit HIPAA Video</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>Instant Live Rx Sync</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 1: AI NEURAL DIAGNOSTIC SCANNER */}
          {activeTab === 1 && (
            <motion.div
              key="ai-scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center"
            >
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* Rotating Outer Radar Ring */}
                <div className="absolute inset-0 rounded-full border border-dashed border-purple-500/40 animate-radar" />
                <div className="absolute inset-3 rounded-full border border-purple-400/20" />
                <div className="absolute inset-8 rounded-full border border-purple-500/40" />

                {/* Radar Sweep Needle */}
                <div className="absolute inset-0 rounded-full overflow-hidden animate-radar pointer-events-none">
                  <div className="w-1/2 h-1/2 bg-gradient-to-br from-purple-500/30 to-transparent origin-bottom-right" />
                </div>

                {/* Center Core Biometric Organ/ECG */}
                <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-600 flex flex-col items-center justify-center shadow-lg shadow-purple-500/40 text-white">
                  <HeartPulse className="w-9 h-9 animate-pulse" />
                  <span className="text-[10px] font-black font-mono mt-0.5">{bpm} BPM</span>
                </div>

                {/* Orbiting Abnormality Detector Pills */}
                <div className="absolute -top-1 -right-2 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-[9px] font-bold text-emerald-300 font-mono shadow-md">
                  ✓ 0 Criticals
                </div>
                <div className="absolute -bottom-1 -left-2 px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/50 text-[9px] font-bold text-purple-300 font-mono shadow-md">
                  99.8% Precision
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className="text-xs font-bold text-purple-300">
                  Real-Time Multi-Organ Diagnostic Scan
                </span>
                <p className="text-[11px] text-slate-400">
                  Automated vital analysis & symptom triage
                </p>
              </div>
            </motion.div>
          )}

          {/* TAB 2: PATHOLOGY LABORATORY ANIMATION */}
          {activeTab === 2 && (
            <motion.div
              key="pathology"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center"
            >
              <div className="relative w-full max-w-sm rounded-2xl bg-slate-950/90 border border-emerald-500/40 p-4 shadow-xl">
                <div className="flex items-center justify-around py-3">
                  {/* Test Tube 1 (Blood CBC) */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-8 h-24 rounded-full border-2 border-emerald-400/60 bg-slate-900/90 overflow-hidden flex flex-col justify-end p-1">
                      <div className="w-full h-14 rounded-b-full bg-gradient-to-t from-rose-600 via-rose-500 to-pink-500 relative">
                        <span className="absolute top-2 left-2 w-1.5 h-1.5 bg-white rounded-full animate-bubble-1" />
                        <span className="absolute top-4 left-3 w-1 h-1 bg-white rounded-full animate-bubble-2" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-rose-300 mt-1.5">CBC Blood</span>
                  </div>

                  {/* Centrifuge / Analyzer */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                      <Microscope className="w-9 h-9 animate-bounce" style={{ animationDuration: '2s' }} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-300 mt-2">NABL Analyzer</span>
                  </div>

                  {/* Test Tube 2 (Biochemistry) */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-8 h-24 rounded-full border-2 border-emerald-400/60 bg-slate-900/90 overflow-hidden flex flex-col justify-end p-1">
                      <div className="w-full h-16 rounded-b-full bg-gradient-to-t from-amber-500 via-yellow-400 to-emerald-400 relative">
                        <span className="absolute top-2 left-3 w-1.5 h-1.5 bg-white rounded-full animate-bubble-2" />
                        <span className="absolute top-5 left-1 w-1 h-1 bg-white rounded-full animate-bubble-3" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 mt-1.5">Biochem</span>
                  </div>
                </div>

                <div className="mt-2 p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-center text-[11px] font-semibold text-emerald-300">
                  Automated Reference Range Matching & PDF Slips
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: ROBOTIC E-PHARMACY ANIMATION */}
          {activeTab === 3 && (
            <motion.div
              key="pharmacy"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center"
            >
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* Glowing Capsule Animation */}
                <div className="w-28 h-14 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 p-1 shadow-xl shadow-rose-500/30 flex items-center justify-between border-2 border-white/20 transform -rotate-12 animate-float-slow">
                  <div className="w-1/2 h-full bg-rose-600 rounded-l-full flex items-center justify-center text-white font-mono font-black text-xs">
                    Rx
                  </div>
                  <div className="w-1/2 h-full bg-amber-400 rounded-r-full flex items-center justify-center text-slate-950 font-mono font-black text-xs">
                    1-0-1
                  </div>
                </div>

                {/* Orbiting molecular ring */}
                <div className="absolute inset-1 rounded-full border border-dashed border-rose-400/40 animate-radar" />
                <div className="absolute -top-1 -right-2 px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500/50 text-[9px] font-bold text-rose-300 font-mono shadow-md">
                  Stock Auto-Deduct
                </div>
                <div className="absolute -bottom-1 -left-2 px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/50 text-[9px] font-bold text-amber-300 font-mono shadow-md">
                  Barcode Safe
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className="text-xs font-bold text-rose-300">
                  Cloud-Synced Electronic Dispensary
                </span>
                <p className="text-[11px] text-slate-400">
                  Multi-dosage 1-0-1 schedule with barcode checks
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info & Portal Action Button */}
      <div className="relative z-20 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Live Status:</span>
          <span className={`font-mono font-bold ${current.textColor}`}>
            {current.badge}
          </span>
        </div>

        <button
          onClick={onAction}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r ${current.color} hover:opacity-90 text-white font-extrabold text-xs shadow-lg flex items-center justify-center space-x-2 cursor-pointer transition transform hover:-translate-y-0.5`}
        >
          <span>Open Patient Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
