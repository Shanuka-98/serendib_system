import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Hotel, MapPin, Star, Award, Clock, Shield, 
  Sparkles, ChevronRight, Calendar, Users
} from 'lucide-react'
import { format, addDays } from 'date-fns'

const HomePage = () => {
  const navigate = useNavigate()
  
  // Search form state
  const [branchId, setBranchId] = useState('')
  const [checkIn, setCheckIn] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 2), 'yyyy-MM-dd'))
  const [guests, setGuests] = useState('2')

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (branchId) params.set('branch_id', branchId)
    if (checkIn) params.set('check_in', checkIn)
    if (checkOut) params.set('check_out', checkOut)
    if (guests) params.set('guests', guests)
    navigate(`/rooms?${params.toString()}`)
  }

  const branches = [
    {
      id: 1,
      name: 'Colombo',
      location: 'Colombo Fort, Sri Lanka',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      rooms: 45,
      type: 'Business & City',
      color: 'from-primary-400 to-primary-600'
    },
    {
      id: 2,
      name: 'Mirissa',
      location: 'Mirissa Beach, Sri Lanka',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      rooms: 32,
      type: 'Beach Resort',
      color: 'from-peach-400 to-peach-600'
    },
    {
      id: 3,
      name: 'Kandy',
      location: 'Kandy City, Sri Lanka',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      rooms: 38,
      type: 'Hill Country',
      color: 'from-mint-400 to-mint-600'
    }
  ]

  const features = [
    {
      icon: Clock,
      title: 'Instant Booking',
      description: 'Book your perfect room in seconds with real-time availability',
      color: 'primary'
    },
    {
      icon: Award,
      title: 'Loyalty Rewards',
      description: 'Earn points with every stay and unlock exclusive benefits',
      color: 'lavender'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Multiple payment options with bank-level security',
      color: 'mint'
    },
    {
      icon: Sparkles,
      title: 'Premium Service',
      description: '24/7 concierge and personalized guest experiences',
      color: 'peach'
    }
  ]

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-peach-50 to-lavender-50">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-peach-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-lavender-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
              <span className="gradient-text">Experience</span>
              <br />
              <span className="text-gray-800">Luxury in Paradise</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Discover exceptional comfort and Sri Lankan hospitality across our boutique hotels in Colombo, Mirissa, and Kandy
            </p>

            {/* Search Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="glass rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <select 
                      className="input pl-10"
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                    >
                      <option value="">All Locations</option>
                      <option value="1">Colombo</option>
                      <option value="2">Mirissa</option>
                      <option value="3">Kandy</option>
                    </select>
                  </div>
                </div>
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input 
                      type="date" 
                      className="input pl-10"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input 
                      type="date" 
                      className="input pl-10"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn}
                    />
                  </div>
                </div>
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guests
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <select 
                      className="input pl-10"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                    >
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="3">3 Guests</option>
                      <option value="4">4+ Guests</option>
                    </select>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSearch}
                className="btn btn-primary w-full mt-6 text-lg py-4"
              >
                Search Available Rooms
                <ChevronRight className="inline ml-2 h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce"></div>
          </div>
        </motion.div>
      </section>

      {/* Branches Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Our <span className="gradient-text">Locations</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three unique destinations, one exceptional experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {branches.map((branch, index) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card card-hover overflow-hidden group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={branch.image}
                    alt={branch.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${branch.color} opacity-60`}></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-3xl font-display font-bold mb-2">{branch.name}</h3>
                    <p className="flex items-center text-white/90">
                      <MapPin className="h-4 w-4 mr-2" />
                      {branch.location}
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="badge badge-primary">{branch.type}</span>
                    <span className="text-gray-600 flex items-center">
                      <Hotel className="h-4 w-4 mr-1" />
                      {branch.rooms} Rooms
                    </span>
                  </div>
                  <Link to={`/rooms?branch_id=${branch.id}`}>
                    <button className="btn btn-secondary w-full">
                      View Rooms
                      <ChevronRight className="inline ml-2 h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Why Choose <span className="gradient-text">Serendib</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We combine luxury, technology, and Sri Lankan hospitality
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colorClasses = {
                primary: 'bg-primary-100 text-primary-600',
                lavender: 'bg-lavender-100 text-lavender-600',
                mint: 'bg-mint-100 text-mint-600',
                peach: 'bg-peach-100 text-peach-600'
              }

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className={`w-16 h-16 ${colorClasses[feature.color]} rounded-2xl flex items-center justify-center mx-auto mb-4 transform hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-500 via-lavender-500 to-peach-500">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div {...fadeInUp}>
            <Star className="h-16 w-16 mx-auto mb-6 animate-float" />
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Ready for Your Next Adventure?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Join our loyalty program and start earning rewards from your first booking
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <button className="btn bg-white text-primary-600 hover:bg-gray-100 shadow-lg px-8 py-4 text-lg">
                  Create Account
                </button>
              </Link>
              <Link to="/rooms">
                <button className="btn bg-white/10 backdrop-blur-lg text-white border-2 border-white/30 hover:bg-white/20 px-8 py-4 text-lg">
                  Browse Rooms
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage

