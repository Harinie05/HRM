import { useState, useEffect } from "react";
import api from "../../api";

export default function ReportingStructure() {
  const [levels, setLevels] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showCreateLevel, setShowCreateLevel] = useState(false);
  const [showCreateHierarchy, setShowCreateHierarchy] = useState(false);
  
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

  const fetchData = async () => {
    console.log("Fetching reporting data...");
    
    // Fetch levels
    try {
      const levelsRes = await api.get("/reporting/levels");
      console.log("API Response - Levels:", levelsRes.data);
      const levelsData = levelsRes.data?.data || levelsRes.data || [];
      setLevels(levelsData);
    } catch (err) {
      console.error("Failed to fetch levels", err.response?.data || err.message);
      setLevels([]);
    }
    
    // Fetch hierarchy
    try {
      const hierarchyRes = await api.get("/reporting/hierarchy");
      console.log("API Response - Hierarchy:", hierarchyRes.data);
      const hierarchyData = hierarchyRes.data?.data || hierarchyRes.data || [];
      setHierarchy(hierarchyData);
    } catch (err) {
      console.error("Failed to fetch hierarchy", err.response?.data || err.message);
      setHierarchy([]);
    }
    
    // Fetch departments
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
  }, []);

  const createLevel = async () => {
    if (!newLevel.level_name || !newLevel.level_order) {
      alert("Please fill in Level Name and Level Order");
      return;
    }
    
    try {
      const response = await api.post("/reporting/levels", newLevel);
      console.log("Level creation response:", response.data);
      alert("Reporting level created successfully");
      setNewLevel({ level_name: "", level_order: "", description: "" });
      setShowCreateLevel(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to create level", err.response?.data || err.message);
      alert(`Failed to create level: ${err.response?.data?.message || err.message}`);
    }
  };

  const createHierarchy = async () => {
    if (!newHierarchy.child_level_id) {
      alert("Please select a Subordinate Level");
      return;
    }
    
    try {
      const response = await api.post("/reporting/hierarchy", newHierarchy);
      console.log("Hierarchy creation response:", response.data);
      alert("Hierarchy rule created successfully");
      setNewHierarchy({ parent_level_id: "", child_level_id: "", department_id: "" });
      setShowCreateHierarchy(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to create hierarchy", err.response?.data || err.message);
      alert(`Failed to create hierarchy: ${err.response?.data?.message || err.message}`);
    }
  };

  const deleteLevel = async (id) => {
    if (!confirm("Are you sure you want to delete this level?")) return;
    try {
      await api.delete(`/reporting/levels/${id}`);
      alert("Level deleted successfully");
      await fetchData();
    } catch (err) {
      console.error("Failed to delete level", err.response?.data || err.message);
      alert(`Failed to delete level: ${err.response?.data?.message || err.message}`);
    }
  };

  const deleteHierarchy = async (id) => {
    if (!confirm("Are you sure you want to delete this hierarchy rule?")) return;
    try {
      await api.delete(`/reporting/hierarchy/${id}`);
      alert("Hierarchy rule deleted successfully");
      await fetchData();
    } catch (err) {
      console.error("Failed to delete hierarchy", err.response?.data || err.message);
      alert(`Failed to delete hierarchy: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
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
        {/* Section 1: Reporting Levels */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Reporting Levels</h3>
              <p className="text-sm text-gray-600">Define organizational levels and hierarchy</p>
            </div>
            <button
              onClick={() => setShowCreateLevel(!showCreateLevel)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Level
            </button>
          </div>

          {showCreateLevel && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Create New Level</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level Name</label>
                  <input
                    type="text"
                    value={newLevel.level_name}
                    onChange={(e) => setNewLevel({...newLevel, level_name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., CEO, Manager, Team Lead"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level Order</label>
                  <input
                    type="number"
                    value={newLevel.level_order}
                    onChange={(e) => setNewLevel({...newLevel, level_order: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="1=highest, 2=next level"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={newLevel.description}
                    onChange={(e) => setNewLevel({...newLevel, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={createLevel}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Create Level
                </button>
                <button
                  onClick={() => setShowCreateLevel(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50 border-b border-gray-200">
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
                        <button
                          onClick={() => deleteLevel(level.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
            <button
              onClick={() => setShowCreateHierarchy(!showCreateHierarchy)}
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Rule
            </button>
          </div>

          {showCreateHierarchy && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Create Hierarchy Rule</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor Level</label>
                  <select
                    value={newHierarchy.parent_level_id}
                    onChange={(e) => setNewHierarchy({...newHierarchy, parent_level_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    value={newHierarchy.child_level_id}
                    onChange={(e) => setNewHierarchy({...newHierarchy, child_level_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    value={newHierarchy.department_id}
                    onChange={(e) => setNewHierarchy({...newHierarchy, department_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                  onClick={createHierarchy}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors"
                >
                  Create Rule
                </button>
                <button
                  onClick={() => setShowCreateHierarchy(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50 border-b border-gray-200">
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
                        <button
                          onClick={() => deleteHierarchy(rule.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}