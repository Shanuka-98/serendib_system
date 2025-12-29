
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CheckCircle, Clock, AlertCircle, ArrowRight, 
  RefreshCw, Filter, Briefcase
} from 'lucide-react'
import { serviceRequestAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { EmptyState } from '../../components/EmptyState'

const MyTasksPage = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active') // 'active' (pending/in_progress) or 'completed'

  // Service Mapping Logic (Same as ServiceManagement)
  const getDepartmentServices = (roleType) => {
    const map = {
      housekeeping: ['housekeeping', 'laundry'],
      food_beverage: ['room_service', 'dining'],
      maintenance: ['maintenance'],
      concierge: ['concierge', 'transport', 'pool'],
      spa: ['spa'],
    }
    return map[roleType] || []
  }

  useEffect(() => {
    fetchTasks()
  }, [user])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await serviceRequestAPI.getRequests({})
      const allRequests = response.data.data?.service_requests || []
      
      // Filter for my department
      const allowedServices = getDepartmentServices(user?.role_type)
      
      let myTasks = allRequests
      
      // Filter Logic:
      // 1. If assigned_staff_id MATCHES me -> Show it (High Priority)
      // 2. If assigned_staff_id is NULL -> Show if role matches (Pool)
      // 3. If assigned_staff_id is SOMEONE ELSE -> Hide it (unless I'm manager)

      const isManager = user?.role_type === 'manager' || user?.role_type === 'front_desk'

      if (user?.role_type && !isManager) {
         myTasks = allRequests.filter(r => {
            // My direct assignments
            if (r.assigned_staff_id === user.user_id) return true
            
            // Pool items (unassigned AND my department)
            if (!r.assigned_staff_id && allowedServices.includes(r.service_type)) return true
            
            return false
         })
      } else if (allowedServices.length > 0 && !isManager) {
         // Fallback for non-manager roles without user_id? (unlikely)
         myTasks = allRequests.filter(r => allowedServices.includes(r.service_type))
      }
      // Managers see everything (or we could filter by branch if needed, but currently seeing all is fine for oversight)

      setTasks(myTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredTasks = () => {
    if (filter === 'active') {
      return tasks.filter(t => t.status === 'pending' || t.status === 'in_progress')
    }
    return tasks.filter(t => t.status === 'completed')
  }

  const filteredTasks = getFilteredTasks()

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    normal: 'bg-primary-100 text-primary-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700',
  }

  const statusConfig = {
    pending: { color: 'text-amber-600 bg-amber-50', icon: Clock, label: 'Pending' },
    in_progress: { color: 'text-blue-600 bg-blue-50', icon: AlertCircle, label: 'In Progress' },
    completed: { color: 'text-green-600 bg-green-50', icon: CheckCircle, label: 'Completed' },
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-800 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-primary-500" />
              My Tasks
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.role_type 
                ? `${user.role_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Tasks`
                : 'All Tasks'}
            </p>
          </div>
          <button 
            onClick={fetchTasks}
            className="btn btn-white p-2 shadow-sm flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100 w-fit mb-6">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'active' 
                ? 'bg-primary-50 text-primary-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Active ({tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'completed' 
                ? 'bg-green-50 text-green-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Completed ({tasks.filter(t => t.status === 'completed').length})
          </button>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon="check"
            title="No tasks found"
            description={filter === 'active' ? "You're all caught up! No active tasks." : "No completed tasks yet."}
          />
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => {
              const StatusIcon = statusConfig[task.status]?.icon || Clock
              return (
                <motion.div
                  key={task.request_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusConfig[task.status]?.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[task.status]?.label}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-800 capitalize mb-1 group-hover:text-primary-600 transition-colors">
                        {task.service_type.replace('_', ' ')}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-700">Room {task.guest_room || 'N/A'}</span>
                        </div>
                        <span>•</span>
                        <div>
                          {new Date(task.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      
                      {task.description && (
                         <p className="mt-2 text-sm text-gray-600 line-clamp-1">
                           {task.description}
                         </p>
                      )}
                    </div>

                    <Link 
                      to={`/staff/services/${task.request_id}`}
                      className="btn btn-secondary self-center shrink-0"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyTasksPage
