import React, { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import { hasPermission, isAdmin } from "../utils/permissions";

export default function Departments() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const tenant_db = localStorage.getItem("tenant_db");
  const canView = isAdmin() || hasPermission("view_departments");
  const canAdd = isAdmin() || hasPermission("add_department");
  const canEdit = isAdmin() || hasPermission("edit_department");
  const canDelete = isAdmin() || hasPermission("delete_department");

  if (!canView) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to view Departments.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const fetchDepartments = async () => {
    try {
      console.log(`Fetching departments for tenant: ${tenant_db}`);
      const res = await api.get(`/hospitals/departments/${tenant_db}/list`);
      console.log('Departments loaded:', res.data.departments);
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error("List error:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const addDepartment = async () => {
    
    if (!canAdd) return alert("You do not have permission to add departments");

    if (!name.trim()) {
      alert("Department name required");
      return;
    }

    setLoading(true);

    try {
      console.log('Creating department:', { name, description: desc });
      await api.post(`/hospitals/departments/${tenant_db}/create`, {
        name,
        description: desc,
      });

      console.log('Department created successfully');
      setName("");
      setDesc("");
      setShowCreateModal(false);
      fetchDepartments();
      alert("Department created!");
    } catch (err) {
      alert("Create failed");
      console.error(err);
    }

    setLoading(false);
  };

  // Filter departments based on search and filter
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === "with-description") {
      return matchesSearch && dept.description && dept.description.trim() !== "";
    } else if (filter === "without-description") {
      return matchesSearch && (!dept.description || dept.description.trim() === "");
    }
    
    return matchesSearch;
  });

  const deleteDepartment = async (id) => {
    if (!canDelete)
      return alert("You do not have permission to delete departments");

    if (!window.confirm("Delete this department?")) return;

    try {
      console.log(`Deleting department with ID: ${id}`);
      await api.delete(`/hospitals/departments/${tenant_db}/delete/${id}`);
      console.log('Department deleted successfully');
      fetchDepartments();
    } catch (err) {
      console.error('Delete department failed:', err);
      alert("Delete failed");
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with gradient background matching Dashboard */}
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Department Management</h1>
                <p className="text-gray-600 text-base sm:text-lg mb-1">Define organizational departments and structure for staff assignment</p>
                <p className="text-gray-500 text-xs sm:text-sm">Organizational Structure</p>
              </div>
            </div>
            <div className="text-left lg:text-right flex-shrink-0">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <span className="text-sm font-medium">Departments {departments.length}</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-gray-900">Active departments</p>
            </div>
          </div>
        </div>

        {/* Stats Cards matching Dashboard style */}
        <div className="bg-white rounded-2xl border border-black p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs sm:text-sm text-gray-600 border border-black">
              Total: {departments.length}
            </div>
            <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs sm:text-sm text-gray-600 border border-black">
              Showing: {filteredDepartments.length}
            </div>
          </div>

          {/* Search and Filter matching Dashboard */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Filter</span>
                <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto border border-black">
                  <button 
                    onClick={() => setFilter("all")}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                      filter === "all" 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilter("with-description")}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                      filter === "with-description" 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    With description
                  </button>
                  <button 
                    onClick={() => setFilter("without-description")}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                      filter === "without-description" 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Without description
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
                  placeholder="Search name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-black rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              {canAdd && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">New Department</span>
                  <span className="sm:hidden">New</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Department List matching Dashboard style */}
        <div className="bg-white rounded-2xl border border-black overflow-hidden">
          {filteredDepartments.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
              <p className="text-gray-500 text-sm">Try changing your search/filter, or create a new department.</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDepartments.map((dept, index) => (
                  <div key={dept.id} className="bg-white border border-black rounded-xl p-3 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-bold text-sm">
                            {dept.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{dept.name}</h3>
                          <p className="text-xs text-gray-500">Department #{index + 1}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditing(dept);
                              setEditName(dept.name);
                              setEditDesc(dept.description || "");
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
                            onClick={() => deleteDepartment(dept.id)}
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
                          {dept.description ? (
                            <span>{dept.description}</span>
                          ) : (
                            <span className="text-gray-400 italic">No description provided</span>
                          )}
                        </p>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Created</span>
                          <span>Active</span>
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

      {/* Create Modal matching Dashboard style */}
      {showCreateModal && canAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-black">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Create Department</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setName("");
                    setDesc("");
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Name</label>
                  <input
                    type="text"
                    placeholder="Enter department name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea
                    placeholder="Enter department description"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setName("");
                    setDesc("");
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors text-sm border border-black"
                >
                  Cancel
                </button>
                <button
                  onClick={addDepartment}
                  disabled={loading || !name.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-black"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal matching Dashboard style */}
      {editing && canEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-black">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Edit Department</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Name</label>
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
                      console.log('Updating department:', {
                        id: editing.id,
                        name: editName,
                        description: editDesc
                      });
                      await api.put(
                        `/hospitals/departments/${tenant_db}/update/${editing.id}`,
                        {
                          name: editName,
                          description: editDesc,
                        }
                      );

                      console.log('Department updated successfully');
                      alert("Updated successfully!");
                      setEditing(null);
                      fetchDepartments();
                    } catch (err) {
                      console.error('Update department failed:', err);
                      alert("Update failed");
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors text-sm border border-black"
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