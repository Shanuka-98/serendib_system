import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Public Pages
import HomePage from './pages/Home'
import LoginPage from './pages/auth/Login'
import RegisterPage from './pages/auth/Register'
import ForgotPasswordPage from './pages/auth/ForgotPassword'
import ResetPasswordPage from './pages/auth/ResetPassword'

// Guest Pages
import RoomSearchPage from './pages/guest/RoomSearch'
import RoomDetailsPage from './pages/guest/RoomDetails'
import BookingPage from './pages/guest/Booking'
import MyBookingsPage from './pages/guest/MyBookings'
import BookingDetailsPage from './pages/guest/BookingDetails'
import ServiceRequestsPage from './pages/guest/ServiceRequests'
import LoyaltyPage from './pages/guest/Loyalty'
import ProfilePage from './pages/guest/Profile'
import BookingSuccess from './pages/guest/BookingSuccess'
import BookingCancel from './pages/guest/BookingCancel'
import AboutPage from './pages/guest/About'
import ContactPage from './pages/guest/Contact'
import CareersPage from './pages/guest/Careers'
import PrivacyPage from './pages/guest/Privacy'

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard'
import CheckInOutPage from './pages/staff/CheckInOut'
import ServiceManagementPage from './pages/staff/ServiceManagement'
import RoomStatusPage from './pages/staff/RoomStatus'
import StaffBookingsPage from './pages/staff/Bookings'
import StaffSchedulePage from './pages/staff/StaffSchedule'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import RoomManagement from './pages/admin/RoomManagement'
import BranchManagement from './pages/admin/BranchManagement'
import AnalyticsPage from './pages/admin/Analytics'
import AuditLogsPage from './pages/admin/AuditLogs'
import AdminProfile from './pages/admin/Profile'
import AdminSettings from './pages/admin/Settings'
import PromotionsManagement from './pages/admin/PromotionsManagement'

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          
          {/* Guest Routes */}
          <Route path="/rooms" element={<RoomSearchPage />} />
          <Route path="/rooms/:id" element={<RoomDetailsPage />} />
          <Route path="/booking" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute roles={['guest']}><MyBookingsPage /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailsPage /></ProtectedRoute>} />
          <Route path="/service-requests" element={<ProtectedRoute><ServiceRequestsPage /></ProtectedRoute>} />
          <Route path="/loyalty" element={<ProtectedRoute><LoyaltyPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/booking/success" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
          <Route path="/booking/cancel" element={<ProtectedRoute><BookingCancel /></ProtectedRoute>} />
          
          {/* Staff Routes */}
          <Route path="/staff" element={<ProtectedRoute roles={['staff', 'admin']}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/bookings" element={<ProtectedRoute roles={['staff', 'admin']}><StaffBookingsPage /></ProtectedRoute>} />
          <Route path="/staff/check-in-out" element={<ProtectedRoute roles={['staff', 'admin']}><CheckInOutPage /></ProtectedRoute>} />
          <Route path="/staff/services" element={<ProtectedRoute roles={['staff', 'admin']}><ServiceManagementPage /></ProtectedRoute>} />
          <Route path="/staff/room-status" element={<ProtectedRoute roles={['staff', 'admin']}><RoomStatusPage /></ProtectedRoute>} />
          <Route path="/staff/schedule" element={<ProtectedRoute roles={['staff', 'admin']}><StaffSchedulePage /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/rooms" element={<ProtectedRoute roles={['admin']}><RoomManagement /></ProtectedRoute>} />
          <Route path="/admin/branches" element={<ProtectedRoute roles={['admin']}><BranchManagement /></ProtectedRoute>} />
          <Route path="/admin/promotions" element={<ProtectedRoute roles={['admin']}><PromotionsManagement /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['admin']}><AuditLogsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute roles={['admin']}><AdminProfile /></ProtectedRoute>} />
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}

export default App

