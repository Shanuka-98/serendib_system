/**
 * Audit Logs Page
 * Displays system audit logs with filtering and search
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, Search, Filter, RefreshCw, User, 
  Calendar, Activity, ChevronDown, Download
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import { ResponsiveTable, StatusBadge } from '../../components/ResponsiveTable'
import { EmptyState } from '../../components/EmptyState'

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    table_name: '',
    user_id: '',
    limit: 100,
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters.action) params.action = filters.action
      if (filters.table_name) params.table_name = filters.table_name
      if (filters.user_id) params.user_id = filters.user_id
      params.limit = filters.limit

      const response = await adminAPI.getAuditLogs(params)
      setLogs(response.data.data?.logs || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    fetchLogs()
  }

  const handleReset = () => {
    setFilters({
      action: '',
      table_name: '',
      user_id: '',
      limit: 100,
    })
    fetchLogs()
  }

  // Format timestamp
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get action badge variant
  const getActionVariant = (action) => {
    if (action?.includes('CREATE') || action?.includes('REGISTER')) return 'success'
    if (action?.includes('DELETE') || action?.includes('CANCEL')) return 'danger'
    if (action?.includes('UPDATE') || action?.includes('MODIFY')) return 'warning'
    if (action?.includes('LOGIN') || action?.includes('LOGOUT')) return 'info'
    return 'default'
  }

  // Table columns
  const columns = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (value) => (
        <span className="text-sm text-gray-600">{formatDate(value)}</span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (value) => (
        <StatusBadge status={value} variant={getActionVariant(value)} />
      ),
    },
    {
      key: 'table_name',
      label: 'Table',
      render: (value) => (
        <span className="text-sm font-medium text-gray-700">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'user_id',
      label: 'User',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-primary-600" />
          </div>
          <span className="text-sm text-gray-600">#{value}</span>
        </div>
      ),
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (value) => (
        <span className="text-xs font-mono text-gray-500">{value || 'N/A'}</span>
      ),
    },
  ]

  // Unique actions and tables for filters
  const uniqueActions = [...new Set(logs.map(l => l.action).filter(Boolean))]
  const uniqueTables = [...new Set(logs.map(l => l.table_name).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-peach-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-800 flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary-500" />
                Audit Logs
              </h1>
              <p className="text-gray-600 mt-1">System activity and security logs</p>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Refresh"
                onClick={fetchLogs}
                className="btn btn-primary flex items-center justify-center p-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-soft p-6 mb-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="input w-full"
                >
                  <option value="">All Actions</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table</label>
                <select
                  value={filters.table_name}
                  onChange={(e) => handleFilterChange('table_name', e.target.value)}
                  className="input w-full"
                >
                  <option value="">All Tables</option>
                  {uniqueTables.map(table => (
                    <option key={table} value={table}>{table}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                <input
                  type="number"
                  value={filters.user_id}
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                  placeholder="Enter user ID"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Limit</label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  className="input w-full"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button onClick={handleReset} className="btn btn-secondary">
                Reset
              </button>
              <button onClick={handleApplyFilters} className="btn btn-primary">
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-xl p-4 shadow-soft">
            <p className="text-sm text-gray-500">Total Logs</p>
            <p className="text-2xl font-bold text-gray-800">{logs.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-soft">
            <p className="text-sm text-gray-500">Unique Users</p>
            <p className="text-2xl font-bold text-primary-600">
              {new Set(logs.map(l => l.user_id)).size}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-soft">
            <p className="text-sm text-gray-500">Actions Today</p>
            <p className="text-2xl font-bold text-mint-600">
              {logs.filter(l => {
                const logDate = new Date(l.timestamp).toDateString()
                return logDate === new Date().toDateString()
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-soft">
            <p className="text-sm text-gray-500">Tables Affected</p>
            <p className="text-2xl font-bold text-lavender-600">
              {new Set(logs.map(l => l.table_name).filter(Boolean)).size}
            </p>
          </div>
        </motion.div>

        {/* Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {logs.length === 0 && !loading ? (
            <EmptyState
              icon="file"
              title="No audit logs found"
              description="There are no logs matching your current filters."
              action={handleReset}
              actionLabel="Clear Filters"
            />
          ) : (
            <ResponsiveTable
              columns={columns}
              data={logs}
              loading={loading}
              sortable={true}
              emptyMessage="No audit logs found"
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default AuditLogsPage
