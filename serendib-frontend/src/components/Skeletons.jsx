/**
 * Skeleton Loading Components
 * Placeholder animations for loading states
 */

import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// Room card skeleton for loading states
export function RoomCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-soft">
      <Skeleton height={200} className="w-full" />
      <div className="p-6">
        <Skeleton height={24} width="60%" className="mb-2" />
        <Skeleton height={16} width="40%" className="mb-4" />
        <div className="flex gap-2 mb-4">
          <Skeleton height={24} width={60} />
          <Skeleton height={24} width={60} />
          <Skeleton height={24} width={60} />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton height={28} width={100} />
          <Skeleton height={40} width={100} borderRadius={8} />
        </div>
      </div>
    </div>
  )
}

// Booking card skeleton
export function BookingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-soft">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Skeleton height={20} width={120} className="mb-2" />
          <Skeleton height={16} width={80} />
        </div>
        <Skeleton height={28} width={80} borderRadius={14} />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Skeleton height={14} width={60} className="mb-1" />
          <Skeleton height={18} width={100} />
        </div>
        <div>
          <Skeleton height={14} width={60} className="mb-1" />
          <Skeleton height={18} width={100} />
        </div>
      </div>
      <Skeleton height={40} borderRadius={8} />
    </div>
  )
}

// Dashboard stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-soft">
      <div className="flex justify-between items-start mb-4">
        <Skeleton height={40} width={40} borderRadius={8} />
        <Skeleton height={20} width={60} />
      </div>
      <Skeleton height={32} width="50%" className="mb-2" />
      <Skeleton height={16} width="70%" />
    </div>
  )
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton height={20} />
        </td>
      ))}
    </tr>
  )
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-soft">
      <div className="flex items-center gap-6 mb-8">
        <Skeleton circle height={80} width={80} />
        <div>
          <Skeleton height={28} width={200} className="mb-2" />
          <Skeleton height={18} width={150} />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton height={14} width={80} className="mb-2" />
            <Skeleton height={44} borderRadius={8} />
          </div>
        ))}
      </div>
    </div>
  )
}

// List skeleton with multiple items
export function ListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-soft flex gap-4">
          <Skeleton height={60} width={60} borderRadius={8} />
          <div className="flex-1">
            <Skeleton height={20} width="70%" className="mb-2" />
            <Skeleton height={16} width="50%" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Page header skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton height={36} width={250} className="mb-2" />
      <Skeleton height={20} width={400} />
    </div>
  )
}

export default {
  RoomCardSkeleton,
  BookingCardSkeleton,
  StatCardSkeleton,
  TableRowSkeleton,
  ProfileSkeleton,
  ListSkeleton,
  PageHeaderSkeleton,
}
