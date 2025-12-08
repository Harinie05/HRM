import React, { useState, useEffect } from "react";
import api from "../api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { hasPermission, isAdmin } from "../utils/permissions";

export default function Roles() {
  const tenant_db = localStorage.getItem("tenant_db");

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  const [search, setSearch] = useState("");

  // NEW ROLE
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRolePerms, setNewRolePerms] = useState([]);

  // EDIT ROLE
  const [editing, setEditing] = useState(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRolePerms, setEditRolePerms] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);

  // ------------------------------------
  // PERMISSION CHECK
  // ------------------------------------
  const canView = isAdmin() || hasPermission("view_roles");
  const canAdd = isAdmin() || hasPermission("add_role");
  const canEdit = isAdmin() || hasPermission("edit_role");
  const canDelete = isAdmin() || hasPermission("delete_role");

  if (!canView) {
    return (
      <div className="flex bg-[#F5F7FA] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="p-6 text-center text-red-600 text-xl font-bold">
            ❌ You do not have permission to view Roles.
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------
  // FETCH DATA
  // ------------------------------------
  useEffect(() => {
    fetchPermissions();
    fetchRoles();
  }, []);

  const fetchPermissions = async () => {
    try {
      console.log(`Fetching permissions for tenant: ${tenant_db}`);
      const res = await api.get(`/hospitals/roles/${tenant_db}/permissions`);
      console.log('Permissions loaded:', res.data.permissions);
      setPermissions(res.data.permissions);
    } catch (err) {
      console.error("Permission load error:", err);
    }
  };

  const fetchRoles = async () => {
    try {
      console.log(`Fetching roles for tenant: ${tenant_db}`);
      const res = await api.get(`/hospitals/roles/${tenant_db}/list`);
      console.log('Roles loaded:', res.data.roles);
      setRoles(res.data.roles);
    } catch (err) {
      console.error("Role load error:", err);
    }
  };

  // ------------------------------------
  // TOGGLE PERMISSION
  // ------------------------------------
  const togglePerm = (perm, setter, list) => {
    if (list.includes(perm)) {
      setter(list.filter((p) => p !== perm));
    } else {
      setter([...list, perm]);
    }
  };

  // ------------------------------------
  // CREATE ROLE
  // ------------------------------------
  const createRole = async () => {
    if (!canAdd) return alert("❌ You do not have permission to add roles.");

    if (!newRoleName.trim()) return alert("Role name required");

    try {
      console.log('Creating role:', {
        name: newRoleName,
        description: newRoleDesc,
        permissions: newRolePerms
      });
      await api.post(`/hospitals/roles/${tenant_db}/create`, {
        name: newRoleName,
        description: newRoleDesc,
        permissions: newRolePerms,
      });

      setNewRoleName("");
      setNewRoleDesc("");
      setNewRolePerms([]);

      console.log('Role created successfully');
      fetchRoles();
      alert("Role created!");
    } catch (err) {
      alert("Failed to create role");
    }
  };

  // ------------------------------------
  // DELETE ROLE
  // ------------------------------------
  const deleteRole = async (id) => {
    if (!canDelete) return alert("❌ You do not have permission to delete roles.");
    if (!window.confirm("Delete this role?")) return;

    try {
      console.log(`Deleting role with ID: ${id}`);
      await api.delete(`/hospitals/roles/${tenant_db}/delete/${id}`);
      console.log('Role deleted successfully');
      fetchRoles();
    } catch (err) {
      console.error('Delete role failed:', err);
      alert("Delete failed");
    }
  };

  // ------------------------------------
  // UPDATE ROLE
  // ------------------------------------
  const updateRole = async () => {
    if (!canEdit) return alert("❌ You do not have permission to edit roles.");

    try {
      console.log('Updating role:', {
        id: editing.id,
        name: editRoleName,
        permissions: editRolePerms
      });
      await api.put(`/hospitals/roles/${tenant_db}/update/${editing.id}`, {
        name: editRoleName,
        permissions: editRolePerms,
      });

      console.log('Role updated successfully');
      setShowEditModal(false);
      fetchRoles();
      alert("Role updated!");
    } catch (err) {
      alert("Update failed");
    }
  };

  // ------------------------------------
  // SEARCH FILTER
  // ------------------------------------
  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <div className="p-6">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-3">
            Admin · Roles & Permissions
          </div>

          {/* TOP HEADER */}
          <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                Roles & Permissions
              </h1>
              <p className="text-gray-500 mt-1">
                Define role templates and attach permission sets.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white border p-4 rounded-xl shadow-sm text-center">
                <p className="text-xs text-gray-500">ROLES</p>
                <p className="text-xl font-bold">{roles.length}</p>
              </div>

              <div className="bg-white border p-4 rounded-xl shadow-sm text-center">
                <p className="text-xs text-gray-500">PERMISSIONS</p>
                <p className="text-xl font-bold">{permissions.length}</p>
              </div>
            </div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-2 gap-6">

            {/* ================= CREATE ROLE SECTION ================= */}
            {canAdd && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  Create role
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Group permissions into named roles.
                </p>

                <input
                  type="text"
                  placeholder="Role name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="border p-3 w-full rounded-xl mb-3"
                />

                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="border p-3 w-full rounded-xl mb-4"
                />

                {/* PERMISSIONS SCROLLBOX */}
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Permissions{" "}
                  <span className="text-gray-400 ml-1">
                    {newRolePerms.length} selected
                  </span>
                </p>

                <div className="border rounded-xl p-3 h-64 overflow-y-auto">
                  {permissions.map((p) => (
                    <label key={p.name} className="flex items-start mb-3">
                      <input
                        type="checkbox"
                        checked={newRolePerms.includes(p.name)}
                        onChange={() =>
                          togglePerm(p.name, setNewRolePerms, newRolePerms)
                        }
                        className="mt-1 h-4 w-4 text-blue-600"
                      />

                      <div className="ml-2">
                        <p className="text-sm text-gray-800">{p.description}</p>
                        <p className="text-xs text-gray-400">{p.name}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  onClick={createRole}
                  className="mt-5 bg-[#0A2540] text-white px-5 py-3 rounded-xl w-full hover:bg-[#061829]"
                >
                  Create Role
                </button>
              </div>
            )}

            {/* ============= ROLE LIST ============= */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold">Role list</h2>

                <input
                  type="text"
                  placeholder="Search role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border p-2 rounded-lg text-sm"
                />
              </div>

              <table className="min-w-full border text-sm rounded-xl overflow-hidden">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 border text-center">#</th>
                    <th className="p-3 border text-left">Role name</th>
                    <th className="p-3 border text-left">Description</th>
                    <th className="p-3 border text-left">Permissions</th>
                    <th className="p-3 border text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRoles.map((r, index) => (
                    <tr key={r.id} className="border hover:bg-gray-50">
                      <td className="p-3 border text-center">{index + 1}</td>
                      <td className="p-3 border">{r.name}</td>
                      <td className="p-3 border">{r.description || "—"}</td>
                      <td className="p-3 border">
                        {r.permissions.length} permissions
                      </td>

                      <td className="p-3 border text-center space-x-2">
                        {canEdit && (
                          <button
                            className="px-4 py-1 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setEditing(r);
                              setEditRoleName(r.name);
                              setEditRolePerms(r.permissions);
                              setShowEditModal(true);
                            }}
                          >
                            Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => deleteRole(r.id)}
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

          {/* ================= EDIT MODAL ================= */}
          {showEditModal && canEdit && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white w-[500px] p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Edit Role</h2>

                <input
                  type="text"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  className="border p-3 w-full rounded-xl mb-4"
                />

                <div className="h-[300px] overflow-y-auto border rounded-lg p-3">
                  {permissions.map((p) => (
                    <label key={p.name} className="flex items-start mb-3">
                      <input
                        type="checkbox"
                        checked={editRolePerms.includes(p.name)}
                        onChange={() =>
                          togglePerm(p.name, setEditRolePerms, editRolePerms)
                        }
                        className="mt-1 h-4 w-4"
                      />
                      <div className="ml-2">
                        <p className="text-sm">{p.description}</p>
                        <p className="text-xs text-gray-500">{p.name}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={updateRole}
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
