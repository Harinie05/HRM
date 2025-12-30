import { useState, useEffect } from "react";
import { Plus, Trash2, Check, Clock, AlertCircle } from "lucide-react";
import api from "../../api";

export default function KnowledgeTransfer() {
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
      const response = await fetch(`http://localhost:8000/hospitals/users/${tenant}/list`, {
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
      fetchKTData(selectedExit.id);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating KT:", error);
      alert("Error creating Knowledge Transfer");
    }
  };

  const acknowledgeItem = async (itemId) => {
    try {
      await api.put(`/api/exit/knowledge-transfer/item/${itemId}/acknowledge`);
      alert("KT Item acknowledged successfully!");
      await fetchKTData(selectedExit.id);
      await fetchExits(); // Force refresh exits list
    } catch (error) {
      console.error("Error acknowledging item:", error);
      alert("Error acknowledging KT item");
    }
  };

  const approveKT = async (type) => {
    try {
      await api.put(`/api/exit/knowledge-transfer/${ktData.id}/approve?approval_type=${type}`);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} approval completed!`);
      fetchKTData(selectedExit.id);
      fetchExits(); // Refresh exits list to update KT status
    } catch (error) {
      console.error("Error approving KT:", error);
      alert("Error approving Knowledge Transfer");
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Knowledge Transfer</h2>
          <p className="text-gray-600">Manage knowledge transfer for exiting employees</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exit List */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-4">Pending Exits</h3>
          <div className="space-y-2">
            {exits.map(exit => (
              <div
                key={exit.id}
                onClick={() => handleExitSelect(exit)}
                className={`p-3 rounded cursor-pointer border ${
                  selectedExit?.id === exit.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{exit.employee_name}</div>
                <div className="text-sm text-gray-600">Code: {exit.employee_code}</div>
              </div>
            ))}
          </div>
        </div>

        {/* KT Details */}
        <div className="lg:col-span-2">
          {selectedExit && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">{selectedExit.employee_name}</h3>
                  <p className="text-gray-600">Code: {selectedExit.employee_code}</p>
                  <p className="text-gray-600">Last Working Day: {selectedExit.last_working_day}</p>
                </div>
                {!ktData && !showCreateForm && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create KT Plan
                  </button>
                )}
              </div>

              {showCreateForm && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">KT Start Date</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">KT End Date</label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Knowledge Transfer Items</h4>
                      <button
                        type="button"
                        onClick={addKTItem}
                        className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Plus className="w-4 h-4" /> Add Item
                      </button>
                    </div>

                    {formData.kt_items.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium">KT Item {index + 1}</h5>
                          {formData.kt_items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeKTItem(index)}
                              className="text-red-600 hover:bg-red-50 p-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Knowledge Area</label>
                            <select
                              value={item.knowledge_area}
                              onChange={(e) => updateKTItem(index, 'knowledge_area', e.target.value)}
                              className="w-full border rounded px-3 py-2"
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
                              className="w-full border rounded px-3 py-2"
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
                            className="w-full border rounded px-3 py-2"
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
                      className="w-full border rounded-lg px-3 py-2"
                      rows="3"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create KT Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {ktData && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>KT Period:</strong> {ktData.start_date} to {ktData.end_date}</div>
                      <div><strong>Overall Status:</strong> {ktData.overall_status}</div>
                      <div><strong>Manager Approved:</strong> {ktData.manager_approved ? "✅" : "❌"}</div>
                      <div><strong>HR Approved:</strong> {ktData.hr_approved ? "✅" : "❌"}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">KT Items</h4>
                    {ktData.kt_items && ktData.kt_items.length > 0 ? (
                      <div className="space-y-3">
                        {ktData.kt_items.map(item => (
                          <div key={item.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(item.status)}
                                <span className="font-medium">{item.knowledge_area}</span>
                              </div>
                              {item.status !== "Completed" && (
                                <button
                                  onClick={() => acknowledgeItem(item.id)}
                                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Mark Complete
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                            <div className="text-xs text-gray-500">
                              To: {employees.find(e => e.id === item.to_employee_id)?.name}
                              {item.acknowledged_at && (
                                <span className="ml-4">Completed: {new Date(item.acknowledged_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4">
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
                    <div className="flex gap-3 mt-4">
                      {!ktData.manager_approved && (
                        <button
                          onClick={() => approveKT("manager")}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                          Manager Approve
                        </button>
                      )}
                      {ktData.manager_approved && !ktData.hr_approved && (
                        <button
                          onClick={() => approveKT("hr")}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          HR Approve
                        </button>
                      )}
                      {ktData.manager_approved && ktData.hr_approved && (
                        <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                          ✅ Fully Approved
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}