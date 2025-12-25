import { useState, useEffect } from "react";
import { Plus, Users, Building2, List, GitBranch, Eye, Trash2, Edit3, ChevronDown, ChevronRight } from "lucide-react";
import api from "../../api";

export default function ReportingStructure() {
  const [levels, setLevels] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showCreateLevel, setShowCreateLevel] = useState(false);
  const [showCreateHierarchy, setShowCreateHierarchy] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'tree'
  
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

  const renderTreeView = () => {
    const buildTree = () => {
      const levelMap = {};
      levels.forEach(level => {
        levelMap[level.id] = { ...level, children: [] };
      });
      
      const tree = [];
      hierarchy.forEach(rule => {
        if (rule.parent_level_id && levelMap[rule.parent_level_id] && levelMap[rule.child_level_id]) {
          levelMap[rule.parent_level_id].children.push(levelMap[rule.child_level_id]);
        } else if (!rule.parent_level_id && levelMap[rule.child_level_id]) {
          tree.push(levelMap[rule.child_level_id]);
        }
      });
      
      // Add levels without hierarchy rules as top-level
      levels.forEach(level => {
        const hasParent = hierarchy.some(rule => rule.child_level_id === level.id);
        if (!hasParent && !tree.find(item => item.id === level.id)) {
          tree.push({ ...level, children: [] });
        }
      });
      
      return tree;
    };

    const TreeNode = ({ node, depth = 0 }) => (
      <div className={`ml-${depth * 6}`}>
        <div className="flex items-center gap-3 p-4 border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{node.level_name}</h4>
            <p className="text-sm text-gray-600">{node.description || 'No description'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            node.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {node.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        {node.children?.map(child => (
          <TreeNode key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    );

    const tree = buildTree();
    return (
      <div className="space-y-4">
        {tree.length === 0 ? (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No hierarchy structure found</p>
            <p className="text-gray-400 text-sm">Create levels and hierarchy rules to see the tree view</p>
          </div>
        ) : (
          tree.map(node => <TreeNode key={node.id} node={node} />)
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex-shrink-0">
              <GitBranch className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reporting Structure</h1>
              <p className="text-gray-600 mt-1">Define organizational hierarchy and reporting levels</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <List size={14} /> Table
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'tree' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <GitBranch size={14} /> Tree
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Section 1: Reporting Levels */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Reporting Levels</h2>
                <p className="text-gray-600 text-sm">Define organizational levels and hierarchy</p>
              </div>
              <button
                onClick={() => setShowCreateLevel(!showCreateLevel)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> Add Level
              </button>
            </div>
          </div>

          <div className="p-6">
            {showCreateLevel && (
              <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Level</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level Name</label>
                    <input
                      type="text"
                      value={newLevel.level_name}
                      onChange={(e) => setNewLevel({...newLevel, level_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., CEO, Manager, Team Lead"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level Order</label>
                    <input
                      type="number"
                      value={newLevel.level_order}
                      onChange={(e) => setNewLevel({...newLevel, level_order: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="1=highest, 2=next level"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={newLevel.description}
                      onChange={(e) => setNewLevel({...newLevel, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Optional description"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={createLevel}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create Level
                  </button>
                  <button
                    onClick={() => setShowCreateLevel(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'table' ? (
              <div className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {levels.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <Building2 size={24} className="text-gray-400" />
                              </div>
                              <div>
                                <p className="text-gray-900 font-medium">No reporting levels found</p>
                                <p className="text-gray-500 text-sm mt-1">Create your first level to get started</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        levels.map((level) => (
                          <tr key={level.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <span className="text-indigo-600 font-semibold text-sm">{level.level_order}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{level.level_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{level.description || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                level.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {level.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => deleteLevel(level.id)}
                                className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              renderTreeView()
            )}
          </div>
        </div>

        {/* Section 2: Hierarchy Rules */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Hierarchy Rules</h2>
                <p className="text-gray-600 text-sm">Define reporting relationships between levels</p>
              </div>
              <button
                onClick={() => setShowCreateHierarchy(!showCreateHierarchy)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={16} /> Add Rule
              </button>
            </div>
          </div>

          <div className="p-6">
            {showCreateHierarchy && (
              <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Hierarchy Rule</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor Level</label>
                    <select
                      value={newHierarchy.parent_level_id}
                      onChange={(e) => setNewHierarchy({...newHierarchy, parent_level_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Create Rule
                  </button>
                  <button
                    onClick={() => setShowCreateHierarchy(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subordinate Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hierarchy.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users size={24} className="text-gray-400" />
                            </div>
                            <div>
                              <p className="text-gray-900 font-medium">No hierarchy rules found</p>
                              <p className="text-gray-500 text-sm mt-1">Create rules to establish reporting relationships</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      hierarchy.map((rule) => (
                        <tr key={rule.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{rule.parent_level_name || 'Top Level'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{rule.child_level_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{rule.department_name || 'All Departments'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              rule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => deleteHierarchy(rule.id)}
                              className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
                            >
                              <Trash2 size={14} />
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
      </div>
    </div>
  );
}