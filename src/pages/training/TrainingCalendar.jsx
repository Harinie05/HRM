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

      <div className="rounded-lg shadow-sm border border-black" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>

        {/* Content */}
        <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : calendarEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted" />
            <h3 className="mt-2 text-sm font-medium text-primary">No scheduled training sessions</h3>
            <p className="mt-1 text-sm text-muted">Training sessions will appear here when programs are published to the calendar.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {calendarEvents.map((event) => (
              <div key={event.id} className="border border-black rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-primary">{event.title}</h3>
                    <p className=" mt-1" style={{color: 'var(--text-secondary, #374151)'}}>{event.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted">
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
                    'bg-gray-100 text-primary'
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
