import { useEffect, useState } from "react";
import { Plus, Calendar, Filter, Search, Edit3, Trash2, X } from "lucide-react";
import api from "../../api";

export default function HolidayCalendar() {
  const tenant_db = localStorage.getItem("tenant_db");

  // States
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayType, setHolidayType] = useState("Festival");
  const [description, setDescription] = useState("");
  const [repeat, setRepeat] = useState(true);
  const [status, setStatus] = useState("Active");
  const [holidays, setHolidays] = useState([]);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);

  const years = [2024, 2025, 2026, 2027, 2028];
  const holidayTypes = ["National", "Public", "Festival", "Optional", "Company"];

  useEffect(() => {
    fetchHolidays();
  }, [yearFilter, typeFilter]);

  const fetchHolidays = async () => {
    try {
      const res = await api.get(`/holidays/list`);
      setHolidays(res.data || []);
    } catch {
      setHolidays([]);
    }
  };

  // Filter holidays
  const filteredHolidays = holidays.filter(h => {
    if (!h.date.startsWith(yearFilter.toString())) return false;
    if (typeFilter !== "All" && h.type !== typeFilter) return false;
    if (search.trim() !== "" && !h.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const saveHoliday = async () => {
    if (!holidayName || !holidayDate) return alert("Holiday name and date required");

    try {
      const payload = {
        name: holidayName, date: holidayDate, type: holidayType,
        description, repeat_yearly: repeat, status,
      };

      if (editingId) {
        await api.put(`/holidays/update/${editingId}`, payload);
      } else {
        await api.post(`/holidays/create`, payload);
      }

      alert(editingId ? "Holiday updated successfully!" : "Holiday saved successfully!");
      resetForm();
      fetchHolidays();
    } catch (err) {
      alert(err.response?.data?.detail || "Save failed");
    }
  };

  const resetForm = () => {
    setEditingId(null); setHolidayName(""); setHolidayDate(""); setHolidayType("Festival");
    setDescription(""); setRepeat(true); setStatus("Active");
  };

  const loadHolidayForEdit = (holiday) => {
    setEditingId(holiday.id); setHolidayName(holiday.name); setHolidayDate(holiday.date);
    setHolidayType(holiday.type); setDescription(holiday.description || "");
    setRepeat(holiday.repeat_yearly); setStatus(holiday.status);
  };

  const deleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
    try {
      await api.delete(`/holidays/delete/${id}`);
      alert("Holiday deleted successfully!");
      fetchHolidays();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      National: 'bg-red-100 text-red-800',
      Public: 'bg-blue-100 text-blue-800',
      Festival: 'bg-purple-100 text-purple-800',
      Optional: 'bg-yellow-100 text-yellow-800',
      Company: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-primary';
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b  px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex-shrink-0">
              <Calendar className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Holiday Calendar</h1>
              <p className=" mt-1" style={{color: 'var(--text-secondary, #374151)'}}>Manage company holidays and observances</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary">Total Holidays: {filteredHolidays.length}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create/Edit Form */}
          <div className="rounded-xl shadow-sm border" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
            <div className="px-6 py-4 border-b ">
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  {editingId ? 'Edit Holiday' : 'Create Holiday'}
                </h2>
                <p className=" text-sm" style={{color: 'var(--text-secondary, #374151)'}}>Add official company holidays</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Holiday Name</label>
                  <input
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Diwali, Christmas"
                    value={holidayName} onChange={e => setHolidayName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={holidayDate} onChange={e => setHolidayDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Type</label>
                  <select
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={holidayType} onChange={e => setHolidayType(e.target.value)}
                  >
                    {holidayTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Status</label>
                  <select
                    className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={status} onChange={e => setStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3" placeholder="Optional description"
                  value={description} onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox" checked={repeat}
                  onChange={e => setRepeat(e.target.checked)}
                  className="rounded -dark text-indigo-600 focus:ring-indigo-500"
                />
                <label className="text-sm font-medium text-secondary">Repeat Every Year</label>
              </div>

              <div className="flex gap-3 pt-4 border-t ">
                <button
                  onClick={saveHoliday}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingId ? 'Update Holiday' : 'Save Holiday'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-white border-dark text-secondary text-sm font-medium rounded-lg hover:bg-content transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Holiday List */}
          <div className="rounded-xl shadow-sm border" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
            <div className="px-6 py-4 border-b ">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary">Holiday List</h2>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="" style={{color: 'var(--text-muted, #6b7280)'}} />
                  <select
                    className="px-3 py-1 border-dark rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Search size={16} className="" style={{color: 'var(--text-muted, #6b7280)'}} />
                  <input
                    className="px-3 py-1 border-dark rounded-md text-sm w-40 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Search holidays"
                    value={search} onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <select
                  className="px-3 py-1 border-dark rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  {holidayTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>

            <div className="p-6">
              {filteredHolidays.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className=" font-medium" style={{color: 'var(--text-muted, #6b7280)'}}>No holidays found</p>
                  <p className=" text-sm" style={{color: 'var(--text-muted, #6b7280)'}}>Create your first holiday to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredHolidays.map(h => (
                    <div key={h.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-primary">{h.name}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(h.type)}`}>
                            {h.type}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            h.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {h.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-secondary">
                          <span>{new Date(h.date).toLocaleDateString('en-US', { 
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                          })}</span>
                          {h.repeat_yearly && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Yearly</span>}
                        </div>
                        {h.description && <p className="text-sm text-muted mt-1">{h.description}</p>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => loadHolidayForEdit(h)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => deleteHoliday(h.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
