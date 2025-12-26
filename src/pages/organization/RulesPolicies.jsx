import { useState, useEffect } from "react";
import { Shield, FileText, Clock, Users, Settings, Plus, Edit, Trash2, Check, X } from "lucide-react";
import api from "../../api";

export default function RulesPolicies() {
  const [activeTab, setActiveTab] = useState("HR Policies");
  const [policies, setPolicies] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // HR Policy States
  const [hrForm, setHrForm] = useState({
    name: "", description: "", notice_days: "", probation_period: "",
    work_week: "Mon-Fri", holiday_pattern: "Based on Holiday Calendar", 
    status: "Active", policy_file: null
  });

  // Leave Policy States
  const [leaveForm, setLeaveForm] = useState({
    name: "", annual: "", sick: "", casual: "", carry_forward: true,
    max_carry: "", encashment: true, rule: "Full Day", status: "Active"
  });

  // Attendance Policy States
  const [attendanceForm, setAttendanceForm] = useState({
    name: "", checkin_start: "", checkin_end: "", checkout_time: "",
    grace: "", late_max: "", late_convert: "1 Half Day after 3 late marks",
    half_hours: "", full_hours: "", weekly_off: "Sat & Sun", status: "Active"
  });

  // OT Policy States
  const [otForm, setOtForm] = useState({
    name: "", basis: "Hourly", rate: "1.5x", min_ot: "", max_ot: "",
    grades: [], auto_ot: true, status: "Active"
  });

  const [availableGrades, setAvailableGrades] = useState([]);

  const tabs = ["HR Policies", "Leave Policies", "Attendance Policies", "OT Policies"];

  useEffect(() => {
    fetchPolicies();
    if (activeTab === "OT Policies") fetchGrades();
  }, [activeTab]);

  const fetchPolicies = async () => {
    try {
      let endpoint = "";
      if (activeTab === "HR Policies") endpoint = "/policies/hr/list";
      else if (activeTab === "Leave Policies") endpoint = "/policies/leave/list";
      else if (activeTab === "Attendance Policies") endpoint = "/policies/attendance/list";
      else if (activeTab === "OT Policies") endpoint = "/policies/ot/list";
      
      const res = await api.get(endpoint);
      setPolicies(res.data || []);
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
    }
  };

  const fetchGrades = async () => {
    try {
      const res = await api.get('/grades/');
      setAvailableGrades(res.data || []);
    } catch (err) {
      console.error('Error fetching grades:', err);
    }
  };

  const savePolicy = async () => {
    const payload = buildPayload();
    let endpoint = "";
    
    if (activeTab === "HR Policies") endpoint = editingId ? `/policies/hr/update/${editingId}` : "/policies/hr/create";
    else if (activeTab === "Leave Policies") endpoint = editingId ? `/policies/leave/update/${editingId}` : "/policies/leave/create";
    else if (activeTab === "Attendance Policies") endpoint = editingId ? `/policies/attendance/update/${editingId}` : "/policies/attendance/create";
    else if (activeTab === "OT Policies") endpoint = editingId ? `/policies/ot/update/${editingId}` : "/policies/ot/create";

    try {
      let policyId = editingId;
      if (editingId) {
        await api.put(endpoint, payload);
      } else {
        const res = await api.post(endpoint, payload);
        policyId = res.data.id;
      }

      // Upload file for HR Policy
      if (activeTab === "HR Policies" && hrForm.policy_file) {
        const formData = new FormData();
        formData.append('file', hrForm.policy_file);
        await api.post(`/policies/hr/upload/${policyId}`, formData, {
          headers: {'Content-Type': 'multipart/form-data'}
        });
      }

      alert(editingId ? "Updated Successfully" : "Saved Successfully");
      resetForm();
      setShowCreateModal(false);
      fetchPolicies();
    } catch (err) {
      console.error(`Error saving ${activeTab}:`, err);
      alert(err.response?.data?.detail || "Failed");
    }
  };

  const buildPayload = () => {
    if (activeTab === "HR Policies") return hrForm;
    if (activeTab === "Leave Policies") return leaveForm;
    if (activeTab === "Attendance Policies") return attendanceForm;
    if (activeTab === "OT Policies") return otForm;
  };

  const resetForm = () => {
    setEditingId(null);
    if (activeTab === "HR Policies") {
      setHrForm({
        name: "", description: "", notice_days: "", probation_period: "",
        work_week: "Mon-Fri", holiday_pattern: "Based on Holiday Calendar", 
        status: "Active", policy_file: null
      });
    } else if (activeTab === "Leave Policies") {
      setLeaveForm({
        name: "", annual: "", sick: "", casual: "", carry_forward: true,
        max_carry: "", encashment: true, rule: "Full Day", status: "Active"
      });
    } else if (activeTab === "Attendance Policies") {
      setAttendanceForm({
        name: "", checkin_start: "", checkin_end: "", checkout_time: "",
        grace: "", late_max: "", late_convert: "1 Half Day after 3 late marks",
        half_hours: "", full_hours: "", weekly_off: "Sat & Sun", status: "Active"
      });
    } else if (activeTab === "OT Policies") {
      setOtForm({
        name: "", basis: "Hourly", rate: "1.5x", min_ot: "", max_ot: "",
        grades: [], auto_ot: true, status: "Active"
      });
    }
  };

  const loadForEdit = (policy) => {
    setEditingId(policy.id);
    if (activeTab === "HR Policies") {
      setHrForm({
        name: policy.name || '', description: policy.description || '',
        notice_days: policy.notice_days || '', probation_period: policy.probation_period || '',
        work_week: policy.work_week || 'Mon-Fri', 
        holiday_pattern: policy.holiday_pattern || 'Based on Holiday Calendar',
        status: policy.status || 'Active', policy_file: null
      });
    } else if (activeTab === "Leave Policies") {
      setLeaveForm({
        name: policy.name || '', annual: policy.annual || '', sick: policy.sick || '',
        casual: policy.casual || '', carry_forward: policy.carry_forward,
        max_carry: policy.max_carry || '', encashment: policy.encashment,
        rule: policy.rule || 'Full Day', status: policy.status || 'Active'
      });
    } else if (activeTab === "Attendance Policies") {
      setAttendanceForm({
        name: policy.name || '', checkin_start: policy.checkin_start || '',
        checkin_end: policy.checkin_end || '', checkout_time: policy.checkout_time || '',
        grace: policy.grace || '', late_max: policy.late_max || '',
        late_convert: policy.late_convert || '1 Half Day after 3 late marks',
        half_hours: policy.half_hours || '', full_hours: policy.full_hours || '',
        weekly_off: policy.weekly_off || 'Sat & Sun', status: policy.status || 'Active'
      });
    } else if (activeTab === "OT Policies") {
      setOtForm({
        name: policy.name || '', basis: policy.basis || 'Hourly', rate: policy.rate || '1.5x',
        min_ot: policy.min_ot || '', max_ot: policy.max_ot || '',
        grades: policy.grades || [], auto_ot: policy.auto_ot, status: policy.status || 'Active'
      });
    }
    setShowCreateModal(true);
  };

  const deletePolicy = async (id) => {
    if (!confirm('Delete this policy?')) return;
    
    let endpoint = "";
    if (activeTab === "HR Policies") endpoint = `/policies/hr/delete/${id}`;
    else if (activeTab === "Leave Policies") endpoint = `/policies/leave/delete/${id}`;
    else if (activeTab === "Attendance Policies") endpoint = `/policies/attendance/delete/${id}`;
    else if (activeTab === "OT Policies") endpoint = `/policies/ot/delete/${id}`;

    try {
      await api.delete(endpoint);
      alert('Deleted Successfully');
      fetchPolicies();
    } catch (err) {
      console.error(`Error deleting ${activeTab}:`, err);
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case "HR Policies": return <Users className="w-5 h-5" />;
      case "Leave Policies": return <Clock className="w-5 h-5" />;
      case "Attendance Policies": return <Shield className="w-5 h-5" />;
      case "OT Policies": return <Settings className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTabColor = (tab) => {
    switch (tab) {
      case "HR Policies": return "from-blue-500 to-blue-600";
      case "Leave Policies": return "from-green-500 to-green-600";
      case "Attendance Policies": return "from-purple-500 to-purple-600";
      case "OT Policies": return "from-orange-500 to-orange-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-content">
      {/* Header */}
      <div className="bg-white border-b  px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Rules & Policies Management</h1>
              <p className=" mt-1" style={{color: 'var(--text-secondary, #374151)'}}>Comprehensive policy framework for HR, Leave, Attendance, and Overtime management</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-8">

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex border-b bg-gradient-to-r from-gray-50 to-indigo-50">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setEditingId(null);
                setPolicies([]);
                setShowCreateModal(false);
              }}
              className={`flex-1 px-6 py-5 text-sm font-semibold border-b-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600 bg-white shadow-lg transform -translate-y-1'
                  : 'border-transparent text-muted hover:text-secondary hover:bg-white/50'
              }`}
            >
              {getTabIcon(tab)}
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">{activeTab}</h2>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className={`bg-gradient-to-r ${getTabColor(activeTab)} text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2 font-semibold`}
            >
              <Plus className="w-4 h-4" />
              Create {activeTab.slice(0, -1)}
            </button>
          </div>

          {/* Policies Table */}
          <div className="bg-content rounded-xl overflow-hidden">
            <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="w-full">
              <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-gradient-to-r from-gray-100 to-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">Policy Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">Status</th>
                  {activeTab === "HR Policies" && (
                    <th className="px-6 py-4 text-center text-sm font-semibold text-secondary">Document</th>
                  )}
                  <th className="px-6 py-4 text-center text-sm font-semibold text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-white">
                {policies.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === "HR Policies" ? "4" : "3"} className="px-6 py-12 text-center text-muted">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="w-12 h-12 text-gray-300" />
                        <p className="text-lg font-medium">No {activeTab} Found</p>
                        <p className="text-sm">Create your first policy to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  policies.map((policy) => (
                    <tr key={policy.id} className="border-b border-gray-100 hover:bg-content transition-colors" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-primary">{policy.name}</div>
                        {policy.description && (
                          <div className="text-sm text-muted mt-1">{policy.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          policy.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {policy.status}
                        </span>
                      </td>
                      {activeTab === "HR Policies" && (
                        <td className="px-6 py-4 text-center">
                          {policy.document_download_url ? (
                            <a 
                              href={`http://localhost:8000${policy.document_download_url}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Download PDF
                            </a>
                          ) : (
                            <span className=" text-sm" style={{color: 'var(--text-muted, #6b7280)'}}>No document</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => loadForEdit(policy)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePolicy(policy.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className={`p-6 bg-gradient-to-r ${getTabColor(activeTab)} text-white rounded-t-2xl`}>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {getTabIcon(activeTab)}
                {editingId ? 'Edit' : 'Create'} {activeTab.slice(0, -1)}
              </h3>
            </div>
            
            <div className="p-6">
              {/* Form content based on active tab */}
              {activeTab === "HR Policies" && (
                <div className="space-y-4">
                  <input
                    className="w-full px-4 py-3 border-dark rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Policy Name"
                    value={hrForm.name}
                    onChange={(e) => setHrForm({...hrForm, name: e.target.value})}
                  />
                  <textarea
                    className="w-full px-4 py-3 border-dark rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Policy Description"
                    value={hrForm.description}
                    onChange={(e) => setHrForm({...hrForm, description: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      className="w-full px-4 py-3 border-dark rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Notice Period (Days)"
                      type="number"
                      value={hrForm.notice_days}
                      onChange={(e) => setHrForm({...hrForm, notice_days: e.target.value})}
                    />
                    <input
                      className="w-full px-4 py-3 border-dark rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Probation Period (Days)"
                      type="number"
                      value={hrForm.probation_period}
                      onChange={(e) => setHrForm({...hrForm, probation_period: e.target.value})}
                    />
                  </div>
                  <select
                    className="w-full px-4 py-3 border-dark rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={hrForm.work_week}
                    onChange={(e) => setHrForm({...hrForm, work_week: e.target.value})}
                  >
                    <option>Mon-Fri</option>
                    <option>Mon-Sat</option>
                    <option>Custom</option>
                  </select>
                  <input
                    type="file"
                    accept=".pdf"
                    className="w-full px-4 py-3 border-dark rounded-lg focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setHrForm({...hrForm, policy_file: e.target.files[0]})}
                  />
                </div>
              )}

              {/* Similar forms for other policy types would go here */}
              
              <div className="flex gap-3 mt-8">
                <button
                  onClick={savePolicy}
                  className={`flex-1 bg-gradient-to-r ${getTabColor(activeTab)} text-white py-3 rounded-lg hover:shadow-lg transition-all duration-300 font-semibold flex items-center justify-center gap-2`}
                >
                  <Check className="w-4 h-4" />
                  {editingId ? 'Update' : 'Create'} Policy
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-primary py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
