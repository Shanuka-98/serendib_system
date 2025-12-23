import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          })
          
          const { access_token } = response.data.data
          localStorage.setItem('access_token', access_token)
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      // Don't show toast for network errors in interceptor - let component handle it
      console.error('Network error - backend may not be running')
      return Promise.reject(error)
    }

    // Show error toast for other errors
    const message = error.response?.data?.message || error.message || 'An error occurred'
    toast.error(message)

    return Promise.reject(error)
  }
)

export default api

// Auth API - handles user authentication flows
export const authAPI = {
  /** Register a new user account with email, password, and full_name */
  register: (data) => api.post('/auth/register', data),
  /** Authenticate user and receive JWT tokens */
  login: (data) => api.post('/auth/login', data),
  /** Invalidate current session */
  logout: () => api.post('/auth/logout'),
  /** Get new access token using refresh token */
  refresh: () => api.post('/auth/refresh'),
  /** Request password reset email */
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  /** Reset password using token from email */
  resetPassword: (data) => api.post('/auth/reset-password', data),
  /** Get current authenticated user profile */
  getCurrentUser: () => api.get('/auth/me'),
  /** Change password for authenticated user */
  changePassword: (data) => api.post('/auth/change-password', data),
}

// Room API - browse, search, and manage hotel rooms
export const roomAPI = {
  getRooms: (params) => api.get('/rooms', { params }),
  getRoom: (id) => api.get(`/rooms/${id}`),
  createRoom: (data) => api.post('/rooms/create', data),
  updateRoom: (id, data) => api.put(`/rooms/${id}`, data),
  deleteRoom: (id) => api.delete(`/rooms/${id}`),
  checkAvailability: (params) => api.get('/rooms/availability', { params }),
  getRoomTypes: (branchId) => api.get('/rooms/types', { params: { branch_id: branchId } }),
  /** Upload image for a new room (before room is created) */
  uploadImageNew: (formData) => api.post('/rooms/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  /** Upload image for an existing room (admin only) */
  uploadImage: (roomId, formData) => api.post(`/rooms/${roomId}/upload-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  /** Delete an image from a room (admin only) */
  deleteImage: (roomId, imageUrl) => api.delete(`/rooms/${roomId}/delete-image`, { params: { image_url: imageUrl } }),
}

// Booking API - create reservations, handle check-in and check-out
export const bookingAPI = {
  getBookings: (params) => api.get('/bookings', { params }),
  getBooking: (id) => api.get(`/bookings/${id}`),
  createBooking: (data) => api.post('/bookings', data),
  updateBooking: (id, data) => api.put(`/bookings/${id}`, data),
  cancelBooking: (id, reason) => api.delete(`/bookings/${id}`, { data: { cancellation_reason: reason } }),
  checkIn: (id, data) => api.post(`/bookings/${id}/checkin`, data),
  checkOut: (id) => api.post(`/bookings/${id}/checkout`),
  getUpcoming: (days) => api.get('/bookings/upcoming', { params: { days } }),
}

// Payment API - process transactions and handle refunds
export const paymentAPI = {
  processPayment: (data) => api.post('/payments', data),
  getPaymentHistory: (bookingId) => api.get(`/payments/${bookingId}`),
  getUserPayments: () => api.get('/payments/user'),
  processRefund: (data) => api.post('/payments/refund', data),
  getPaymentMethods: () => api.get('/payments/methods'),
}

// Service Request API - room service, housekeeping, and guest requests
export const serviceRequestAPI = {
  getRequests: (params) => api.get('/service-requests', { params }),
  getRequest: (id) => api.get(`/service-requests/${id}`),
  createRequest: (data) => api.post('/service-requests', data),
  updateRequest: (id, data) => api.put(`/service-requests/${id}`, data),
  cancelRequest: (id) => api.delete(`/service-requests/${id}`),
  getServiceTypes: () => api.get('/service-requests/types'),
}

// Notification API - alerts and messages for users
export const notificationAPI = {
  getNotifications: (unreadOnly) => api.get('/notifications', { params: { unread_only: unreadOnly } }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
}

// Loyalty API - points, tiers, and guest rewards program
export const loyaltyAPI = {
  getProfile: () => api.get('/loyalty/profile'),
  redeemPoints: (points) => api.post('/loyalty/redeem', { points }),
  getHistory: () => api.get('/loyalty/history'),
  getBenefits: () => api.get('/loyalty/benefits'),
  getTiers: () => api.get('/loyalty/tiers'),
}

// Admin API - user management, branch settings, and system reports
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getBranches: () => api.get('/admin/branches'),
  getBranchConfig: (id) => api.get(`/admin/branches/${id}/config`),
  updateBranch: (id, data) => api.put(`/admin/branches/${id}`, data),
  updateBranchConfig: (id, data) => api.put(`/admin/branches/${id}/config`, data),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  generateReports: (params) => api.get('/admin/reports', { params }),
  getLoyaltyStats: () => api.get('/admin/loyalty-stats'),
}

// Analytics API - revenue, occupancy, and booking trends
export const analyticsAPI = {
  getRevenue: (params) => api.get('/analytics/revenue', { params }),
  getOccupancy: (params) => api.get('/analytics/occupancy', { params }),
  getBookingTrends: (params) => api.get('/analytics/booking-trends', { params }),
  getCustomerInsights: (params) => api.get('/analytics/customer-insights', { params }),
}

// Stripe API - payment processing with Stripe
export const stripeAPI = {
  /** Create a Stripe payment intent for a booking */
  createPaymentIntent: (data) => api.post('/stripe/create-intent', data),
  /** Confirm payment after successful Stripe charge */
  confirmPayment: (data) => api.post('/stripe/confirm', data),
  /** Create a Stripe Checkout session for redirect-based payment */
  createCheckoutSession: (data) => api.post('/stripe/create-checkout-session', data),
}

