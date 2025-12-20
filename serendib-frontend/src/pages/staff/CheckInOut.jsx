import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, CheckCircle, Clock, User, Calendar, MapPin } from 'lucide-react'
import { bookingAPI } from '../../services/api'
import { format } from 'date-fns'
import { toast } from 'react-toastify'

const CheckInOutPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, checkin, checkout

  useEffect(() => {
    fetchBookings()
  }, [filter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await bookingAPI.getUpcoming(7)
      let bookings = response.data.data || []
      
      const today = format(new Date(), 'yyyy-MM-dd')
      if (filter === 'checkin') {
        bookings = bookings.filter(b => format(new Date(b.check_in), 'yyyy-MM-dd') === today && b.status === 'confirmed')
      } else if (filter === 'checkout') {
        bookings = bookings.filter(b => format(new Date(b.check_out), 'yyyy-MM-dd') === today && b.status === 'checked_in')
      }
      
      setBookings(bookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (bookingId) => {
    try {
      await bookingAPI.checkIn(bookingId)
      toast.success('Check-in successful')
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check in')
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
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
            Check-in / Check-out
          </h1>
          <p className="text-gray-600">Manage guest arrivals and departures</p>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, room number, or booking ID..."
                className="input pl-12"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'checkin', 'checkout'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    filter === f
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {f === 'checkin' ? 'Check-in' : f === 'checkout' ? 'Check-out' : 'All'}
                </button>
              ))}
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
          <div className="text-center py-20">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold text-gray-800 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => {
              const isCheckIn = format(new Date(booking.check_in), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              const isCheckOut = format(new Date(booking.check_out), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              
              return (
                <motion.div
                  key={booking.booking_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-2xl p-6"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl font-display font-bold text-gray-800">
                          Room {booking.room?.room_number}
                        </h3>
                        <span className="badge badge-primary">
                          Booking #{booking.booking_id}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {booking.user?.full_name}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd')}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {booking.room?.branch?.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {isCheckIn && booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCheckIn(booking.booking_id)}
                          className="btn btn-primary"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check In
                        </button>
                      )}
                      {isCheckOut && booking.status === 'checked_in' && (
                        <button
                          onClick={() => handleCheckOut(booking.booking_id)}
                          className="btn btn-peach"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check Out
                        </button>
                      )}
                      {booking.status === 'checked_in' && !isCheckOut && (
                        <span className="badge badge-success">Checked In</span>
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
