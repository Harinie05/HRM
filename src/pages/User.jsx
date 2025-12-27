import React, { useState, useEffect } from "react";
import api from "../api";
import Layout from "../components/Layout";
import { hasPermission, isAdmin } from "../utils/permissions";

export default function Users() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // --- EDIT STATE ---
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editDepartment, setEditDepartment] = useState("");

  const tenant_db = localStorage.getItem("tenant_db");

  // ----------------------------
  // PERMISSION HANDLING (ADMIN = FULL ACCESS)
  // ----------------------------
  const canView = isAdmin() || hasPermission("view_users");
  const canAdd = isAdmin() || hasPermission("add_user");
  const canEdit = isAdmin() || hasPermission("edit_user");
  const canDelete = isAdmin() || hasPermission("delete_user");

  // If user does NOT have view permission → block entire page
  if (!canView) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to view Users.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const loadUsers = async () => {
    try {
      const res = await api.get(`/hospitals/users/${tenant_db}/list`);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("User load error:", err);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await api.get(`/hospitals/roles/${tenant_db}/list`);
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error("Role load error:", err);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await api.get(`/hospitals/departments/${tenant_db}/list`);
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error("Dept load error:", err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadDepartments();
  }, []);

  const createUser = async () => {
    if (!canAdd) return alert("You do not have permission to add users");

    if (!name.trim() || !email.trim() || !password.trim() || !role || !department) {
      alert("All fields required");
      return;
    }

    setLoading(true);

    try {
      await api.post(`/hospitals/users/${tenant_db}/create`, {
        name,
        email,
        password,
        role_id: Number(role),
        department_id: Number(department),
      });

      setName("");
      setEmail("");
      setPassword("");
      setRole("");
      setDepartment("");
      setShowCreateModal(false);
      loadUsers();
      alert("User created!");
    } catch (err) {
      alert("Create failed");
      console.error(err);
    }

    setLoading(false);
  };

  // Filter users based on search and filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "with-role") {
      return matchesSearch && user.role && user.role.trim() !== "";
    } else if (filter === "without-role") {
      return matchesSearch && (!user.role || user.role.trim() === "");
    }
    
    return matchesSearch;
  });

  const deleteUser = async (id) => {
    if (!canDelete)
      return alert("You do not have permission to delete users");

    if (!window.confirm("Delete this user?")) return;

    try {
      await api.delete(`/hospitals/users/${tenant_db}/delete/${id}`);
      loadUsers();
    } catch (err) {
      console.error('Delete user failed:', err);
      alert("Delete failed");
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with gradient background matching Department/Roles page */}
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                <p className="text-gray-600 text-lg mb-1">Manage employees, assign roles & access levels</p>
                <p className="text-gray-500 text-sm">User & Access Management</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gray-100 rounded-xl p-3 border border-black text-center">
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                  <span className="text-xs font-medium">Users</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter matching Department/Roles page */}
        <div className="bg-white rounded-2xl border border-black p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-600 border border-black">
              Total: {users.length}
            </div>
            <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-600 border border-black">
              Showing: {filteredUsers.length}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter</span>
              <div className="flex items-center bg-gray-100 rounded-full p-1 border border-black">
                <button 
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    filter === "all" 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilter("with-role")}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    filter === "with-role" 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  With role
                </button>
                <button 
                  onClick={() => setFilter("without-role")}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    filter === "without-role" 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Without role
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:ml-auto">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-black rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              {canAdd && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                  className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-full hover:opacity-90 transition-colors text-sm font-medium"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User List matching Department/Roles page */}
        <div className="bg-white rounded-2xl border border-black overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 text-sm">Try changing your search/filter, or create a new user.</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredUsers.map((u, index) => (
                  <div key={u.id} className="bg-white border border-black rounded-xl p-3 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-600 font-bold text-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{u.name}</h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditing(u);
                              setEditName(u.name);
                              setEditEmail(u.email);
                              const userRole = roles.find(r => r.name === u.role);
                              const userDept = departments.find(d => d.name === u.department);
                              setEditRole(userRole ? userRole.id : "");
                              setEditDepartment(userDept ? userDept.id : "");
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</p>
                        <p className="text-sm text-gray-700 truncate">{u.email}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Role</p>
                          <div className="text-sm text-gray-700">
                            {u.role ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 truncate max-w-full">
                                {u.role}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-xs">No role</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Department</p>
                          <div className="text-sm text-gray-700">
                            {u.department ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 truncate max-w-full">
                                {u.department}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-xs">No dept</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Active User</span>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal matching Department/Roles page */}
      {showCreateModal && canAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-black">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Create User</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setName("");
                    setEmail("");
                    setPassword("");
                    setRole("");
                    setDepartment("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setName("");
                    setEmail("");
                    setPassword("");
                    setRole("");
                    setDepartment("");
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={createUser}
                  disabled={loading || !name.trim() || !email.trim() || !password.trim() || !role || !department}
                  style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                  className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)')}
                  onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--primary-color, #2862e9)')}
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal matching Department/Roles page */}
      {editing && canEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-black">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                <button
                  onClick={() => setEditing(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.put(
                        `/hospitals/users/${tenant_db}/update/${editing.id}`,
                        {
                          name: editName,
                          email: editEmail,
                          role_id: Number(editRole),
                          department_id: Number(editDepartment),
                        }
                      );

                      alert("Updated successfully!");
                      setEditing(null);
                      loadUsers();
                    } catch (err) {
                      console.error('Update user failed:', err);
                      alert("Update failed");
                    }
                  }}
                  style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                  className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors text-sm"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}