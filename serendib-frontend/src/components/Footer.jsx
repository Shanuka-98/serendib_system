import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8 print:hidden">
      <div className="max-w-7xl mx-auto text-center">
        <h3 className="text-2xl font-display font-bold mb-4">Serendib Hotels</h3>
        <p className="text-gray-400 mb-6">Experience luxury in paradise</p>
        <div className="flex justify-center space-x-6 mb-6">
          <Link to="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
          <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
          <Link to="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link>
          <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
        </div>
        <p className="text-gray-500 text-sm">© 2025 Serendib Hotels. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
