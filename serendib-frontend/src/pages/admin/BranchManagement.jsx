/**
 * Branch Management Page
 * View and edit hotel branches
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, MapPin, Phone, Mail, 
  Bed, Users, TrendingUp, Edit,
  RefreshCw, Save, Percent
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import { StatCard, StatCardGrid } from '../../components/StatCard'
import { Modal } from '../../components/Modal'
import { EmptyState } from '../../components/EmptyState'
import { toast } from 'react-toastify'

const BranchManagement = () => {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    city: '',
    address: '',
    tax_rate: '',
    service_charge_rate: '',
    contact_phone: '',
    contact_email: '',
  })

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getBranches()
      setBranches(response.data.data?.branches || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
      toast.error('Failed to load branches')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEdit = (branch) => {
    setSelectedBranch(branch)
    setEditForm({
      name: branch.name || '',
      location: branch.location || '',
      city: branch.city || '',
      address: branch.address || '',
      tax_rate: branch.tax_rate?.toString() || '',
      service_charge_rate: branch.service_charge_rate?.toString() || '10',
      contact_phone: branch.contact_info?.phone || '',
      contact_email: branch.contact_info?.email || '',
    })
    setEditModalOpen(true)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveBranch = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await adminAPI.updateBranch(selectedBranch.branch_id, {
        name: editForm.name,
        location: editForm.location,
        city: editForm.city,
        address: editForm.address,
        tax_rate: parseFloat(editForm.tax_rate),
        service_charge_rate: parseFloat(editForm.service_charge_rate),
        contact_info: {
          phone: editForm.contact_phone,
          email: editForm.contact_email,
        }
      })
      toast.success('Branch updated successfully')
      setEditModalOpen(false)
      await fetchBranches()
    } catch (error) {
      console.error('Error updating branch:', error)
      toast.error(error.response?.data?.message || 'Failed to update branch')
    } finally {
      setSaving(false)
    }
  }

  // Calculate totals
  const totalRooms = branches.reduce((sum, b) => sum + (b.statistics?.total_rooms || 0), 0)
  const availableRooms = branches.reduce((sum, b) => sum + (b.statistics?.available_rooms || 0), 0)
  const activeBookings = branches.reduce((sum, b) => sum + (b.statistics?.active_bookings || 0), 0)
  const avgOccupancy = branches.length > 0 
    ? (branches.reduce((sum, b) => sum + (b.statistics?.occupancy_rate || 0), 0) / branches.length).toFixed(1)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading branches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-800 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary-500" />
                Branch Management
              </h1>
              <p className="text-gray-600 mt-1">Manage hotel locations</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchBranches}
              className="p-2 bg-primary-500 text-white rounded-xl shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <StatCardGrid>
            <StatCard
              title="Total Branches"
              value={branches.length}
              icon={Building2}
              color="primary"
            />
            <StatCard
              title="Total Rooms"
              value={totalRooms}
              subtitle={`${availableRooms} available`}
              icon={Bed}
              color="mint"
            />
            <StatCard
              title="Active Bookings"
              value={activeBookings}
              icon={Users}
              color="peach"
            />
            <StatCard
              title="Avg Occupancy"
              value={`${avgOccupancy}%`}
              icon={TrendingUp}
              color="lavender"
            />
          </StatCardGrid>
        </motion.div>

        {/* Branches Grid */}
        {branches.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No branches found"
            description="There are no hotel branches configured in the system."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch, index) => (
              <motion.div
                key={branch.branch_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Branch Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-5 text-white relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleOpenEdit(branch)}
                    className="absolute top-3 right-3 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                    title="Edit Branch"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  <h3 className="text-xl font-bold">{branch.name}</h3>
                  <p className="text-primary-100 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {branch.city}
                  </p>
                </div>

                {/* Branch Details */}
                <div className="p-5">
                  <p className="text-sm text-gray-600 mb-4">{branch.address}</p>

                  {/* Contact Info */}
                  {branch.contact_info && (
                    <div className="space-y-2 mb-4">
                      {branch.contact_info.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {branch.contact_info.phone}
                        </div>
                      )}
                      {branch.contact_info.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {branch.contact_info.email}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-3 py-4 border-y border-gray-100">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">
                        {branch.statistics?.total_rooms || 0}
                      </p>
                      <p className="text-xs text-gray-500">Rooms</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-mint-600">
                        {branch.statistics?.available_rooms || 0}
                      </p>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {(branch.statistics?.occupancy_rate || 0).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">Occupancy</p>
                    </div>
                  </div>

                  {/* Rates */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tax Rate</span>
                      <span className="badge badge-lavender">{branch.tax_rate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Service Charge</span>
                      <span className="badge badge-warning">
                        {branch.service_charge_rate ? parseFloat(branch.service_charge_rate).toFixed(1) : '10.0'}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit Branch Modal */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit ${selectedBranch?.name}`}
          size="lg"
          headerIcon={Edit}
        >
          <form onSubmit={handleSaveBranch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={editForm.city}
                  onChange={handleEditChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleEditChange}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="tax_rate"
                    value={editForm.tax_rate}
                    onChange={handleEditChange}
                    className="input pr-10"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                   Service Charge (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="service_charge_rate"
                    value={editForm.service_charge_rate}
                    onChange={handleEditChange}
                    className="input pr-10"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Default is 10%</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={editForm.address}
                onChange={handleEditChange}
                className="input min-h-[80px]"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="contact_phone"
                    value={editForm.contact_phone}
                    onChange={handleEditChange}
                    className="input pl-10"
                    placeholder="+94 XX XXX XXXX"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="contact_email"
                    value={editForm.contact_email}
                    onChange={handleEditChange}
                    className="input pl-10"
                    placeholder="branch@serendibhotels.lk"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setEditModalOpen(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  )
}

export default BranchManagement
