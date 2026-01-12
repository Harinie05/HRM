import React, { useState, useEffect } from "react";
import api from "../api";
import Layout from "../components/Layout";
import Toast from "../components/Toast";
import useToast from "../utils/useToast";
import { hasPermission, isAdmin } from "../utils/permissions";

export default function Users() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // --- EDIT STATE ---
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editTwoFactorEnabled, setEditTwoFactorEnabled] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const tenant_db = localStorage.getItem("tenant_db");

  // ----------------------------
  // PERMISSION HANDLING (ADMIN = FULL ACCESS)
  // ----------------------------
  const canView = isAdmin() || hasPermission("view_users");
  const canAdd = isAdmin() || hasPermission("add_user");
  const canEdit = isAdmin() || hasPermission("edit_user");
  const canDelete = isAdmin() || hasPermission("delete_user");

  const loadUsers = async (status = statusFilter) => {
    try {
      console.log('Loading users with tenant_db:', tenant_db, 'status:', status);
      const res = await api.get(`/hospitals/users/${tenant_db}/list?status=${status}`);
      console.log('Users API response:', res.data);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("User load error:", err);
      if (err.response?.status === 403) {
        showToast('Access denied: You do not have permission to view users', 'error');
      } else {
        showToast('Failed to load users', 'error');
      }
      setUsers([]); // Keep empty array for consistent UI
    }
  };

  const loadRoles = async () => {
    try {
      const res = await api.get(`/hospitals/roles/${tenant_db}/list?status=active`);
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error("Role load error:", err);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await api.get(`/hospitals/departments/${tenant_db}/list?status=active`);
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error("Dept load error:", err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadDepartments();
  }, [statusFilter]);

  const createUser = async () => {
    if (!canAdd) return showToast("You do not have permission to add users", 'error');

    if (!name.trim() || !email.trim() || !password.trim() || !role || !department) {
      showToast("All fields are required to create a user", 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(`/hospitals/users/${tenant_db}/create`, {
        name,
        email,
        password,
        role_id: Number(role),
        department_id: Number(department),
        two_factor_enabled: twoFactorEnabled,
      });

      setName("");
      setEmail("");
      setPassword("");
      setRole("");
      setDepartment("");
      setTwoFactorEnabled(false);
      setShowCreateModal(false);
      loadUsers();
      
      // Show success toast with user name and login code
      const message = response.data.message || `User '${name}' created successfully`;
      showToast(message, 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Failed to create user";
      showToast(errorMessage, 'error');
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
      return showToast("You do not have permission to delete users", 'error');

    const userToDelete = users.find(u => u.id === id);
    const userName = userToDelete ? userToDelete.name : 'User';
    
    if (!window.confirm(`Are you sure you want to deactivate ${userName}?`)) return;

    try {
      const response = await api.delete(`/hospitals/users/${tenant_db}/delete/${id}`);
      loadUsers();
      
      // Show success toast with user name
      const message = response.data.message || `${userName} has been deactivated successfully`;
      showToast(message, 'success');
    } catch (err) {
      console.error('Delete user failed:', err);
      const errorMessage = err.response?.data?.detail || `Failed to deactivate ${userName}`;
      showToast(errorMessage, 'error');
    }
  };

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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Hero Header matching Dashboard */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-gray-200 shadow-sm p-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">User Management</h1>
                <p className="text-gray-600 text-sm mb-1">Manage employees, assign roles & access levels</p>
                <p className="text-gray-500 text-xs">User & Access Management</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                  <span className="text-xs font-medium">Users</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators matching Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-gray-400 text-xs mt-1">System accounts</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.status === 'Active').length}</p>
                <p className="text-gray-400 text-xs mt-1">Currently enabled</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
                <p className="text-gray-400 text-xs mt-1">Currently showing</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">With Roles</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role && u.role.trim() !== '').length}</p>
                <p className="text-gray-400 text-xs mt-1">Role assigned</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <svg className="h-5 w-5" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">User Directory</h3>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{
                      focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="all">All</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Filter</span>
                  <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto border border-gray-200">
                    <button 
                      onClick={() => setFilter("all")}
                      className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        filter === "all" 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      style={{
                        backgroundColor: filter === "all" ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : 'transparent',
                        color: filter === "all" ? 'white' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        if (filter !== "all") {
                          e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                          e.target.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filter !== "all") {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6b7280';
                        }
                      }}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFilter("with-role")}
                      className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        filter === "with-role" 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      style={{
                        backgroundColor: filter === "with-role" ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : 'transparent',
                        color: filter === "with-role" ? 'white' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        if (filter !== "with-role") {
                          e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                          e.target.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filter !== "with-role") {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6b7280';
                        }
                      }}
                    >
                      With role
                    </button>
                    <button 
                      onClick={() => setFilter("without-role")}
                      className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        filter === "without-role" 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      style={{
                        backgroundColor: filter === "without-role" ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : 'transparent',
                        color: filter === "without-role" ? 'white' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        if (filter !== "without-role") {
                          e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                          e.target.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filter !== "without-role") {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6b7280';
                        }
                      }}
                    >
                      Without role
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{
                      focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                  />
                </div>
                {canAdd && (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center justify-center gap-2 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">New User</span>
                    <span className="sm:hidden">New</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredUsers.map((u, index) => (
                  <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                          backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}15`
                        }}>
                          <span className="font-bold text-sm" style={{
                            color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }}>
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-gray-900">{u.name}</h3>
                          <p className="text-xs text-gray-500">User</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditing(u);
                              setEditName(u.name);
                              setEditEmail(u.email);
                              setEditPassword(""); // Reset password field
                              const userRole = roles.find(r => r.name === u.role);
                              const userDept = departments.find(d => d.name === u.department);
                              setEditRole(userRole ? userRole.id : "");
                              setEditDepartment(userDept ? userDept.id : "");
                              setEditTwoFactorEnabled(u.two_factor_enabled || false);
                            }}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
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
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</p>
                        <p className="text-sm text-gray-700">{u.email}</p>
                      </div>
                      
                      {u.employee_code && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Employee Code</p>
                          <p className="text-sm text-gray-700 font-mono">{u.employee_code}</p>
                        </div>
                      )}
                      
                      {u.login_code && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Login Code</p>
                          <p className="text-sm text-gray-700 font-mono">{u.login_code}</p>
                        </div>
                      )}
                      
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-600">Role</span>
                          <span className="text-sm font-bold text-gray-900 text-right break-words">
                            {u.role || 'No Role'}
                          </span>
                        </div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-600">Department</span>
                          <span className="text-sm font-bold text-gray-900 text-right break-words">
                            {u.department || 'No Department'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Status</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className="text-xs font-medium text-gray-700">{u.status === 'Active' ? 'Active User' : 'Inactive User'}</span>
                          </div>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Login Code *</label>
                    <div className="flex gap-2">
                      <div className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600 font-mono">
                        Auto-generated
                      </div>
                      <button
                        type="button"
                        className="px-3 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        title="Generate new code"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Unique code for user login (e.g., AB123456)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="activeUser"
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    defaultChecked
                  />
                  <label htmlFor="activeUser" className="text-sm font-medium text-gray-700">Active User</label>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Authentication Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="twoFactor"
                        checked={twoFactorEnabled}
                        onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                      />
                      <div>
                        <label htmlFor="twoFactor" className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                        <p className="text-xs text-gray-500">Require OTP verification for login</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Roles ({roles.length} available)</h3>
                  <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                    {roles.map((r) => (
                      <div key={r.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`role-${r.id}`}
                          name="role"
                          value={r.id}
                          checked={role == r.id}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor={`role-${r.id}`} className="text-sm text-gray-700">
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-gray-500">Role description</div>
                        </label>
                      </div>
                    ))}
                  </div>
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
                    setTwoFactorEnabled(false);
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
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)')}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Login Code *</label>
                    <div className="flex gap-2">
                      <div className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600 font-mono">
                        {editing?.login_code || 'Not assigned'}
                      </div>
                      <button
                        type="button"
                        className="px-3 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        title="Generate new code"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Unique code for user login (e.g., AB123456)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="editActiveUser"
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    defaultChecked
                  />
                  <label htmlFor="editActiveUser" className="text-sm font-medium text-gray-700">Active User</label>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Authentication Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="editTwoFactor"
                        checked={editTwoFactorEnabled}
                        onChange={(e) => setEditTwoFactorEnabled(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                      />
                      <div>
                        <label htmlFor="editTwoFactor" className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                        <p className="text-xs text-gray-500">Require OTP verification for login</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Roles ({roles.length} available)</h3>
                  <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                    {roles.map((r) => (
                      <div key={r.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`edit-role-${r.id}`}
                          name="editRole"
                          value={r.id}
                          checked={editRole == r.id}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor={`edit-role-${r.id}`} className="text-sm text-gray-700">
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-gray-500">Role description</div>
                        </label>
                      </div>
                    ))}
                  </div>
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
                      const updateData = {
                        name: editName,
                        email: editEmail,
                        role_id: Number(editRole),
                        department_id: Number(editDepartment),
                        two_factor_enabled: editTwoFactorEnabled,
                      };
                      
                      // Only include password if it's provided
                      if (editPassword.trim()) {
                        updateData.password = editPassword;
                      }

                      const response = await api.put(
                        `/hospitals/users/${tenant_db}/update/${editing.id}`,
                        updateData
                      );

                      // Show success toast with user name
                      const message = response.data.message || `User '${editName}' updated successfully`;
                      showToast(message, 'success');
                      setEditing(null);
                      loadUsers();
                    } catch (err) {
                      console.error('Update user failed:', err);
                      const errorMessage = err.response?.data?.detail || "Failed to update user";
                      showToast(errorMessage, 'error');
                    }
                  }}
                  style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                  className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors text-sm"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}