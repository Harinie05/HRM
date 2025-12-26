import { useEffect, useState } from "react";
import api from "../../api";

export default function Shifts() {
  // Shift Configuration State
  const [shiftForm, setShiftForm] = useState({
    name: "",
    code: "",
    start_time: "",
    end_time: "",
    break_duration: "",
    description: "",
  });
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showViewShifts, setShowViewShifts] = useState(false);
  
  // Roster Management State
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week");
  const [rosterData, setRosterData] = useState({});
  const [editingCell, setEditingCell] = useState(null);

  const tenant_db = localStorage.getItem("tenant_db");

  useEffect(() => {
    fetchShifts();
    fetchEmployees();
    fetchRosterData();
  }, []);

  const fetchShifts = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      if (!tenant || !token) return;
      
      const response = await fetch(`http://localhost:8000/shifts/${tenant}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShifts(data.shifts || []);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get(`/hospitals/users/${tenant_db}/list`);
      setEmployees(res.data.users || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchRosterData = async () => {
    try {
      const dates = getDateRange();
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/api/roster/schedule?start_date=${startDate}&end_date=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Process roster data into a more usable format
        const processedData = {};
        data.roster?.forEach(entry => {
          if (!processedData[entry.employee_id]) {
            processedData[entry.employee_id] = {};
          }
          entry.schedule?.forEach(dayData => {
            processedData[entry.employee_id][dayData.date] = dayData.shift_id;
          });
        });
        setRosterData(processedData);
      }
    } catch (error) {
      console.error("Error fetching roster data:", error);
    }
  };

  const deleteShift = async (shiftId) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      const response = await fetch(`http://localhost:8000/shifts/${tenant}/${shiftId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert("Shift deleted successfully!");
        fetchShifts();
      }
    } catch (error) {
      console.error("Error deleting shift:", error);
      alert("Failed to delete shift");
    }
  };

  function handleShiftChange(e) {
    setShiftForm({ ...shiftForm, [e.target.name]: e.target.value });
  }

  async function handleShiftSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      const response = await fetch(`http://localhost:8000/shifts/${tenant}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(shiftForm)
      });
      
      if (response.ok) {
        alert("Shift Configuration Saved Successfully!");
        setShiftForm({ name: "", code: "", start_time: "", end_time: "", break_duration: "", description: "" });
        fetchShifts();
      }
    } catch (err) {
      alert('Failed to save shift configuration');
    } finally {
      setLoading(false);
    }
  }

  const addEmployeeToRoster = async () => {
    if (!selectedEmployee) {
      alert("Please select an employee");
      return;
    }
    
    const employee = employees.find(emp => emp.id == selectedEmployee);
    if (!employee) return;
    
    // Add employee to roster data
    setRosterData(prev => ({
      ...prev,
      [employee.id]: {}
    }));
    
    setSelectedEmployee("");
  };

  const updateRosterCell = async (employeeId, date, shiftId) => {
    setRosterData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [date]: shiftId
      }
    }));
    
    // Save to backend
    try {
      const token = localStorage.getItem("access_token");
      await fetch("http://localhost:8000/api/roster/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: employeeId,
          date: date,
          shift_id: shiftId === "OFF" ? null : parseInt(shiftId),
          status: shiftId === "OFF" ? "OFF" : "Scheduled"
        })
      });
    } catch (error) {
      console.error("Error saving roster:", error);
    }
  };

  const getDateRange = () => {
    const dates = [];
    let start, end;
    
    if (viewMode === "week") {
      const curr = new Date(currentDate);
      const first = curr.getDate() - curr.getDay() + 1;
      start = new Date(curr.setDate(first));
      end = new Date(curr.setDate(first + 6));
    } else {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const getCalendarTitle = () => {
    if (viewMode === "week") {
      const dates = getDateRange();
      const start = new Date(dates[0]);
      const end = new Date(dates[dates.length - 1]);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const calculateDuration = (start, end) => {
    const startTime = new Date(`2000-01-01 ${start}`);
    const endTime = new Date(`2000-01-01 ${end}`);
    let diff = endTime - startTime;
    if (diff < 0) diff += 24 * 60 * 60 * 1000;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hours`;
  };

  const rosterEmployees = Object.keys(rosterData).map(empId => {
    const employee = employees.find(emp => emp.id == empId);
    return employee ? { ...employee, roster: rosterData[empId] } : null;
  }).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Shift Configuration */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Shift Configuration</h2>
                <p className="text-sm text-gray-600">Configure shift timings and schedules</p>
              </div>
            </div>
            <button
              onClick={() => setShowViewShifts(!showViewShifts)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View All Shifts ({shifts.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleShiftSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                name="name"
                value={shiftForm.name}
                onChange={handleShiftChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="e.g., Morning Shift"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                name="code"
                value={shiftForm.code}
                onChange={handleShiftChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="e.g., MS001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                name="start_time"
                value={shiftForm.start_time}
                onChange={handleShiftChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                name="end_time"
                value={shiftForm.end_time}
                onChange={handleShiftChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Break Duration (minutes)</label>
              <input
                type="number"
                name="break_duration"
                value={shiftForm.break_duration}
                onChange={handleShiftChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="e.g., 60"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={shiftForm.description}
              onChange={handleShiftChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              placeholder="Shift description and additional details"
            />
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        {/* View All Shifts Section */}
        {showViewShifts && (
          <div className="border-t border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">All Shifts</h3>
              {shifts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No shifts found</h3>
                  <p className="text-gray-500 text-sm">Create your first shift to get started with shift management</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shifts.map((shift) => (
                    <div key={shift.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => deleteShift(shift.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{shift.name}</h3>
                        <p className="text-sm text-gray-600">Code: {shift.code}</p>
                        <p className="text-sm text-gray-600">{shift.start_time} - {shift.end_time}</p>
                        {shift.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{shift.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {calculateDuration(shift.start_time, shift.end_time)}
                        </span>
                        {shift.break_duration && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {shift.break_duration}min break
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Roster Management */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9H4V7z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Roster Management</h2>
              <p className="text-sm text-gray-600">Assign employees to shifts and manage schedules</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Employee to Roster */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Employee to Roster</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.employee_code || employee.email}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={addEmployeeToRoster}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
              >
                Add to Roster
              </button>
            </div>
          </div>

          {/* Calendar Controls */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === "week" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === "month" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Month
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 text-gray-700 hover:bg-white rounded-xl border border-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <h3 className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
                  {getCalendarTitle()}
                </h3>
                
                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 text-gray-700 hover:bg-white rounded-xl border border-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
          </div>

          {/* Roster Calendar */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">
                {viewMode === "week" ? "Weekly" : "Monthly"} Roster Calendar
                {rosterEmployees.length > 0 && (
                  <span className="ml-2 text-sm text-gray-600">({rosterEmployees.length} employees)</span>
                )}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-fixed">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900 min-w-[180px] border-r border-gray-200">
                      Employee
                    </th>
                    {getDateRange().map((date) => {
                      const dayName = getDayName(date);
                      const dayNum = new Date(date).getDate();
                      const isWeekend = ['Sat', 'Sun'].includes(dayName);
                      
                      return (
                        <th key={date} className={`px-3 py-3 text-center min-w-[100px] border-r border-gray-200 ${
                          isWeekend ? 'bg-red-50' : ''
                        }`}>
                          <div className={`font-medium text-sm ${
                            isWeekend ? 'text-red-600' : 'text-gray-900'
                          }`}>{dayName}</div>
                          <div className={`text-xs ${
                            isWeekend ? 'text-red-500' : 'text-gray-500'
                          }`}>{dayNum}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rosterEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={getDateRange().length + 1} className="px-8 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m6-10v10m-6-4h6" />
                          </svg>
                          <p className="text-lg font-medium">No employees in roster</p>
                          <p className="text-sm">Add employees above to start scheduling shifts</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rosterEmployees.map((employee, index) => (
                      <tr key={employee.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                        <td className="px-4 py-3 border-r border-gray-200">
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900 text-sm">{employee.name}</div>
                            <div className="text-xs text-gray-500">{employee.employee_code || employee.email}</div>
                          </div>
                        </td>
                        {getDateRange().map((date) => {
                          const dayName = getDayName(date);
                          const isWeekend = ['Sat', 'Sun'].includes(dayName);
                          const shiftValue = employee.roster?.[date] || "";
                          const shift = shifts.find(s => s.id == shiftValue);
                          
                          return (
                            <td key={date} className={`px-2 py-3 border-r border-gray-200 text-center ${
                              isWeekend ? 'bg-red-25' : ''
                            }`}>
                              {editingCell === `${employee.id}-${date}` ? (
                                <select
                                  value={shiftValue}
                                  onChange={(e) => {
                                    updateRosterCell(employee.id, date, e.target.value);
                                    setEditingCell(null);
                                  }}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select</option>
                                  {shifts.map((shift) => (
                                    <option key={shift.id} value={shift.id}>{shift.name}</option>
                                  ))}
                                  <option value="OFF">OFF</option>
                                </select>
                              ) : shiftValue ? (
                                <div 
                                  onClick={() => setEditingCell(`${employee.id}-${date}`)}
                                  className={`px-2 py-1 text-xs rounded font-medium cursor-pointer hover:opacity-80 ${
                                    shiftValue === "OFF" ? 'bg-red-100 text-red-700' :
                                    'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {shiftValue === "OFF" ? "OFF" : shift?.name || "Unknown"}
                                </div>
                              ) : (
                                <div 
                                  onClick={() => setEditingCell(`${employee.id}-${date}`)}
                                  className="text-gray-400 text-xs cursor-pointer hover:text-blue-500 hover:bg-blue-50 py-1 rounded"
                                >
                                  + Add
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}