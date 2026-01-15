import { useEffect, useState } from "react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function HolidayCalendar() {
  const { toast, showToast } = useToast();
  const tenant_db = localStorage.getItem("tenant_db");

  // Permission checks
  const canView = isAdmin() || hasPermission("view_holiday");
  const canAdd = isAdmin() || hasPermission("add_holiday");
  const canEdit = isAdmin() || hasPermission("edit_holiday");
  const canDelete = isAdmin() || hasPermission("delete_holiday");

  // Block access if no view permission
  if (!canView) {
    return (
      <div className="bg-white rounded-2xl border border-black p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have permission to view Holiday Calendar.</p>
      </div>
    );
  }

  // Form States
  const [form, setForm] = useState({
    name: "",
    date: "",
    type: "Festival",
    description: "",
    repeat_yearly: true,
    status: "Active"
  });

  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [showViewHolidays, setShowViewHolidays] = useState(false);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);

  const holidayTypes = ["National", "Public", "Festival", "Optional", "Company"];
  const years = [2024, 2025, 2026, 2027, 2028];

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await api.get('/holidays/list');
      setHolidays(res.data || []);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (editingId && !canEdit) {
      showToast("You do not have permission to edit holidays", "error");
      return;
    }
    
    if (!editingId && !canAdd) {
      showToast("You do not have permission to add holidays", "error");
      return;
    }
    
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/holidays/update/${editingId}`, form);
        showToast("Holiday updated successfully!", "success");
        setEditingId(null);
      } else {
        await api.post('/holidays/create', form);
        showToast("Holiday Calendar Saved Successfully!", "success");
      }
      
      clearForm();
      fetchHolidays();
    } catch (err) {
      showToast('Failed to save holiday', "error");
    } finally {
      setLoading(false);
    }
  }

  const clearForm = () => {
    setForm({
      name: "",
      date: "",
      type: "Festival",
      description: "",
      repeat_yearly: true,
      status: "Active"
    });
    setEditingId(null);
  };

  const loadHolidayForEdit = (holiday) => {
    setEditingId(holiday.id);
    setForm({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
      description: holiday.description || "",
      repeat_yearly: holiday.repeat_yearly,
      status: holiday.status
    });
    setShowViewHolidays(false);
  };

  const deleteHoliday = async (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete holidays", "error");
      return;
    }
    
    if (!window.confirm("Delete this holiday?")) return;
    try {
      await api.delete(`/holidays/delete/${id}`);
      showToast("Holiday deleted successfully!", "success");
      fetchHolidays();
    } catch (err) {
      showToast("Failed to delete holiday", "error");
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
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Filter holidays
  const filteredHolidays = holidays.filter(h => {
    if (!h.date.startsWith(yearFilter.toString())) return false;
    if (typeFilter !== "All" && h.type !== typeFilter) return false;
    if (searchTerm.trim() !== "" && !h.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Holiday Configuration */}
      <div className="bg-white rounded-xl p-5 shadow-sm overflow-hidden relative border" style={{
        background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
        borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
      }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
          transform: 'translate(40%, -40%)'
        }}></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
          transform: 'translate(-40%, 40%)'
        }}></div>
        <div className="p-5 border-b-0 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="h-5 w-5" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9H4V7z"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Holiday Calendar</h2>
            </div>
            <button
              onClick={() => setShowViewHolidays(!showViewHolidays)}
              className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              style={{
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View All Holidays ({holidays.length})
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">Configure company holidays and observances</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Holiday Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Holiday Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                  border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                }}
                placeholder="e.g., Diwali, Christmas"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                  border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                }}
              />
            </div>

            {/* Holiday Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Holiday Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                  border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                }}
              >
                {holidayTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                  border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Description - Full Width */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm resize-none"
              style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
              }}
              placeholder="Holiday description and details"
            />
          </div>

          {/* Repeat Yearly Checkbox */}
          <div className="mt-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="repeat_yearly"
                checked={form.repeat_yearly}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`
                }}
              />
              <span className="text-sm font-medium text-gray-700">Repeat Every Year</span>
            </label>
          </div>

          {/* Submit Button */}
          {(canAdd || (editingId && canEdit)) && (
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                }}
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
                    {editingId ? 'Update Holiday' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {/* View All Holidays Section */}
        {showViewHolidays && (
          <div className="-t-0">
            <div className="p-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search holidays..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
                  >
                    <option value="All">All Types</option>
                    {holidayTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-4">All Holidays</h3>
              {filteredHolidays.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9H4V7z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No holidays found</h3>
                  <p className="text-gray-500 text-sm">Create your first holiday to get started with holiday management</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredHolidays.map((holiday) => (
                    <div key={holiday.id} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden border" style={{
                      background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
                      borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                    }}>
                      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20" style={{
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
                        transform: 'translate(30%, -30%)'
                      }}></div>
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-sm" style={{
                          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }}>
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9H4V7z"/>
                          </svg>
                        </div>
                        <div className="flex gap-2">
                          {canEdit && (
                            <button 
                              onClick={() => loadHolidayForEdit(holiday)}
                              className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors" 
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {canDelete && (
                            <button 
                              onClick={() => deleteHoliday(holiday.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{holiday.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(holiday.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        {holiday.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{holiday.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(holiday.type)}`}>
                          {holiday.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            holiday.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {holiday.status}
                          </span>
                          {holiday.repeat_yearly && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Yearly
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Toast toast={toast} />
    </div>
  );
}
