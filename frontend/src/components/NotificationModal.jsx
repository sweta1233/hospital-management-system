import React, { useState, useEffect } from 'react'
import { Bell, Check, Trash2, X, ExternalLink } from 'lucide-react'
import api from '../services/api'

export default function NotificationModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await api.get('/notifications?per_page=20')
      setNotifications(res.data?.data?.items || [])
    } catch (err) {
      console.error('Failed to load notifications', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (err) {
      console.error(err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/all-read')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-blue-600 text-white">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Notifications</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={markAllAsRead}
              className="text-xs bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded transition"
            >
              Mark all read
            </button>
            <button onClick={onClose} className="p-1 hover:bg-blue-700 rounded transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition ${
                  item.is_read ? 'bg-white border-gray-100' : 'bg-blue-50/70 border-blue-200 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                  {!item.is_read && (
                    <button
                      onClick={() => markAsRead(item.id)}
                      className="text-xs text-blue-600 hover:underline flex items-center"
                      title="Mark as read"
                    >
                      <Check className="h-3 w-3 mr-1" /> Read
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">{item.message}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                  <span className="capitalize px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                    {item.notification_type || 'General'}
                  </span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
