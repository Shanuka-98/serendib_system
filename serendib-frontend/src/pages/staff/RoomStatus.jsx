/**
 * Room Status Page - Staff View
 * View and manage room statuses in real-time
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Bed, RefreshCw, Filter, CheckCircle, XCircle, 
  Clock, Sparkles, Users, ChevronDown, Search
} from 'lucide-react'
import { roomAPI } from '../../services/api'
import { Modal } from '../../components/Modal'

const RoomStatusPage = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await roomAPI.getRooms({ include_all_statuses: true })
      setRooms(response.data.data?.rooms || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await roomAPI.updateRoom(roomId, { status: newStatus })
      await fetchRooms()
      setModalOpen(false)
    } catch (error) {
      console.error('Error updating room status:', error)
    }
  }

  // Status configuration
  const statusConfig = {
    available: { color: 'bg-mint-500', icon: CheckCircle, label: 'Available', bgLight: 'bg-mint-100 text-mint-700' },
    occupied: { color: 'bg-red-500', icon: Users, label: 'Occupied', bgLight: 'bg-red-100 text-red-700' },
    maintenance: { color: 'bg-amber-500', icon: Clock, label: 'Maintenance', bgLight: 'bg-amber-100 text-amber-700' },
    cleaning: { color: 'bg-lavender-500', icon: Sparkles, label: 'Cleaning', bgLight: 'bg-lavender-100 text-lavender-700' },
    reserved: { color: 'bg-purple-500', icon: Clock, label: 'Reserved', bgLight: 'bg-purple-100 text-purple-700' },
  }

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchesFilter = filter === 'all' || room.status === filter
    const matchesSearch = room.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          room.room_type?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Stats
  const stats = {
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
    cleaning: rooms.filter(r => r.status === 'cleaning').length,
    reserved: rooms.filter(r => r.status === 'reserved').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading rooms...</p>
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
                <Bed className="w-8 h-8 text-primary-500" />
                Room Status
              </h1>
              <p className="text-gray-600 mt-1">Real-time room availability and status</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Refresh"
              onClick={fetchRooms}
              className="btn btn-primary flex items-center justify-center p-2"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
        >
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon
            return (
              <motion.div
                key={key}
                whileHover={{ y: -4 }}
                onClick={() => setFilter(filter === key ? 'all' : key)}
                className={`bg-white rounded-xl p-4 shadow-soft cursor-pointer transition-all ${
                  filter === key ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${config.bgLight.split(' ')[1]}`} />
                  <span className={`text-2xl font-bold ${config.bgLight.split(' ')[1]}`}>
                    {stats[key]}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{config.label}</p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by room number or type..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </motion.div>

        {/* Room Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {filteredRooms.map((room, index) => {
            const config = statusConfig[room.status] || statusConfig.available
            const Icon = config.icon
            
            return (
              <motion.div
                key={room.room_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.05, y: -4 }}
                onClick={() => { setSelectedRoom(room); setModalOpen(true) }}
                className="bg-white rounded-xl shadow-soft overflow-hidden cursor-pointer hover:shadow-lg transition-all"
              >
                {/* Status bar */}
                <div className={`h-2 ${config.color}`} />
                
                <div className="p-4 text-center">
                  <p className="text-lg font-bold text-gray-800">{room.room_number}</p>
                  <p className="text-xs text-gray-500 mb-2">{room.room_type}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgLight}`}>
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <Bed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No rooms match your filters</p>
          </div>
        )}

        {/* Room Detail Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Room ${selectedRoom?.room_number}`}
          size="md"
        >
          {selectedRoom && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Room Type</p>
                  <p className="font-semibold text-gray-800">{selectedRoom.room_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Floor</p>
                  <p className="font-semibold text-gray-800">{selectedRoom.floor || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-semibold text-gray-800">{selectedRoom.capacity} guests</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedRoom.status]?.bgLight || 'bg-gray-100 text-gray-700'}`}>
                    {statusConfig[selectedRoom.status]?.label || selectedRoom.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Change Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statusConfig).map(([key, config]) => {
                    const Icon = config.icon
                    const isActive = selectedRoom.status === key
                    return (
                      <motion.button
                        key={key}
                        whileHover={{ scale: isActive ? 1 : 1.02 }}
                        whileTap={{ scale: isActive ? 1 : 0.98 }}
                        onClick={() => !isActive && handleStatusChange(selectedRoom.room_id, key)}
                        disabled={isActive}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                          isActive 
                            ? `${config.color} text-white cursor-default` 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

export default RoomStatusPage
