import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BACKGROUND_IMAGES = [
  { id: 'bg1', src: '/images/background.png', label: 'AI Cyber Clinic' },
  { id: 'bg2', src: '/images/background2.png', label: 'Neural Diagnostic Lab' },
  { id: 'bg3', src: '/images/bg3.png', label: 'Digital Surgery Suite' },
  { id: 'bg4', src: '/images/bg4.png', label: 'Smart Telehealth Grid' },
  { id: 'bg5', src: '/images/bg5.png', label: 'Quantum Medical Core' },
]

export default function AppBackdrop({ opacity = 'opacity-20', showSwitcher = false }) {
  const [currentIdx, setCurrentIdx] = useState(0)

  // Auto-cycle through all 5 images every 8 seconds for a rich ambient experience
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % BACKGROUND_IMAGES.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#080c14]">
      {/* ── Low-Opacity 5-Image Ambient Layer with Smooth Crossfade ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={BACKGROUND_IMAGES[currentIdx].id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
          className={`absolute inset-0 ${opacity} bg-cover bg-center bg-no-repeat transition-all duration-1000`}
          style={{
            backgroundImage: `url(${BACKGROUND_IMAGES[currentIdx].src})`,
            filter: 'contrast(1.15) brightness(0.85) saturate(1.1)',
          }}
        />
      </AnimatePresence>

      {/* ── Modern Neutral Dark Graphite Gradient Overlays (Zero Deep Blue) ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080c14]/85 via-[#0a0e1a]/80 to-[#080c14]/95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-transparent via-[#080c14]/60 to-[#080c14]" />

      {/* ── Cyber Medical Ambient Light Flares ── */}
      <div
        className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-emerald-500/10 blur-[140px] animate-pulse pointer-events-none"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[150px] animate-pulse pointer-events-none"
        style={{ animationDuration: '9s' }}
      />
      <div
        className="absolute -bottom-40 left-1/4 w-[650px] h-[650px] rounded-full bg-purple-600/10 blur-[160px] animate-pulse pointer-events-none"
        style={{ animationDuration: '10s' }}
      />

      {/* ── Micro Cyber Grid Pattern ── */}
      <div className="absolute inset-0 ai-grid-overlay opacity-15 pointer-events-none" />

      {/* Optional Interactive Indicator Switcher (When pointer-events allowed on controls) */}
      {showSwitcher && (
        <div className="absolute bottom-4 right-4 z-50 pointer-events-auto flex items-center space-x-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 shadow-lg">
          <span className="text-[10px] font-mono font-bold text-emerald-400 mr-1.5 uppercase tracking-wider">
            AI Visuals:
          </span>
          {BACKGROUND_IMAGES.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIdx(idx)}
              title={img.label}
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
