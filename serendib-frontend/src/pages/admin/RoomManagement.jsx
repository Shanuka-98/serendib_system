import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, Edit2, Trash2, Bed, Building2, DollarSign,
  Users, CheckCircle, XCircle, Filter
} from 'lucide-react'
import { roomAPI, adminAPI } from '../../services/api'
import { toast } from 'react-toastify'

const RoomManagement = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [filters, setFilters] = useState({
    branch_id: '',
    room_type: '',
    status: '',
    search: ''
  })
  const [branches, setBranches] = useState([])

  useEffect(() => {
    fetchBranches()
  }, [])

  // Debounced search effect - only trigger fetchRooms when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRooms()
    }, 300) // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [filters.search, filters.branch_id, filters.room_type, filters.status])

  // Test backend connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health')
        const data = await response.json()
        console.log('Backend health check:', data)
      } catch (error) {
        console.error('Backend health check failed:', error)
      }
    }
    testConnection()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await adminAPI.getBranches()
      setBranches(response.data.data?.branches || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const params = { ...filters }
      
      // Keep search parameter even if it's empty string initially, but remove if truly empty
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })

      // For admin room management, always show all rooms unless status is explicitly filtered
      // BUT: Don't set include_all_statuses if there's a search term - let search filter naturally
      if (!params.status && !params.search) {
        params.include_all_statuses = 'true'
      }

      console.log('Fetching rooms with params:', params)
      console.log('Search term:', params.search)

      const response = await roomAPI.getRooms(params)
      console.log('API response:', response.data)

      // API returns: { success: true, message: "Success", data: { rooms: [...], pagination: {...} } }
      const apiResponse = response.data

      if (apiResponse?.data?.rooms) {
        const roomsData = apiResponse.data.rooms
        console.log('Found rooms:', roomsData.length, 'rooms')
        console.log('First room sample:', roomsData[0] || 'No rooms')
        setRooms(Array.isArray(roomsData) ? roomsData : [])
      } else if (apiResponse?.data?.rooms) {
        const roomsData = apiResponse.data.rooms
        console.log('Found rooms (fallback):', roomsData.length, 'rooms')
        setRooms(Array.isArray(roomsData) ? roomsData : [])
      } else {
        console.warn('No rooms found in response:', apiResponse)
        console.log('Full response structure:', JSON.stringify(apiResponse, null, 2))
        setRooms([])
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      })

      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Cannot connect to backend server. Please ensure the backend is running on http://localhost:5000')
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load rooms'
        toast.error(errorMessage)
      }
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return
    
    try {
      await roomAPI.deleteRoom(roomId)
      toast.success('Room deleted successfully')
      fetchRooms()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete room')
    }
  }

  const handleSave = async (roomData) => {
    try {
      console.log('handleSave called with:', roomData)
      if (editingRoom) {
        console.log('Updating room:', editingRoom.room_id)
        await roomAPI.updateRoom(editingRoom.room_id, roomData)
        toast.success('Room updated successfully')
      } else {
        console.log('Creating new room')
        await roomAPI.createRoom(roomData)
        toast.success('Room created successfully')
      }
      setShowModal(false)
      setEditingRoom(null)
      fetchRooms()
    } catch (error) {
      console.error('handleSave error:', error)
      toast.error(error.response?.data?.message || 'Failed to save room')
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getStatusBadge = (status) => {
    const badges = {
      available: 'badge-success',
      occupied: 'badge-primary',
      maintenance: 'badge-warning',
      cleaning: 'badge-secondary'
    }
    return badges[status] || 'badge-secondary'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
              Room Management
            </h1>
            <p className="text-gray-600">Manage all hotel rooms across branches</p>
          </div>
          <button
            onClick={() => {
              setEditingRoom(null)
              setShowModal(true)
            }}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Room
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
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Room number..."
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="inline h-4 w-4 mr-1" />
                Branch
              </label>
              <select
                value={filters.branch_id}
                onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                className="input"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Bed className="inline h-4 w-4 mr-1" />
                Type
              </label>
              <select
                value={filters.room_type}
                onChange={(e) => setFilters({ ...filters, room_type: e.target.value })}
                className="input"
              >
                <option value="">All Types</option>
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold text-gray-800 mb-2">
              No rooms found
            </h3>
            <p className="text-gray-600">Try adjusting your filters or add a new room</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, index) => (
              <motion.div
                key={room.room_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Room Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary-200 to-lavender-200">
                  {Array.isArray(room.image_urls) && room.image_urls.length > 0 && room.image_urls[0] ? (
                    <img
                      src={room.image_urls[0]}
                      alt={room.room_number}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bed className="h-16 w-16 text-primary-400" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`badge ${getStatusBadge(room.status)} capitalize`}>
                      {room.status}
                    </span>
                  </div>
                </div>

                {/* Room Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-display font-bold text-gray-800 mb-1">
                        Room {room.room_number}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {room.room_type} • Floor {room.floor}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Capacity
                      </span>
                      <span className="font-semibold text-gray-800">{room.capacity} guests</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Price
                      </span>
                      <span className="font-semibold text-primary-600">
                        {formatPrice(room.price_per_night)}/night
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        Branch
                      </span>
                      <span className="font-semibold text-gray-800">
                        {room.branch_name || '-'}
                      </span>
                    </div>
                  </div>

                  {room.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {room.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setEditingRoom(room)
                        setShowModal(true)
                      }}
                      className="btn btn-secondary flex-1"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(room.room_id)}
                      className="btn btn-secondary text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Room Edit Modal */}
        {showModal && (
          <RoomEditModal
            room={editingRoom}
            branches={branches}
            onClose={() => {
              setShowModal(false)
              setEditingRoom(null)
            }}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  )
}

// Room Edit Modal Component
const RoomEditModal = ({ room, branches, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    branch_id: room?.branch_id || '',
    room_number: room?.room_number || '',
    room_type: room?.room_type || 'standard',
    capacity: room?.capacity || 2,
    price_per_night: room?.price_per_night || 0,
    floor: room?.floor || 1,
    status: room?.status || 'available',
    description: room?.description || '',
    amenities: Array.isArray(room?.amenities) ? room.amenities.join(', ') : (room?.amenities || '')
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const submitData = {
        ...formData,
        branch_id: parseInt(formData.branch_id),
        capacity: parseInt(formData.capacity),
        price_per_night: parseFloat(formData.price_per_night),
        floor: parseInt(formData.floor),
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a)
      }
      console.log('Submitting room data:', submitData)
      await onSave(submitData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-6 max-w-2xl w-full my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-gray-800">
            {room ? 'Edit Room' : 'Add Room'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <XCircle className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch *
              </label>
              <select
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Number *
              </label>
              <input
                type="text"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                className="input"
                required
                placeholder="101"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type *
              </label>
              <select
                value={formData.room_type}
                onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                className="input"
                required
              >
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
                required
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity *
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="input"
                required
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor *
              </label>
              <input
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="input"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price/Night (LKR) *
              </label>
              <input
                type="number"
                value={formData.price_per_night}
                onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                className="input"
                required
                min="0"
                step="100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Room description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities (comma-separated)
            </label>
            <input
              type="text"
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              className="input"
              placeholder="WiFi, TV, Air Conditioning, Mini Bar"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Saving...' : room ? 'Update Room' : 'Create Room'}
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

export default RoomManagement
