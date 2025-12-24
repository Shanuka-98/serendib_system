import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Briefcase, Heart, Clock, Award, Users, 
  MapPin, ChevronRight, Sparkles
} from 'lucide-react'

const CareersPage = () => {
  const benefits = [
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance and wellness programs for you and your family'
    },
    {
      icon: Award,
      title: 'Growth Opportunities',
      description: 'Training programs, mentorship, and clear career advancement paths'
    },
    {
      icon: Clock,
      title: 'Work-Life Balance',
      description: 'Flexible scheduling, paid time off, and employee discounts on stays'
    },
    {
      icon: Users,
      title: 'Team Culture',
      description: 'A supportive, diverse team that celebrates success together'
    }
  ]

  const openings = [
    {
      title: 'Front Desk Manager',
      location: 'Colombo',
      type: 'Full-time',
      department: 'Guest Services'
    },
    {
      title: 'Executive Chef',
      location: 'Mirissa',
      type: 'Full-time',
      department: 'Food & Beverage'
    },
    {
      title: 'Housekeeping Supervisor',
      location: 'Kandy',
      type: 'Full-time',
      department: 'Housekeeping'
    },
    {
      title: 'Guest Relations Associate',
      location: 'All Locations',
      type: 'Full-time',
      department: 'Guest Services'
    },
    {
      title: 'Spa Therapist',
      location: 'Mirissa',
      type: 'Full-time',
      department: 'Wellness'
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
          <div className="absolute top-20 left-10 w-72 h-72 bg-lavender-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-mint-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeInUp}>
            <Briefcase className="h-16 w-16 mx-auto mb-6 text-primary-500" />
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Join Our <span className="gradient-text">Team</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build your career with Sri Lanka's premier boutique hotel group. 
              We're looking for passionate individuals who share our commitment to exceptional hospitality.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Why Work at <span className="gradient-text">Serendib</span>?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join a team where your growth matters and your contributions make a real impact
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card p-6 text-center"
                >
                  <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Current Openings */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Current <span className="gradient-text">Openings</span>
            </h2>
            <p className="text-lg text-gray-600">
              Explore opportunities across our properties
            </p>
          </motion.div>

          <div className="space-y-4">
            {openings.map((job, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </span>
                    <span className="badge badge-primary">{job.type}</span>
                    <span className="text-gray-400">{job.department}</span>
                  </div>
                </div>
                <a 
                  href="mailto:careers@serendibhotels.com" 
                  className="btn btn-secondary text-sm px-4 py-2"
                >
                  Apply Now
                </a>
              </motion.div>
            ))}
          </div>

          <motion.div 
            {...fadeInUp} 
            className="mt-8 text-center text-gray-600"
          >
            <p>
              Don't see a role that fits? Send your resume to{' '}
              <a href="mailto:careers@serendibhotels.com" className="text-primary-600 hover:underline">
                careers@serendibhotels.com
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-lavender-500 via-primary-500 to-peach-500">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div {...fadeInUp}>
            <Sparkles className="h-12 w-12 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Start Your Journey With Us
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Be part of a team that creates unforgettable experiences
            </p>
            <a href="mailto:careers@serendibhotels.com">
              <button className="btn bg-white text-primary-600 hover:bg-gray-100 shadow-lg px-8 py-4 text-lg">
                Send Your Resume
                <ChevronRight className="inline ml-2 h-5 w-5" />
              </button>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default CareersPage
