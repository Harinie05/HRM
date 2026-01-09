import { useEffect, useState } from "react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function DesignationList() {
  const { toast, showToast, hideToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [showCreateRole, setShowCreateRole] = useState(false);
  const tenant_db = localStorage.getItem("tenant_db");

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    level: "employee",
    permissions: []
  });
  
  // Permission checks - moved after all hooks
  const canView = isAdmin() || hasPermission("view_designation");
  
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
        <p className="text-gray-600">You do not have permission to view Designations.</p>
        <Toast toast={toast} hideToast={hideToast} />
      </div>
    );
  }

  const roleHierarchy = {
    'admin': { label: 'Administrator', color: 'bg-red-500', priority: 1 },
    'manager': { label: 'Manager', color: 'bg-purple-500', priority: 2 },
    'supervisor': { label: 'Supervisor', color: 'bg-blue-500', priority: 3 },
    'employee': { label: 'Employee', color: 'bg-green-500', priority: 4 }
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
      showToast("Please enter a role name", "error");
      return;
    }
    
    try {
      const response = await api.post(`/hospitals/roles/${tenant_db}/create`, newRole);
      showToast("Role created successfully", "success");
      setNewRole({ name: "", description: "", level: "employee", permissions: [] });
      setShowCreateRole(false);
      await fetchRoles();
    } catch (err) {
      console.error("Failed to create role", err);
      showToast(`Failed to create role: ${err.response?.data?.message || err.message}`, "error");
    }
  };

  const deleteRole = async (id) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await api.delete(`/hospitals/roles/${tenant_db}/${id}`);
      showToast("Role deleted successfully", "success");
      await fetchRoles();
    } catch (err) {
      console.error("Failed to delete role", err);
      showToast(`Failed to delete role: ${err.response?.data?.message || err.message}`, "error");
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getRoleColor = (level) => {
    return roleHierarchy[level]?.color || 'bg-gray-500';
  };

  const getRoleLabel = (level) => {
    return roleHierarchy[level]?.label || 'Employee';
  };

  return (
    <div className="bg-white rounded-2xl border border-black overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Designations & Roles</h2>
              <p className="text-sm text-gray-600">Overview of all roles and their permission levels</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Create Role Form */}
        {showCreateRole && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Role</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., Senior Developer, HR Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Level</label>
                <select
                  value={newRole.level}
                  onChange={(e) => setNewRole({...newRole, level: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                placeholder="Describe the role responsibilities and scope..."
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createRole}
                className="px-4 py-2 text-white text-sm font-medium rounded-xl transition-colors"
                style={{
                  backgroundColor: 'var(--primary-color, #4575b5)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
                }}
              >
                Create Role
              </button>
              <button
                onClick={() => setShowCreateRole(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Roles Display */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterLevel !== 'all' ? 'No matching roles found' : 'No roles found'}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchTerm || filterLevel !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Create your first role to get started with role management'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role) => (
              <div key={role.id} className="bg-white rounded-xl border border-black p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${getRoleColor(role.level)} rounded-xl flex items-center justify-center text-white`}>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{role.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
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
            ))}
          </div>
        )}
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
}