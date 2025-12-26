import { useState, useEffect } from "react";
import api from "../../api";

export default function RulesPolicies() {
  // Form States
  const [form, setForm] = useState({
    name: "",
    type: "HR Policy",
    description: "",
    notice_days: "",
    probation_period: "",
    work_week: "Mon-Fri",
    annual_leave: "",
    sick_leave: "",
    casual_leave: "",
    checkin_time: "",
    checkout_time: "",
    grace_period: "",
    status: "Active"
  });

  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [showViewPolicies, setShowViewPolicies] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const policyTypes = ["HR Policy", "Leave Policy", "Attendance Policy", "OT Policy"];

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await api.get('/policies/hr/list');
      setPolicies(res.data || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
    }
  };

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    
    if (name === 'type') {
      // Clear irrelevant fields when policy type changes
      const clearedForm = {
        name: form.name,
        type: value,
        description: form.description,
        status: form.status,
        notice_days: "",
        probation_period: "",
        work_week: "Mon-Fri",
        annual_leave: "",
        sick_leave: "",
        casual_leave: "",
        checkin_time: "",
        checkout_time: "",
        grace_period: ""
      };
      setForm(clearedForm);
    } else {
      setForm({ 
        ...form, 
        [name]: type === 'checkbox' ? checked : value 
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // Clean the form data - keep numeric fields as strings, convert empty strings to null
      const cleanedForm = {
        name: form.name,
        type: form.type,
        description: form.description || "",
        status: form.status,
        notice_days: form.notice_days || null,
        probation_period: form.probation_period || null,
        work_week: form.work_week || null,
        annual_leave: form.annual_leave || null,
        sick_leave: form.sick_leave || null,
        casual_leave: form.casual_leave || null,
        checkin_time: form.checkin_time || null,
        checkout_time: form.checkout_time || null,
        grace_period: form.grace_period || null,
        // Add required field that was missing
        holiday_pattern: "standard",
        // Add potential missing required fields
        created_by: "system",
        updated_by: "system",
        effective_date: new Date().toISOString().split('T')[0],
        is_active: true
      };

      console.log('Sending cleaned form data:', cleanedForm);

      if (editingId) {
        await api.put(`/policies/hr/update/${editingId}`, cleanedForm);
        alert("Policy updated successfully!");
        setEditingId(null);
      } else {
        await api.post('/policies/hr/create', cleanedForm);
        alert("Rules & Policies Saved Successfully!");
      }
      
      clearForm();
      fetchPolicies();
    } catch (err) {
      console.error('Policy save error:', err);
      console.error('Error response:', err.response?.data);
      if (err.response?.data?.detail) {
        console.error('Error details:', err.response.data.detail);
        err.response.data.detail.forEach((error, index) => {
          console.log(`Error ${index + 1}:`, error);
        });
      }
      alert('Failed to save policy. Check console for details.');
    } finally {
      setLoading(false);
    }
  }

  const clearForm = () => {
    setForm({
      name: "",
      type: "HR Policy",
      description: "",
      notice_days: "",
      probation_period: "",
      work_week: "Mon-Fri",
      annual_leave: "",
      sick_leave: "",
      casual_leave: "",
      checkin_time: "",
      checkout_time: "",
      grace_period: "",
      status: "Active"
    });
    setEditingId(null);
  };

  const loadPolicyForEdit = (policy) => {
    setEditingId(policy.id);
    setForm({
      name: policy.name || '',
      type: policy.type || 'HR Policy',
      description: policy.description || '',
      notice_days: policy.notice_days || '',
      probation_period: policy.probation_period || '',
      work_week: policy.work_week || 'Mon-Fri',
      annual_leave: policy.annual_leave || '',
      sick_leave: policy.sick_leave || '',
      casual_leave: policy.casual_leave || '',
      checkin_time: policy.checkin_time || '',
      checkout_time: policy.checkout_time || '',
      grace_period: policy.grace_period || '',
      status: policy.status || 'Active'
    });
    setShowViewPolicies(false);
  };

  const deletePolicy = async (id) => {
    if (!confirm('Delete this policy?')) return;
    try {
      await api.delete(`/policies/hr/delete/${id}`);
      alert('Policy deleted successfully');
      fetchPolicies();
    } catch (err) {
      alert('Failed to delete policy');
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy Configuration */}
      <div className="bg-white rounded-3xl border border-black shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl border border-black flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Rules & Policies</h2>
                <p className="text-sm text-gray-600">Configure company policies and rules</p>
              </div>
            </div>
            <button
              onClick={() => setShowViewPolicies(!showViewPolicies)}
              className="inline-flex items-center gap-2 bg-white border border-black text-gray-900 px-4 py-2 rounded-2xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View All Policies ({policies.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Policy Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                placeholder="e.g., Employee Handbook"
              />
            </div>

            {/* Policy Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              >
                {policyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* HR Policy Fields */}
            {form.type === "HR Policy" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notice Period (Days)</label>
                  <input
                    type="number"
                    name="notice_days"
                    value={form.notice_days}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Probation Period (Days)</label>
                  <input
                    type="number"
                    name="probation_period"
                    value={form.probation_period}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                    placeholder="90"
                  />
                </div>
              </>
            )}

            {/* Leave Policy Fields */}
            {form.type === "Leave Policy" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Annual Leave (Days)</label>
                  <input
                    type="number"
                    name="annual_leave"
                    value={form.annual_leave}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                    placeholder="21"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sick Leave (Days)</label>
                  <input
                    type="number"
                    name="sick_leave"
                    value={form.sick_leave}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Casual Leave (Days)</label>
                  <input
                    type="number"
                    name="casual_leave"
                    value={form.casual_leave}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                    placeholder="12"
                  />
                </div>
              </>
            )}

            {/* Attendance Policy Fields */}
            {form.type === "Attendance Policy" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Time</label>
                  <input
                    type="time"
                    name="checkin_time"
                    value={form.checkin_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Time</label>
                  <input
                    type="time"
                    name="checkout_time"
                    value={form.checkout_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grace Period (Minutes)</label>
                  <input
                    type="number"
                    name="grace_period"
                    value={form.grace_period}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                    placeholder="15"
                  />
                </div>
              </>
            )}

            {/* OT Policy Fields */}
            {form.type === "OT Policy" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Week</label>
                <select
                  name="work_week"
                  value={form.work_week}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                >
                  <option value="Mon-Fri">Monday to Friday</option>
                  <option value="Mon-Sat">Monday to Saturday</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            )}

            {/* Status - Always visible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
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
              className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm resize-none"
              placeholder="Policy description and details"
            />
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-white border border-black text-gray-900 hover:bg-gray-50 px-8 py-3 rounded-2xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-sm"
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
                  {editingId ? 'Update Policy' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* View All Policies Section */}
        {showViewPolicies && (
          <div className="border-t border-black">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">All Policies</h3>
              {policies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl border border-black flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No policies found</h3>
                  <p className="text-gray-500 text-sm">Create your first policy to get started with policy management</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {policies.map((policy) => (
                    <div key={policy.id} className="bg-white rounded-2xl border border-black p-6 hover:bg-gray-50 transition-colors shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl border border-black flex items-center justify-center text-gray-600">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => loadPolicyForEdit(policy)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl border border-black transition-colors" 
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => deletePolicy(policy.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl border border-black transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{policy.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{policy.type}</p>
                        {policy.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{policy.description}</p>
                        )}
                        
                        {/* Policy Details */}
                        <div className="space-y-2 text-sm">
                          {policy.notice_days && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Notice Period:</span>
                              <span className="text-gray-900">{policy.notice_days} days</span>
                            </div>
                          )}
                          {policy.probation_period && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Probation:</span>
                              <span className="text-gray-900">{policy.probation_period} days</span>
                            </div>
                          )}
                          {policy.annual_leave && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Annual Leave:</span>
                              <span className="text-gray-900">{policy.annual_leave} days</span>
                            </div>
                          )}
                          {policy.sick_leave && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Sick Leave:</span>
                              <span className="text-gray-900">{policy.sick_leave} days</span>
                            </div>
                          )}
                          {policy.casual_leave && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Casual Leave:</span>
                              <span className="text-gray-900">{policy.casual_leave} days</span>
                            </div>
                          )}
                          {policy.checkin_time && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Check-in:</span>
                              <span className="text-gray-900">{policy.checkin_time}</span>
                            </div>
                          )}
                          {policy.checkout_time && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Check-out:</span>
                              <span className="text-gray-900">{policy.checkout_time}</span>
                            </div>
                          )}
                          {policy.grace_period && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Grace Period:</span>
                              <span className="text-gray-900">{policy.grace_period} min</span>
                            </div>
                          )}
                          {policy.work_week && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Work Week:</span>
                              <span className="text-gray-900">{policy.work_week}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-2xl text-xs font-medium border border-black ${
                          policy.status === 'Active' ? 'bg-white text-gray-800' : 'bg-gray-200 text-gray-800'
                        }`}>
                          {policy.status}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-2xl text-xs font-medium bg-gray-100 text-gray-800 border border-black">
                          {policy.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}