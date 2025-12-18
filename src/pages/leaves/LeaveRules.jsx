import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Settings } from "lucide-react";
import api from "../../api";

export default function LeaveRules() {
  const [rules, setRules] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    accrual_frequency: "",
    accrual_method: "",
    carry_forward_limit: null,
    encashment_allowed: false,
    encashment_rate: null,
    auto_deduct_lop: true,
    status: "Active"
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await api.get("/api/leave/rules/");
      setRules(res.data);
    } catch (error) {
      console.error("Error fetching leave rules:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await api.put(`/api/leave/rules/${editingRule.id}`, formData);
      } else {
        await api.post("/api/leave/rules/", formData);
      }
      fetchRules();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving leave rule:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this rule?")) {
      try {
        await api.delete(`/api/leave/rules/${id}`);
        fetchRules();
      } catch (error) {
        console.error("Error deleting leave rule:", error);
      }
    }
  };

  const handleOpenModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        accrual_frequency: rule.accrual_frequency || "",
        accrual_method: rule.accrual_method || "",
        carry_forward_limit: rule.carry_forward_limit || null,
        encashment_allowed: rule.encashment_allowed || false,
        encashment_rate: rule.encashment_rate || null,
        auto_deduct_lop: rule.auto_deduct_lop ?? true,
        status: rule.status || "Active"
      });
    } else {
      setEditingRule(null);
      setFormData({
        accrual_frequency: "",
        accrual_method: "",
        carry_forward_limit: null,
        encashment_allowed: false,
        encashment_rate: null,
        auto_deduct_lop: true,
        status: "Active"
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const filteredRules = rules.filter(rule =>
    rule.accrual_frequency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.accrual_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Leave Rules</h2>
            <p className="text-gray-600 mt-1">Configure accrual, carry forward and encashment policies</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Add Rule
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accrual Settings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carry Forward</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Encashment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auto Deduction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? "No rules found matching your search." : "No leave rules configured yet."}
                </td>
              </tr>
            ) : (
              filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{rule.accrual_frequency}</div>
                      <div className="text-sm text-gray-500">{rule.accrual_method}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {rule.carry_forward_limit ? `${rule.carry_forward_limit} days` : "No limit"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rule.encashment_allowed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {rule.encashment_allowed ? "Allowed" : "Not Allowed"}
                    </span>
                    {rule.encashment_allowed && rule.encashment_rate && (
                      <div className="text-xs text-gray-500 mt-1">Rate: {rule.encashment_rate}%</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rule.auto_deduct_lop ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {rule.auto_deduct_lop ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rule.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {rule.status || "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1 rounded">
                        <Settings size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(rule)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total: {rules.length} rules</span>
          <span>Active: {rules.filter(r => r.status === "Active" || !r.status).length}</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingRule ? "Edit Leave Rule" : "Add Leave Rule"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accrual Frequency</label>
                <select
                  value={formData.accrual_frequency}
                  onChange={(e) => setFormData({...formData, accrual_frequency: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select frequency</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accrual Method</label>
                <select
                  value={formData.accrual_method}
                  onChange={(e) => setFormData({...formData, accrual_method: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select method</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Pro-rata">Pro-rata</option>
                  <option value="Attendance">Attendance based</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carry Forward Limit (days)</label>
                <input
                  type="number"
                  value={formData.carry_forward_limit || ""}
                  onChange={(e) => setFormData({...formData, carry_forward_limit: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.encashment_allowed}
                    onChange={(e) => setFormData({...formData, encashment_allowed: e.target.checked})}
                    className="mr-2"
                  />
                  Encashment Allowed
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.auto_deduct_lop}
                    onChange={(e) => setFormData({...formData, auto_deduct_lop: e.target.checked})}
                    className="mr-2"
                  />
                  Auto Deduct LOP
                </label>
              </div>
              {formData.encashment_allowed && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Encashment Rate (%)</label>
                  <input
                    type="number"
                    value={formData.encashment_rate || ""}
                    onChange={(e) => setFormData({...formData, encashment_rate: e.target.value ? parseFloat(e.target.value) : null})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRule ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
