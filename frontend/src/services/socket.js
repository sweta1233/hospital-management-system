import { io } from 'socket.io-client'

let socket = null

export const initSocket = (token, user = null) => {
  if (socket && socket.connected) {
    if (user?.id) {
      socket.emit('join_user_room', { user_id: user.id })
    }
    return socket
  }

  if (socket) {
    socket.disconnect()
  }

  const socketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    (import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : window.location.origin)

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  })

  socket.on('connect', () => {
    console.log('⚡ Socket connected:', socket.id)
    if (user?.id) {
      socket.emit('join_user_room', { user_id: user.id })
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('⚡ Socket disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.warn('⚡ Socket connection error:', err.message)
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// ── WebRTC & Video Call Signaling Helpers ──────────────────────────

export const initiateVideoCall = (callData) => {
  if (socket && socket.connected) {
    socket.emit('video_call_initiate', callData)
  }
}

export const acceptVideoCall = (acceptData) => {
  if (socket && socket.connected) {
    socket.emit('video_call_accept', acceptData)
  }
}

export const rejectVideoCall = (rejectData) => {
  if (socket && socket.connected) {
    socket.emit('video_call_reject', rejectData)
  }
}

export const endVideoCall = (endData) => {
  if (socket && socket.connected) {
    socket.emit('video_call_end', endData)
  }
}

export const sendCallSignal = (signalData) => {
  if (socket && socket.connected) {
    socket.emit('video_call_signal', signalData)
  }
}
