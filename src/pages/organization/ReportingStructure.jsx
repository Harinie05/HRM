import { useState, useEffect } from "react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function ReportingStructure() {
  const { toast, showToast } = useToast();
  
  // Permission checks - separate for levels and hierarchy
  const canViewLevels = isAdmin() || hasPermission("view_reporting_levels");
  const canAddLevels = isAdmin() || hasPermission("add_reporting_level");
  const canEditLevels = isAdmin() || hasPermission("edit_reporting_level");
  const canDeleteLevels = isAdmin() || hasPermission("delete_reporting_level");
  
  const canViewHierarchy = isAdmin() || hasPermission("view_hierarchy_rules");
  const canAddHierarchy = isAdmin() || hasPermission("add_hierarchy_rule");
  const canEditHierarchy = isAdmin() || hasPermission("edit_hierarchy_rule");
  const canDeleteHierarchy = isAdmin() || hasPermission("delete_hierarchy_rule");
  
  // Overall view permission (can view if can view either levels or hierarchy)
  const canView = canViewLevels || canViewHierarchy;

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
        <p className="text-gray-600">You do not have permission to view Reporting Structure.</p>
      </div>
    );
  }
  const [levels, setLevels] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showCreateLevel, setShowCreateLevel] = useState(false);
  const [showCreateHierarchy, setShowCreateHierarchy] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [editingHierarchy, setEditingHierarchy] = useState(null);
  const [statusFilter, setStatusFilter] = useState("active");
  
  const [newLevel, setNewLevel] = useState({
    level_name: "",
    level_order: "",
    description: ""
  });
  
  const [newHierarchy, setNewHierarchy] = useState({
    parent_level_id: "",
    child_level_id: "",
    department_id: ""
  });

  const fetchData = async (status = statusFilter) => {
    console.log("Fetching reporting data...");
    
    // Fetch levels
    try {
      const levelsRes = await api.get(`/reporting/levels?status=${status}`);
      console.log("API Response - Levels:", levelsRes.data);
      const levelsData = levelsRes.data?.data || levelsRes.data || [];
      setLevels(levelsData);
    } catch (err) {
      console.error("Failed to fetch levels", err.response?.data || err.message);
      setLevels([]);
    }
    
    // Fetch hierarchy
    try {
      const hierarchyRes = await api.get(`/reporting/hierarchy?status=${status}`);
      console.log("API Response - Hierarchy:", hierarchyRes.data);
      const hierarchyData = hierarchyRes.data?.data || hierarchyRes.data || [];
      setHierarchy(hierarchyData);
    } catch (err) {
      console.error("Failed to fetch hierarchy", err.response?.data || err.message);
      setHierarchy([]);
    }
    
    // Fetch departments (always active)
    try {
      const tenant_db = localStorage.getItem("tenant_db");
      const deptsRes = await api.get(`/hospitals/departments/${tenant_db}/list`);
      console.log("API Response - Departments:", deptsRes.data);
      const deptsData = deptsRes.data?.departments || [];
      setDepartments(deptsData);
    } catch (err) {
      console.error("Failed to fetch departments", err.response?.data || err.message);
      setDepartments([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const createLevel = async () => {
    if (!canAddLevels) {
      showToast("You do not have permission to add reporting levels", "error");
      return;
    }
    
    if (!newLevel.level_name || !newLevel.level_order) {
      showToast("Please fill in Level Name and Level Order", "error");
      return;
    }
    
    try {
      const response = await api.post("/reporting/levels", newLevel);
      console.log("Level creation response:", response.data);
      showToast("Reporting level created successfully", "success");
      setNewLevel({ level_name: "", level_order: "", description: "" });
      setShowCreateLevel(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to create level", err.response?.data || err.message);
      showToast(`Failed to create level: ${err.response?.data?.message || err.message}`, "error");
    }
  };

  const createHierarchy = async () => {
    if (!canAddHierarchy) {
      showToast("You do not have permission to add hierarchy rules", "error");
      return;
    }
    
    if (!newHierarchy.child_level_id) {
      showToast("Please select a Subordinate Level", "error");
      return;
    }
    
    try {
      const response = await api.post("/reporting/hierarchy", newHierarchy);
      console.log("Hierarchy creation response:", response.data);
      showToast("Hierarchy rule created successfully", "success");
      setNewHierarchy({ parent_level_id: "", child_level_id: "", department_id: "" });
      setShowCreateHierarchy(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to create hierarchy", err.response?.data || err.message);
      showToast(`Failed to create hierarchy: ${err.response?.data?.message || err.message}`, "error");
    }
  };

  const updateLevel = async () => {
    if (!canEditLevels) {
      showToast("You do not have permission to edit reporting levels", "error");
      return;
    }
    
    if (!editingLevel.level_name || !editingLevel.level_order) {
      showToast("Please fill in Level Name and Level Order", "error");
      return;
    }
    
    try {
      const response = await api.put(`/reporting/levels/${editingLevel.id}`, editingLevel);
      console.log("Level update response:", response.data);
      showToast("Reporting level updated successfully", "success");
      setEditingLevel(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to update level", err.response?.data || err.message);
      showToast(`Failed to update level: ${err.response?.data?.message || err.message}`, "error");
    }
  };

  const updateHierarchy = async () => {
    if (!canEditHierarchy) {
      showToast("You do not have permission to edit hierarchy rules", "error");
      return;
    }
    
    if (!editingHierarchy.child_level_id) {
      showToast("Please select a Subordinate Level", "error");
      return;
    }
    
    try {
      const response = await api.put(`/reporting/hierarchy/${editingHierarchy.id}`, editingHierarchy);
      console.log("Hierarchy update response:", response.data);
      showToast("Hierarchy rule updated successfully", "success");
      setEditingHierarchy(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to update hierarchy", err.response?.data || err.message);
      showToast(`Failed to update hierarchy: ${err.response?.data?.message || err.message}`, "error");
    }
  };
  const deleteLevel = async (id) => {
    if (!canDeleteLevels) {
      showToast("You do not have permission to delete reporting levels", "error");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this level?")) return;
    try {
      await api.delete(`/reporting/levels/${id}`);
      showToast("Level deleted successfully", "success");
      await fetchData();
    } catch (err) {
      console.error("Failed to delete level", err.response?.data || err.message);
      showToast(`Failed to delete level: ${err.response?.data?.message || err.message}`, "error");
    }
  };

  const deleteHierarchy = async (id) => {
    if (!canDeleteHierarchy) {
      showToast("You do not have permission to delete hierarchy rules", "error");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this hierarchy rule?")) return;
    try {
      await api.delete(`/reporting/hierarchy/${id}`);
      showToast("Hierarchy rule deleted successfully", "success");
      await fetchData();
    } catch (err) {
      console.error("Failed to delete hierarchy", err.response?.data || err.message);
      showToast(`Failed to delete hierarchy: ${err.response?.data?.message || err.message}`, "error");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-black overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-black">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Reporting Structure</h2>
            <p className="text-sm text-gray-600">Define organizational hierarchy and reporting levels</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Status Filter */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>
        {/* Section 1: Reporting Levels */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Reporting Levels</h3>
              <p className="text-sm text-gray-600">Define organizational levels and hierarchy</p>
            </div>
            {canAddLevels && (
              <button
                onClick={() => {
                  setShowCreateLevel(!showCreateLevel);
                  setEditingLevel(null);
                }}
                className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors text-sm font-medium border border-black"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Level
              </button>
            )}
          </div>

          {(showCreateLevel || editingLevel) && (
            <div className="bg-gray-50 rounded-xl p-6 border border-black mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {editingLevel ? 'Edit Level' : 'Create New Level'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level Name</label>
                  <input
                    type="text"
                    value={editingLevel ? editingLevel.level_name : newLevel.level_name}
                    onChange={(e) => editingLevel 
                      ? setEditingLevel({...editingLevel, level_name: e.target.value})
                      : setNewLevel({...newLevel, level_name: e.target.value})
                    }
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., CEO, Manager, Team Lead"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level Order</label>
                  <input
                    type="number"
                    value={editingLevel ? editingLevel.level_order : newLevel.level_order}
                    onChange={(e) => editingLevel 
                      ? setEditingLevel({...editingLevel, level_order: e.target.value})
                      : setNewLevel({...newLevel, level_order: e.target.value})
                    }
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="1=highest, 2=next level"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={editingLevel ? editingLevel.description : newLevel.description}
                    onChange={(e) => editingLevel 
                      ? setEditingLevel({...editingLevel, description: e.target.value})
                      : setNewLevel({...newLevel, description: e.target.value})
                    }
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={editingLevel ? updateLevel : createLevel}
                  className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors border border-black"
                >
                  {editingLevel ? 'Update Level' : 'Create Level'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateLevel(false);
                    setEditingLevel(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors border border-black"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto border border-black rounded-xl">
            <table className="min-w-full">
              <thead className="bg-gray-50/50 border-b border-black">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {levels.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">No reporting levels found</p>
                          <p className="text-sm text-gray-500 mt-1">Create your first level to get started</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  levels.map((level) => (
                    <tr key={level.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">{level.level_order}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{level.level_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{level.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          level.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {level.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canEditLevels && (
                            <button
                              onClick={() => {
                                setEditingLevel(level);
                                setShowCreateLevel(false);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {canDeleteLevels && (
                            <button
                              onClick={() => deleteLevel(level.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Hierarchy Rules */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Hierarchy Rules</h3>
              <p className="text-sm text-gray-600">Define reporting relationships between levels</p>
            </div>
            {canAddHierarchy && (
              <button
                onClick={() => {
                  setShowCreateHierarchy(!showCreateHierarchy);
                  setEditingHierarchy(null);
                }}
                className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors text-sm font-medium border border-black"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Rule
              </button>
            )}
          </div>

          {(showCreateHierarchy || editingHierarchy) && (
            <div className="bg-gray-50 rounded-xl p-6 border border-black mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {editingHierarchy ? 'Edit Hierarchy Rule' : 'Create Hierarchy Rule'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor Level</label>
                  <select
                    value={editingHierarchy ? editingHierarchy.parent_level_id || '' : newHierarchy.parent_level_id}
                    onChange={(e) => editingHierarchy 
                      ? setEditingHierarchy({...editingHierarchy, parent_level_id: e.target.value})
                      : setNewHierarchy({...newHierarchy, parent_level_id: e.target.value})
                    }
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select Supervisor Level</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>{level.level_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subordinate Level</label>
                  <select
                    value={editingHierarchy ? editingHierarchy.child_level_id : newHierarchy.child_level_id}
                    onChange={(e) => editingHierarchy 
                      ? setEditingHierarchy({...editingHierarchy, child_level_id: e.target.value})
                      : setNewHierarchy({...newHierarchy, child_level_id: e.target.value})
                    }
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select Subordinate Level</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>{level.level_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department (Optional)</label>
                  <select
                    value={editingHierarchy ? editingHierarchy.department_id || '' : newHierarchy.department_id}
                    onChange={(e) => editingHierarchy 
                      ? setEditingHierarchy({...editingHierarchy, department_id: e.target.value})
                      : setNewHierarchy({...newHierarchy, department_id: e.target.value})
                    }
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={editingHierarchy ? updateHierarchy : createHierarchy}
                  className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors border border-black"
                >
                  {editingHierarchy ? 'Update Rule' : 'Create Rule'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateHierarchy(false);
                    setEditingHierarchy(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors border border-black"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto border border-black rounded-xl">
            <table className="min-w-full">
              <thead className="bg-gray-50/50 border-b border-black">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor Level</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subordinate Level</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {hierarchy.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">No hierarchy rules found</p>
                          <p className="text-sm text-gray-500 mt-1">Create rules to establish reporting relationships</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  hierarchy.map((rule) => (
                    <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{rule.parent_level_name || 'Top Level'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{rule.child_level_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{rule.department_name || 'All Departments'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          rule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canEditHierarchy && (
                            <button
                              onClick={() => {
                                setEditingHierarchy(rule);
                                setShowCreateHierarchy(false);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {canDeleteHierarchy && (
                            <button
                              onClick={() => deleteHierarchy(rule.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
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
      <Toast {...toast} />
    </div>
  );
}