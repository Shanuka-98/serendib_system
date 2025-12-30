import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Plus, Trash2, Check, Loader2, Send } from 'lucide-react'
import { facilityAPI } from '../../services/api'
import { toast } from 'react-toastify'

const QuoteModal = ({ isOpen, onClose, booking, onQuoteSent }) => {
  const [loading, setLoading] = useState(false)
  const [availableAddons, setAvailableAddons] = useState([])
  
  // Form State
  const [formData, setFormData] = useState({
    base_price: 0,
    selected_addons: [],
    admin_notes: '',
    service_charge_rate: 0.10, // Default 10%
    tax_rate: 0.12 // Default 12%
  })

  // Calculations
  const [totals, setTotals] = useState({
    subtotal: 0,
    serviceCharge: 0,
    tax: 0,
    total: 0
  })

  useEffect(() => {
    if (isOpen && booking) {
      console.log('QuoteModal - booking.selected_addons:', booking.selected_addons)
      fetchAddons()
      // Initialize form with existing data or defaults
      setFormData({
        base_price: booking.base_price || booking.facility?.price_per_slot || 0,
        selected_addons: booking.selected_addons || [],
        admin_notes: booking.admin_notes || '',
        service_charge_rate: 0.10, // Could fetch from branch config
        tax_rate: 0.12
      })
    }
  }, [isOpen, booking])

  useEffect(() => {
    calculateTotals()
  }, [formData.base_price, formData.selected_addons])

  const fetchAddons = async () => {
    try {
      const response = await facilityAPI.getAddons({ branch_id: booking.branch_id })
      const addons = response.data.data || []
      // Deduplicate by name
      const uniqueAddons = addons.filter((addon, index, self) => 
        index === self.findIndex(a => a.name === addon.name)
      )
      setAvailableAddons(uniqueAddons)
    } catch (error) {
      console.error('Error fetching addons:', error)
    }
  }

  const calculateTotals = () => {
    const base = parseFloat(formData.base_price) || 0
    
    const addonsTotal = formData.selected_addons.reduce((sum, addon) => {
      let price = parseFloat(addon.price) || 0
      if (addon.price_type === 'per_person') {
        price *= (booking.number_of_guests || 1)
      }
      return sum + price
    }, 0)

    const subtotal = base + addonsTotal
    const serviceCharge = subtotal * formData.service_charge_rate
    const tax = (subtotal + serviceCharge) * formData.tax_rate
    const total = subtotal + serviceCharge + tax

    setTotals({ subtotal, serviceCharge, tax, total })
  }

  const handleAddAddon = (addonId) => {
    const addon = availableAddons.find(a => a.addon_id === parseInt(addonId))
    if (!addon) return

    // Prevent duplicates
    if (formData.selected_addons.some(a => a.addon_id === addon.addon_id)) return

    setFormData(prev => ({
      ...prev,
      selected_addons: [...prev.selected_addons, addon]
    }))
  }

  const handleRemoveAddon = (index) => {
    setFormData(prev => ({
      ...prev,
      selected_addons: prev.selected_addons.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await facilityAPI.createQuote(booking.booking_id, {
        base_price: formData.base_price,
        selected_addons: formData.selected_addons,
        admin_notes: formData.admin_notes
      })
      toast.success('Quote sent successfully')
      onQuoteSent()
    } catch (error) {
      console.error('Error sending quote:', error)
      toast.error(error.response?.data?.message || 'Failed to send quote')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Create Quote</h3>
            <p className="text-sm text-gray-500">
              For {booking?.event_name || 'Event Inquiry'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="quote-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Base Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facility Base Price (Rs.)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.base_price}
                  onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value) || 0})}
                  className="pl-10 w-full input bg-white"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Default price: Rs. {booking?.facility?.price_per_slot?.toLocaleString()}</p>
            </div>

            {/* Add-ons Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Add-ons</label>
                <select 
                  className="text-sm border rounded-lg px-2 py-1 bg-white hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
                  onChange={(e) => {
                    handleAddAddon(e.target.value)
                    e.target.value = ''
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>+ Add Item</option>
                  {availableAddons.map(addon => (
                    <option key={addon.addon_id} value={addon.addon_id}>
                      {addon.name} - Rs. {addon.price} ({addon.price_type === 'per_person' ? '/person' : 'fixed'})
                    </option>
                  ))}
                </select>
              </div>

              {formData.selected_addons.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500">No add-ons selected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.selected_addons.map((addon, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-800">{addon.name}</p>
                        <p className="text-xs text-gray-500">
                          Rs. {addon.price} {addon.price_type === 'per_person' ? `x ${booking.number_of_guests} guests` : '(Fixed)'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-700">
                          Rs. {(parseFloat(addon.price) * (addon.price_type === 'per_person' ? (booking.number_of_guests || 1) : 1)).toLocaleString()}
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveAddon(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quote Summary */}
            <div className="bg-primary-50 rounded-xl p-4 border border-primary-100 space-y-2">
              <h4 className="font-bold text-primary-900 mb-2">Quote Summary</h4>
              <div className="flex justify-between text-sm text-primary-700">
                 <span>Subtotal</span>
                 <span>Rs. {totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-primary-700">
                 <span>Service Charge ({(formData.service_charge_rate * 100)}%)</span>
                 <span>Rs. {totals.serviceCharge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-primary-700">
                 <span>Tax ({(formData.tax_rate * 100)}%)</span>
                 <span>Rs. {totals.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary-800 pt-2 border-t border-primary-200 mt-2">
                 <span>Total Quote</span>
                 <span>Rs. {totals.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes for Guest
              </label>
              <textarea
                rows="3"
                value={formData.admin_notes}
                onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                className="w-full input p-3 text-sm"
                placeholder="Add any special details, terms, or warm greetings..."
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="quote-form"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Quote
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default QuoteModal
