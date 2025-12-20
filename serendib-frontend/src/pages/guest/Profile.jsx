import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Shield, Save, Edit2 } from 'lucide-react'
import { authAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Update profile via API
      const response = await authAPI.getCurrentUser() // Assuming there's an update endpoint
      updateUser({ ...user, ...formData })
      toast.success('Profile updated successfully')
      setEditing(false)
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-display font-bold text-gray-800 mb-8">
          My Profile
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-800">
                Personal Information
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-secondary"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input"
                  disabled={!editing}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  className="input"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  disabled={!editing}
                />
              </div>

              {editing && (
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        full_name: user?.full_name || '',
                        email: user?.email || '',
                        phone: user?.phone || ''
                      })
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </motion.div>

          {/* Account Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="text-xl font-display font-bold text-gray-800 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary-500" />
              Account
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-semibold text-gray-800">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <span className="badge badge-success">Active</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email Verified</p>
                {user?.is_verified ? (
                  <span className="badge badge-success">Verified</span>
                ) : (
                  <span className="badge badge-warning">Not Verified</span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
