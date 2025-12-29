import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, User, MapPin, Plus, X, ChevronLeft, ChevronRight,
  RefreshCw, Trash2, Edit2, Save
} from 'lucide-react'
import { shiftsAPI, adminAPI } from '../../services/api'
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, parseISO, isSameDay } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

const SHIFT_ROLES = [
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'spa', label: 'Spa' },
  { value: 'manager', label: 'Manager' },
  { value: 'security', label: 'Security' }
]

const StaffSchedulePage = () => {
  const { user } = useAuth()
  const [shifts, setShifts] = useState([])
  const [staff, setStaff] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [editingShift, setEditingShift] = useState(null)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetchData()
  }, [currentWeek, selectedBranch, selectedRole])

  const fetchData = async () => {
    try {
      setLoading(true)
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })

      const params = {
        start_date: format(weekStart, 'yyyy-MM-dd'),
        end_date: format(weekEnd, 'yyyy-MM-dd'),
      }
      if (selectedBranch) params.branch_id = selectedBranch

      const [shiftsRes, branchesRes] = await Promise.all([
        shiftsAPI.getShifts(params),
        isAdmin ? adminAPI.getBranches() : Promise.resolve({ data: { data: [] } })
      ])

      let fetchedShifts = shiftsRes.data?.data?.shifts || []
      
      // RESTRICTION: Managers/Front Desk see all; Others see only their own
      const isManagerial = user?.role_type === 'manager' || user?.role_type === 'front_desk' || user?.role === 'admin'
      
      if (!isManagerial && user?.user_id) {
        fetchedShifts = fetchedShifts.filter(s => s.user_id === user.user_id)
      }

      // Client-side role filtering
      if (selectedRole) {
        fetchedShifts = fetchedShifts.filter(s => s.role === selectedRole)
      }

      setShifts(fetchedShifts)
      setBranches(branchesRes.data?.data?.branches || branchesRes.data?.data || [])

      if (isAdmin) {
        const staffRes = await shiftsAPI.getStaffForScheduling({ branch_id: selectedBranch || undefined })
        setStaff(staffRes.data?.data?.staff || [])
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error)
      toast.error('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleAddShift = async (shiftData) => {
    try {
      await shiftsAPI.createShift(shiftData)
      toast.success('Shift created successfully')
      setShowAddModal(false)
      setSelectedDate(null)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create shift')
    }
  }

  const handleUpdateShift = async (shiftId, shiftData) => {
    try {
      await shiftsAPI.updateShift(shiftId, shiftData)
      toast.success('Shift updated successfully')
      setEditingShift(null)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update shift')
    }
  }

  const handleDeleteShift = async (shiftId) => {
    if (!confirm('Are you sure you want to delete this shift?')) return
    try {
      await shiftsAPI.deleteShift(shiftId)
      toast.success('Shift deleted')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete shift')
    }
  }

  const getWeekDays = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }

  const getShiftsForDay = (date) => {
    return shifts.filter(shift => {
      const shiftDate = parseISO(shift.start_time)
      return isSameDay(shiftDate, date)
    })
  }

  const weekDays = getWeekDays()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
              Staff Schedule
            </h1>
            <p className="text-gray-600">
              {isAdmin ? 'Manage staff shifts and assignments' : 'View your scheduled shifts'}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-white flex items-center justify-center p-2 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Controls */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Week Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="btn btn-secondary p-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center min-w-[200px]">
                <p className="text-lg font-semibold text-gray-800">
                  {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                </p>
              </div>
              <button
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="btn btn-secondary p-2"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2">
              {/* Role Filter */}
              {/* Role Filter - Only visible to Managers/Front Desk */}
              {(user?.role_type === 'manager' || user?.role_type === 'front_desk' || user?.role === 'admin') && (
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="input w-40"
                >
                  <option value="">All Departments</option>
                  {SHIFT_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Branch Filter (Admin only) */}
              {isAdmin && branches.length > 0 && (
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="input w-48"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-primary-50 border-b">
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-4 text-center border-r last:border-r-0 ${
                    isSameDay(day, new Date()) ? 'bg-primary-100' : ''
                  }`}
                >
                  <p className="text-sm text-gray-600">{format(day, 'EEE')}</p>
                  <p className={`text-lg font-bold ${
                    isSameDay(day, new Date()) ? 'text-primary-600' : 'text-gray-800'
                  }`}>
                    {format(day, 'd')}
                  </p>
                </div>
              ))}
            </div>

            {/* Shift Cells */}
            <div className="grid grid-cols-7 min-h-[400px]">
              {weekDays.map((day, idx) => {
                const dayShifts = getShiftsForDay(day)
                return (
                  <div
                    key={idx}
                    className={`p-2 border-r last:border-r-0 border-b ${
                      isSameDay(day, new Date()) ? 'bg-primary-50/50' : 'bg-white'
                    }`}
                  >
                    {/* Shifts for this day */}
                    <div className="space-y-2">
                      {dayShifts.map(shift => (
                        <motion.div
                          key={shift.shift_id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-2 bg-gradient-to-r from-primary-100 to-lavender-100 rounded-lg text-xs group relative"
                        >
                          <p className="font-semibold text-gray-800 truncate">{shift.user_name}</p>
                          <p className="text-gray-600">
                             {SHIFT_ROLES.find(r => r.value === shift.role)?.label || shift.role}
                          </p>
                          <p className="text-gray-500">
                            {format(parseISO(shift.start_time), 'HH:mm')} - {format(parseISO(shift.end_time), 'HH:mm')}
                          </p>
                          
                          {isAdmin && (
                            <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                              <button
                                onClick={() => setEditingShift(shift)}
                                className="p-1 bg-white rounded shadow hover:bg-gray-100"
                              >
                                <Edit2 className="h-3 w-3 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteShift(shift.shift_id)}
                                className="p-1 bg-white rounded shadow hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {/* Add Shift Button (Admin only) */}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setSelectedDate(day)
                            setShowAddModal(true)
                          }}
                          className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {(showAddModal || editingShift) && (
            <ShiftModal
              isOpen={showAddModal || !!editingShift}
              onClose={() => {
                setShowAddModal(false)
                setEditingShift(null)
                setSelectedDate(null)
              }}
              onSave={editingShift ? 
                (data) => handleUpdateShift(editingShift.shift_id, data) : 
                handleAddShift
              }
              shift={editingShift}
              selectedDate={selectedDate}
              staff={staff}
              branches={branches}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Shift Modal Component
const ShiftModal = ({ isOpen, onClose, onSave, shift, selectedDate, staff, branches }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    branch_id: '',
    start_time: '',
    end_time: '',
    role: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (shift) {
      setFormData({
        user_id: shift.user_id || '',
        branch_id: shift.branch_id || '',
        start_time: shift.start_time ? format(parseISO(shift.start_time), "yyyy-MM-dd'T'HH:mm") : '',
        end_time: shift.end_time ? format(parseISO(shift.end_time), "yyyy-MM-dd'T'HH:mm") : '',
        role: shift.role || '',
        notes: shift.notes || ''
      })
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        start_time: format(selectedDate, "yyyy-MM-dd'T'09:00"),
        end_time: format(selectedDate, "yyyy-MM-dd'T'17:00"),
      }))
    }
  }, [shift, selectedDate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.user_id || !formData.branch_id || !formData.role) {
      toast.error('Please fill in all required fields')
      return
    }
    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-gray-800">
            {shift ? 'Edit Shift' : 'Add Shift'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Staff Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff Member *
            </label>
            <select
              value={formData.user_id}
              onChange={(e) => {
                const selectedUserId = parseInt(e.target.value)
                const selectedStaff = staff.find(s => s.user_id === selectedUserId)
                setFormData({ 
                  ...formData, 
                  user_id: e.target.value,
                  branch_id: selectedStaff?.branch_id || formData.branch_id,
                  role: selectedStaff?.role_type || formData.role
                })
              }}
              className="input w-full"
              required
            >
              <option value="">Select Staff</option>
              {staff.map(s => (
                <option key={s.user_id} value={s.user_id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch *
            </label>
            <select
              value={formData.branch_id}
              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">Select Branch</option>
              {branches.map(b => (
                <option key={b.branch_id} value={b.branch_id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">Select Role</option>
              {SHIFT_ROLES.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input w-full"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex-1"
            >
              {saving ? 'Saving...' : (shift ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default StaffSchedulePage
