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
      <Layout>
        <div className="p-6 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to view Roles.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const fetchPermissions = async () => {
    try {
      const res = await api.get(`/hospitals/roles/${tenant_db}/permissions`);
      setPermissions(res.data.permissions);
    } catch (err) {
      console.error("Permission load error:", err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get(`/hospitals/roles/${tenant_db}/list`);
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
      await api.post(`/hospitals/roles/${tenant_db}/create`, {
        name,
        description: desc,
        permissions: selectedPerms,
      });

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
      await api.delete(`/hospitals/roles/${tenant_db}/delete/${id}`);
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
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with gradient background matching Department page */}
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Roles & Permissions</h1>
                <p className="text-gray-600 text-base sm:text-lg mb-1">Define role templates and attach permission sets for access control</p>
                <p className="text-gray-500 text-xs sm:text-sm">Access Control & Security</p>
              </div>
            </div>
            <div className="text-left lg:text-right flex-shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-100 rounded-xl p-3 border border-black text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                    <span className="text-xs font-medium">Roles</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{roles.length}</p>
                </div>
                <div className="bg-gray-100 rounded-xl p-3 border border-black text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                    <span className="text-xs font-medium">Permissions</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{permissions.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter matching Department page */}
        <div className="bg-white rounded-2xl border border-black p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs sm:text-sm text-gray-600 border border-black">
              Total: {roles.length}
            </div>
            <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs sm:text-sm text-gray-600 border border-black">
              Showing: {filteredRoles.length}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-black rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            {canAdd && (
              <button 
                onClick={() => setShowCreateModal(true)}
                style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                className="inline-flex items-center justify-center gap-2 text-white px-4 py-2 rounded-full transition-colors text-sm font-medium whitespace-nowrap"
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">New Role</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
          </div>
        </div>

        {/* Role List matching Department page */}
        <div className="bg-white rounded-2xl border border-black overflow-hidden">
          {filteredRoles.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
              <p className="text-gray-500 text-sm">Try changing your search, or create a new role.</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRoles.map((role, index) => (
                  <div key={role.id} className="bg-white border border-black rounded-xl p-3 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-bold text-sm">
                            {role.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{role.name}</h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditing(role);
                              setEditName(role.name);
                              setEditDesc(role.description || "");
                              setEditPerms(role.permissions);
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
                            onClick={() => deleteRole(role.id)}
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
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-sm text-gray-700">
                          {role.description ? (
                            <span>{role.description}</span>
                          ) : (
                            <span className="text-gray-400 italic">No description provided</span>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Permissions</p>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            {role.permissions.length} permissions
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Active Role</span>
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

      {/* Create Modal */}
      {showCreateModal && canAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-black">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Create New Role</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setName("");
                    setDesc("");
                    setSelectedPerms([]);
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                  <input
                    type="text"
                    placeholder="Enter role name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea
                    placeholder="Enter role description"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions ({selectedPerms.length} selected)</label>
                  <div className="max-h-64 overflow-y-auto border border-black rounded-xl p-4 space-y-3">
                    {permissions.map((p) => (
                      <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPerms.includes(p.name)}
                          onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                          className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.description}</p>
                          <p className="text-xs text-gray-500">{p.name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setName("");
                    setDesc("");
                    setSelectedPerms([]);
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors text-sm border border-black"
                >
                  Cancel
                </button>
                <button
                  onClick={addRole}
                  disabled={loading || !name.trim()}
                  style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                  className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-black"
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)')}
                  onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--primary-color, #2862e9)')}
                >
                  {loading ? "Creating..." : "Create Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && canEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-black">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Edit Role</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions ({editPerms.length} selected)</label>
                  <div className="max-h-64 overflow-y-auto border border-black rounded-xl p-4 space-y-3">
                    {permissions.map((p) => (
                      <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPerms.includes(p.name)}
                          onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                          className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.description}</p>
                          <p className="text-xs text-gray-500">{p.name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors text-sm border border-black"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.put(
                        `/hospitals/roles/${tenant_db}/update/${editing.id}`,
                        {
                          name: editName,
                          description: editDesc,
                          permissions: editPerms,
                        }
                      );

                      alert("Updated successfully!");
                      setEditing(null);
                      fetchRoles();
                    } catch (err) {
                      console.error('Update role failed:', err);
                      alert("Update failed");
                    }
                  }}
                  style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                  className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors text-sm border border-black"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}