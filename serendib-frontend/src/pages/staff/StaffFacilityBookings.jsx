import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Calendar, Search, Filter, Clock, Users, DollarSign, RotateCcw,
  CheckCircle, XCircle, AlertCircle, MessageSquare, Plus
} from 'lucide-react'
import { facilityAPI } from '../../services/api'
import { format, parseISO } from 'date-fns'
import { toast } from 'react-toastify'
import { formatFacilityRef } from '../../utils/helpers'

import FacilityCalendar from './FacilityCalendar'

const StaffFacilityBookings = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('events') // 'events', 'facilities', 'all'

  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'

  useEffect(() => {
    if (viewMode === 'list') {
      fetchBookings()
    }
  }, [viewMode])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await facilityAPI.getFacilityBookings()
      if (response.data && response.data.data) {
        setBookings(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching facility bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'inquiry': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'quoted': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200'
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100'
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const filteredBookings = bookings.filter(booking => {
    // 1. Text Search Filter
    const matchesSearch = 
      booking.facility_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.booking_id?.toString().includes(searchTerm)

    if (!matchesSearch) return false

    // 2. Category Filter
    let matchesCategory = true
    if (activeCategory === 'events') {
      matchesCategory = ['event_hall', 'meeting_room'].includes(booking.facility_type || booking.facility?.facility_type)
    } else if (activeCategory === 'facilities') {
      matchesCategory = ['pool', 'gym', 'spa'].includes(booking.facility_type || booking.facility?.facility_type)
    }

    if (!matchesCategory) return false

    // 3. Status Filter
    if (filterStatus === 'all') return true
    if (filterStatus === 'inquiry') return (booking.status === 'inquiry' || booking.status === 'quoted')
    return booking.status === filterStatus
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event & Facility Bookings</h1>
            <p className="text-gray-500">Manage event halls, pools, and reservations</p>
          </div>
          <div className="flex gap-2 items-center">
             {/* View Toggle */}
            <div className="bg-white border rounded-lg p-1 flex items-center">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" /> List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'calendar' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="w-4 h-4" /> Calendar
              </button>
            </div>
            
            {viewMode === 'list' && (
              <button 
                onClick={() => fetchBookings()}
                className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-500 hover:text-primary-600 transition-colors"
                title="Refresh Bookings"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
           <button
             onClick={() => setActiveCategory('events')}
             className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
               activeCategory === 'events' 
                 ? 'border-primary-600 text-primary-600' 
                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
             }`}
           >
             <Calendar className="w-4 h-4" />
             Event Inquiries
           </button>
           <button
             onClick={() => setActiveCategory('facilities')}
             className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
               activeCategory === 'facilities' 
                 ? 'border-primary-600 text-primary-600' 
                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
             }`}
           >
             <RotateCcw className="w-4 h-4" />
             Facility Reservations
           </button>
           <button
             onClick={() => setActiveCategory('all')}
             className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
               activeCategory === 'all' 
                 ? 'border-primary-600 text-primary-600' 
                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
             }`}
           >
             All
           </button>
        </div>

        {viewMode === 'calendar' ? (
          <FacilityCalendar />
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                
                {/* Status Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'inquiry', label: 'Inquiries', count: bookings.filter(b => b.status === 'inquiry').length },
                    { id: 'pending', label: 'Pending' },
                    { id: 'confirmed', label: 'Confirmed' },
                    { id: 'history', label: 'History' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterStatus(tab.id)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                        filterStatus === tab.id 
                          ? 'bg-white text-primary-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredBookings.map((booking) => (
                  <motion.div
                    key={booking.booking_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => navigate(`/staff/facility-bookings/${booking.booking_id}`)}
                  >
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                      <div className="flex items-start gap-4">
                        {/* Date Box */}
                        <div className="flex flex-col items-center justify-center bg-gray-50 border rounded-lg w-16 h-16 min-w-[4rem]">
                          <span className="text-xs text-red-500 font-bold uppercase">
                            {booking.booking_date ? format(parseISO(booking.booking_date), 'MMM') : '-'}
                          </span>
                          <span className="text-xl font-bold text-gray-800">
                            {booking.booking_date ? format(parseISO(booking.booking_date), 'dd') : '-'}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-800 group-hover:text-primary-600 transition-colors">
                              {booking.event_name || booking.facility_name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                            <Users className="w-3.5 h-3.5" />
                            {booking.contact_name || booking.user_name || 'Guest'} 
                            <span className="text-gray-300">|</span> 
                            {booking.number_of_guests} Guests
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {booking.start_time?.slice(0,5)} - {booking.end_time?.slice(0,5)}
                            </span>
                            <span>
                              Ref: <span className="font-mono">{formatFacilityRef(booking.booking_id, booking.booking_date)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-center min-w-[8rem]">
                        {booking.status === 'inquiry' ? (
                          <div className="text-right">
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md mb-1 inline-block">
                              Action Required
                            </span>
                            <p className="text-xs text-gray-500">Needs Quote</p>
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {booking.total_amount !== null && booking.total_amount !== undefined ? (
                                parseFloat(booking.total_amount) === 0 ? (
                                  <span className="text-green-600">Free</span>
                                ) : (
                                  `Rs. ${parseFloat(booking.total_amount).toLocaleString()}` 
                                )
                              ) : (
                                'TBD'
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {booking.total_amount && parseFloat(booking.total_amount) > 0 ? (
                                booking.payment_status === 'paid' ? 'Paid' : 'Unpaid'
                              ) : null}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default StaffFacilityBookings
