import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Filter, Plus, Edit2, Trash2, User, Mail, Phone,
  Building2, Shield, CheckCircle, XCircle, MoreVertical
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import { format } from 'date-fns'
import { toast } from 'react-toastify'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [filters, setFilters] = useState({
    role: '',
    branch_id: '',
    is_active: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchUsers()
  }, [filters, pagination.page])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = {
        ...filters,
        page: pagination.page,
        per_page: pagination.per_page
      }
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key]
        }
      })
      
      const response = await adminAPI.getUsers(params)
      const data = response.data.data
      setUsers(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        pages: data.pages || 0
      }))
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setShowModal(true)
  }

  const handleSave = async (userData) => {
    try {
      await adminAPI.updateUser(editingUser.user_id, userData)
      toast.success('User updated successfully')
      setShowModal(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user')
    }
  }

  const handleToggleActive = async (user) => {
    try {
      await adminAPI.updateUser(user.user_id, {
        is_active: !user.is_active
      })
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`)
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'badge-error',
      staff: 'badge-primary',
      guest: 'badge-success'
    }
    return badges[role] || 'badge-secondary'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
              User Management
            </h1>
            <p className="text-gray-600">Manage all users, staff, and administrators</p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null)
              setShowModal(true)
            }}
            className="btn btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline h-4 w-4 mr-1" />
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Email or name..."
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="inline h-4 w-4 mr-1" />
                Role
              </label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="input"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="guest">Guest</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Status
              </label>
              <select
                value={filters.is_active}
                onChange={(e) => handleFilterChange('is_active', e.target.value)}
                className="input"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ role: '', branch_id: '', is_active: '', search: '' })}
                className="btn btn-secondary w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold text-gray-800 mb-2">
              No users found
            </h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Branch</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Joined</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.user_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-lavender-400 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{user.full_name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              {user.phone && (
                                <p className="text-xs text-gray-400 flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {user.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${getRoleBadge(user.role)} capitalize`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.branch ? (
                            <div className="flex items-center text-sm text-gray-600">
                              <Building2 className="h-4 w-4 mr-1" />
                              {user.branch.name}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {user.is_active ? (
                            <span className="badge badge-success flex items-center w-fit">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="badge badge-error flex items-center w-fit">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                              title="Edit User"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`p-2 rounded-lg transition-all ${
                                user.is_active
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-mint-600 hover:bg-mint-50'
                              }`}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {user.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.per_page) + 1} to {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} users
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.pages}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Edit User Modal */}
        {showModal && (
          <UserEditModal
            user={editingUser}
            onClose={() => {
              setShowModal(false)
              setEditingUser(null)
            }}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  )
}

// User Edit Modal Component
const UserEditModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    role: user?.role || 'guest',
    is_active: user?.is_active !== undefined ? user.is_active : true,
    branch_id: user?.branch_id || ''
  })
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await adminAPI.getBranches()
      setBranches(response.data.data?.branches || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-gray-800">
            {user ? 'Edit User' : 'Add User'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <XCircle className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {user && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">User</p>
            <p className="font-semibold text-gray-800">{user.full_name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
              required
            >
              <option value="guest">Guest</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch
            </label>
            <select
              value={formData.branch_id}
              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value || null })}
              className="input"
            >
              <option value="">No Branch</option>
              {branches.map(branch => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Active Account</span>
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default UserManagement
