/**
 * Enhanced Room Card Component
 * Displays room information with hover animations and responsive design
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Users, Wifi, Wind, Tv, Bath, MapPin } from 'lucide-react'

// Map amenity names to icons
const amenityIcons = {
  wifi: Wifi,
  'air conditioning': Wind,
  ac: Wind,
  tv: Tv,
  bathroom: Bath,
  'en-suite': Bath,
}

export function RoomCard({ room, onBook }) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Default image if none provided
  const roomImage = room.images?.[0] || room.image || 
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'

  // Parse amenities if string
  const amenities = typeof room.amenities === 'string' 
    ? room.amenities.split(',').map(a => a.trim()).slice(0, 3)
    : (room.amenities || []).slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-xl transition-shadow duration-300"
    >
      {/* Image Container */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <motion.img
          src={roomImage}
          alt={room.room_number || 'Room'}
          onLoad={() => setImageLoaded(true)}
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.4 }}
          className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`
            px-3 py-1 rounded-full text-xs font-semibold
            ${room.status === 'available' 
              ? 'bg-mint-500 text-white' 
              : room.status === 'occupied'
                ? 'bg-red-500 text-white'
                : 'bg-gray-500 text-white'
            }
          `}>
            {room.status || 'Available'}
          </span>
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-3 right-3">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
            <span className="text-lg font-bold text-gray-900">
              LKR {(room.price_per_night || room.base_price || 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 ml-1">/night</span>
          </div>
        </div>

        {/* Hover Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
        />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {room.room_type || 'Deluxe Room'}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Room {room.room_number}
            </p>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-1 bg-primary-50 px-2 py-1 rounded-lg">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-gray-700">
              {room.rating || '4.8'}
            </span>
          </div>
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Users className="w-4 h-4" />
          <span>Up to {room.capacity || 2} guests</span>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {amenities.map((amenity, index) => {
            const IconComponent = amenityIcons[amenity.toLowerCase()] || Wifi
            return (
              <span
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600"
              >
                <IconComponent className="w-3 h-3" />
                {amenity}
              </span>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link 
            to={`/rooms/${room.room_id}`}
            className="flex-1 btn btn-secondary text-center py-2.5 text-sm"
          >
            View Details
          </Link>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onBook?.(room)}
            disabled={room.status !== 'available'}
            className={`
              flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${room.status === 'available'
                ? 'btn btn-primary'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {room.status === 'available' ? 'Book Now' : 'Unavailable'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// Room card grid wrapper with stagger animation
export function RoomCardGrid({ rooms, onBook, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-soft">
            <div className="h-48 sm:h-56 bg-gray-200 animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-10 bg-gray-200 rounded-xl animate-pulse flex-1" />
                <div className="h-10 bg-gray-200 rounded-xl animate-pulse flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No rooms found</h3>
        <p className="text-gray-500">Try adjusting your search filters</p>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.1 }
        }
      }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {rooms.map((room) => (
        <RoomCard key={room.room_id} room={room} onBook={onBook} />
      ))}
    </motion.div>
  )
}

export default RoomCard
