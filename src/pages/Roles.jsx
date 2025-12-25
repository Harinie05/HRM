import React, { useState, useEffect } from "react";
import api from "../api";
import Layout from "../components/Layout";
import { hasPermission, isAdmin } from "../utils/permissions";

export default function Roles() {
  const tenant_db = localStorage.getItem("tenant_db");

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // NEW ROLE
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedPerms, setSelectedPerms] = useState([]);

  // EDIT ROLE
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPerms, setEditPerms] = useState([]);

  // ------------------------------------
  // PERMISSION CHECK
  // ------------------------------------
  const canView = isAdmin() || hasPermission("view_roles");
  const canAdd = isAdmin() || hasPermission("add_role");
  const canEdit = isAdmin() || hasPermission("edit_role");
  const canDelete = isAdmin() || hasPermission("delete_role");

  if (!canView) {
    return (
      <Layout breadcrumb="Admin · Roles">
        <div className="p-6 text-center text-red-600 font-semibold text-xl">
          ❌ You do not have permission to view Roles.
        </div>
      </Layout>
    );
  }

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

  useEffect(() => {
    fetchPermissions();
    fetchRoles();
  }, []);

  const togglePerm = (perm, setter, list) => {
    if (list.includes(perm)) {
      setter(list.filter((p) => p !== perm));
    } else {
      setter([...list, perm]);
    }
  };

  const addRole = async () => {
    if (!canAdd) return alert("You do not have permission to add roles");

    if (!name.trim()) {
      alert("Role name required");
      return;
    }

    setLoading(true);

    try {
      console.log('Creating role:', {
        name,
        description: desc,
        permissions: selectedPerms
      });
      await api.post(`/hospitals/roles/${tenant_db}/create`, {
        name,
        description: desc,
        permissions: selectedPerms,
      });

      console.log('Role created successfully');
      setName("");
      setDesc("");
      setSelectedPerms([]);
      setShowCreateModal(false);
      fetchRoles();
      alert("Role created!");
    } catch (err) {
      alert("Create failed");
      console.error(err);
    }

    setLoading(false);
  };

  const deleteRole = async (id) => {
    if (!canDelete)
      return alert("You do not have permission to delete roles");

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

  // Filter roles based on search
  const filteredRoles = roles.filter(role => {
    return role.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });



  return (
    <Layout 
      breadcrumb="Admin · Roles"
    >
      {/* Hero Section */}
      <div className="mb-4 p-6">
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-4 text-white relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className="bg-white/20 rounded-lg p-1.5 mr-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                  Access Control & Security
                </span>
              </div>
              
              <h1 className="text-xl font-bold mb-1">
                Roles & Permissions
              </h1>
              
              <p className="text-white/90 text-xs mb-3 max-w-xl">
                Define role templates and attach permission sets for access control.
              </p>
              
              <div className="flex items-center space-x-3">
                <button className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-xs font-medium transition-colors">
                  Role Management
                </button>
                <span className="text-white/80 text-xs">
                  Used by User Management / Security
                </span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center min-w-[120px]">
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">
                ROLES
              </p>
              <p className="text-2xl font-bold mb-1">
                {roles.length}
              </p>
              <p className="text-white/70 text-xs">
                Active roles with {permissions.length} permissions
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls Section */}
      <div className="mb-4 p-6">
        <div className="bg-white rounded-3xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            {/* Left side - Total and Showing */}
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                Total: {roles.length}
              </div>
              <div className="bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                Showing: {filteredRoles.length}
              </div>
            </div>
            
            {/* Right side - Search and New */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-full w-72 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>
      </div>

      {/* Role List */}
      <div className="p-6">
        <div className="bg-white rounded-3xl border border-gray-200">
          {filteredRoles.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No roles found
              </h3>
              <p className="text-gray-500 mb-6">
                Try changing your search, or create a new role.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRoles.map((role, index) => (
                    <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{role.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {role.description || <span className="italic text-gray-400">No description</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {role.permissions.length} permissions
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditing(role);
                              setEditName(role.name);
                              setEditDesc(role.description || "");
                              setEditPerms(role.permissions);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteRole(role.id)}
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

      {/* Create Modal */}
      {showCreateModal && canAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-[500px] p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Create Role
            </h2>

            <input
              type="text"
              placeholder="Role name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <input
              type="text"
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <p className="text-sm font-medium text-gray-700 mb-2">
              Permissions{" "}
              <span className="text-gray-400 ml-1">
                {selectedPerms.length} selected
              </span>
            </p>

            <div className="border border-gray-300 rounded-lg p-3 h-64 overflow-y-auto mb-4">
              {permissions.map((p) => (
                <label key={p.name} className="flex items-start mb-3">
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(p.name)}
                    onChange={() =>
                      togglePerm(p.name, setSelectedPerms, selectedPerms)
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

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setName("");
                  setDesc("");
                  setSelectedPerms([]);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>

              <button
                onClick={addRole}
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
          <div className="bg-white w-[500px] p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Edit Role
            </h2>

            <input
              type="text"
              className="border p-3 rounded-xl w-full mb-4"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <input
              type="text"
              className="border p-3 rounded-xl w-full mb-4"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />

            <p className="text-sm font-medium text-gray-700 mb-2">
              Permissions{" "}
              <span className="text-gray-400 ml-1">
                {editPerms.length} selected
              </span>
            </p>

            <div className="h-[300px] overflow-y-auto border rounded-lg p-3 mb-4">
              {permissions.map((p) => (
                <label key={p.name} className="flex items-start mb-3">
                  <input
                    type="checkbox"
                    checked={editPerms.includes(p.name)}
                    onChange={() =>
                      togglePerm(p.name, setEditPerms, editPerms)
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
                    console.log('Updating role:', {
                      id: editing.id,
                      name: editName,
                      description: editDesc,
                      permissions: editPerms
                    });
                    await api.put(
                      `/hospitals/roles/${tenant_db}/update/${editing.id}`,
                      {
                        name: editName,
                        description: editDesc,
                        permissions: editPerms,
                      }
                    );

                    console.log('Role updated successfully');
                    alert("Updated successfully!");
                    setEditing(null);
                    fetchRoles();
                  } catch (err) {
                    console.error('Update role failed:', err);
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
