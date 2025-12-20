/**
 * Admin Profile Page
 * View and edit admin profile information
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Mail, Phone, Shield, Save, Camera, Key, 
  CheckCircle, AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import { toast } from 'react-toastify'

const AdminProfile = () => {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await authAPI.updateProfile(profileData)
      toast.success('Profile updated successfully')
      if (refreshUser) refreshUser()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      setLoading(true)
      await authAPI.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      })
      toast.success('Password changed successfully')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-800 flex items-center gap-3">
            <User className="w-8 h-8 text-primary-500" />
            My Profile
          </h1>
          <p className="text-gray-600 mt-1">Manage your account settings</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl overflow-hidden"
        >
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary-500 to-lavender-500 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{user?.full_name}</h2>
                <p className="text-white/80">{user?.email}</p>
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                  <Shield className="w-3 h-3" />
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'text-primary-600 border-b-2 border-primary-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Profile Info
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-4 font-medium transition-all ${
                  activeTab === 'security'
                    ? 'text-primary-600 border-b-2 border-primary-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Key className="w-4 h-4 inline mr-2" />
                Security
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleProfileSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="full_name"
                        value={profileData.full_name}
                        onChange={handleProfileChange}
                        className="input pl-10"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className="input pl-10"
                        placeholder="Enter your email"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        className="input pl-10"
                        placeholder="Enter your phone"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </div>
              </motion.form>
            )}

            {activeTab === 'security' && (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handlePasswordSubmit}
                className="space-y-6 max-w-md"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    className="input"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className="input"
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    className="input"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    {loading ? 'Changing...' : 'Change Password'}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminProfile
