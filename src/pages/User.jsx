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
        <div className="p-6 text-center text-red-600 text-xl font-bold">
          ❌ You do not have permission to view Users.
        </div>
      </Layout>
    );
  }

  const loadUsers = async () => {
    try {
      console.log(`Loading users for tenant: ${tenant_db}`);
      const res = await api.get(`/hospitals/users/${tenant_db}/list`);
      console.log('Users loaded:', res.data.users);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("User load error:", err);
    }
  };

  const loadRoles = async () => {
    try {
      console.log(`Loading roles for user creation in tenant: ${tenant_db}`);
      const res = await api.get(`/hospitals/roles/${tenant_db}/list`);
      console.log('Roles for user creation loaded:', res.data.roles);
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error("Role load error:", err);
    }
  };

  const loadDepartments = async () => {
    try {
      console.log(`Loading departments for user creation in tenant: ${tenant_db}`);
      const res = await api.get(`/hospitals/departments/${tenant_db}/list`);
      console.log('Departments for user creation loaded:', res.data.departments);
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
      console.log('Creating user:', { name, email, role_id: Number(role), department_id: Number(department) });
      await api.post(`/hospitals/users/${tenant_db}/create`, {
        name,
        email,
        password,
        role_id: Number(role),
        department_id: Number(department),
      });

      console.log('User created successfully');
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
      console.log(`Deleting user with ID: ${id}`);
      await api.delete(`/hospitals/users/${tenant_db}/delete/${id}`);
      console.log('User deleted successfully');
      loadUsers();
    } catch (err) {
      console.error('Delete user failed:', err);
      alert("Delete failed");
    }
  };

  return (
    <Layout 
      breadcrumb="Admin · Users"
    >
      <div className="max-w-full overflow-hidden">
        {/* Hero Section */}
        <div className="mb-4 mt-6 px-8">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="bg-white/20 rounded-lg p-1.5 mr-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                    </svg>
                  </div>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                    User & Access Management
                  </span>
                </div>
                
                <h1 className="text-xl font-bold mb-1">
                  User Management
                </h1>
                
                <p className="text-white/90 text-xs mb-3">
                  Manage employees, assign roles & access levels.
                </p>
                
                <div className="flex items-center space-x-3">
                  <button className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-xs font-medium transition-colors">
                    User Setup
                  </button>
                  <span className="text-white/80 text-xs">
                    Used by HR / Admin / Management
                  </span>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center min-w-[120px]">
                <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">
                  USERS
                </p>
                <p className="text-2xl font-bold mb-1">
                  {users.length}
                </p>
                <p className="text-white/70 text-xs">
                  Active employees
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Controls Section */}
        <div className="mb-4 p-6">
          <div className="rounded-3xl border p-4" style={{borderColor: 'var(--border-color, #e2e8f0)', backgroundColor: 'var(--card-bg, #ffffff)'}} style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left side - Total and Showing */}
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 min-w-[100px] text-center px-3 py-1.5 rounded-full text-sm">
                  Total: {users.length}
                </div>
                <div className="bg-gray-100 min-w-[120px] text-center px-3 py-1.5 rounded-full text-sm">
                  Showing: {filteredUsers.length}
                </div>
              </div>
              
              {/* Right side - Search and New */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border-dark rounded-full w-48 sm:w-64 lg:w-72 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <svg className="w-4 h-4 text-muted absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                {canAdd && (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>New</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Filter section */}
            <div className="flex items-center space-x-4 mt-4">
              <span className="text-sm text-secondary">Filter</span>
              <div className="bg-content rounded-full p-1 flex items-center space-x-1">
                <button 
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === "all" ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-primary"
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilter("with-role")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === "with-role" ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-primary"
                  }`}
                >
                  With role
                </button>
                <button 
                  onClick={() => setFilter("without-role")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === "without-role" ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-primary"
                  }`}
                >
                  Without role
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="p-6">
          <div className="rounded-3xl border" style={{borderColor: 'var(--border-color, #e2e8f0)', backgroundColor: 'var(--card-bg, #ffffff)'}} style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  No users found
                </h3>
                <p className=" mb-6" style={{color: 'var(--text-muted, #6b7280)'}}>
                  Try changing your search/filter, or create a new user.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="min-w-full table-fixed">
                  <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-content border-b ">
                    <tr>
                      <th className="px-3 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider w-12">
                        #
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider w-32">
                        Name
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider w-48">
                        Email
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider w-28">
                        Role
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider w-32">
                        Department
                      </th>
                      <th className="px-3 py-4 text-right text-xs font-medium text-muted uppercase tracking-wider w-24">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="divide-y">
                    {filteredUsers.map((u, index) => (
                      <tr key={u.id} className="hover:bg-content transition-colors">
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-muted">
                          {index + 1}
                        </td>
                        <td className="px-3 py-4 text-sm font-medium text-primary">
                          <div className="truncate" title={u.name}>{u.name}</div>
                        </td>
                        <td className="px-3 py-4 text-sm text-muted">
                          <div className="truncate" title={u.email}>{u.email}</div>
                        </td>
                        <td className="px-3 py-4 text-sm text-muted">
                          <div className="truncate" title={u.role}>
                            {u.role || <span className="italic text-muted">No role</span>}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-muted">
                          <div className="truncate" title={u.department}>
                            {u.department || <span className="italic text-muted">No department</span>}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm space-x-2">
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
                              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="text-red-600 hover:text-red-800 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && canAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-96 p-6 rounded-xl shadow-xl" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
            <h2 className="text-lg font-semibold mb-4 text-primary">
              Create User
            </h2>

            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-dark p-3 rounded-lg w-full mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            />

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-dark p-3 rounded-lg w-full mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-dark p-3 rounded-lg w-full mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border-dark p-3 rounded-lg w-full mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="border-dark p-3 rounded-lg w-full mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setName("");
                  setEmail("");
                  setPassword("");
                  setRole("");
                  setDepartment("");
                }}
                className="px-4 py-2 rounded-lg border-dark text-secondary hover:bg-content font-medium"
              >
                Cancel
              </button>

              <button
                onClick={createUser}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="w-96 p-6 rounded-xl shadow-xl" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
            <h2 className="text-lg font-semibold mb-4 text-primary">
              Edit User
            </h2>

            <input
              type="text"
              className="border p-3 rounded-xl w-full mb-4" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <input
              type="email"
              className="border p-3 rounded-xl w-full mb-4" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />

            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="border p-3 rounded-xl w-full mb-4" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
              className="border p-3 rounded-xl w-full mb-4" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  try {
                    console.log('Updating user:', {
                      id: editing.id,
                      name: editName,
                      email: editEmail,
                      role_id: Number(editRole),
                      department_id: Number(editDepartment)
                    });
                    await api.put(
                      `/hospitals/users/${tenant_db}/update/${editing.id}`,
                      {
                        name: editName,
                        email: editEmail,
                        role_id: Number(editRole),
                        department_id: Number(editDepartment),
                      }
                    );

                    console.log('User updated successfully');
                    alert("Updated successfully!");
                    setEditing(null);
                    loadUsers();
                  } catch (err) {
                    console.error('Update user failed:', err);
                    alert("Update failed");
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
