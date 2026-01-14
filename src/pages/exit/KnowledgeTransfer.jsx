import { useState, useEffect } from "react";
import { Plus, Trash2, Check, Clock, AlertCircle } from "lucide-react";
import api from "../../api";
import { hasPermission, isAdmin, getUserPermissions } from "../../utils/permissions";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";

export default function KnowledgeTransfer() {
  // Permission checks
  const canView = isAdmin() || hasPermission('view_kt_plans');
  const canAdd = isAdmin() || hasPermission('add_kt_plan');
  const canCreate = isAdmin() || hasPermission('create_kt_plan');
  const canComplete = isAdmin() || hasPermission('complete_kt_items');
  const canHRApprove = isAdmin() || hasPermission('hr_approve_kt');
  const canManagerApprove = isAdmin() || hasPermission('manager_approve_kt');
  
  const { toast, showToast, hideToast } = useToast();
  
  // Fetch branding colors
  useEffect(() => {
    const fetchBrandingColors = async () => {
      try {
        const tenantCode = localStorage.getItem('tenant_code');
        if (tenantCode) {
          const response = await api.get(`/auth/branding/${tenantCode}`);
          document.documentElement.style.setProperty('--primary-color', response.data.primary_color || '#2862e9');
          document.documentElement.style.setProperty('--secondary-color', response.data.secondary_color || '#474e71');
        }
      } catch (error) {
        console.error('Error fetching branding colors:', error);
      }
    };
    fetchBrandingColors();
  }, []);
  
  // Debug: Check actual permissions
  console.log('Permission Debug:', {
    isAdmin: isAdmin(),
    allPermissions: getUserPermissions(),
    hasManagerApprove: hasPermission('manager_approve_kt'),
    canManagerApprove
  });
  
  if (!canView) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You do not have permission to view knowledge transfer plans.</p>
        </div>
      </div>
    );
  }
  const [exits, setExits] = useState([]);
  const [selectedExit, setSelectedExit] = useState(null);
  const [ktData, setKtData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [knowledgeAreas, setKnowledgeAreas] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    remarks: "",
    kt_items: [
      {
        knowledge_area: "",
        description: "",
        to_employee_id: "",
        status: "Pending"
      }
    ]
  });

  useEffect(() => {
    fetchExits();
    fetchEmployees();
    fetchKnowledgeAreas();
  }, []);

  const fetchExits = async () => {
    try {
      // Fetch exits from resignation tracking API
      const res = await api.get("/api/resignation/list");
      const exitData = res.data.resignations || [];
      
      console.log("All exits data:", exitData); // Debug log
      
      // Show all exits for now (remove filter to see all statuses)
      setExits(exitData);
      
      // Update selected exit if it exists in the new data
      if (selectedExit) {
        const updatedExit = exitData.find(exit => exit.id === selectedExit.id);
        if (updatedExit) {
          console.log("Updated exit KT status:", updatedExit.kt_status); // Debug log
          setSelectedExit(updatedExit);
        }
      }
    } catch (error) {
      console.error("Error fetching exits:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${api.defaults.baseURL}/hospitals/users/${tenant}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchKnowledgeAreas = async () => {
    try {
      const res = await api.get("/api/exit/knowledge-transfer/knowledge-areas");
      setKnowledgeAreas(res.data.knowledge_areas);
    } catch (error) {
      console.error("Error fetching knowledge areas:", error);
    }
  };

  const fetchKTData = async (exitId) => {
    try {
      const res = await api.get(`/api/exit/knowledge-transfer/exit/${exitId}`);
      setKtData(res.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setKtData(null);
        setShowCreateForm(true);
      }
    }
  };

  const handleExitSelect = (exit) => {
    setSelectedExit(exit);
    fetchKTData(exit.id);
    setShowCreateForm(false);
  };

  const addKTItem = () => {
    setFormData({
      ...formData,
      kt_items: [
        ...formData.kt_items,
        {
          knowledge_area: "",
          description: "",
          to_employee_id: "",
          status: "Pending"
        }
      ]
    });
  };

  const removeKTItem = (index) => {
    const newItems = formData.kt_items.filter((_, i) => i !== index);
    setFormData({ ...formData, kt_items: newItems });
  };

  const updateKTItem = (index, field, value) => {
    const newItems = [...formData.kt_items];
    newItems[index][field] = value;
    setFormData({ ...formData, kt_items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/exit/knowledge-transfer/?exit_id=${selectedExit.id}`, formData);
      alert("Knowledge Transfer created successfully!");
      showToast("Knowledge Transfer created successfully!", "success");
      fetchKTData(selectedExit.id);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating KT:", error);
      alert("Error creating Knowledge Transfer");
      showToast("Error creating Knowledge Transfer", "error");
    }
  };

  const acknowledgeItem = async (itemId) => {
    try {
      await api.put(`/api/exit/knowledge-transfer/item/${itemId}/acknowledge`);
      alert("KT Item acknowledged successfully!");
      showToast("KT Item acknowledged successfully!", "success");
      await fetchKTData(selectedExit.id);
      await fetchExits(); // Force refresh exits list
    } catch (error) {
      console.error("Error acknowledging item:", error);
      alert("Error acknowledging KT item");
      showToast("Error acknowledging KT item", "error");
    }
  };

  const approveKT = async (type) => {
    try {
      await api.put(`/api/exit/knowledge-transfer/${ktData.id}/approve?approval_type=${type}`);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} approval completed!`);
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} approval completed!`, "success");
      fetchKTData(selectedExit.id);
      fetchExits(); // Refresh exits list to update KT status
    } catch (error) {
      console.error("Error approving KT:", error);
      alert("Error approving Knowledge Transfer");
      showToast("Error approving Knowledge Transfer", "error");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed": return <Check className="w-4 h-4 text-green-600" />;
      case "In Progress": return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6" style={{
        background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
      }}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{
            backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
          }}>
            <Check className="h-5 w-5 sm:h-6 sm:w-6" style={{
              color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
            }} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Knowledge Transfer</h1>
            <p className="text-gray-600 text-xs sm:text-sm mb-1">Manage knowledge transfer for exiting employees</p>
            <p className="text-gray-500 text-xs hidden sm:block">Exit Management</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exit List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <AlertCircle className="h-5 w-5" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Pending Exits</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-3">
            {exits.map(exit => (
              <div
                key={exit.id}
                onClick={() => handleExitSelect(exit)}
                className={`p-3 rounded-xl cursor-pointer border transition-all duration-200 hover:shadow-md ${
                  selectedExit?.id === exit.id ? 'bg-blue-50 shadow-md' : 'bg-white hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: selectedExit?.id === exit.id ? `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10` : 'white',
                  borderColor: selectedExit?.id === exit.id ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : '#e5e7eb'
                }}
              >
                <div className="font-medium text-base truncate">{exit.employee_name}</div>
                <div className="text-sm text-gray-600">Code: {exit.employee_code}</div>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* KT Details */}
        <div className="lg:col-span-2">
          {selectedExit && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg" style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                    }}>
                      <Check className="h-5 w-5" style={{
                        color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedExit.employee_name}</h3>
                      <p className="text-gray-600 text-sm">Code: {selectedExit.employee_code} • Last Working: {selectedExit.last_working_day}</p>
                    </div>
                  </div>
                  {!ktData && !showCreateForm && canCreate && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      style={{ backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' }}
                      className="px-4 py-2 text-white rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200"
                      onMouseEnter={(e) => e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}
                    >
                      Create KT Plan
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5">

              {showCreateForm && (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">KT Start Date</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">KT End Date</label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
                      <h4 className="font-medium text-sm sm:text-base">Knowledge Transfer Items</h4>
                      {canAdd && (
                        <button
                          type="button"
                          onClick={addKTItem}
                          className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4" /> Add Item
                        </button>
                      )}
                    </div>

                    {formData.kt_items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3">
                          <h5 className="font-medium text-sm sm:text-base">KT Item {index + 1}</h5>
                          {formData.kt_items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeKTItem(index)}
                              className="text-red-600 hover:bg-red-50 p-1 rounded self-start"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Knowledge Area</label>
                            <select
                              value={item.knowledge_area}
                              onChange={(e) => updateKTItem(index, 'knowledge_area', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                              required
                            >
                              <option value="">Select Area</option>
                              {knowledgeAreas.map(area => (
                                <option key={area} value={area}>{area}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Transfer To</label>
                            <select
                              value={item.to_employee_id}
                              onChange={(e) => updateKTItem(index, 'to_employee_id', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                              required
                            >
                              <option value="">Select Employee</option>
                              {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Description</label>
                          <textarea
                            value={item.description}
                            onChange={(e) => updateKTItem(index, 'description', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                            rows="2"
                            placeholder="Describe what needs to be transferred..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Remarks</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      rows="3"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                      className="px-4 sm:px-6 py-2 text-white rounded-lg text-sm"
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #474e71)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                    >
                      Create KT Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {ktData && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div><strong>KT Period:</strong> {ktData.start_date} to {ktData.end_date}</div>
                      <div><strong>Overall Status:</strong> {ktData.overall_status}</div>
                      <div><strong>Manager Approved:</strong> {ktData.manager_approved ? "✅" : "❌"}</div>
                      <div><strong>HR Approved:</strong> {ktData.hr_approved ? "✅" : "❌"}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">KT Items</h4>
                    {ktData.kt_items && ktData.kt_items.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {ktData.kt_items.map(item => (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(item.status)}
                                <span className="font-medium text-sm sm:text-base">{item.knowledge_area}</span>
                              </div>
                              {item.status !== "Completed" && canComplete && (
                                <button
                                  onClick={() => acknowledgeItem(item.id)}
                                  style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-white rounded whitespace-nowrap"
                                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #474e71)'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                                >
                                  Mark Complete
                                </button>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2">{item.description}</p>
                            <div className="text-xs text-gray-500">
                              To: {employees.find(e => e.id === item.to_employee_id)?.name}
                              {item.acknowledged_at && (
                                <span className="ml-2 sm:ml-4">Completed: {new Date(item.acknowledged_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4 text-sm">
                        No KT items found. 
                        <button 
                          onClick={() => setShowCreateForm(true)}
                          className="text-blue-600 hover:underline ml-1"
                        >
                          Add KT items
                        </button>
                      </div>
                    )}
                  </div>

                  {ktData && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                      {console.log('Button render check:', { manager_approved: ktData.manager_approved, canManagerApprove })}
                      {!ktData.manager_approved && canManagerApprove && (
                        <button
                          onClick={() => approveKT("manager")}
                          style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                          className="px-3 sm:px-4 py-2 text-white rounded-lg text-sm"
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #474e71)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                        >
                          Manager Approve
                        </button>
                      )}
                      {ktData.manager_approved && !ktData.hr_approved && canHRApprove && (
                        <button
                          onClick={() => approveKT("hr")}
                          style={{ backgroundColor: 'var(--secondary-color, #474e71)' }}
                          className="px-3 sm:px-4 py-2 text-white rounded-lg text-sm"
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #474e71)'}
                        >
                          HR Approve
                        </button>
                      )}
                      {ktData.manager_approved && ktData.hr_approved && (
                        <div className="px-3 sm:px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                          ✅ Fully Approved
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          )}
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
}