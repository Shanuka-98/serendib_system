import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, Calendar, Users, MapPin, Filter, 
  Star, Wifi, Car, Coffee, Waves, Mountain,
  Bed, Bath, Square, ArrowRight, X
} from 'lucide-react'
import { roomAPI } from '../../services/api'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import { RoomCardSkeleton } from '../../components/Skeletons'

const RoomSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Search filters
  const [branchId, setBranchId] = useState(searchParams.get('branch_id') || '')
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '')
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '')
  const [guests, setGuests] = useState(searchParams.get('guests') || '2')
  const [roomType, setRoomType] = useState(searchParams.get('room_type') || '')
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [showFilters, setShowFilters] = useState(false)
  
  // Data
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState([])
  
  const roomTypes = [
    { value: '', label: 'All Types' },
    { value: 'standard', label: 'Standard' },
    { value: 'deluxe', label: 'Deluxe' },
    { value: 'suite', label: 'Suite' },
    { value: 'penthouse', label: 'Penthouse' }
  ]

  useEffect(() => {
    fetchBranches()
    // Always search on initial load, even without dates
    searchRooms()
  }, [])

  const fetchBranches = async () => {
    try {
      // This would come from a branches API, for now using static data
      setBranches([
        { branch_id: 1, name: 'Colombo', location: 'Colombo Fort' },
        { branch_id: 2, name: 'Mirissa', location: 'Mirissa Beach' },
        { branch_id: 3, name: 'Kandy', location: 'Kandy City' }
      ])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const searchRooms = async () => {
    setLoading(true)
    try {
      const params = {
        branch_id: branchId || undefined,
        check_in: checkIn,
        check_out: checkOut,
        capacity: parseInt(guests) || undefined,
        room_type: roomType || undefined,
        min_price: priceRange[0] || undefined,
        max_price: priceRange[1] || undefined
      }
      
      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key]
        }
      })
      
      // Use getRooms endpoint which supports availability filtering
      const response = await roomAPI.getRooms(params)
      
      console.log('API Response:', response)
      console.log('Response data:', response.data)
      
      // API returns: { success: true, data: { rooms: [...], pagination: {...} } }
      const apiResponse = response.data
      const roomsData = apiResponse?.data?.rooms || apiResponse?.data || []
      
      console.log('Rooms data extracted:', roomsData)
      
      // Ensure rooms is always an array
      setRooms(Array.isArray(roomsData) ? roomsData : [])
      
      // Update URL params
      const newParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') newParams.set(key, value)
      })
      setSearchParams(newParams)
    } catch (error) {
      console.error('Error searching rooms:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      toast.error(error.response?.data?.message || 'Failed to search rooms')
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates')
      return
    }
    searchRooms()
  }

  const handleBookNow = (room) => {
    const params = new URLSearchParams({
      room_id: room.room_id,
      check_in: checkIn,
      check_out: checkOut,
      guests: guests
    })
    navigate(`/booking?${params.toString()}`)
  }

  const getAmenityIcon = (amenity) => {
    const icons = {
      'WiFi': Wifi,
      'Parking': Car,
      'Coffee Maker': Coffee,
      'Beach Access': Waves,
      'Mountain View': Mountain
    }
    return icons[amenity] || Star
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="input w-full"
              >
                <option value="">All Locations</option>
                {branches.map(branch => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.name} - {branch.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Check-in */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Check-in
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="input w-full"
                required
              />
            </div>

            {/* Check-out */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Check-out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || format(new Date(), 'yyyy-MM-dd')}
                className="input w-full"
                required
              />
            </div>

            {/* Guests & Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Guests
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  min="1"
                  max="10"
                  className="input flex-1"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary px-6 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Advanced Filters Toggle */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            {rooms.length > 0 && (
              <p className="text-sm text-gray-600">
                {rooms.length} room{rooms.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="input w-full"
                >
                  {roomTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    className="input flex-1"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="input flex-1"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={searchRooms}
                  className="btn btn-secondary w-full"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏨</div>
            <h3 className="text-2xl font-display font-bold text-gray-800 mb-2">
              No rooms found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or dates
            </p>
            <button
              onClick={() => {
                setCheckIn('')
                setCheckOut('')
                setRooms([])
              }}
              className="btn btn-secondary"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, index) => (
              <motion.div
                key={room.room_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl overflow-hidden hover:shadow-xl transition-shadow group"
              >
                {/* Room Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary-200 to-lavender-200 overflow-hidden">
                  {room.image_urls && room.image_urls[0] ? (
                    <img
                      src={room.image_urls[0]}
                      alt={room.room_number}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bed className="h-16 w-16 text-primary-400" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold text-primary-600">
                      {formatPrice(room.price_per_night)}
                      <span className="text-xs font-normal text-gray-500">/night</span>
                    </span>
                  </div>
                </div>

                {/* Room Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-display font-bold text-gray-800 mb-1">
                        {room.room_type?.charAt(0).toUpperCase() + room.room_type?.slice(1)} Room
                      </h3>
                      <p className="text-sm text-gray-500">
                        Room {room.room_number} • Floor {room.floor}
                      </p>
                    </div>
                    {/* Rating placeholder - would normally come from reviews */}
                    <div className="flex items-center text-yellow-500 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="ml-1 text-xs font-medium">4.8</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {room.description || 'Experience comfort and luxury in our well-appointed rooms, designed for your relaxation.'}
                  </p>

                  {/* Room Details */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-primary-500" />
                      {room.capacity} Guests
                    </div>
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1 text-primary-500" />
                      {room.floor} Floor
                    </div>
                  </div>

                  {/* Amenities */}
                  {room.amenities && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.amenities.slice(0, 3).map((amenity, idx) => {
                        const Icon = getAmenityIcon(amenity)
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 bg-white border border-gray-100 rounded-lg text-xs text-gray-600"
                          >
                            <Icon className="h-3 w-3 mr-1 text-primary-500" />
                            {amenity}
                          </span>
                        )
                      })}
                      {room.amenities.length > 3 && (
                        <span className="text-xs text-primary-600 font-medium self-center bg-primary-50 px-2 py-1 rounded-lg">
                          +{room.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={() => handleBookNow(room)}
                    className="btn btn-primary w-full group-hover:bg-primary-600 shadow-md group-hover:shadow-lg"
                  >
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RoomSearchPage
