/**
 * Responsive Table Component
 * Mobile-friendly tables with horizontal scroll and card view option
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Search, Filter } from 'lucide-react'

export function ResponsiveTable({ 
  columns, 
  data, 
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  sortable = false,
  searchable = false,
  searchPlaceholder = 'Search...',
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [searchQuery, setSearchQuery] = useState('')

  // Handle sorting
  const handleSort = (key) => {
    if (!sortable) return
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Filter and sort data
  const processedData = [...(data || [])]
    .filter(row => {
      if (!searchQuery) return true
      return columns.some(col => {
        const value = row[col.key]
        return String(value).toLowerCase().includes(searchQuery.toLowerCase())
      })
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      const direction = sortConfig.direction === 'asc' ? 1 : -1
      if (aVal < bVal) return -1 * direction
      if (aVal > bVal) return 1 * direction
      return 0
    })

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="border-b border-gray-100">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
      {/* Search Bar */}
      {searchable && (
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`
                    px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider
                    ${sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}
                  `}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortable && sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map((row, index) => (
                <motion.tr
                  key={row.id || index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    hover:bg-gray-50 transition-colors
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-4 text-sm text-gray-700">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-100">
        {processedData.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          processedData.map((row, index) => (
            <motion.div
              key={row.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => onRowClick?.(row)}
              className={`
                p-4 space-y-2 hover:bg-gray-50 transition-colors
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">{col.label}</span>
                  <span className="text-sm text-gray-800">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </span>
                </div>
              ))}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

// Status badge helper
export function StatusBadge({ status, variant }) {
  const variants = {
    success: 'bg-mint-100 text-mint-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-primary-100 text-primary-700',
    default: 'bg-gray-100 text-gray-700',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant] || variants.default}`}>
      {status}
    </span>
  )
}

// Pagination component
export function TablePagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className = '' 
}) {
  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-between px-4 py-3 border-t border-gray-100 ${className}`}>
      <p className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default ResponsiveTable
