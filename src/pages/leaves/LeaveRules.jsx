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
    <div className="">
      {/* Header */}
      <div className="p-8 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">Leave Rules</h2>
              <p className="text-gray-600 text-base">Configure accrual, carry forward and encashment policies</p>
            </div>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Add Rule
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-8 border-b border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 border border-black rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full bg-gray-50 hover:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Accrual Settings</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Carry Forward</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Encashment</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Auto Deduction</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Settings className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">
                      {searchTerm ? "No rules found matching your search." : "No leave rules configured yet."}
                    </p>
                    <p className="text-sm text-gray-500">Create your first leave rule to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRules.map((rule, index) => (
                <tr key={rule.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{rule.accrual_frequency}</div>
                      <div className="text-sm text-gray-500">{rule.accrual_method}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {rule.carry_forward_limit ? `${rule.carry_forward_limit} days` : "No limit"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      rule.encashment_allowed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {rule.encashment_allowed ? "Allowed" : "Not Allowed"}
                    </span>
                    {rule.encashment_allowed && rule.encashment_rate && (
                      <div className="text-xs text-gray-500 mt-1">Rate: {rule.encashment_rate}%</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      rule.auto_deduct_lop ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {rule.auto_deduct_lop ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      rule.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {rule.status || "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                        <Settings size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(rule)}
                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
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
      <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span className="font-medium">Total: {rules.length} rules</span>
          <span className="font-medium">Active: {rules.filter(r => r.status === "Active" || !r.status).length}</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-black w-full max-w-lg">
            <div className="p-8 border-b border-gray-100">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {editingRule ? "Edit Leave Rule" : "Add Leave Rule"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Accrual Frequency</label>
                <select
                  value={formData.accrual_frequency}
                  onChange={(e) => setFormData({...formData, accrual_frequency: e.target.value})}
                  className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  required
                >
                  <option value="">Select frequency</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Accrual Method</label>
                <select
                  value={formData.accrual_method}
                  onChange={(e) => setFormData({...formData, accrual_method: e.target.value})}
                  className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  required
                >
                  <option value="">Select method</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Pro-rata">Pro-rata</option>
                  <option value="Attendance">Attendance based</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Carry Forward Limit (days)</label>
                <input
                  type="number"
                  value={formData.carry_forward_limit || ""}
                  onChange={(e) => setFormData({...formData, carry_forward_limit: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.encashment_allowed}
                    onChange={(e) => setFormData({...formData, encashment_allowed: e.target.checked})}
                    className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Encashment Allowed</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.auto_deduct_lop}
                    onChange={(e) => setFormData({...formData, auto_deduct_lop: e.target.checked})}
                    className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto Deduct LOP</span>
                </label>
              </div>
              {formData.encashment_allowed && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Encashment Rate (%)</label>
                  <input
                    type="number"
                    value={formData.encashment_rate || ""}
                    onChange={(e) => setFormData({...formData, encashment_rate: e.target.value ? parseFloat(e.target.value) : null})}
                    className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>
              )}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-black rounded-2xl text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
