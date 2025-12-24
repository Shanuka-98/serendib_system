import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, CheckCircle, Clock, User, Calendar, MapPin, 
  Camera, Upload, X, Filter, RefreshCw
} from 'lucide-react'
import { bookingAPI } from '../../services/api'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import { formatBookingRef } from '../../utils/helpers'

const CheckInOutPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, checkin, checkout
  const [photos, setPhotos] = useState({}) // Store uploaded photos by booking ID
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchBookings()
  }, [filter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      
      // Fetch both confirmed (for check-in) and checked_in (for check-out) bookings
      // unique list for 'all' view
      const promises = [
        bookingAPI.getBookings({ status: 'confirmed' }),
        bookingAPI.getBookings({ status: 'checked_in' })
      ]
      
      // If history is selected, fetch checked_out bookings too
      if (filter === 'history') {
        promises.push(bookingAPI.getBookings({ status: 'checked_out' }))
      }

      const responses = await Promise.all(promises)
      const confirmed = responses[0].data.data?.bookings || []
      const checkedIn = responses[1].data.data?.bookings || []
      const checkedOut = filter === 'history' ? (responses[2]?.data.data?.bookings || []) : []

      let results = []
      if (filter === 'all') {
        results = [...confirmed, ...checkedIn]
      } else if (filter === 'checkin') {
        results = confirmed
      } else if (filter === 'checkout') {
        results = checkedIn
      } else if (filter === 'history') {
        results = checkedOut
      }
      
      // Sort: History (newest first), Others (oldest first/chronological)
      results.sort((a, b) => {
        if (filter === 'history') {
           return new Date(b.check_out_date) - new Date(a.check_out_date)
        }
        const dateA = new Date(a.status === 'confirmed' ? a.check_in_date : a.check_out_date)
        const dateB = new Date(b.status === 'confirmed' ? b.check_in_date : b.check_out_date)
        return dateA - dateB
      })

      setBookings(results)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = (bookingId, event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size too large. Max 5MB.')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotos(prev => ({
          ...prev,
          [bookingId]: reader.result
        }))
        toast.success('Guest photo uploaded')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCheckIn = async (bookingId) => {
    try {
      const photo = photos[bookingId]
      await bookingAPI.checkIn(bookingId, photo ? { photo } : {})
      toast.success('Check-in successful', { toastId: `checkin-${bookingId}` })
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check in', { toastId: `checkin-error-${bookingId}` })
    }
  }

  const handleCheckOut = async (bookingId) => {
    try {
      await bookingAPI.checkOut(bookingId)
      toast.success('Check-out successful')
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check out')
    }
  }

  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      booking.user?.full_name?.toLowerCase().includes(search) ||
      booking.room?.room_number?.toLowerCase().includes(search) ||
      booking.booking_id?.toString().includes(search)
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
              Check-in / Check-out
            </h1>
            <p className="text-gray-600">Manage guest arrivals and departures</p>
          </div>
          <button 
            title="Refresh List"
            onClick={fetchBookings}
            className="btn btn-white flex items-center justify-center p-2 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search guest, room number, or booking ID..."
                className="input pl-12 pr-10 w-full"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-4 w-full md:w-auto">
              <div className="flex p-1 bg-gray-100 rounded-xl flex-1 md:flex-none">
                {['all', 'checkin', 'checkout'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === f
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {f === 'checkin' ? 'Check-in' : f === 'checkout' ? 'Check-out' : 'All'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setFilter('history')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all border ${
                  filter === 'history'
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                History
              </button>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-3xl border border-gray-100">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? `No results found for "${searchTerm}"`
                : "No guests scheduled for check-in or check-out at this time."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => {
              // Allow action if status matches, regardless of date (handle late checkins etc)
              const isCheckIn = booking.status === 'confirmed'
              const isCheckOut = booking.status === 'checked_in'
              const hasPhoto = photos[booking.booking_id]
              
              return (
                <motion.div
                  key={booking.booking_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-2xl p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                    {/* Guest Photo / Upload Section */}
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-100 flex items-center justify-center">
                        {hasPhoto ? (
                          <img 
                            src={hasPhoto} 
                            alt="Guest" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-gray-400" />
                        )}
                        
                        {/* Upload Overlay */}
                        {(isCheckIn || booking.status === 'confirmed') && (
                          <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera className="h-6 w-6 text-white mb-1" />
                            <span className="text-[10px] text-white font-medium">Add Photo</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden"
                              onChange={(e) => handlePhotoUpload(booking.booking_id, e)}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-3 mb-2">
                        <h3 className="text-xl font-display font-bold text-gray-800">
                          {booking.room?.room_number ? `Room ${booking.room.room_number}` : 'Unassigned'}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          booking.status === 'confirmed' ? 'bg-primary-100 text-primary-700' :
                          booking.status === 'checked_in' ? 'bg-mint-100 text-mint-700' :
                          booking.status === 'checked_out' ? 'bg-gray-100 text-gray-600' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {booking.status === 'confirmed' ? 'Confirmed' : 
                           booking.status === 'checked_in' ? 'Checked In' : 
                           booking.status === 'checked_out' ? 'Checked Out' : booking.status}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {formatBookingRef(booking.booking_id)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-primary-400" />
                          <span className="truncate" title={booking.user?.full_name}>
                            {booking.user?.full_name || 'Guest'}
                          </span>
                        </div>
                        {booking.status === 'checked_out' ? (
                          <>
                             <div className="flex items-center" title="Checked Out At">
                              <Clock className="h-4 w-4 mr-2 text-gray-400" />
                              <span>
                                {booking.checked_out_at ? format(new Date(booking.checked_out_at), 'MMM dd, HH:mm') : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">
                                ${parseFloat(booking.total_amount).toFixed(2)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-primary-400" />
                            <span>
                              {booking.check_in_date && booking.check_out_date ? 
                                `${format(new Date(booking.check_in_date), 'MMM dd')} - ${format(new Date(booking.check_out_date), 'MMM dd')}` : 'Dates N/A'}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-primary-400" />
                          <span className="truncate">
                            {booking.room?.branch?.name || booking.branch?.name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-primary-400" />
                          <span>{booking.nights || 1} Nights</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 w-full lg:w-auto mt-4 lg:mt-0">
                      {isCheckIn && booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCheckIn(booking.booking_id)}
                          className="btn btn-primary flex-1 lg:flex-none justify-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check In
                        </button>
                      )}
                      {isCheckOut && booking.status === 'checked_in' && (
                        <button
                          onClick={() => handleCheckOut(booking.booking_id)}
                          className="btn btn-peach flex-1 lg:flex-none justify-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check Out
                        </button>
                      )}
                      
                      {/* Status Indicators */}
                      {booking.status === 'checked_in' && !isCheckOut && (
                        <div className="px-4 py-2 bg-green-50 text-green-700 rounded-xl flex items-center justify-center lg:justify-start w-full lg:w-auto">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">Stay Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckInOutPage
