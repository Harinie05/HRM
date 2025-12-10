import React, { useState, useEffect } from "react";
import api from "../api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { hasPermission, isAdmin } from "../utils/permissions";

export default function Users() {
  const tenant_db = localStorage.getItem("tenant_db");

  // ---------------------------
  // USER PERMISSIONS
  // ---------------------------
  const canView = isAdmin() || hasPermission("view_users");
  const canAdd = isAdmin() || hasPermission("add_user");
  const canEdit = isAdmin() || hasPermission("edit_user");
  const canDelete = isAdmin() || hasPermission("delete_user");

  // Block entire page if user cannot view
  if (!canView) {
    return (
      <div className="flex bg-[#F5F7FA] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="p-6 text-center text-red-600 text-xl font-bold">
            ❌ You do not have permission to view Users.
          </div>
        </div>
      </div>
    );
  }

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");

  // New user fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");

  // Edit User Modal
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadDepartments();
  }, []);

  const loadUsers = async () => {
    try {
      console.log(`Loading users for tenant: ${tenant_db}`);
      const res = await api.get(`/hospitals/users/${tenant_db}/list`);
      console.log('Users loaded:', res.data.users);
      setUsers(res.data.users);
    } catch (err) {
      console.error("User load error:", err);
    }
  };

  const loadRoles = async () => {
    try {
      console.log(`Loading roles for user creation in tenant: ${tenant_db}`);
      const res = await api.get(`/hospitals/roles/${tenant_db}/list`);
      console.log('Roles for user creation loaded:', res.data.roles);
      setRoles(res.data.roles);
    } catch (err) {
      console.error("Role load error:", err);
    }
  };

  const loadDepartments = async () => {
    try {
      console.log(`Loading departments for user creation in tenant: ${tenant_db}`);
      const res = await api.get(`/hospitals/departments/${tenant_db}/list`);
      console.log('Departments for user creation loaded:', res.data.departments);
      setDepartments(res.data.departments);
    } catch (err) {
      console.error("Dept load error:", err);
    }
  };

  // Create new user
  const createUser = async () => {
    if (!canAdd) return alert("❌ You do not have permission to add users.");

    if (!name || !email || !password || !role || !department) {
      alert("All fields required");
      return;
    }

    try {
      console.log('Creating user:', {
        name,
        email,
        role_id: Number(role),
        department_id: Number(department)
      });
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

      console.log('User created successfully');
      loadUsers();
      alert("User created!");
    } catch (error) {
      alert("Create failed");
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    if (!canDelete)
      return alert("❌ You do not have permission to delete users.");

    if (!window.confirm("Delete this user?")) return;

    try {
      console.log(`Deleting user with ID: ${id}`);
      await api.delete(`/hospitals/users/${tenant_db}/delete/${id}`);
      console.log('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Delete user failed:', error);
      alert("Delete failed");
    }
  };

  // Update user
  const updateUser = async () => {
    if (!canEdit) return alert("❌ You do not have permission to edit users.");

    try {
      console.log('Updating user:', {
        id: editing.id,
        name: editName,
        email: editEmail,
        role_id: Number(editRole),
        department_id: Number(editDepartment)
      });
      const updateData = {
        name: editName,
        email: editEmail,
        role_id: Number(editRole),
        department_id: Number(editDepartment),
      };
      await api.put(`/hospitals/users/${tenant_db}/update/${editing.id}`, updateData);

      console.log('User updated successfully');
      setShowEditModal(false);
      loadUsers();
      alert("Updated!");
    } catch (err) {
      alert("Update failed");
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <div className="p-6">
          <div className="text-sm text-gray-500 mb-3">Admin · Users</div>

          <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Users</h1>
              <p className="text-gray-500 mt-1">
                Manage employees, assign roles & access levels.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white border p-4 rounded-xl shadow-sm text-center">
                <p className="text-xs font-medium text-gray-500 tracking-wide">
                  USERS
                </p>
                <p className="text-xl font-bold text-gray-800 mt-1">
                  {users.length}
                </p>
                <p className="text-[10px] text-gray-400">Active employees</p>
              </div>
            </div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-2 gap-6">

            {/* CREATE USER CARD (ONLY IF PERMITTED) */}
            {canAdd && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  Create User
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Add new employees and assign roles.
                </p>

                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border p-3 w-full rounded-xl mb-3"
                />

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border p-3 w-full rounded-xl mb-3"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border p-3 w-full rounded-xl mb-3"
                />

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="border p-3 w-full rounded-xl mb-3"
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
                  className="border p-3 w-full rounded-xl mb-4"
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={createUser}
                  className="mt-2 bg-[#0A2540] text-white px-5 py-3 rounded-xl w-full hover:bg-[#061829]"
                >
                  Create User
                </button>
              </div>
            )}

            {/* USER LIST CARD */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold">User List</h2>

                <input
                  type="text"
                  placeholder="Search user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border p-2 rounded-lg text-sm"
                />
              </div>

              <table className="min-w-full border text-sm rounded-xl overflow-hidden">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 border w-12 text-center">#</th>
                    <th className="p-3 border text-left">Name</th>
                    <th className="p-3 border text-left">Email</th>
                    <th className="p-3 border text-left">Role</th>
                    <th className="p-3 border text-left">Department</th>
                    <th className="p-3 border text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u, index) => (
                    <tr key={u.id} className="border hover:bg-gray-50 transition">
                      <td className="p-3 border text-center">{index + 1}</td>
                      <td className="p-3 border">{u.name}</td>
                      <td className="p-3 border">{u.email}</td>
                      <td className="p-3 border">{u.role}</td>
                      <td className="p-3 border">{u.department}</td>

                      <td className="p-3 border text-center space-x-2">

                        {/* EDIT BUTTON */}
                        {canEdit && (
                          <button
                            className="px-4 py-1 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setEditing(u);
                              setEditName(u.name);
                              setEditEmail(u.email);
                              // Find role and department IDs from names
                              const userRole = roles.find(r => r.name === u.role);
                              const userDept = departments.find(d => d.name === u.department);
                              setEditRole(userRole ? userRole.id : "");
                              setEditDepartment(userDept ? userDept.id : "");
                              setShowEditModal(true);
                            }}
                          >
                            Edit
                          </button>
                        )}

                        {/* DELETE BUTTON */}
                        {canDelete && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="px-4 py-1 rounded-full border border-red-500 text-red-500 hover:bg-red-50"
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
          </div>

          {/* EDIT USER MODAL */}
          {showEditModal && canEdit && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white w-[500px] p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Edit User</h2>

                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border p-3 w-full rounded-xl mb-3"
                />

                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="border p-3 w-full rounded-xl mb-3"
                />

                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="border p-3 w-full rounded-xl mb-3"
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
                  className="border p-3 w-full rounded-xl mb-4"
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <div className="flex justify-end gap-3 mt-2">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={updateUser}
                    className="bg-[#0A2540] text-white px-4 py-2 rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
