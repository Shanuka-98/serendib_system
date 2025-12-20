import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bed, Bath, Users, Square, Wifi, Car, Coffee,
  Waves, Mountain, Calendar, ArrowLeft, ArrowRight,
  Star, MapPin, CheckCircle, X
} from 'lucide-react'
import { roomAPI } from '../../services/api'
import { format } from 'date-fns'
import { toast } from 'react-toastify'

const RoomDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentImage, setCurrentImage] = useState(0)

  const checkIn = searchParams.get('check_in')
  const checkOut = searchParams.get('check_out')
  const guests = searchParams.get('guests') || '2'

  useEffect(() => {
    fetchRoomDetails()
  }, [id])

  const fetchRoomDetails = async () => {
    try {
      setLoading(true)
      const response = await roomAPI.getRoom(id)
      setRoom(response.data.data)
    } catch (error) {
      console.error('Error fetching room:', error)
      toast.error('Failed to load room details')
      navigate('/rooms')
    } finally {
      setLoading(false)
    }
  }

  const handleBookNow = () => {
    const params = new URLSearchParams({
      room_id: id,
      check_in: checkIn || '',
      check_out: checkOut || '',
      guests: guests
    })
    navigate(`/booking?${params.toString()}`)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getAmenityIcon = (amenity) => {
    const icons = {
      'WiFi': Wifi,
      'Parking': Car,
      'Coffee Maker': Coffee,
      'Beach Access': Waves,
      'Mountain View': Mountain
    }
    return icons[amenity] || CheckCircle
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room details...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return null
  }

  const images = room.image_urls || []
  const hasMultipleImages = images.length > 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Image Gallery */}
        <div className="relative mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-200 to-lavender-200" style={{ height: '500px' }}>
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImage]}
                alt={`Room ${room.room_number} - Image ${currentImage + 1}`}
                className="w-full h-full object-cover"
              />
              {hasMultipleImages && (
                <>
                  <button
                    onClick={() => setCurrentImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImage ? 'bg-white w-8' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Bed className="h-24 w-24 text-primary-400" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
                    {room.room_type?.charAt(0).toUpperCase() + room.room_type?.slice(1)} Room
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {room.branch?.name || 'Hotel'}
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-500 fill-current" />
                      <span>4.8</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary-600">
                    {formatPrice(room.price_per_night)}
                  </p>
                  <p className="text-sm text-gray-500">per night</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">
                Description
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {room.description || 'A beautifully appointed room designed for your comfort and relaxation. Features modern amenities and stunning views.'}
              </p>
            </motion.div>

            {/* Room Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">
                Room Features
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="font-semibold text-gray-800">{room.capacity} Guests</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-gray-600">Beds</p>
                    <p className="font-semibold text-gray-800">{room.capacity} Bed{room.capacity > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Square className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-gray-600">Floor</p>
                    <p className="font-semibold text-gray-800">Floor {room.floor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-gray-600">Bathroom</p>
                    <p className="font-semibold text-gray-800">Private</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-2xl p-6"
              >
                <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {room.amenities.map((amenity, idx) => {
                    const Icon = getAmenityIcon(amenity)
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Icon className="h-5 w-5 text-primary-500" />
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-6 sticky top-24"
            >
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">
                Book This Room
              </h2>

              {checkIn && checkOut ? (
                <div className="space-y-4 mb-6">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">Check-in</p>
                    <p className="font-semibold text-gray-800">
                      {format(new Date(checkIn), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">Check-out</p>
                    <p className="font-semibold text-gray-800">
                      {format(new Date(checkOut), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">Guests</p>
                    <p className="font-semibold text-gray-800">{guests} Guest{guests > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-200">
                  <p className="text-sm text-primary-700">
                    Select dates to see pricing and availability
                  </p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-3xl font-bold text-primary-600 mb-1">
                  {formatPrice(room.price_per_night)}
                </p>
                <p className="text-sm text-gray-500">per night</p>
              </div>

              <button
                onClick={handleBookNow}
                className="btn btn-primary w-full text-lg py-4"
              >
                {checkIn && checkOut ? 'Book Now' : 'Select Dates to Book'}
              </button>

              <div className="mt-6 space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-mint-500 mt-0.5 flex-shrink-0" />
                  <span>Free cancellation up to 24 hours</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-mint-500 mt-0.5 flex-shrink-0" />
                  <span>No prepayment needed</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-mint-500 mt-0.5 flex-shrink-0" />
                  <span>Instant confirmation</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomDetailsPage
