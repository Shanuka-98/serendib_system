import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Phone, Mail, MapPin, Clock, 
  Hotel, ChevronRight
} from 'lucide-react'

const ContactPage = () => {
  const branches = [
    {
      name: 'Colombo',
      type: 'Business & City',
      address: '42 Galle Face Terrace, Colombo 03, Sri Lanka',
      phone: '+94 11 234 5678',
      email: 'colombo@serendibhotels.com',
      hours: '24/7 Front Desk',
      color: 'primary'
    },
    {
      name: 'Mirissa',
      type: 'Beach Resort',
      address: '15 Beach Road, Mirissa, Matara, Sri Lanka',
      phone: '+94 41 225 1234',
      email: 'mirissa@serendibhotels.com',
      hours: '24/7 Front Desk',
      color: 'peach'
    },
    {
      name: 'Kandy',
      type: 'Hill Country',
      address: '88 Temple View Road, Kandy, Sri Lanka',
      phone: '+94 81 223 4567',
      email: 'kandy@serendibhotels.com',
      hours: '24/7 Front Desk',
      color: 'lavender'
    }
  ]

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600 border-primary-200',
    peach: 'bg-peach-100 text-peach-600 border-peach-200',
    lavender: 'bg-lavender-100 text-lavender-600 border-lavender-200'
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary-50 via-peach-50 to-lavender-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-lavender-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeInUp}>
            <Phone className="h-16 w-16 mx-auto mb-6 text-primary-500" />
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Contact <span className="gradient-text">Us</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're here to help with your reservations, inquiries, and any assistance you need.
            </p>
          </motion.div>
        </div>
      </section>

      {/* General Contact */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="card p-8 text-center">
            <Hotel className="h-12 w-12 mx-auto mb-4 text-primary-500" />
            <h2 className="text-2xl font-display font-bold mb-4">General Inquiries</h2>
            <p className="text-gray-600 mb-6">
              For general questions, group bookings, or partnership inquiries
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a href="mailto:info@serendibhotels.com" className="flex items-center text-primary-600 hover:text-primary-700">
                <Mail className="h-5 w-5 mr-2" />
                info@serendibhotels.com
              </a>
              <a href="tel:+94112345600" className="flex items-center text-primary-600 hover:text-primary-700">
                <Phone className="h-5 w-5 mr-2" />
                +94 11 234 5600
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Branch Contacts */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Our <span className="gradient-text">Branches</span>
            </h2>
            <p className="text-lg text-gray-600">
              Reach out to any of our locations directly
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {branches.map((branch, index) => (
              <motion.div
                key={branch.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card p-6"
              >
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${colorClasses[branch.color]}`}>
                  {branch.type}
                </div>
                <h3 className="text-xl font-semibold mb-4">{branch.name}</h3>
                
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{branch.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" />
                    <a href={`tel:${branch.phone.replace(/\s/g, '')}`} className="text-sm hover:text-primary-600">
                      {branch.phone}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${branch.email}`} className="text-sm hover:text-primary-600">
                      {branch.email}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" />
                    <span className="text-sm">{branch.hours}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Ready to Book Your Stay?
            </h2>
            <p className="text-gray-600 mb-8">
              Browse our rooms and make a reservation online
            </p>
            <Link to="/rooms">
              <button className="btn btn-primary px-8 py-4 text-lg">
                View Available Rooms
                <ChevronRight className="inline ml-2 h-5 w-5" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage
