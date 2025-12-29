import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, roles = [], allowedRoleTypes = [] }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg-primary">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  if (allowedRoleTypes && allowedRoleTypes.length > 0) {
    // If user has no role_type (e.g. guest or old admin), access might be denied if strictly enforced
    // Assuming this prop is used mainly for staff routes where user.role === 'staff'
    if (!user?.role_type || !allowedRoleTypes.includes(user.role_type)) {
       // Redirect to a safe default for staff or home
       return <Navigate to="/staff/my-tasks" replace /> 
    }
  }

  return children
}

export default ProtectedRoute

