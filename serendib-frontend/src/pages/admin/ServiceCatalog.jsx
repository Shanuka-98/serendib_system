import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Edit2, Trash2, X, Save, 
  CheckCircle, DollarSign, Tag, Info, AlertCircle 
} from 'lucide-react'
import { toast } from 'react-toastify'
import { serviceAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/LoadingSpinner'

const ServiceCatalog = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    base_price: '',
    is_chargeable: true,
    is_active: true
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const { data } = await serviceAPI.getServices()
      setServices(data.data.services)
    } catch (error) {
      toast.error('Failed to load service catalog')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        code: service.code,
        description: service.description || '',
        base_price: service.base_price,
        is_chargeable: service.is_chargeable,
        is_active: service.is_active
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        code: '',
        description: '',
        base_price: '',
        is_chargeable: true,
        is_active: true
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Auto-generate code if empty (from name)
    let submitData = { ...formData }
    if (!submitData.code) {
      submitData.code = submitData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    }

    try {
      if (editingService) {
        await serviceAPI.updateService(editingService.id, submitData)
        toast.success('Service updated successfully')
      } else {
        await serviceAPI.createService(submitData)
        toast.success('Service created successfully')
      }
      setIsModalOpen(false)
      fetchServices()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save service')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this service?')) {
      try {
        await serviceAPI.deleteService(id)
        toast.success('Service deactivated')
        fetchServices()
      } catch (error) {
        toast.error('Failed to deactivate service')
      }
    }
  }

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-8"><LoadingSpinner /></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-800">Service Catalog</h1>
          <p className="text-gray-500 mt-1">Manage hotel services, pricing, and availability</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add New Service
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Service List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-sm font-semibold text-gray-600 border-b">
              <th className="px-6 py-4">Service Name</th>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Price (LKR)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredServices.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{service.name}</div>
                  <div className="text-xs text-gray-500 truncate max-w-xs">{service.description}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="badge bg-gray-100 text-gray-600 font-mono text-xs">
                    {service.code}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {service.is_chargeable ? (
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(service.base_price)}
                    </span>
                  ) : (
                    <span className="badge bg-green-100 text-green-700">Complimentary</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${service.is_active ? 'badge-success' : 'badge-error'}`}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(service)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {service.is_active && (
                      <button 
                        onClick={() => handleDelete(service.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deactivate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredServices.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <Search className="h-10 w-10 text-gray-300 mb-3" />
                    <p>No services found matching your search.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., Airport Transfer"
                  />
                </div>

                {/* Code (Auto-generated usually) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System Code <span className="text-xs text-gray-400 font-normal">(Unique Identifier)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input w-full font-mono text-sm"
                    placeholder="e.g., airport_transfer"
                    disabled={!!editingService} // Disable code editing for existing items
                  />
                  {!editingService && (
                    <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from name</p>
                  )}
                </div>

                {/* Price & Chargeable */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center pt-6">
                     <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={formData.is_chargeable}
                            onChange={(e) => setFormData({ ...formData, is_chargeable: e.target.checked })}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Chargeable Service</span>
                      </label>
                  </div>

                  {formData.is_chargeable && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required={formData.is_chargeable}
                          value={formData.base_price}
                          onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                          className="input w-full pl-10"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input w-full"
                    placeholder="Brief details about the service..."
                  ></textarea>
                </div>

                {/* Active Status */}
                {editingService && (
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-gray-700">Service Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                      <span className="ml-2 text-sm font-medium text-gray-600">{formData.is_active ? 'Active' : 'Inactive'}</span>
                    </label>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Service
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

export default ServiceCatalog
