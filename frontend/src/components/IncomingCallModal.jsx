import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
  User, Stethoscope, AlertTriangle, ShieldCheck, X,
  Maximize2, Minimize2, Sparkles, Clock, FileText, Send, Plus
} from 'lucide-react'
import {
  getSocket, acceptVideoCall, rejectVideoCall,
  endVideoCall, sendCallSignal
} from '../services/socket'
import api from '../services/api'

// Web Audio API Ringtone Synthesizer (No external audio file needed)
class RingtonePlayer {
  constructor() {
    this.audioCtx = null
    this.intervalId = null
    this.isPlaying = false
  }

  play() {
    if (this.isPlaying) return
    this.isPlaying = true
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return
      this.audioCtx = new AudioContextClass()

      const playChime = () => {
        if (!this.audioCtx || this.audioCtx.state === 'closed') return
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume()
        }

        const now = this.audioCtx.currentTime
        const osc1 = this.audioCtx.createOscillator()
        const osc2 = this.audioCtx.createOscillator()
        const gainNode = this.audioCtx.createGain()

        osc1.type = 'sine'
        osc2.type = 'sine'
        osc1.frequency.setValueAtTime(440, now) // A4
        osc2.frequency.setValueAtTime(480, now) // B4 tone

        // Pulsing volume envelope
        gainNode.gain.setValueAtTime(0, now)
        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
        gainNode.gain.linearRampToValueAtTime(0.25, now + 1.0)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.8)

        osc1.connect(gainNode)
        osc2.connect(gainNode)
        gainNode.connect(this.audioCtx.destination)

        osc1.start(now)
        osc2.start(now)
        osc1.stop(now + 1.85)
        osc2.stop(now + 1.85)
      }

      playChime()
      this.intervalId = setInterval(playChime, 3000)
    } catch (e) {
      console.warn('Web Audio ringtone unavailable:', e)
    }
  }

  stop() {
    this.isPlaying = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close()
      } catch (e) {}
      this.audioCtx = null
    }
  }
}

