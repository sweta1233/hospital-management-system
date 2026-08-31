import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  notifications: [],
  unreadCount: 0,
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload.items || []
      state.unreadCount = action.payload.unread_count || 0
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload)
      if (!action.payload.is_read) {
        state.unreadCount += 1
      }
    },
    markAsRead: (state, action) => {
      const notif = state.notifications.find(n => n.id === action.payload)
      if (notif && !notif.is_read) {
        notif.is_read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach(n => n.is_read = true)
      state.unreadCount = 0
    },
  },
})

export const { setNotifications, addNotification, markAsRead, markAllRead } = notificationSlice.actions
export default notificationSlice.reducer
