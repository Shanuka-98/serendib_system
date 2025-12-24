import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Hotel, MapPin, Heart, Users, Award, 
  Sparkles, ChevronRight, Star
} from 'lucide-react'

const AboutPage = () => {
  const values = [
    {
      icon: Heart,
      title: 'Genuine Hospitality',
      description: 'We treat every guest like family, offering warm Sri Lankan hospitality that feels like home.',
      color: 'peach'
    },
    {
      icon: Award,
      title: 'Excellence in Service',
      description: 'From check-in to checkout, we strive for perfection in every interaction.',
      color: 'primary'
    },
    {
      icon: Users,
      title: 'Community Focus',
      description: 'We support local communities and sustainable tourism practices.',
      color: 'lavender'
    },
    {
      icon: Sparkles,
      title: 'Memorable Experiences',
      description: 'We create moments that guests cherish long after their stay.',
      color: 'mint'
    }
  ]

  const locations = [
    {
      name: 'Colombo',
      type: 'Business & City',
      description: 'Our flagship property in the heart of the commercial capital, perfect for business travelers and city explorers.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
    },
    {
      name: 'Mirissa',
      type: 'Beach Resort',
      description: 'A tropical paradise on the southern coast, ideal for whale watching and beach relaxation.',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
    },
    {
      name: 'Kandy',
      type: 'Hill Country',
      description: 'Nestled in the misty hills near the Temple of the Tooth, offering cultural immersion and scenic beauty.',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'
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
      <section className="relative py-24 bg-gradient-to-br from-primary-50 via-peach-50 to-lavender-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-peach-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeInUp}>
            <Hotel className="h-16 w-16 mx-auto mb-6 text-primary-500" />
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              About <span className="gradient-text">Serendib Hotels</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the magic of Sri Lanka through our collection of boutique hotels, 
              where luxury meets authentic island hospitality.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Our Story</h2>
            <p className="text-lg text-gray-600 mb-6">
              Founded with a vision to showcase the beauty of Sri Lanka, Serendib Hotels began 
              as a single property in Colombo in 2010. The name "Serendib" is the ancient Arabic 
              name for Sri Lanka, reflecting our deep connection to the island's rich heritage.
            </p>
            <p className="text-lg text-gray-600">
              Today, we operate three distinct properties across Sri Lanka's most captivating 
              destinations. Each hotel is designed to offer guests an authentic experience while 
              providing modern comforts and personalized service that exceeds expectations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Locations Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Our <span className="gradient-text">Locations</span>
            </h2>
            <p className="text-lg text-gray-600">
              Three unique destinations, one exceptional standard of hospitality
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {locations.map((location, index) => (
              <motion.div
                key={location.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card overflow-hidden"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={location.image}
                    alt={location.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <span className="badge badge-primary mb-2">{location.type}</span>
                  <h3 className="text-xl font-semibold mb-2">{location.name}</h3>
                  <p className="text-gray-600 text-sm">{location.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Our <span className="gradient-text">Values</span>
            </h2>
            <p className="text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
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
                  <div className={`w-16 h-16 ${colorClasses[value.color]} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
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
            <Star className="h-12 w-12 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Experience Serendib Hospitality
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Book your stay and discover why guests keep coming back
            </p>
            <Link to="/rooms">
              <button className="btn bg-white text-primary-600 hover:bg-gray-100 shadow-lg px-8 py-4 text-lg">
                Browse Our Rooms
                <ChevronRight className="inline ml-2 h-5 w-5" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
