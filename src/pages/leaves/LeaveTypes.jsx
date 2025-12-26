import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import api from "../../api";

export default function LeaveTypes({ activeView = "types" }) {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leavePolicies, setLeavePolicies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [activeTab, setActiveTab] = useState(activeView);
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
    <div className="">
      {/* Header */}
      <div className="p-8 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                {activeView === "types" ? "Leave Types" : "Leave Policies"}
              </h2>
              <p className="text-gray-600 text-base">
                {activeView === "types" ? "Manage different types of leaves" : "Manage leave policies and allocations"}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => activeView === "types" ? handleOpenModal() : handleOpenPolicyModal()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus size={18} />
              {activeView === "types" ? "Add Leave Type" : "Add Leave Policy"}
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-8 border-b border-gray-100">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={`Search ${activeView === "types" ? "leave types" : "leave policies"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 border border-black rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full bg-gray-50 hover:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === "types" ? (
        /* Leave Types Table */
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-48">Leave Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Limit Source</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Carry Forward</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Plus className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        {searchTerm ? "No leave types found matching your search." : "No leave types configured yet."}
                      </p>
                      <p className="text-sm text-gray-500">Create your first leave type to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTypes.map((type, index) => (
                  <tr key={type.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 truncate">{type.name}</div>
                        <div className="text-sm text-gray-500 truncate">{type.is_paid ? "Paid Leave" : "Unpaid Leave"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 truncate">
                        {type.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 truncate">
                      {type.category || "General"}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const isFixedPolicyType = ['AL', 'ANNUAL', 'SL', 'SICK', 'CL', 'CASUAL'].includes(type.code?.toUpperCase());
                        const isDynamicPolicyType = leavePolicies.some(policy => 
                          policy.status === 'Active' && 
                          policy.leave_allocations && 
                          policy.leave_allocations[type.code?.toUpperCase()]
                        );
                        
                        return (isFixedPolicyType || isDynamicPolicyType) ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            Policy Controlled
                          </span>
                        ) : (
                          <span className="text-sm text-gray-900">{type.annual_limit} days</span>
                        );
                      })()} 
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        type.carry_forward ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {type.carry_forward ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        type.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {type.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(type)}
                          className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(type.id)}
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
      ) : (
        /* Leave Policies Table */
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-48">Policy Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-64">Leave Allocations</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Carry Forward</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Encashment</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {leavePolicies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Plus className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">No leave policies found</p>
                      <p className="text-sm text-gray-500">Create your first leave policy to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((policy, index) => (
                  <tr key={policy.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 truncate">{policy.name}</div>
                      <div className="text-sm text-gray-500 truncate">{policy.rule}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          AL: {policy.annual}d
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          SL: {policy.sick}d
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          CL: {policy.casual}d
                        </span>
                        {policy.leave_allocations && Object.entries(policy.leave_allocations).map(([code, days]) => {
                          const leaveType = leaveTypes.find(lt => lt.code?.toUpperCase() === code);
                          return (
                            <span key={code} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                              {code}: {days}d
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        policy.carry_forward ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {policy.carry_forward ? `Yes (${policy.max_carry})` : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        policy.encashment ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {policy.encashment ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        policy.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {policy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenPolicyModal(policy)}
                          className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeletePolicy(policy.id)}
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
      )}

      {/* Stats Footer */}
      <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm text-gray-600">
          {activeView === "types" ? (
            <>
              <span className="font-medium">Total: {leaveTypes.length} leave types</span>
              <span className="font-medium">Active: {leaveTypes.filter(t => t.status === "Active").length}</span>
            </>
          ) : (
            <>
              <span className="font-medium">Total: {leavePolicies.length} leave policies</span>
              <span className="font-medium">Active: {leavePolicies.filter(p => p.status === "Active").length}</span>
            </>
          )}
        </div>
      </div>

      {/* Leave Type Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-black w-full max-w-lg">
            <div className="p-8 border-b border-gray-100">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {editingType ? "Edit Leave Type" : "Add Leave Type"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className={`w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${(() => {
                    const isFixedPolicyType = formData.code && ['AL', 'ANNUAL', 'SL', 'SICK', 'CL', 'CASUAL'].includes(formData.code.toUpperCase());
                    const isDynamicPolicyType = formData.code && leavePolicies.some(policy => 
                      policy.status === 'Active' && 
                      policy.leave_allocations && 
                      policy.leave_allocations[formData.code?.toUpperCase()]
                    );
                    return (isFixedPolicyType || isDynamicPolicyType) ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-200 bg-gray-50 hover:bg-white';
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
                    <p className="text-sm text-blue-600 mt-2 font-medium">
                      ℹ️ This leave type is controlled by Leave Policy
                    </p>
                  );
                })()}
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_paid}
                    onChange={(e) => setFormData({...formData, is_paid: e.target.checked})}
                    className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Paid Leave</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.carry_forward}
                    onChange={(e) => setFormData({...formData, carry_forward: e.target.checked})}
                    className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Carry Forward</span>
                </label>
              </div>
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
                  {editingType ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-100">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {editingPolicy ? "Edit Leave Policy" : "Add Leave Policy"}
              </h3>
            </div>
            <form onSubmit={handlePolicySubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Policy Name</label>
                  <input
                    type="text"
                    value={policyFormData.name}
                    onChange={(e) => setPolicyFormData({...policyFormData, name: e.target.value})}
                    className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Policy Rule</label>
                  <textarea
                    value={policyFormData.rule}
                    onChange={(e) => setPolicyFormData({...policyFormData, rule: e.target.value})}
                    className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Annual Leave (days)</label>
                  <input
                    type="number"
                    value={policyFormData.annual}
                    onChange={(e) => setPolicyFormData({...policyFormData, annual: parseInt(e.target.value) || 0})}
                    className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sick Leave (days)</label>
                  <input
                    type="number"
                    value={policyFormData.sick}
                    onChange={(e) => setPolicyFormData({...policyFormData, sick: parseInt(e.target.value) || 0})}
                    className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Casual Leave (days)</label>
                  <input
                    type="number"
                    value={policyFormData.casual}
                    onChange={(e) => setPolicyFormData({...policyFormData, casual: parseInt(e.target.value) || 0})}
                    className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Carry Forward</label>
                  <input
                    type="number"
                    value={policyFormData.max_carry}
                    onChange={(e) => setPolicyFormData({...policyFormData, max_carry: parseInt(e.target.value) || 0})}
                    className="w-full border border-black rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>
              </div>
              
              {/* Other Leave Types */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Other Leave Types</label>
                
                {/* Add New Leave Type */}
                <div className="flex gap-3 mb-4">
                  <select
                    value={selectedLeaveType}
                    onChange={(e) => setSelectedLeaveType(e.target.value)}
                    className="flex-1 border border-black rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors"
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
                    className="w-24 border border-black rounded-2xl px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors"
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
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Add
                  </button>
                </div>
                
                {/* Display Added Leave Types */}
                <div className="space-y-3">
                  {Object.entries(policyFormData.leave_allocations).map(([code, days]) => {
                    const leaveType = leaveTypes.find(lt => lt.code?.toUpperCase() === code);
                    return (
                      <div key={code} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <span className="text-sm font-semibold text-gray-900">{code} - {leaveType?.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 font-medium">{days} days</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newAllocations = {...policyFormData.leave_allocations};
                              delete newAllocations[code];
                              setPolicyFormData({...policyFormData, leave_allocations: newAllocations});
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={policyFormData.carry_forward}
                    onChange={(e) => setPolicyFormData({...policyFormData, carry_forward: e.target.checked})}
                    className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Allow Carry Forward</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={policyFormData.encashment}
                    onChange={(e) => setPolicyFormData({...policyFormData, encashment: e.target.checked})}
                    className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Allow Encashment</span>
                </label>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={handleClosePolicyModal}
                  className="flex-1 px-6 py-3 border border-black rounded-2xl text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
