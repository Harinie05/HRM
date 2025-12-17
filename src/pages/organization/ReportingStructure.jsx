import { useState, useEffect } from "react";
import { Plus, Users, Building2, List, GitBranch, Eye, Trash2 } from "lucide-react";
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
        <div className="flex items-center gap-2 p-3 border-l-2 border-blue-200 bg-gray-50 rounded mb-2">
          <Building2 size={16} className="text-blue-600" />
          <span className="font-medium">{node.level_name}</span>
          <span className="text-sm text-gray-500">({node.description || 'No description'})</span>
          <span className={`px-2 py-1 rounded text-xs ml-auto ${
            node.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
          <div className="text-center py-8 text-gray-500">
            No hierarchy structure found. Create levels and hierarchy rules to see the tree view.
          </div>
        ) : (
          tree.map(node => <TreeNode key={node.id} node={node} />)
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reporting Structure</h1>
          <p className="text-gray-600">Define organizational hierarchy and reporting levels</p>
        </div>
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">View:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List size={14} /> Table
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                viewMode === 'tree' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <GitBranch size={14} /> Tree
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Reporting Levels */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="text-blue-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-800">Reporting Levels</h2>
          </div>
          <button
            onClick={() => setShowCreateLevel(!showCreateLevel)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} /> Add Level
          </button>
        </div>

        {showCreateLevel && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-md font-semibold mb-4">Create New Level</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level Name</label>
                <input
                  type="text"
                  value={newLevel.level_name}
                  onChange={(e) => setNewLevel({...newLevel, level_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., CEO, Manager, Team Lead"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level Order</label>
                <input
                  type="number"
                  value={newLevel.level_order}
                  onChange={(e) => setNewLevel({...newLevel, level_order: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1=highest, 2=next level"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newLevel.description}
                  onChange={(e) => setNewLevel({...newLevel, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={createLevel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Level
              </button>
              <button
                onClick={() => setShowCreateLevel(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Order</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Level Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {levels.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      No reporting levels defined. Create your first level to get started.
                    </td>
                  </tr>
                ) : (
                  levels.map((level) => (
                    <tr key={level.id}>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{level.level_order}</td>
                      <td className="border border-gray-300 px-4 py-2">{level.level_name}</td>
                      <td className="border border-gray-300 px-4 py-2">{level.description || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${level.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {level.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          onClick={() => deleteLevel(level.id)}
                          className="px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
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
        ) : (
          renderTreeView()
        )}
      </div>

      {/* Section 2: Hierarchy Rules */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="text-purple-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-800">Hierarchy Rules</h2>
          </div>
          <button
            onClick={() => setShowCreateHierarchy(!showCreateHierarchy)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus size={16} /> Add Rule
          </button>
        </div>

        {showCreateHierarchy && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-md font-semibold mb-4">Create Hierarchy Rule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Level</label>
                <select
                  value={newHierarchy.parent_level_id}
                  onChange={(e) => setNewHierarchy({...newHierarchy, parent_level_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Supervisor Level</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>{level.level_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subordinate Level</label>
                <select
                  value={newHierarchy.child_level_id}
                  onChange={(e) => setNewHierarchy({...newHierarchy, child_level_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Subordinate Level</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>{level.level_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department (Optional)</label>
                <select
                  value={newHierarchy.department_id}
                  onChange={(e) => setNewHierarchy({...newHierarchy, department_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={createHierarchy}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Rule
              </button>
              <button
                onClick={() => setShowCreateHierarchy(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Supervisor Level</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Subordinate Level</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Department</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hierarchy.length === 0 ? (
                <tr>
                  <td colSpan="5" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    No hierarchy rules defined. Create rules to establish reporting relationships.
                  </td>
                </tr>
              ) : (
                hierarchy.map((rule) => (
                  <tr key={rule.id}>
                    <td className="border border-gray-300 px-4 py-2">{rule.parent_level_name || 'Top Level'}</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">{rule.child_level_name}</td>
                    <td className="border border-gray-300 px-4 py-2">{rule.department_name || 'All Departments'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${rule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button
                        onClick={() => deleteHierarchy(rule.id)}
                        className="px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
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
  );
}