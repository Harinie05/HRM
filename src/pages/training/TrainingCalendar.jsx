import { useEffect, useState } from "react";
import { Calendar, Clock, Users, MapPin } from "lucide-react";
import api from "../../api";

export default function TrainingCalendar() {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await api.get("/api/training/programs", {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      // Filter programs that have dates and are published
      const programsWithDates = (res.data?.data || []).filter(program => 
        program.startDate && program.endDate && program.status === 'Published'
      ).map(program => ({
        id: program.id,
        title: program.title,
        description: program.description,
        start_date: program.startDate,
        end_date: program.endDate,
        status: 'Scheduled',
        enrolled_count: 0,
        location: program.department || 'TBD',
        trainer: program.trainer
      }));
      
      setCalendarEvents(programsWithDates);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request timed out');
      } else {
        console.error("Error fetching training calendar:", error);
      }
      setCalendarEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Training Calendar</h2>
            <p className="text-gray-600 mt-1">View scheduled training sessions and upcoming programs</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Sessions</p>
              <p className="text-2xl font-semibold text-blue-900">{calendarEvents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">This Month</p>
              <p className="text-2xl font-semibold text-green-900">
                {calendarEvents.filter(event => {
                  const eventDate = new Date(event.start_date);
                  const now = new Date();
                  return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Total Enrolled</p>
              <p className="text-2xl font-semibold text-purple-900">
                {calendarEvents.reduce((sum, event) => sum + (event.enrolled_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-600">Locations</p>
              <p className="text-2xl font-semibold text-orange-900">
                {new Set(calendarEvents.map(event => event.location).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">

        {/* Content */}
        <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : calendarEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled training sessions</h3>
            <p className="mt-1 text-sm text-gray-500">Training sessions will appear here when programs are published to the calendar.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {calendarEvents.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                    <p className="text-gray-600 mt-1">{event.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>{event.enrolled_count || 0} enrolled</span>
                      </div>
                      {event.trainer && (
                        <div className="flex items-center gap-1">
                          <span>Trainer: {event.trainer}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                    event.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                    event.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}