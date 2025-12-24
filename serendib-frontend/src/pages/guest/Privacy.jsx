import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, ChevronRight } from 'lucide-react'

const PrivacyPage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  const sections = [
    {
      title: 'Information We Collect',
      content: `We collect information you provide directly to us when making reservations, creating an account, or contacting us. This includes:
      
• Personal identification (name, email, phone number)
• Booking details (dates, room preferences, special requests)
• Payment information (processed securely through our payment providers)
• Communication records (inquiries, feedback, service requests)
• Loyalty program information (points, tier status, preferences)`
    },
    {
      title: 'How We Use Your Information',
      content: `We use the information we collect to:

• Process and manage your reservations
• Communicate with you about your bookings and our services
• Provide customer support and respond to inquiries
• Improve our services and personalize your experience
• Send promotional offers and updates (with your consent)
• Comply with legal obligations and protect our rights`
    },
    {
      title: 'Information Sharing',
      content: `We do not sell or rent your personal information to third parties. We may share your information with:

• Service providers who assist our operations (payment processors, email services)
• Legal authorities when required by law or to protect our rights
• Business partners for joint promotions (only with your explicit consent)

All third-party service providers are contractually obligated to protect your information.`
    },
    {
      title: 'Data Security',
      content: `We implement appropriate technical and organizational measures to protect your personal information, including:

• Encryption of sensitive data in transit and at rest
• Secure payment processing through PCI-compliant providers
• Regular security assessments and updates
• Access controls limiting employee access to personal data
• Staff training on data protection best practices`
    },
    {
      title: 'Cookies and Tracking',
      content: `Our website uses cookies and similar technologies to:

• Remember your preferences and settings
• Analyze website traffic and usage patterns
• Improve website functionality and user experience

You can control cookie settings through your browser preferences. Disabling cookies may affect some website features.`
    },
    {
      title: 'Your Rights',
      content: `You have the right to:

• Access the personal information we hold about you
• Request correction of inaccurate information
• Request deletion of your personal data (subject to legal requirements)
• Opt out of marketing communications at any time
• Lodge a complaint with relevant data protection authorities

To exercise these rights, please contact our privacy team.`
    },
    {
      title: 'Data Retention',
      content: `We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy. Booking records are retained for 7 years for legal and accounting purposes. You may request deletion of your account at any time.`
    },
    {
      title: 'Changes to This Policy',
      content: `We may update this privacy policy from time to time. We will notify you of significant changes by posting the new policy on our website and, where appropriate, by email. We encourage you to review this policy periodically.`
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary-50 via-peach-50 to-lavender-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-mint-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeInUp}>
            <Shield className="h-16 w-16 mx-auto mb-6 text-primary-500" />
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Privacy <span className="gradient-text">Policy</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your privacy matters to us. Learn how we collect, use, and protect your personal information.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Last updated: December 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="card p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-8">
                Serendib Hotels ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, and safeguard your information 
                when you use our website and services.
              </p>

              {sections.map((section, index) => (
                <div key={index} className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {index + 1}. {section.title}
                  </h2>
                  <div className="text-gray-600 whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              ))}

              <hr className="my-8" />

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
                <p className="text-gray-600 mb-4">
                  If you have questions about this Privacy Policy or our data practices, please contact:
                </p>
                <div className="text-gray-600">
                  <p><strong>Serendib Hotels - Privacy Team</strong></p>
                  <p>Email: privacy@serendibhotels.com</p>
                  <p>Phone: +94 11 234 5600</p>
                  <p>Address: 42 Galle Face Terrace, Colombo 03, Sri Lanka</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Back to Home */}
          <motion.div {...fadeInUp} className="mt-8 text-center">
            <Link to="/">
              <button className="btn btn-secondary px-6 py-3">
                <ChevronRight className="inline mr-2 h-4 w-4 rotate-180" />
                Back to Home
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default PrivacyPage
