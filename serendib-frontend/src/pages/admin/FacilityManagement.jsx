import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import {
  Building2, Plus, Edit2, Trash2, Save, X, Loader2,
  Waves, Dumbbell, Sparkles, Building, Clock, Users,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { facilityAPI, adminAPI } from '../../services/api'

const FacilityManagement = () => {
  const { user } = useAuth()
  const [facilities, setFacilities] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFacility, setEditingFacility] = useState(null)
  const [expandedFacility, setExpandedFacility] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedType, setSelectedType] = useState('')

  const [formData, setFormData] = useState({
    branch_id: '',
    name: '',
    facility_type: 'pool',
    description: '',
    capacity: 20,
    price_per_slot: 0,
    slot_duration_minutes: 60,
    requires_booking: true,
    is_guest_only: true,
    amenities: [],
    operating_hours: { open: '06:00', close: '20:00' },
    rules: ''
  })

  const [newAmenity, setNewAmenity] = useState('')
  const [showSlotModal, setShowSlotModal] = useState(false)
  const [slotData, setSlotData] = useState({
    start_time: '',
    end_time: '',
    day_of_week: 'all',
    max_capacity: ''
  })

  const facilityTypes = [
    { value: 'pool', label: 'Swimming Pool', icon: Waves },
    { value: 'gym', label: 'Fitness Center', icon: Dumbbell },
    { value: 'spa', label: 'Spa & Wellness', icon: Sparkles },
    { value: 'event_hall', label: 'Event Hall', icon: Building2 },
    { value: 'meeting_room', label: 'Meeting Room', icon: Building }
  ]

  useEffect(() => {
    fetchData()
  }, [selectedBranch, selectedType])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch all facilities first (without branch filter) to get all branches - explicitly include inactive
      const allFacilitiesRes = await facilityAPI.getFacilities({ is_active: 'false' })
      const allFacilitiesData = allFacilitiesRes.data.data || []
      
      // Extract unique branches from facilities
      const uniqueBranches = allFacilitiesData.reduce((acc, f) => {
        if (f.branch_id && !acc.find(b => b.branch_id === f.branch_id)) {
          acc.push({ branch_id: f.branch_id, name: f.branch_name })
        }
        return acc
      }, [])
      setBranches(uniqueBranches)
      
      // Now filter if needed
      if (selectedBranch || selectedType) {
        const filteredRes = await facilityAPI.getFacilities({ 
          branch_id: selectedBranch || undefined,
          facility_type: selectedType || undefined,
          is_active: 'false' // Admin needs to see all statuses
        })
        setFacilities(filteredRes.data.data || [])
      } else {
        setFacilities(allFacilitiesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load facilities')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingFacility(null)
    setFormData({
      branch_id: branches[0]?.branch_id || '',
      name: '',
      facility_type: 'pool',
      description: '',
      capacity: 20,
      price_per_slot: 0,
      slot_duration_minutes: 60,
      requires_booking: true,
      is_guest_only: true,
      amenities: [],
      operating_hours: { open: '06:00', close: '20:00' },
      rules: ''
    })
    setShowModal(true)
  }

  const handleEdit = (facility) => {
    setEditingFacility(facility)
    setFormData({
      branch_id: facility.branch_id,
      name: facility.name,
      facility_type: facility.facility_type,
      description: facility.description || '',
      capacity: facility.capacity,
      price_per_slot: facility.price_per_slot || 0,
      slot_duration_minutes: facility.slot_duration_minutes || 60,
      requires_booking: facility.requires_booking,
      is_guest_only: facility.is_guest_only,
      amenities: facility.amenities || [],
      operating_hours: facility.operating_hours || { open: '06:00', close: '20:00' },
      rules: facility.rules || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingFacility) {
        await facilityAPI.updateFacility(editingFacility.facility_id, formData)
        toast.success('Facility updated successfully')
      } else {
        await facilityAPI.createFacility(formData)
        toast.success('Facility created successfully')
      }
      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error('Error saving facility:', error)
      toast.error(error.response?.data?.message || 'Failed to save facility')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (facility) => {
    if (!confirm(`Are you sure you want to deactivate "${facility.name}"?`)) return

    try {
      await facilityAPI.deleteFacility(facility.facility_id)
      toast.success('Facility deactivated')
      fetchData()
    } catch (error) {
      console.error('Error deleting facility:', error)
      toast.error('Failed to deactivate facility')
    }
  }

  const handleToggleActive = async (facility) => {
    try {
      // Optimistic update
      setFacilities(prev => prev.map(f => 
        f.facility_id === facility.facility_id ? { ...f, is_active: !f.is_active } : f
      ))

      const response = await facilityAPI.updateFacility(facility.facility_id, { 
        is_active: !facility.is_active 
      })
      
      // Update with actual server response to ensure consistency
      if (response.data && response.data.data) {
        setFacilities(prev => prev.map(f => 
          f.facility_id === facility.facility_id ? response.data.data : f
        ))
        toast.success(response.data.data.is_active ? 'Facility activated' : 'Facility deactivated')
      }
    } catch (error) {
      console.error('Error toggling facility:', error)
      toast.error('Failed to update facility')
      // Revert on error by re-fetching
      fetchData() 
    }
  }

  const handleAddAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }))
      setNewAmenity('')
    }
  }

  const handleRemoveAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }))
  }

  const handleAddSlot = async (e) => {
    e.preventDefault()
    if (!expandedFacility) return

    try {
      await facilityAPI.createSlot(expandedFacility.facility_id, slotData)
      toast.success('Time slot added')
      setShowSlotModal(false)
      setSlotData({ start_time: '', end_time: '', day_of_week: 'all', max_capacity: '' })
      // Refresh facility to show new slot
      const res = await facilityAPI.getFacility(expandedFacility.facility_id, { include_slots: true })
      setExpandedFacility(res.data.data)
    } catch (error) {
      console.error('Error adding slot:', error)
      toast.error('Failed to add slot')
    }
  }

  const handleExpandFacility = async (facility) => {
    if (expandedFacility?.facility_id === facility.facility_id) {
      setExpandedFacility(null)
    } else {
      try {
        const res = await facilityAPI.getFacility(facility.facility_id, { include_slots: true })
        setExpandedFacility(res.data.data)
      } catch (error) {
        console.error('Error fetching facility details:', error)
      }
    }
  }

  const getTypeIcon = (type) => {
    const found = facilityTypes.find(t => t.value === type)
    return found?.icon || Building2
  }

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Free'
    return `Rs. ${price.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Facility Management</h1>
            <p className="text-gray-600">Manage pools, gyms, spas, and event venues</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Facility
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch.branch_id} value={branch.branch_id}>
                {branch.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="">All Types</option>
            {facilityTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Facilities List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          </div>
        ) : facilities.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No facilities found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {facilities.map(facility => {
              const Icon = getTypeIcon(facility.facility_type)
              const isExpanded = expandedFacility?.facility_id === facility.facility_id

              return (
                <motion.div
                  key={facility.facility_id}
                  layout
                  className="bg-white rounded-xl shadow-sm border"
                >
                  {/* Facility Row */}
                  <div className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${facility.is_active ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${!facility.is_active && 'text-gray-400'}`}>
                          {facility.name}
                        </h3>
                        {!facility.is_active && (
                          <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{facility.branch_name}</p>
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {facility.capacity}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {facility.slot_duration_minutes}min
                      </span>
                      <span className="font-medium text-gray-700">
                        {formatPrice(facility.price_per_slot)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(facility)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title={facility.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {facility.is_active ? (
                          <ToggleRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(facility)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-blue-500"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleExpandFacility(facility)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                        title="View slots"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Slots View */}
                  {isExpanded && expandedFacility && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="border-t bg-gray-50 p-4"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-700">Time Slots</h4>
                        <button
                          onClick={() => setShowSlotModal(true)}
                          className="text-sm text-sky-500 hover:text-sky-600 flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add Slot
                        </button>
                      </div>

                      {expandedFacility.slots?.length === 0 ? (
                        <p className="text-sm text-gray-500">No time slots configured</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {expandedFacility.slots?.map(slot => (
                            <div
                              key={slot.slot_id}
                              className="bg-white p-2 rounded border text-sm"
                            >
                              <div className="font-medium">{slot.start_time} - {slot.end_time}</div>
                              <div className="text-xs text-gray-500">
                                {slot.day_of_week === 'all' ? 'Every day' : slot.day_of_week}
                              </div>
                              <div className="text-xs text-gray-500">
                                Max: {slot.max_capacity}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Add/Edit Facility Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {editingFacility ? 'Edit Facility' : 'Add New Facility'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
                    <select
                      value={formData.branch_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, branch_id: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Select branch</option>
                      {branches.map(branch => (
                        <option key={branch.branch_id} value={branch.branch_id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={formData.facility_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, facility_type: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      {facilityTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Infinity Pool"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Describe the facility..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                      min="1"
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per Slot</label>
                    <input
                      type="number"
                      value={formData.price_per_slot}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_per_slot: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="100"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration (min)</label>
                    <input
                      type="number"
                      value={formData.slot_duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, slot_duration_minutes: parseInt(e.target.value) || 60 }))}
                      min="15"
                      step="15"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opens At</label>
                    <input
                      type="time"
                      value={formData.operating_hours.open}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        operating_hours: { ...prev.operating_hours, open: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Closes At</label>
                    <input
                      type="time"
                      value={formData.operating_hours.close}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        operating_hours: { ...prev.operating_hours, close: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requires_booking}
                      onChange={(e) => setFormData(prev => ({ ...prev, requires_booking: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Requires booking</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_guest_only}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_guest_only: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Hotel guests only</span>
                  </label>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                      className="flex-1 px-3 py-2 border rounded-lg"
                      placeholder="Add amenity..."
                    />
                    <button
                      type="button"
                      onClick={handleAddAmenity}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-sky-100 text-sky-700 rounded text-sm flex items-center gap-1"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => handleRemoveAmenity(amenity)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {editingFacility ? 'Update' : 'Create'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Slot Modal */}
        {showSlotModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl max-w-md w-full"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold">Add Time Slot</h3>
                <button onClick={() => setShowSlotModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSlot} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={slotData.start_time}
                      onChange={(e) => setSlotData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={slotData.end_time}
                      onChange={(e) => setSlotData(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select
                    value={slotData.day_of_week}
                    onChange={(e) => setSlotData(prev => ({ ...prev, day_of_week: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">Every Day</option>
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity (optional)</label>
                  <input
                    type="number"
                    value={slotData.max_capacity}
                    onChange={(e) => setSlotData(prev => ({ ...prev, max_capacity: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Leave empty to use facility default"
                    min="1"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSlotModal(false)}
                    className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                  >
                    Add Slot
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FacilityManagement
