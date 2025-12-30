import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, addMonths, subMonths, isSameMonth, 
  isSameDay, parseISO 
} from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalIcon } from 'lucide-react'
import { facilityAPI } from '../../services/api'
import { toast } from 'react-toastify'

const FacilityCalendar = () => {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCalendarData()
  }, [currentDate])

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd')
      
      // Fetch specifically for calendar range
      const response = await facilityAPI.getEventCalendar({ 
        start_date: start, 
        end_date: end 
      })

      if (response.data && response.data.data && response.data.data.events) {
        setEvents(response.data.data.events)
      } else {
        setEvents({})
      }
    } catch (error) {
      console.error('Error loading calendar:', error)
      toast.error('Failed to load calendar events')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  // Utility to get grid days
  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: startDate, end: endDate })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'inquiry': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'quoted': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <CalIcon className="w-5 h-5 text-primary-600" />
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">
            Today
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
          {getCalendarDays().map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayEvents = events[dateKey] || []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())

            return (
              <div 
                key={dateKey} 
                className={`min-h-[100px] border-b border-r p-2 flex flex-col ${
                  !isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white'
                } ${isToday ? 'bg-blue-50/30' : ''}`}
              >
                <div className={`text-right text-xs mb-1 ${isToday ? 'font-bold text-primary-600' : ''}`}>
                  {isToday ? <span className="bg-primary-100 px-1.5 py-0.5 rounded-full">{format(day, 'd')}</span> : format(day, 'd')}
                </div>
                
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                  {dayEvents.map(event => (
                    <div
                      key={event.booking_id}
                      onClick={() => navigate(`/staff/facility-bookings/${event.booking_id}`)}
                      className={`text-[10px] px-1.5 py-1 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(event.status)}`}
                      title={`${event.event_name || event.facility_name} (${event.start_time?.slice(0,5)})`}
                    >
                      <span className="font-semibold">{event.start_time?.slice(0,5)}</span> {event.event_name || event.facility_name}
                    </div>
                  ))}
                  {dayEvents.length === 0 && !isCurrentMonth && (
                    <div className="h-full"></div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FacilityCalendar
