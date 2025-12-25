/**
 * Promotions Management Page
 * Admin CRUD for promo codes and discounts
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Tag, Plus, Edit2, Trash2, X, Check, Calendar,
  Percent, DollarSign, Building2, Search
} from 'lucide-react'
import { promotionsAPI, adminAPI } from '../../services/api'
import { toast } from 'react-toastify'

const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promo_code: '',
    discount_percentage: '',
    discount_amount: '',
    branch_id: '',
    start_date: '',
    end_date: '',
    min_booking_amount: '',
    max_discount: '',
    usage_limit: '',
    terms_conditions: '',
    is_active: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [promoRes, branchRes] = await Promise.all([
        promotionsAPI.getPromotions(),
        adminAPI.getBranches()
      ])
      setPromotions(promoRes.data.data?.promotions || [])
      setBranches(branchRes.data.data?.branches || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load promotions')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      promo_code: '',
      discount_percentage: '',
      discount_amount: '',
      branch_id: '',
      start_date: '',
      end_date: '',
      min_booking_amount: '',
      max_discount: '',
      usage_limit: '',
      terms_conditions: '',
      is_active: true
    })
    setEditingPromotion(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (promotion) => {
    setEditingPromotion(promotion)
    setFormData({
      title: promotion.title || '',
      description: promotion.description || '',
      promo_code: promotion.promo_code || '',
      discount_percentage: promotion.discount_percentage || '',
      discount_amount: promotion.discount_amount || '',
      branch_id: promotion.branch_id || '',
      start_date: promotion.start_date || '',
      end_date: promotion.end_date || '',
      min_booking_amount: promotion.min_booking_amount || '',
      max_discount: promotion.max_discount || '',
      usage_limit: promotion.usage_limit || '',
      terms_conditions: promotion.terms_conditions || '',
      is_active: promotion.is_active
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const payload = {
        ...formData,
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        branch_id: formData.branch_id ? parseInt(formData.branch_id) : null,
        min_booking_amount: formData.min_booking_amount ? parseFloat(formData.min_booking_amount) : null,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      }

      if (editingPromotion) {
        await promotionsAPI.updatePromotion(editingPromotion.promotion_id, payload)
        toast.success('Promotion updated successfully')
      } else {
        await promotionsAPI.createPromotion(payload)
        toast.success('Promotion created successfully')
      }
      
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving promotion:', error)
      toast.error(error.response?.data?.message || 'Failed to save promotion')
    }
  }

  const handleDelete = async (promotionId) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return
    
    try {
      await promotionsAPI.deletePromotion(promotionId)
      toast.success('Promotion deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting promotion:', error)
      toast.error('Failed to delete promotion')
    }
  }

  const toggleActive = async (promotion) => {
    try {
      await promotionsAPI.updatePromotion(promotion.promotion_id, {
        is_active: !promotion.is_active
      })
      toast.success(`Promotion ${promotion.is_active ? 'disabled' : 'enabled'}`)
      fetchData()
    } catch (error) {
      toast.error('Failed to update promotion')
    }
  }

  const filteredPromotions = promotions.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.promo_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading promotions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-800 flex items-center gap-3">
              <Tag className="w-8 h-8 text-primary-500" />
              Promotions
            </h1>
            <p className="text-gray-600 mt-1">Manage promo codes and discounts</p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Promotion
          </button>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </motion.div>

        {/* Promotions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Discount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Valid Period</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Usage</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPromotions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No promotions found
                    </td>
                  </tr>
                ) : (
                  filteredPromotions.map((promotion) => (
                    <tr key={promotion.promotion_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                          {promotion.promo_code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{promotion.title}</p>
                        <p className="text-sm text-gray-500">{promotion.branch_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-mint-600 font-semibold">
                          <Percent className="w-4 h-4" />
                          {promotion.discount_percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {promotion.start_date} - {promotion.end_date}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="text-gray-800">{promotion.usage_count}</span>
                        <span className="text-gray-400">
                          {promotion.usage_limit ? ` / ${promotion.usage_limit}` : ' / ∞'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(promotion)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            promotion.is_active && promotion.is_valid
                              ? 'bg-mint-100 text-mint-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {promotion.is_active ? (promotion.is_valid ? 'Active' : 'Expired') : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(promotion)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(promotion.promotion_id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                      {editingPromotion ? 'Edit Promotion' : 'Create Promotion'}
                    </h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code *</label>
                      <input
                        type="text"
                        value={formData.promo_code}
                        onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500 font-mono"
                        placeholder="e.g., SUMMER25"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500"
                      rows="2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount % *</label>
                      <input
                        type="number"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500"
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (LKR)</label>
                      <input
                        type="number"
                        value={formData.max_discount}
                        onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Booking (LKR)</label>
                      <input
                        type="number"
                        value={formData.min_booking_amount}
                        onChange={(e) => setFormData({ ...formData, min_booking_amount: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                      <input
                        type="number"
                        value={formData.usage_limit}
                        onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500"
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                    <select
                      value={formData.branch_id}
                      onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500"
                    >
                      <option value="">All Branches</option>
                      {branches.map(branch => (
                        <option key={branch.branch_id} value={branch.branch_id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 btn btn-primary">
                      {editingPromotion ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default PromotionsManagement
