import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { 
  Waves, Dumbbell, Sparkles, Building2, Users, Clock, 
  Calendar, ChevronRight, MapPin, Check, X, Loader2,
  Phone, Mail, Building, Send, Star, Filter, ArrowRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { facilityAPI, bookingAPI } from '../../services/api'

const Facilities = () => {
  const { user } = useAuth()
  const [facilities, setFacilities] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [bookingData, setBookingData] = useState({
    booking_date: '',
    slot_id: null,
    number_of_guests: 1,
    special_requests: ''
  })
  const [inquiryData, setInquiryData] = useState({
    booking_date: '',
    event_type: '',
    event_name: '',
    number_of_guests: 50,
    start_time: '',
    end_time: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    organization: '',
    special_requests: '',
    selected_addons: []
  })
  const [availableSlots, setAvailableSlots] = useState([])
  const [activeBookings, setActiveBookings] = useState([])
  const [availableAddons, setAvailableAddons] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const facilityIcons = {
    pool: Waves,
    gym: Dumbbell,
    spa: Sparkles,
    event_hall: Building2,
    meeting_room: Building
  }

  const facilityColors = {
    pool: { gradient: 'from-cyan-500 via-blue-500 to-blue-600', bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
    gym: { gradient: 'from-orange-500 via-red-500 to-rose-600', bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600' },
    spa: { gradient: 'from-purple-500 via-pink-500 to-rose-500', bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600' },
    event_hall: { gradient: 'from-amber-500 via-yellow-500 to-orange-500', bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
    meeting_room: { gradient: 'from-emerald-500 via-teal-500 to-cyan-500', bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' }
  }

  useEffect(() => {
    fetchData()
  }, [selectedBranch, selectedType])

  useEffect(() => {
    if (user) {
      setInquiryData(prev => ({
        ...prev,
        contact_name: user.full_name || '',
        contact_email: user.email || '',
        contact_phone: user.phone || ''
      }))
      fetchActiveBookings()
    }
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const facilitiesRes = await facilityAPI.getFacilities({ 
        branch_id: selectedBranch || undefined,
        facility_type: selectedType || undefined
      })
      const facilitiesData = facilitiesRes.data.data || []
      setFacilities(facilitiesData)
      
      if (branches.length === 0 && facilitiesData.length > 0) {
        const uniqueBranches = []
        const seenIds = new Set()
        facilitiesData.forEach(f => {
          if (f.branch_id && !seenIds.has(f.branch_id)) {
            seenIds.add(f.branch_id)
            uniqueBranches.push({ branch_id: f.branch_id, name: f.branch_name })
          }
        })
        setBranches(uniqueBranches)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load facilities')
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveBookings = async () => {
    try {
      const res = await bookingAPI.getBookings({ status: 'confirmed' })
      setActiveBookings(res.data.data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const fetchSlots = async (facilityId, date) => {
    try {
      const res = await facilityAPI.getSlots(facilityId, date)
      setAvailableSlots(res.data.data?.slots || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
      setAvailableSlots([])
    }
  }

  const handleFacilityClick = async (facility) => {
    setSelectedFacility(facility)
    if (facility.facility_type === 'event_hall' || facility.facility_type === 'meeting_room') {
      // Fetch addons for this branch
      try {
        const res = await facilityAPI.getAddons({ branch_id: facility.branch_id })
        const addons = res.data.data || []
        // Deduplicate by name (in case of duplicate entries)
        const uniqueAddons = addons.filter((addon, index, self) => 
          index === self.findIndex(a => a.name === addon.name)
        )
        setAvailableAddons(uniqueAddons)
      } catch (error) {
        console.error('Error fetching addons:', error)
        setAvailableAddons([])
      }
      // Reset selected addons
      setInquiryData(prev => ({ ...prev, selected_addons: [] }))
      setShowInquiryModal(true)
    } else {
      const today = new Date().toISOString().split('T')[0]
      setShowBookingModal(true)
      setBookingData({
        booking_date: today,
        slot_id: null,
        number_of_guests: 1,
        special_requests: ''
      })
      // Fetch slots for today immediately
      fetchSlots(facility.facility_id, today)
    }
  }

  const handleDateChange = (e) => {
    const date = e.target.value
    setBookingData(prev => ({ ...prev, booking_date: date, slot_id: null }))
    if (selectedFacility && date) {
      fetchSlots(selectedFacility.facility_id, date)
    }
  }

  const handleSlotSelect = (slot) => {
    setBookingData(prev => ({ ...prev, slot_id: slot.slot_id }))
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    if (!bookingData.slot_id) {
      toast.error('Please select a time slot')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        facility_id: selectedFacility.facility_id,
        booking_date: bookingData.booking_date,
        slot_id: bookingData.slot_id,
        number_of_guests: bookingData.number_of_guests,
        special_requests: bookingData.special_requests,
        payment_type: selectedFacility.price_per_slot > 0 ? 'add_to_bill' : 'free'
      }

      await facilityAPI.createFacilityBooking(payload)
      toast.success('Booking confirmed!')
      setShowBookingModal(false)
      setSelectedFacility(null)
    } catch (error) {
      console.error('Booking error:', error)
      toast.error(error.response?.data?.message || 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInquirySubmit = async (e) => {
    e.preventDefault()
    if (!inquiryData.booking_date || !inquiryData.event_type) {
      toast.error('Please fill in required fields')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        facility_id: selectedFacility.facility_id,
        ...inquiryData
      }

      await facilityAPI.createFacilityBooking(payload)
      toast.success('Inquiry submitted! Our team will contact you shortly.')
      setShowInquiryModal(false)
      setSelectedFacility(null)
    } catch (error) {
      console.error('Inquiry error:', error)
      toast.error(error.response?.data?.message || 'Failed to submit inquiry')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Free'
    return `Rs. ${price.toLocaleString()}`
  }

  const groupedFacilities = facilities.reduce((acc, facility) => {
    const type = facility.facility_type
    if (!acc[type]) acc[type] = []
    acc[type].push(facility)
    return acc
  }, {})

  const typeLabels = {
    pool: 'Swimming Pools',
    gym: 'Fitness Centers',
    spa: 'Spa & Wellness',
    event_hall: 'Event Halls',
    meeting_room: 'Meeting Rooms'
  }

  const typeOrder = ['pool', 'gym', 'spa', 'event_hall', 'meeting_room']
  const sortedTypes = typeOrder.filter(type => groupedFacilities[type])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6bTAgMGMwLTItMi00LTItNHMtMiAyLTIgNCAyIDQgMiA0IDItMiAyLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">Premium Hotel Amenities</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Experience Our World-Class
              <span className="block bg-gradient-to-r from-cyan-300 to-yellow-300 bg-clip-text text-transparent">
                Hotel Facilities
              </span>
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              From relaxing spa treatments to state-of-the-art fitness centers, discover everything you need for an unforgettable stay
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{facilities.length}</div>
                <div className="text-sm text-white/70">Facilities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{branches.length}</div>
                <div className="text-sm text-white/70">Locations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-white/70">Gym Access</div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 50L48 45C96 40 192 30 288 35C384 40 480 60 576 65C672 70 768 60 864 50C960 40 1056 30 1152 35C1248 40 1344 60 1392 70L1440 80V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z" fill="rgb(248 250 252)" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10 pb-16">
        {/* Filters Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-10 border border-gray-100"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filter Facilities</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm font-medium"
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
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm font-medium"
              >
                <option value="">All Facility Types</option>
                <option value="pool">🏊 Pools</option>
                <option value="gym">💪 Gyms</option>
                <option value="spa">✨ Spa & Wellness</option>
                <option value="event_hall">🎉 Event Halls</option>
                <option value="meeting_room">🏢 Meeting Rooms</option>
              </select>

              {(selectedBranch || selectedType) && (
                <button
                  onClick={() => { setSelectedBranch(''); setSelectedType(''); }}
                  className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-sky-200 rounded-full animate-pulse"></div>
              <Loader2 className="w-8 h-8 animate-spin text-sky-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-500 mt-4">Loading facilities...</p>
          </div>
        ) : facilities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Facilities Found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or check back later</p>
            <button 
              onClick={() => { setSelectedBranch(''); setSelectedType(''); }}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium transition-colors"
            >
              Clear All Filters
            </button>
          </motion.div>
        ) : (
          /* Facility Cards by Type */
          <div className="space-y-12">
            {sortedTypes.map((type, typeIndex) => {
              const items = groupedFacilities[type]
              const colors = facilityColors[type] || facilityColors.pool
              const Icon = facilityIcons[type] || Building2
              
              return (
                <motion.section
                  key={type}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: typeIndex * 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-xl ${colors.light} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{typeLabels[type]}</h2>
                      <p className="text-sm text-gray-500">{items.length} {items.length === 1 ? 'facility' : 'facilities'} available</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((facility, index) => {
                      const FacilityIcon = facilityIcons[facility.facility_type] || Building2
                      const fColors = facilityColors[facility.facility_type] || facilityColors.pool
                      const isEventType = facility.facility_type === 'event_hall' || facility.facility_type === 'meeting_room'
                      
                      return (
                        <motion.div
                          key={facility.facility_id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -8, transition: { duration: 0.2 } }}
                          className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden cursor-pointer border border-gray-100 transition-shadow duration-300"
                          onClick={() => handleFacilityClick(facility)}
                        >
                          {/* Card Header with Image or Gradient */}
                          <div className="relative h-48 overflow-hidden">
                            {facility.images && facility.images.length > 0 ? (
                              <>
                                <img 
                                  src={facility.images[0]} 
                                  alt={facility.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent`}></div>
                              </>
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${fColors.gradient}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                              </div>
                            )}
                            
                            {/* Overlay Content */}
                            <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                              <div className="flex items-start justify-between">
                                <div className={`w-12 h-12 ${facility.images ? 'bg-white/20' : 'bg-white/20'} backdrop-blur-sm rounded-xl flex items-center justify-center`}>
                                  <FacilityIcon className="w-6 h-6" />
                                </div>
                                <div className={`px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm ${
                                  facility.price_per_slot > 0 
                                    ? 'bg-white/20' 
                                    : 'bg-green-500/40'
                                }`}>
                                  {formatPrice(facility.price_per_slot)}
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="text-xl font-bold mb-1 group-hover:translate-x-1 transition-transform drop-shadow-lg">
                                  {facility.name}
                                </h3>
                                <p className="flex items-center gap-1.5 text-sm text-white/90 drop-shadow">
                                  <MapPin className="w-4 h-4" />
                                  {facility.branch_name}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-5">
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                              {facility.description || 'Experience premium facilities designed for your comfort and enjoyment.'}
                            </p>

                            {/* Info Pills */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${fColors.light} ${fColors.text} text-xs font-medium`}>
                                <Users className="w-3.5 h-3.5" />
                                Up to {facility.capacity}
                              </span>
                              {facility.operating_hours && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
                                  <Clock className="w-3.5 h-3.5" />
                                  {facility.operating_hours.open} - {facility.operating_hours.close}
                                </span>
                              )}
                            </div>

                            {/* Amenities */}
                            {facility.amenities && facility.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {facility.amenities.slice(0, 3).map((amenity, idx) => (
                                  <span 
                                    key={idx}
                                    className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-md border border-gray-100"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                                {facility.amenities.length > 3 && (
                                  <span className="text-xs text-gray-400 px-2 py-1">
                                    +{facility.amenities.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Action Button */}
                            <button className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all group-hover:gap-3 ${
                              isEventType
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25'
                                : `bg-gradient-to-r ${fColors.gradient} text-white hover:shadow-lg`
                            }`}>
                              <span>{isEventType ? 'Make Inquiry' : 'Book Now'}</span>
                              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.section>
              )
            })}
          </div>
        )}

        {/* Slot Booking Modal */}
        <AnimatePresence>
          {showBookingModal && selectedFacility && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
              >
                <div className={`bg-gradient-to-br ${facilityColors[selectedFacility.facility_type]?.gradient || 'from-sky-500 to-blue-600'} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold">{selectedFacility.name}</h3>
                      <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {selectedFacility.branch_name}
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowBookingModal(false)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={bookingData.booking_date}
                      onChange={handleDateChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>

                  {bookingData.booking_date && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Available Time Slots
                      </label>
                      {availableSlots.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                          <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No slots available for this date</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {availableSlots.map(slot => (
                            <button
                              key={slot.slot_id}
                              type="button"
                              onClick={() => handleSlotSelect(slot)}
                              className={`p-3 rounded-xl border-2 text-sm transition-all h-fit ${
                                bookingData.slot_id === slot.slot_id
                                  ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md'
                                  : 'border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-white'
                              }`}
                            >
                              <div className="font-semibold">{slot.start_time} - {slot.end_time}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {slot.remaining_capacity} spots left
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-2" />
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      value={bookingData.number_of_guests}
                      onChange={(e) => setBookingData(prev => ({ ...prev, number_of_guests: parseInt(e.target.value) || 1 }))}
                      min="1"
                      max={selectedFacility.capacity}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={bookingData.special_requests}
                      onChange={(e) => setBookingData(prev => ({ ...prev, special_requests: e.target.value }))}
                      rows="2"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white resize-none"
                      placeholder="Any special requirements..."
                    />
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gradient-to-r from-gray-50 to-sky-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Total Price</span>
                      <span className="text-xl font-bold text-gray-800">
                        {formatPrice(selectedFacility.price_per_slot)}
                      </span>
                    </div>
                    {selectedFacility.price_per_slot > 0 && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500" />
                        Will be added to your room bill at checkout
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !bookingData.slot_id}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${facilityColors[selectedFacility.facility_type]?.gradient || 'from-sky-500 to-blue-600'} text-white hover:shadow-lg`}
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Confirm Booking
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Event Inquiry Modal */}
        <AnimatePresence>
          {showInquiryModal && selectedFacility && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 pt-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              >
                <div className={`bg-gradient-to-br ${facilityColors[selectedFacility.facility_type]?.gradient || 'from-amber-500 to-orange-600'} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative flex justify-between items-start">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm mb-2">
                        <Send className="w-3 h-3" />
                        Event Inquiry
                      </div>
                      <h3 className="text-2xl font-bold">{selectedFacility.name}</h3>
                      <p className="text-white/80 text-sm">{selectedFacility.branch_name}</p>
                    </div>
                    <button 
                      onClick={() => setShowInquiryModal(false)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleInquirySubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        value={inquiryData.booking_date}
                        onChange={(e) => setInquiryData(prev => ({ ...prev, booking_date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Event Type *
                      </label>
                      <select
                        value={inquiryData.event_type}
                        onChange={(e) => setInquiryData(prev => ({ ...prev, event_type: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="Wedding">Wedding</option>
                        <option value="Corporate">Corporate Event</option>
                        <option value="Conference">Conference</option>
                        <option value="Birthday">Birthday Party</option>
                        <option value="Anniversary">Anniversary</option>
                        <option value="Meeting">Business Meeting</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Event Name
                    </label>
                    <input
                      type="text"
                      value={inquiryData.event_name}
                      onChange={(e) => setInquiryData(prev => ({ ...prev, event_name: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white"
                      placeholder="e.g., Smith Wedding Reception"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Expected Guests
                      </label>
                      <input
                        type="number"
                        value={inquiryData.number_of_guests}
                        onChange={(e) => setInquiryData(prev => ({ ...prev, number_of_guests: parseInt(e.target.value) || 1 }))}
                        min="1"
                        max={selectedFacility.capacity}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={inquiryData.start_time}
                        onChange={(e) => setInquiryData(prev => ({ ...prev, start_time: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={inquiryData.end_time}
                        onChange={(e) => setInquiryData(prev => ({ ...prev, end_time: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <hr className="my-4 border-gray-100" />
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact Information
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        value={inquiryData.contact_name}
                        onChange={(e) => setInquiryData(prev => ({ ...prev, contact_name: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={inquiryData.contact_email}
                        onChange={(e) => setInquiryData(prev => ({ ...prev, contact_email: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={inquiryData.contact_phone}
                        onChange={(e) => setInquiryData(prev => ({ ...prev, contact_phone: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Organization
                      </label>
                      <input
                        type="text"
                        value={inquiryData.organization}
                        onChange={(e) => setInquiryData(prev => ({ ...prev, organization: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white"
                        placeholder="Company name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Special Requests
                    </label>
                    <textarea
                      value={inquiryData.special_requests}
                      onChange={(e) => setInquiryData(prev => ({ ...prev, special_requests: e.target.value }))}
                      rows="3"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-gray-50 focus:bg-white resize-none"
                      placeholder="Tell us about your event, catering preferences, decoration needs, etc."
                    />
                  </div>

                  {/* Add-ons Selection */}
                  {availableAddons.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Request Add-ons (Optional)
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                        {availableAddons.map(addon => {
                          const isSelected = inquiryData.selected_addons.some(a => a.addon_id === addon.addon_id)
                          return (
                            <label
                              key={addon.addon_id}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-sky-100 border border-sky-300' : 'bg-white border border-gray-100 hover:bg-gray-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setInquiryData(prev => ({
                                      ...prev,
                                      selected_addons: prev.selected_addons.filter(a => a.addon_id !== addon.addon_id)
                                    }))
                                  } else {
                                    setInquiryData(prev => ({
                                      ...prev,
                                      selected_addons: [...prev.selected_addons, addon]
                                    }))
                                  }
                                }}
                                className="w-4 h-4 text-sky-600 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{addon.name}</p>
                                <p className="text-xs text-gray-500">
                                  Rs. {addon.price} {addon.price_type === 'per_person' ? '/person' : ''}
                                </p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Manager will confirm availability and finalize pricing in the quote.
                      </p>
                    </div>
                  )}                  {/* Info Box */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                    <p className="text-sm text-amber-800">
                      <strong className="flex items-center gap-1 mb-1">
                        <Star className="w-4 h-4 text-amber-500" />
                        What happens next?
                      </strong>
                      Our events team will review your inquiry and send you a detailed quote within 24-48 hours. A 50% deposit is required to confirm your booking.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Inquiry
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Facilities
