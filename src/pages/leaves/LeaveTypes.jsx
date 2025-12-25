import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import api from "../../api";

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leavePolicies, setLeavePolicies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [activeTab, setActiveTab] = useState("types");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "",
    is_paid: true,
    annual_limit: 0,
    carry_forward: false,
    max_carry_forward: null,
    attachment_required: false,
    auto_approve_days: 0,
    status: "Active"
  });
  const [policyFormData, setPolicyFormData] = useState({
    name: "",
    rule: "",
    annual: 0,
    sick: 0,
    casual: 0,
    carry_forward: false,
    max_carry: 0,
    encashment: false,
    status: "Active",
    leave_allocations: {}
  });
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [allocationDays, setAllocationDays] = useState("");
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  useEffect(() => {
    fetchLeaveTypes();
    fetchLeavePolicies();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const res = await api.get("/api/leave/types/");
      setLeaveTypes(res.data);
    } catch (error) {
      console.error("Error fetching leave types:", error);
    }
  };

  const fetchLeavePolicies = async () => {
    try {
      console.log("Fetching leave policies from /policies/leave/list");
      const res = await api.get("/policies/leave/list");
      console.log("Leave policies loaded:", res.data);
      setLeavePolicies(res.data || []);
    } catch (error) {
      console.error("Error fetching leave policies:", error);
      setLeavePolicies([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await api.put(`/api/leave/types/${editingType.id}`, formData);
      } else {
        await api.post("/api/leave/types/", formData);
      }
      fetchLeaveTypes();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving leave type:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this leave type?")) {
      try {
        await api.delete(`/api/leave/types/${id}`);
        fetchLeaveTypes();
      } catch (error) {
        console.error("Error deleting leave type:", error);
      }
    }
  };

  const handlePolicySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPolicy) {
        await api.put(`/policies/leave/update/${editingPolicy.id}`, policyFormData);
      } else {
        await api.post("/policies/leave/create", policyFormData);
      }
      fetchLeavePolicies();
      handleClosePolicyModal();
    } catch (error) {
      console.error("Error saving leave policy:", error);
    }
  };

  const handleDeletePolicy = async (id) => {
    if (window.confirm("Are you sure you want to delete this leave policy?")) {
      try {
        await api.delete(`/policies/leave/delete/${id}`);
        fetchLeavePolicies();
      } catch (error) {
        console.error("Error deleting leave policy:", error);
      }
    }
  };

  const handleOpenPolicyModal = (policy = null) => {
    if (policy) {
      setEditingPolicy(policy);
      setPolicyFormData({
        name: policy.name || "",
        rule: policy.rule || "",
        annual: policy.annual || 0,
        sick: policy.sick || 0,
        casual: policy.casual || 0,
        carry_forward: policy.carry_forward || false,
        max_carry: policy.max_carry || 0,
        encashment: policy.encashment || false,
        status: policy.status || "Active",
        leave_allocations: policy.leave_allocations || {}
      });
      console.log("Editing policy with allocations:", policy.leave_allocations);
      setSelectedLeaveType("");
      setAllocationDays("");
    } else {
      setEditingPolicy(null);
      setPolicyFormData({
        name: "",
        rule: "",
        annual: 0,
        sick: 0,
        casual: 0,
        carry_forward: false,
        max_carry: 0,
        encashment: false,
        status: "Active",
        leave_allocations: {}
      });
      setSelectedLeaveType("");
      setAllocationDays("");
    }
    setShowPolicyModal(true);
  };

  const handleClosePolicyModal = () => {
    setShowPolicyModal(false);
    setEditingPolicy(null);
  };

  const handleOpenModal = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name || "",
        code: type.code || "",
        category: type.category || "",
        is_paid: type.is_paid ?? true,
        annual_limit: type.annual_limit || 0,
        carry_forward: type.carry_forward || false,
        max_carry_forward: type.max_carry_forward || null,
        attachment_required: type.attachment_required || false,
        auto_approve_days: type.auto_approve_days || 0,
        status: type.status || "Active"
      });
    } else {
      setEditingType(null);
      setFormData({
        name: "",
        code: "",
        category: "",
        is_paid: true,
        annual_limit: 0,
        carry_forward: false,
        max_carry_forward: null,
        attachment_required: false,
        auto_approve_days: 0,
        status: "Active"
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
  };

  const filteredTypes = leaveTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPolicies = leavePolicies.filter(policy => 
    policy.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Leave Types & Policies</h2>
            <p className="text-gray-600 mt-1">Manage different types of leaves and their policies</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => activeTab === "types" ? handleOpenModal() : handleOpenPolicyModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              {activeTab === "types" ? "Add Leave Type" : "Add Leave Policy"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("types")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "types"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Leave Types ({leaveTypes.length})
          </button>
          <button
            onClick={() => setActiveTab("policies")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "policies"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Leave Policies ({leavePolicies.length})
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={`Search ${activeTab === "types" ? "leave types" : "leave policies"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "types" ? (
        /* Leave Types Table */
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Leave Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Limit Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Carry Forward</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? "No leave types found matching your search." : "No leave types configured yet."}
                  </td>
                </tr>
              ) : (
                filteredTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate">{type.name}</div>
                        <div className="text-sm text-gray-500 truncate">{type.is_paid ? "Paid Leave" : "Unpaid Leave"}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate">
                        {type.code}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 truncate">
                      {type.category || "General"}
                    </td>
                    <td className="px-4 py-4">
                      {(() => {
                        const isFixedPolicyType = ['AL', 'ANNUAL', 'SL', 'SICK', 'CL', 'CASUAL'].includes(type.code?.toUpperCase());
                        const isDynamicPolicyType = leavePolicies.some(policy => 
                          policy.status === 'Active' && 
                          policy.leave_allocations && 
                          policy.leave_allocations[type.code?.toUpperCase()]
                        );
                        
                        return (isFixedPolicyType || isDynamicPolicyType) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Policy Controlled
                          </span>
                        ) : (
                          <span className="text-sm text-gray-900">{type.annual_limit} days</span>
                        );
                      })()} 
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        type.carry_forward ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {type.carry_forward ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        type.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {type.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <button className="text-blue-600 hover:text-blue-900 p-1 rounded">
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(type)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(type.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Leave Policies Table */
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Policy Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Leave Allocations</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Carry Forward</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Encashment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leavePolicies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No leave policies found. Create your first leave policy.
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate">{policy.name}</div>
                      <div className="text-sm text-gray-500 truncate">{policy.rule}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          AL: {policy.annual}d
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          SL: {policy.sick}d
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          CL: {policy.casual}d
                        </span>
                        {policy.leave_allocations && Object.entries(policy.leave_allocations).map(([code, days]) => {
                          const leaveType = leaveTypes.find(lt => lt.code?.toUpperCase() === code);
                          return (
                            <span key={code} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {code}: {days}d
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        policy.carry_forward ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {policy.carry_forward ? `Yes (${policy.max_carry})` : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        policy.encashment ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {policy.encashment ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        policy.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {policy.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <button className="text-blue-600 hover:text-blue-900 p-1 rounded">
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenPolicyModal(policy)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeletePolicy(policy.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          {activeTab === "types" ? (
            <>
              <span>Total: {leaveTypes.length} leave types</span>
              <span>Active: {leaveTypes.filter(t => t.status === "Active").length}</span>
            </>
          ) : (
            <>
              <span>Total: {leavePolicies.length} leave policies</span>
              <span>Active: {leavePolicies.filter(p => p.status === "Active").length}</span>
            </>
          )}
        </div>
      </div>

      {/* Leave Type Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingType ? "Edit Leave Type" : "Add Leave Type"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {(() => {
                    const isFixedPolicyType = formData.code && ['AL', 'ANNUAL', 'SL', 'SICK', 'CL', 'CASUAL'].includes(formData.code.toUpperCase());
                    const isDynamicPolicyType = formData.code && leavePolicies.some(policy => 
                      policy.status === 'Active' && 
                      policy.leave_allocations && 
                      policy.leave_allocations[formData.code?.toUpperCase()]
                    );
                    return (isFixedPolicyType || isDynamicPolicyType) ? 'Default Limit (for non-policy leaves)' : 'Annual Limit (days)';
                  })()} 
                </label>
                <input
                  type="number"
                  value={formData.annual_limit}
                  onChange={(e) => setFormData({...formData, annual_limit: parseInt(e.target.value) || 0})}
                  disabled={(() => {
                    const isFixedPolicyType = formData.code && ['AL', 'ANNUAL', 'SL', 'SICK', 'CL', 'CASUAL'].includes(formData.code.toUpperCase());
                    const isDynamicPolicyType = formData.code && leavePolicies.some(policy => 
                      policy.status === 'Active' && 
                      policy.leave_allocations && 
                      policy.leave_allocations[formData.code?.toUpperCase()]
                    );
                    return isFixedPolicyType || isDynamicPolicyType;
                  })()}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${(() => {
                    const isFixedPolicyType = formData.code && ['AL', 'ANNUAL', 'SL', 'SICK', 'CL', 'CASUAL'].includes(formData.code.toUpperCase());
                    const isDynamicPolicyType = formData.code && leavePolicies.some(policy => 
                      policy.status === 'Active' && 
                      policy.leave_allocations && 
                      policy.leave_allocations[formData.code?.toUpperCase()]
                    );
                    return (isFixedPolicyType || isDynamicPolicyType) ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' : 'border-gray-300';
                  })()}`}
                  placeholder={(() => {
                    const isFixedPolicyType = formData.code && ['AL', 'ANNUAL', 'SL', 'SICK', 'CL', 'CASUAL'].includes(formData.code.toUpperCase());
                    const isDynamicPolicyType = formData.code && leavePolicies.some(policy => 
                      policy.status === 'Active' && 
                      policy.leave_allocations && 
                      policy.leave_allocations[formData.code?.toUpperCase()]
                    );
                    return (isFixedPolicyType || isDynamicPolicyType) ? 'Overridden by Leave Policy' : 'Enter annual limit';
                  })()}
                />
                {(() => {
                  const isFixedPolicyType = formData.code && ['AL', 'ANNUAL', 'SL', 'SICK', 'CL', 'CASUAL'].includes(formData.code.toUpperCase());
                  const isDynamicPolicyType = formData.code && leavePolicies.some(policy => 
                    policy.status === 'Active' && 
                    policy.leave_allocations && 
                    policy.leave_allocations[formData.code?.toUpperCase()]
                  );
                  return (isFixedPolicyType || isDynamicPolicyType) && (
                    <p className="text-sm text-blue-600 mt-1">
                      ℹ️ This leave type is controlled by Leave Policy
                    </p>
                  );
                })()}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_paid}
                    onChange={(e) => setFormData({...formData, is_paid: e.target.checked})}
                    className="mr-2"
                  />
                  Paid Leave
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.carry_forward}
                    onChange={(e) => setFormData({...formData, carry_forward: e.target.checked})}
                    className="mr-2"
                  />
                  Carry Forward
                </label>
              </div>
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
                  {editingType ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingPolicy ? "Edit Leave Policy" : "Add Leave Policy"}
            </h3>
            <form onSubmit={handlePolicySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Policy Name</label>
                  <input
                    type="text"
                    value={policyFormData.name}
                    onChange={(e) => setPolicyFormData({...policyFormData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Policy Rule</label>
                  <textarea
                    value={policyFormData.rule}
                    onChange={(e) => setPolicyFormData({...policyFormData, rule: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Leave (days)</label>
                  <input
                    type="number"
                    value={policyFormData.annual}
                    onChange={(e) => setPolicyFormData({...policyFormData, annual: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sick Leave (days)</label>
                  <input
                    type="number"
                    value={policyFormData.sick}
                    onChange={(e) => setPolicyFormData({...policyFormData, sick: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Casual Leave (days)</label>
                  <input
                    type="number"
                    value={policyFormData.casual}
                    onChange={(e) => setPolicyFormData({...policyFormData, casual: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Carry Forward</label>
                  <input
                    type="number"
                    value={policyFormData.max_carry}
                    onChange={(e) => setPolicyFormData({...policyFormData, max_carry: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Other Leave Types */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Other Leave Types</label>
                
                {/* Add New Leave Type */}
                <div className="flex gap-2 mb-3">
                  <select
                    value={selectedLeaveType}
                    onChange={(e) => setSelectedLeaveType(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.filter(lt => 
                      !['AL', 'ANNUAL', 'SL', 'SICK', 'CL', 'CASUAL'].includes(lt.code?.toUpperCase()) &&
                      !policyFormData.leave_allocations[lt.code?.toUpperCase()]
                    ).map(leaveType => (
                      <option key={leaveType.id} value={leaveType.code?.toUpperCase()}>
                        {leaveType.code} - {leaveType.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Days"
                    value={allocationDays}
                    onChange={(e) => setAllocationDays(e.target.value)}
                    className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedLeaveType && allocationDays) {
                        setPolicyFormData({
                          ...policyFormData,
                          leave_allocations: {
                            ...policyFormData.leave_allocations,
                            [selectedLeaveType]: parseInt(allocationDays)
                          }
                        });
                        setSelectedLeaveType("");
                        setAllocationDays("");
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add
                  </button>
                </div>
                
                {/* Display Added Leave Types */}
                <div className="space-y-2">
                  {Object.entries(policyFormData.leave_allocations).map(([code, days]) => {
                    const leaveType = leaveTypes.find(lt => lt.code?.toUpperCase() === code);
                    return (
                      <div key={code} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm font-medium">{code} - {leaveType?.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{days} days</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newAllocations = {...policyFormData.leave_allocations};
                              delete newAllocations[code];
                              setPolicyFormData({...policyFormData, leave_allocations: newAllocations});
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={policyFormData.carry_forward}
                    onChange={(e) => setPolicyFormData({...policyFormData, carry_forward: e.target.checked})}
                    className="mr-2"
                  />
                  Allow Carry Forward
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={policyFormData.encashment}
                    onChange={(e) => setPolicyFormData({...policyFormData, encashment: e.target.checked})}
                    className="mr-2"
                  />
                  Allow Encashment
                </label>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleClosePolicyModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPolicy ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
