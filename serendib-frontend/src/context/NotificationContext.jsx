import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'react-toastify'
import { notificationAPI } from '../services/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

// Notification sound (simple beep using Web Audio API)
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (error) {
    console.log('Could not play notification sound:', error)
  }
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      const response = await notificationAPI.getNotifications()
      const data = response.data.data
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [isAuthenticated])

  // Connect to Socket.IO when authenticated as staff/admin
  useEffect(() => {
    if (!isAuthenticated || !user) return
    
    // Only connect for staff and admin users
    if (user.role !== 'staff' && user.role !== 'admin') return
    
    const token = localStorage.getItem('access_token')
    if (!token) return

    // Create Socket.IO connection
    const socket = io('http://localhost:5000', {
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to server')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from server')
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error)
      setIsConnected(false)
    })

    // Handle incoming notifications
    socket.on('new_notification', (data) => {
      console.log('[Socket.IO] New notification:', data)
      
      // Play sound
      playNotificationSound()
      
      // Show toast notification
      const icon = data.type === 'booking' ? '🏨' : '🔔'
      toast.info(
        <div className="flex items-start gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="font-semibold">{data.title}</p>
            <p className="text-sm text-gray-600">{data.message}</p>
          </div>
        </div>,
        {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      )
      
      // Refresh notifications list
      fetchNotifications()
    })

    // Initial fetch
    fetchNotifications()

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, user, fetchNotifications])

  // Polling fallback when WebSocket is disconnected
  useEffect(() => {
    // Only poll for staff/admin users
    if (!isAuthenticated || !user) return
    if (user.role !== 'staff' && user.role !== 'admin') return
    
    // Skip polling if WebSocket is connected
    if (isConnected) return
    
    console.log('[Notifications] WebSocket disconnected, starting polling fallback')
    
    // Poll every 30 seconds when WebSocket is not available
    const pollInterval = setInterval(() => {
      console.log('[Notifications] Polling for new notifications...')
      fetchNotifications()
    }, 30000)
    
    return () => {
      clearInterval(pollInterval)
      console.log('[Notifications] Stopped polling fallback')
    }
  }, [isAuthenticated, user, isConnected, fetchNotifications])

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId)
      const notification = notifications.find(n => n.notification_id === notificationId)
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId))
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const value = {
    notifications,
    unreadCount,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
