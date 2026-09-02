import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, Shield } from 'lucide-react'
import api from '../services/api'
import AppBackdrop from '../components/AppBackdrop'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [resetToken, setResetToken] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
      if (res.data?.data?.reset_token) {
        setResetToken(res.data.data.reset_token)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-cyan-500 selection:text-white">
      {/* ── 5 AI Background Visuals Ambient Backdrop ── */}
      <AppBackdrop opacity="opacity-35" showSwitcher={false} />

      <div className="max-w-md w-full mx-auto relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center space-x-2 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="glass-panel rounded-3xl p-8 border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/60 relative bg-slate-900/90 backdrop-blur-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-sm text-slate-300">
              Enter your registered email address and we'll send you instructions to reset your password.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start space-x-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {submitted ? (
            <div className="text-center space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                <p className="font-semibold mb-1">Reset instructions sent!</p>
                <p className="text-xs text-slate-300">
                  If an account exists with this email, you will receive password reset instructions.
                </p>
              </div>

              {resetToken && (
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-left">
                  <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Direct Reset Link:</p>
                  <Link
                    to={`/reset-password/${resetToken}`}
                    className="text-xs text-cyan-300 hover:underline break-all block font-mono"
                  >
                    Click here to reset password directly
                  </Link>
                </div>
              )}

              <Link
                to="/patient/login"
                className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition"
              >
                <span>Return to Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending Instructions...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <Link
              to="/patient/login"
              className="text-xs text-slate-400 hover:text-cyan-400 transition"
            >
              Remember your password? <span className="text-cyan-400 font-semibold underline">Sign In</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
