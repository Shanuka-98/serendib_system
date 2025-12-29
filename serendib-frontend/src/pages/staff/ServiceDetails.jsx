
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  AlertCircle, ChevronLeft, Calendar, User, Bed, 
  MessageSquare, Clock, CheckCircle, XCircle 
} from 'lucide-react'
import { serviceRequestAPI, shiftsAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { StatusBadge } from '../../components/ResponsiveTable'
import { useAuth } from '../../context/AuthContext'

const ServiceDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)



  const { user } = useAuth()
  const [assignedStaff, setAssignedStaff] = useState('')
  const [staffList, setStaffList] = useState([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [isChangingAssignment, setIsChangingAssignment] = useState(false)
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, title: '', message: '' })

  // Helper to match service type to role
  const getDepartmentServices = (roleType) => {
    const map = {
      housekeeping: ['housekeeping', 'laundry'],
      food_beverage: ['room_service', 'dining'],
      maintenance: ['maintenance'],
      concierge: ['concierge', 'transport', 'pool'],
      spa: ['spa'],
      // Managers can technically do anything but usually assign
      manager: [], 
      front_desk: []
    }
    return map[roleType] || []
  }

  useEffect(() => {
    fetchRequestDetails(true)
  }, [id])

  useEffect(() => {
    if (user && (user.role_type === 'manager' || user.role_type === 'front_desk')) {
      fetchStaffList()
    }
  }, [user])

  const fetchStaffList = async () => {
    try {
      setLoadingStaff(true)
      // Use shifting API to get staff list or admin API if needed
      // Assuming shiftsAPI.getStaffForScheduling is available and returns staff for branch
      // If user has branch_id, use it. Default to current user's branch
      const branchId = user?.branch_id
      if (branchId) {
          const response = await shiftsAPI.getStaffForScheduling({ branch_id: branchId })
          setStaffList(response.data.data?.staff || [])
      }
    } catch (error) {
      console.error('Error fetching staff list:', error)
    } finally {
      setLoadingStaff(false)
    }
  }

  const fetchRequestDetails = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      const response = await serviceRequestAPI.getRequest(id)
      // API returns { data: { service_request: {...} } }
      const data = response.data.data.service_request || response.data.data
      setRequest(data)
      
      // Update assigned staff state, defaulting to empty string if null
      setAssignedStaff(data.assigned_staff_id || '')
      
    } catch (error) {
      console.error('Error fetching request details:', error)
      toast.error('Failed to load service request details')
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true)
      await serviceRequestAPI.updateRequest(id, { status: newStatus })
      toast.success(`Request marked as ${newStatus.replace('_', ' ')}`)
      fetchRequestDetails()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleAssignStaff = async (staffId) => {
    try {
      setUpdating(true)
      await serviceRequestAPI.updateRequest(id, { assigned_staff_id: staffId })
      toast.success('Staff assigned successfully')
      fetchRequestDetails()
    } catch (error) {
      console.error('Error assigning staff:', error)
      toast.error('Failed to assign staff')
    } finally {
      setUpdating(false)
    }
  }

  const statusConfig = {
    pending: { color: 'warning', icon: Clock, label: 'Pending' },
    in_progress: { color: 'info', icon: AlertCircle, label: 'In Progress' },
    completed: { color: 'success', icon: CheckCircle, label: 'Completed' },
    cancelled: { color: 'danger', icon: XCircle, label: 'Cancelled' },
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    normal: 'bg-primary-100 text-primary-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Request not found</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-gray-600 hover:text-primary-600 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Tasks
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-display font-bold text-gray-800 capitalize">
                  {request.service_type?.replace('_', ' ')}
                </h1>
                <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${priorityColors[request.priority]}`}>
                  {request.priority} Priority
                </span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-gray-500 text-sm">Request #{request.request_id}</p>
                {/* Pricing Badge */}
                {request.is_chargeable ? (
                  <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-medium">
                    LKR {request.price?.toLocaleString() || 0}
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                    Complimentary
                  </span>
                )}
                {/* Billing Status */}
                {request.is_chargeable && request.is_billed && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Billed
                  </span>
                )}
              </div>
            </div>
            <StatusBadge 
              status={statusConfig[request.status]?.label || request.status} 
              variant={statusConfig[request.status]?.color || 'default'} 
              className="text-lg px-4 py-2"
            />
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="relative flex items-center justify-between w-full max-w-2xl mx-auto">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full -z-0"></div>
            
            {/* Active Line - Calculate width based on status */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-500 rounded-full transition-all duration-500 -z-0"
              style={{ 
                width: request.status === 'pending' ? '0%' : 
                       request.status === 'in_progress' ? '50%' : 
                       request.status === 'completed' ? '100%' : '0%'
              }}
            ></div>

            {/* Steps */}
            {[
              { id: 'pending', label: 'Received', icon: Clock },
              { id: 'in_progress', label: 'In Progress', icon: AlertCircle },
              { id: 'completed', label: 'Completed', icon: CheckCircle }
            ].map((step, index) => {
              const isActive = 
                (request.status === step.id) ||
                (request.status === 'completed') || 
                (request.status === 'in_progress' && step.id === 'pending');
              
              const isCurrent = request.status === step.id;
              
              const Icon = step.icon;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center bg-white px-2">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary-500 border-primary-500 text-white shadow-lg scale-110' 
                        : 'bg-white border-gray-200 text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`mt-2 text-sm font-medium transition-colors duration-300 ${
                    isCurrent ? 'text-primary-600 font-bold' : isActive ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Bar - Only for assigned staff */}
        {(request.status === 'pending' || request.status === 'in_progress') && (
          <>
            {/* Full action buttons ONLY for assigned staff */}
            {request.assigned_staff_id === user?.user_id && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6"
              >
                <div className="flex gap-3">
                  {request.status === 'pending' && (
                    <button
                      onClick={() => setConfirmModal({
                        show: true,
                        action: 'in_progress',
                        title: 'Start Task',
                        message: 'Are you sure you want to start working on this task?'
                      })}
                      disabled={updating}
                      className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3"
                    >
                      {updating ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Clock className="w-5 h-5" />}
                      Start Task
                    </button>
                  )}
                  
                  {request.status === 'in_progress' && (
                    <button
                      onClick={() => setConfirmModal({
                        show: true,
                        action: 'completed',
                        title: 'Mark as Complete',
                        message: 'Are you sure this task is complete? This action cannot be undone.'
                      })}
                      disabled={updating}
                      className="btn bg-mint-500 hover:bg-mint-600 text-white flex-1 flex items-center justify-center gap-2 py-3"
                    >
                      {updating ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <CheckCircle className="w-5 h-5" />}
                      Mark as Complete
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Manager view: only show Force Complete if assigned to someone else */}
            {request.assigned_staff_id && request.assigned_staff_id !== user?.user_id && (user?.role_type === 'manager' || user?.role_type === 'front_desk') && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Assigned to <span className="font-medium text-gray-700">{request.assigned_staff_name || 'staff member'}</span>
                </p>
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updating}
                  className="text-xs text-gray-400 hover:text-mint-600 flex items-center gap-1"
                >
                  {updating ? <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full" /> : <CheckCircle className="w-3 h-3" />}
                  Force Complete
                </button>
              </div>
            )}
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Request Details</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 leading-relaxed">
                  {request.description || 'No additional description provided by the guest.'}
                </p>
                
                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Requested on {request.requested_at ? new Date(request.requested_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Staff Assignment Card - Managers Only */}
            {(user?.role_type === 'manager' || user?.role_type === 'front_desk') && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-800">Assign Staff</h3>
                  </div>
                  {assignedStaff && !isChangingAssignment && (
                    <button 
                      onClick={() => setIsChangingAssignment(true)}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      Change
                    </button>
                  )}
                </div>
                <div className="p-4">
                  {assignedStaff && !isChangingAssignment ? (
                     <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg border border-green-100">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                           {staffList.find(s => s.user_id === parseInt(assignedStaff))?.full_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                           <p className="font-medium text-gray-900">
                              {staffList.find(s => s.user_id === parseInt(assignedStaff))?.full_name || 'Staff Member'}
                           </p>
                           <p className="text-xs text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Active Agent
                           </p>
                        </div>
                     </div>
                  ) : (
                    <>
                      <select 
                        className="input w-full mb-2"
                        value={assignedStaff || ''}
                        onChange={(e) => {
                           handleAssignStaff(e.target.value);
                           setIsChangingAssignment(false);
                        }}
                        disabled={updating || loadingStaff}
                        autoFocus={isChangingAssignment}
                      >
                        <option value="">Unassigned</option>
                        
                        {/* Only show staff with matching role for this service type */}
                        {staffList
                          .filter(s => getDepartmentServices(s.role_type).includes(request.service_type))
                          .map(staff => (
                            <option key={staff.user_id} value={staff.user_id}>
                              {staff.full_name} ({staff.active_tasks || 0} active)
                            </option>
                        ))}
                      </select>
                      {isChangingAssignment && (
                         <button 
                            onClick={() => setIsChangingAssignment(false)}
                            className="text-xs text-gray-500 hover:text-gray-700 w-full text-center mt-2"
                         >
                            Cancel Change
                         </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Location Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <Bed className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Location</h3>
              </div>
              <div className="p-4">
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-1">Room Number</p>
                  <p className="text-4xl font-bold text-primary-600">
                    {request.guest_room || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Guest Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Guest</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                    {request.guest_name?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{request.guest_name}</p>
                    <p className="text-xs text-gray-500">Registered Guest</p>
                  </div>
                </div>
                {request.guest_email && (
                  <p className="text-sm text-gray-600 break-all bg-gray-50 p-2 rounded">
                    {request.guest_email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Confirmation Modal */}
    {confirmModal.show && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-2">{confirmModal.title}</h3>
          <p className="text-gray-600 mb-6">{confirmModal.message}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmModal({ show: false, action: null, title: '', message: '' })}
              className="btn btn-white flex-1"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleStatusUpdate(confirmModal.action)
                setConfirmModal({ show: false, action: null, title: '', message: '' })
              }}
              disabled={updating}
              className={`btn flex-1 ${confirmModal.action === 'completed' ? 'bg-mint-500 hover:bg-mint-600' : 'btn-primary'} text-white`}
            >
              {updating ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </motion.div>
      </div>
    )}
    </>
  )
}

export default ServiceDetailsPage