const ringtone = new RingtonePlayer()

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export default function IncomingCallModal() {
  const user = useSelector((state) => state.auth.user)
  const [incomingCall, setIncomingCall] = useState(null)
  const [activeCall, setActiveCall] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [callError, setCallError] = useState('')
  const [showNotesDrawer, setShowNotesDrawer] = useState(false)
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const timerIntervalRef = useRef(null)

  // Listen to Global Socket Events for Two-Way Calling
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const onIncomingCall = (data) => {
      console.log('📞 Incoming video consultation call:', data)
      setIncomingCall(data)
      ringtone.play()
    }

    const onCallAccepted = async (data) => {
      console.log('✅ Call accepted by peer:', data)
      ringtone.stop()
      setActiveCall((prev) => prev ? { ...prev, ...data } : data)
      initiateWebRTCOffer(data)
    }

    const onCallRejected = (data) => {
      console.log('❌ Call rejected / declined:', data)
      ringtone.stop()
      setCallError(data.reason || 'Call was declined by recipient.')
      setTimeout(() => {
        setCallError('')
        cleanupCall()
      }, 4000)
    }

    const onCallEnded = () => {
      console.log('📴 Call ended by peer')
      ringtone.stop()
      cleanupCall()
    }

    const onCallError = (data) => {
      console.warn('⚠️ Video Call restriction / error:', data.message)
      ringtone.stop()
      setCallError(data.message)
      setTimeout(() => {
        setCallError('')
        setIncomingCall(null)
      }, 5000)
    }

    const onVideoCallSignal = async (data) => {
      handleWebRTCSignal(data)
    }

    socket.on('incoming_call', onIncomingCall)
    socket.on('call_accepted', onCallAccepted)
    socket.on('call_rejected', onCallRejected)
    socket.on('call_ended', onCallEnded)
    socket.on('call_error', onCallError)
    socket.on('video_call_signal', onVideoCallSignal)

    return () => {
      socket.off('incoming_call', onIncomingCall)
      socket.off('call_accepted', onCallAccepted)
      socket.off('call_rejected', onCallRejected)
      socket.off('call_ended', onCallEnded)
      socket.off('call_error', onCallError)
      socket.off('video_call_signal', onVideoCallSignal)
    }
  }, [user])

  // Setup WebRTC Peer Connection and Local Media Stream
  const setupMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      return stream
    } catch (err) {
      console.warn('Camera / Audio permission error:', err)
      return null
    }
  }

  const createPeerConnection = (callRoom, targetUserId) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }

    const pc = new RTCPeerConnection(ICE_SERVERS)

    // Add local tracks to WebRTC connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current)
      })
    }

    // Handle remote media stream arrival
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    // Forward ICE candidates to peer via socket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendCallSignal({
          call_room: callRoom,
          target_user_id: targetUserId,
          candidate: event.candidate,
        })
      }
    }

    peerConnectionRef.current = pc
    return pc
  }

  const initiateWebRTCOffer = async (callData) => {
    const stream = await setupMediaStream()
    const targetUserId = callData.accepted_by_id || callData.receiver_id
    const pc = createPeerConnection(callData.call_room, targetUserId)

    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendCallSignal({
        call_room: callData.call_room,
        target_user_id: targetUserId,
        sdp: offer,
      })
    } catch (e) {
      console.warn('Error creating WebRTC offer:', e)
    }
  }

  const handleWebRTCSignal = async (signalData) => {
    const pc = peerConnectionRef.current
    if (signalData.sdp) {
      if (!pc) {
        await setupMediaStream()
        const newPc = createPeerConnection(signalData.call_room, signalData.sender_id)
        await newPc.setRemoteDescription(new RTCSessionDescription(signalData.sdp))
        if (signalData.sdp.type === 'offer') {
          const answer = await newPc.createAnswer()
          await newPc.setLocalDescription(answer)
          sendCallSignal({
            call_room: signalData.call_room,
            target_user_id: signalData.sender_id,
            sdp: answer,
          })
        }
      } else {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp))
        if (signalData.sdp.type === 'offer') {
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          sendCallSignal({
            call_room: signalData.call_room,
            target_user_id: signalData.sender_id,
            sdp: answer,
          })
        }
      }
    } else if (signalData.candidate && pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate))
      } catch (e) {
        console.warn('Error adding ICE candidate:', e)
      }
    }
  }

  // Answer Incoming Call
  const handleAcceptCall = async () => {
    if (!incomingCall) return
    ringtone.stop()
    const callData = incomingCall
    setIncomingCall(null)
    setActiveCall(callData)

    // Emit acceptance event
    acceptVideoCall({
      appointment_id: callData.appointment_id,
      call_room: callData.call_room,
      caller_id: callData.caller_id,
      user_id: user?.id,
      user_name: user?.full_name || 'Medical Specialist',
    })

    await setupMediaStream()
    createPeerConnection(callData.call_room, callData.caller_id)

    // Start timer
    setCallDuration(0)
    timerIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)
  }

  // Decline Incoming Call
  const handleRejectCall = () => {
    if (!incomingCall) return
    ringtone.stop()
    rejectVideoCall({
      appointment_id: incomingCall.appointment_id,
      caller_id: incomingCall.caller_id,
      call_room: incomingCall.call_room,
      reason: 'User is currently unavailable.',
    })
    setIncomingCall(null)
  }

  // End Active Call
  const handleEndActiveCall = () => {
    ringtone.stop()
    if (activeCall) {
      endVideoCall({
        appointment_id: activeCall.appointment_id,
        call_room: activeCall.call_room,
        user_id: user?.id,
      })
    }
    cleanupCall()
  }

  const cleanupCall = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    setActiveCall(null)
    setIncomingCall(null)
    setCallDuration(0)
  }

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

  const handleSaveNotes = async () => {
    if (!activeCall?.appointment_id || !clinicalNotes.trim()) return
    setSavingNotes(true)
    try {
      await api.put(`/appointments/${activeCall.appointment_id}/status`, {
        status: 'completed',
        notes: clinicalNotes,
      })
      alert('Consultation clinical summary saved successfully!')
      setShowNotesDrawer(false)
    } catch (e) {
      alert('Failed to save consultation summary.')
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <>
      {/* ── Error / Time Gating Toast ─────────────────────────────── */}
      <AnimatePresence>
        {callError && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
          >
            <div className="bg-rose-950/95 border border-rose-500/60 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-start space-x-3 text-rose-200">
              <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Consultation Alert</h4>
                <p className="text-xs text-rose-300 mt-1 leading-relaxed">{callError}</p>
              </div>
              <button onClick={() => setCallError('')} className="text-rose-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Incoming Video Call Banner Modal ──────────────────────── */}
      <AnimatePresence>
        {incomingCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-[#0b132b] border-2 border-cyan-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-cyan-500/20 text-center relative overflow-hidden"
            >
              {/* Pulsing ring background */}
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />
              <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 p-1 flex items-center justify-center relative">
                <span className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-75" />
                <div className="w-full h-full rounded-full bg-[#080e22] flex items-center justify-center text-cyan-300">
                  {incomingCall.caller_role === 'doctor' ? (
                    <Stethoscope className="w-10 h-10" />
                  ) : (
                    <User className="w-10 h-10" />
                  )}
                </div>
              </div>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Incoming Telehealth Call
              </span>

              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                {incomingCall.caller_name || 'Medical Specialist'}
              </h3>
              <p className="text-xs text-slate-400 capitalize mt-0.5">
                {incomingCall.caller_role === 'doctor' ? 'Attending Physician' : 'Registered Patient'}
                {incomingCall.appointment_id ? ` • Appt #${incomingCall.appointment_id}` : ''}
              </p>

              <div className="mt-4 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-300">
                🔒 Live WebRTC End-to-End Encrypted Consultation
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={handleRejectCall}
                  className="py-3.5 px-4 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white font-bold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg hover:shadow-rose-600/30"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>Decline</span>
                </button>

                <button
                  onClick={handleAcceptCall}
                  className="py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-emerald-500/30 hover:scale-[1.02]"
                >
                  <Video className="w-5 h-5 animate-pulse" />
                  <span>Accept Call</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Active WebRTC Video Consultation Window ───────────────── */}
      <AnimatePresence>
        {activeCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl h-[90vh] bg-[#080e22] border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
            >
              {/* Call Header */}
              <div className="h-16 px-6 bg-[#060b1b] border-b border-slate-800 flex items-center justify-between z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center">
                      Telehealth Session
                      <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                        {formatTimer(callDuration)}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      With {activeCall.caller_name || activeCall.receiver_name || 'Participant'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowNotesDrawer(!showNotesDrawer)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
                      showNotesDrawer
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Clinical Notes</span>
                  </button>
                </div>
              </div>

              {/* Video Area Grid */}
              <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
                {/* Remote Stream Video Element */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Remote Video Fallback Avatar when remote track not yet streamed */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 -z-0 pointer-events-none">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3">
                    <User className="w-12 h-12" />
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    {activeCall.caller_name || activeCall.receiver_name || 'Consultation Participant'}
                  </h4>
                  <p className="text-xs text-cyan-400 mt-1 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 animate-pulse" />
                    HD Audio / Video Stream Connected
                  </p>
                </div>

                {/* Local Camera Tile (Picture-in-Picture) */}
                <div className="absolute bottom-4 right-4 w-40 sm:w-56 h-28 sm:h-36 bg-slate-900 border-2 border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl z-20">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                  />
                  {isVideoOff && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                      <CameraOff className="w-6 h-6 mb-1" />
                      <span>Camera Off</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white font-semibold">
                    You {isMuted ? '(Muted)' : ''}
                  </div>
                </div>

                {/* Clinical Notes Drawer Overlay */}
                <AnimatePresence>
                  {showNotesDrawer && (
                    <motion.div
                      initial={{ x: 320 }}
                      animate={{ x: 0 }}
                      exit={{ x: 320 }}
                      className="absolute right-0 top-0 bottom-0 w-80 bg-[#080e22]/95 border-l border-slate-700 p-5 flex flex-col z-30 backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h4 className="text-sm font-bold text-white flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-cyan-400" />
                          Consultation Rx & Notes
                        </h4>
                        <button onClick={() => setShowNotesDrawer(false)} className="text-slate-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 py-4 flex flex-col">
                        <label className="text-xs text-slate-300 font-bold mb-1.5">
                          Clinical Findings & Rx:
                        </label>
                        <textarea
                          rows={10}
                          value={clinicalNotes}
                          onChange={(e) => setClinicalNotes(e.target.value)}
                          placeholder="Document patient symptoms, diagnosis, prescribed dosages, and lab recommendations here..."
                          className="flex-1 w-full p-3 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none font-mono"
                        />
                      </div>

                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes || !clinicalNotes.trim()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{savingNotes ? 'Saving...' : 'Save & Attach to Record'}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Call Controls Bar */}
              <div className="h-20 bg-[#060b1b] border-t border-slate-800 flex items-center justify-center space-x-4 px-6 z-10">
                <button
                  onClick={toggleMute}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isVideoOff
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                  title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleEndActiveCall}
                  className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center space-x-2 shadow-lg shadow-rose-600/30 transition-transform hover:scale-105 cursor-pointer"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>End Consultation</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
