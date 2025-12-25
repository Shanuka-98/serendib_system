/**
 * Admin Settings Page
 * SMS notification toggles and system configuration
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, MessageSquare, Bell, Save, RefreshCw } from 'lucide-react'
import { adminAPI } from '../../services/api'
import { toast } from 'react-toastify'

const Settings = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    sms_enabled: true,
    sms_booking_enabled: true,
    sms_payment_enabled: true,
    sms_cancelled_enabled: true,
  })
  const [smsCount, setSmsCount] = useState(0)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getSettings()
      const smsData = response.data.data?.sms || {}
      setSettings({
        sms_enabled: smsData.enabled ?? true,
        sms_booking_enabled: smsData.booking_enabled ?? true,
        sms_payment_enabled: smsData.payment_enabled ?? true,
        sms_cancelled_enabled: smsData.cancelled_enabled ?? true,
      })
      setSmsCount(smsData.total_sent || 0)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await adminAPI.updateSettings(settings)
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-800 flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-primary-500" />
              Settings
            </h1>
            <p className="text-gray-600 mt-1">Configure system notifications and preferences</p>
          </div>
        </motion.div>

        {/* SMS Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">SMS Notifications</h2>
                <p className="text-sm text-gray-500">Configure Text.lk SMS alerts</p>
              </div>
            </div>
          </div>

          {/* Global Toggle */}
          <div className="p-4 bg-gray-50 rounded-xl mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Enable All SMS</p>
                <p className="text-sm text-gray-500">Master toggle for all SMS notifications</p>
              </div>
              <button
                onClick={() => handleToggle('sms_enabled')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.sms_enabled ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.sms_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Individual Toggles */}
          <div className="space-y-3">
            {[
              { key: 'sms_booking_enabled', label: 'Booking Confirmation', desc: 'SMS when booking is confirmed' },
              { key: 'sms_payment_enabled', label: 'Payment Confirmation', desc: 'SMS when payment is received' },
              { key: 'sms_cancelled_enabled', label: 'Cancellation Notice', desc: 'SMS when booking is cancelled' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                <div>
                  <p className="font-medium text-gray-800">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleToggle(item.key)}
                  disabled={!settings.sms_enabled}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    settings[item.key] && settings.sms_enabled ? 'bg-mint-500' : 'bg-gray-300'
                  } ${!settings.sms_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      settings[item.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn btn-primary py-4 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default Settings
