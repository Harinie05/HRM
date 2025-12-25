import { useEffect, useState } from "react";
import { Plus, Users, Shield, Eye, Edit3, Trash2, Search, Filter, UserCheck, Settings, Crown, Star } from "lucide-react";
import api from "../../api";

export default function DesignationList() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const tenant_db = localStorage.getItem("tenant_db");

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    level: "employee",
    permissions: []
  });

  const permissionCategories = [
    { id: 'user_management', name: 'User Management', icon: Users },
    { id: 'attendance', name: 'Attendance', icon: UserCheck },
    { id: 'payroll', name: 'Payroll', icon: Settings },
    { id: 'reports', name: 'Reports', icon: Eye },
    { id: 'admin', name: 'Administration', icon: Shield }
  ];

  const roleHierarchy = {
    'admin': { label: 'Administrator', color: 'bg-red-500', icon: Crown, priority: 1 },
    'manager': { label: 'Manager', color: 'bg-purple-500', icon: Star, priority: 2 },
    'supervisor': { label: 'Supervisor', color: 'bg-blue-500', icon: Shield, priority: 3 },
    'employee': { label: 'Employee', color: 'bg-green-500', icon: Users, priority: 4 }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/hospitals/roles/${tenant_db}/list`);
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const createRole = async () => {
    if (!newRole.name) {
      alert("Please enter a role name");
      return;
    }
    
    try {
      const response = await api.post(`/hospitals/roles/${tenant_db}/create`, newRole);
      alert("Role created successfully");
      setNewRole({ name: "", description: "", level: "employee", permissions: [] });
      setShowCreateRole(false);
      await fetchRoles();
    } catch (err) {
      console.error("Failed to create role", err);
      alert(`Failed to create role: ${err.response?.data?.message || err.message}`);
    }
  };

  const deleteRole = async (id) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await api.delete(`/hospitals/roles/${tenant_db}/${id}`);
      alert("Role deleted successfully");
      await fetchRoles();
    } catch (err) {
      console.error("Failed to delete role", err);
      alert(`Failed to delete role: ${err.response?.data?.message || err.message}`);
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterLevel === 'all' || role.level === filterLevel;
    return matchesSearch && matchesFilter;
  });

  const getRoleIcon = (level) => {
    const hierarchy = roleHierarchy[level] || roleHierarchy['employee'];
    const IconComponent = hierarchy.icon;
    return <IconComponent size={20} />;
  };

  const getRoleColor = (level) => {
    return roleHierarchy[level]?.color || 'bg-gray-500';
  };

  const getRoleLabel = (level) => {
    return roleHierarchy[level]?.label || 'Employee';
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredRoles.map((role) => {
        const IconComponent = roleHierarchy[role.level]?.icon || Users;
        return (
          <div key={role.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${getRoleColor(role.level)} rounded-lg flex items-center justify-center text-white`}>
                  <IconComponent size={24} />
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteRole(role.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{role.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {role.description || 'No description provided'}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white ${getRoleColor(role.level)}`}>
                  {getRoleLabel(role.level)}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {role.permissions ? role.permissions.length : 0} permissions
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Description</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Level</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Permissions</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRoles.map((role) => {
              const IconComponent = roleHierarchy[role.level]?.icon || Users;
              return (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 ${getRoleColor(role.level)} rounded-lg flex items-center justify-center text-white mr-3 flex-shrink-0`}>
                        <IconComponent size={16} />
                      </div>
                      <div className="text-sm font-medium text-gray-900 truncate" title={role.name}>{role.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-500 truncate" title={role.description}>
                      {role.description || <span className="italic text-gray-400">No description</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getRoleColor(role.level)}`}>
                      {getRoleLabel(role.level)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {role.permissions ? role.permissions.length : 0}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button className="inline-flex items-center p-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-200 transition-colors">
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => deleteRole(role.id)}
                        className="inline-flex items-center p-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex-shrink-0">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Designations & Roles</h1>
              <p className="text-gray-600 mt-1">Overview of all roles and their permission levels</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 w-3 h-3">
                    <div className="bg-current h-0.5 rounded-sm"></div>
                    <div className="bg-current h-0.5 rounded-sm"></div>
                    <div className="bg-current h-0.5 rounded-sm"></div>
                  </div>
                  Table
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-600" />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Levels</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="supervisor">Supervisor</option>
                <option value="employee">Employee</option>
              </select>
            </div>
          </div>
        </div>

        {/* Create Role Form */}
        {showCreateRole && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Role</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Senior Developer, HR Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Level</label>
                  <select
                    value={newRole.level}
                    onChange={(e) => setNewRole({...newRole, level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Describe the role responsibilities and scope..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={createRole}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Role
                </button>
                <button
                  onClick={() => setShowCreateRole(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Roles Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Roles & Permissions</h2>
                <p className="text-gray-600 text-sm">Manage organizational roles and their access levels</p>
              </div>
              <div className="text-sm text-gray-500">
                {filteredRoles.length} of {roles.length} roles
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || filterLevel !== 'all' ? 'No matching roles found' : 'No roles found'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm || filterLevel !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'Create your first role to get started with role management'}
                </p>
              </div>
            ) : (
              viewMode === 'grid' ? renderGridView() : renderTableView()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
