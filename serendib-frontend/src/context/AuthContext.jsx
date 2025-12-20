import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('access_token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
    
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password })
      const { user: userData, tokens } = response.data.data
      
      // Store tokens and user data
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      localStorage.setItem('user', JSON.stringify(userData))
      
      setUser(userData)
      setIsAuthenticated(true)
      
      toast.success('Welcome back!')
      return { success: true, user: userData }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.response?.data?.message || 'Login failed' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      toast.success('Registration successful! Please check your email to verify your account.')
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: error.response?.data?.message || 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      
      setUser(null)
      setIsAuthenticated(false)
      
      toast.info('You have been logged out')
    }
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    isGuest: user?.role === 'guest',
    isStaff: user?.role === 'staff',
    isAdmin: user?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

