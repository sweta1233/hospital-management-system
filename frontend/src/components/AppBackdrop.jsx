import React, { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export const BACKGROUND_IMAGES = [
  {
    id: 'bg1',
    src: '/images/background.png',
    label: 'AI Cyber Clinic',
    theme: 'emerald',
    description: 'Patient Wellness & Modern Hospital Care',
    matchPaths: ['/patient', '/patients', '/billing', '/forgot-password', '/reset-password']
  },
  {
    id: 'bg2',
    src: '/images/background2.png',
    label: 'Neural Diagnostic Lab',
    theme: 'teal',
    description: 'Pathology Diagnostics & AI Cancer ML',
    matchPaths: ['/laboratory', '/arogya-ai', '/cancer-prediction']
  },
  {
    id: 'bg3',
    src: '/images/bg3.png',
    label: 'Digital Surgery Suite',
    theme: 'cyan',
    description: 'Doctor Surgery & Clinical Operations',
    matchPaths: ['/doctor', '/admin', '/staff', '/admissions']
  },
  {
    id: 'bg4',
    src: '/images/bg4.png',
    label: 'Smart Telehealth Grid',
    theme: 'purple',
    description: 'HD Telemedicine & Hospital Comms',
    matchPaths: ['/appointments', '/chat', '/receptionist', '/nurse']
  },
  {
    id: 'bg5',
    src: '/images/bg5.png',
    label: 'Quantum Medical Core',
    theme: 'amber',
    description: 'AI Pharmacy & Digital E-Prescriptions',
    matchPaths: ['/pharmacy', '/prescriptions']
  },
]

function getInitialIndex(pathname, forceIndex) {
  if (typeof forceIndex === 'number' && forceIndex >= 0 && forceIndex < BACKGROUND_IMAGES.length) {
    return forceIndex
  }
  if (!pathname || pathname === '/') return 0

  const lower = pathname.toLowerCase()
  for (let i = 0; i < BACKGROUND_IMAGES.length; i++) {
    if (BACKGROUND_IMAGES[i].matchPaths.some((p) => lower.startsWith(p))) {
      return i
    }
  }
  return 0
}

export default function AppBackdrop({
  opacity = 'opacity-70',
  showSwitcher = false,
  forceIndex = null,
  autoCycle = null
}) {
  const location = useLocation()
  const pathname = location.pathname

  const routeIndex = useMemo(() => getInitialIndex(pathname, forceIndex), [pathname, forceIndex])
  const [currentIdx, setCurrentIdx] = useState(routeIndex)

  // Update background image when navigating between different routes/dashboards
  useEffect(() => {
    if (forceIndex === null) {
      setCurrentIdx(routeIndex)
    }
  }, [routeIndex, forceIndex])

  // Determine if this page should auto-cycle (default: true for landing page `/`, false for inner dashboards)
  const shouldAutoCycle = autoCycle !== null ? autoCycle : (pathname === '/')

  useEffect(() => {
    if (!shouldAutoCycle) return
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % BACKGROUND_IMAGES.length)
    }, 7500)
    return () => clearInterval(timer)
  }, [shouldAutoCycle])

  const activeImage = BACKGROUND_IMAGES[currentIdx] || BACKGROUND_IMAGES[0]

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#080c14]">
      {/* ── High-Visibility Ambient AI Background Image Layer with Crossfade ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={activeImage.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          className={`absolute inset-0 ${opacity} bg-cover bg-center bg-no-repeat transition-all duration-700`}
          style={{
            backgroundImage: `url(${activeImage.src})`,
            filter: 'contrast(1.12) brightness(1.05) saturate(1.30)',
          }}
        />
      </AnimatePresence>

      {/* ── Luminous Softened Graphite Ambient Overlay (Ensures AI Artwork is Crisp & High-Visibility) ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080c14]/20 via-[#0a0e1a]/10 to-[#080c14]/35" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-transparent via-[#080c14]/10 to-[#080c14]/30" />

      {/* ── Cyber Medical Ambient Light Flares ── */}
      <div
        className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-emerald-500/15 blur-[140px] animate-pulse pointer-events-none"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-cyan-500/15 blur-[150px] animate-pulse pointer-events-none"
        style={{ animationDuration: '9s' }}
      />
      <div
        className="absolute -bottom-40 left-1/4 w-[650px] h-[650px] rounded-full bg-purple-600/15 blur-[160px] animate-pulse pointer-events-none"
        style={{ animationDuration: '10s' }}
      />

      {/* ── Micro Cyber Grid Pattern ── */}
      <div className="absolute inset-0 ai-grid-overlay opacity-15 pointer-events-none" />

      {/* Optional Interactive Indicator Switcher (Allows switching theme/visual scene) */}
      {showSwitcher && (
        <div className="absolute bottom-4 right-4 z-50 pointer-events-auto flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-xl">
          <span className="text-[10px] font-mono font-bold text-emerald-400 mr-1.5 uppercase tracking-wider hidden sm:inline">
            {activeImage.label}:
          </span>
          {BACKGROUND_IMAGES.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIdx(idx)}
              title={`${img.label} - ${img.description}`}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentIdx === idx
                  ? 'bg-emerald-400 w-6 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-slate-600 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
