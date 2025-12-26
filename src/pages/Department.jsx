import React, { useEffect, useState } from "react";
import api from "../api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
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

  // --- EDIT STATE ---
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const tenant_db = localStorage.getItem("tenant_db");

  // ----------------------------
  // PERMISSION HANDLING (ADMIN = FULL ACCESS)
  // ----------------------------
  const canView = isAdmin() || hasPermission("view_departments");
  const canAdd = isAdmin() || hasPermission("add_department");
  const canEdit = isAdmin() || hasPermission("edit_department");
  const canDelete = isAdmin() || hasPermission("delete_department");

  // If user does NOT have view permission → block entire page
  if (!canView) {
    return (
      <div className="flex bg-[#F5F7FA] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="p-6 text-center text-red-600 font-semibold text-xl">
            ❌ You do not have permission to view Departments.
          </div>
        </div>
      </div>
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
    <Layout 
      breadcrumb="Admin · Departments"
    >
      {/* Hero Section */}
      <div className="mb-4 p-6">
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-4 text-white relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className="bg-white/20 rounded-lg p-1.5 mr-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                  HR & Administrative Structure
                </span>
              </div>
              
              <h1 className="text-xl font-bold mb-1">
                HR & Administrative Departments
              </h1>
              
              <p className="text-white/90 text-xs mb-3 max-w-xl">
                Configure HR, Finance, IT, Operations and other departments.
              </p>
              
              <div className="flex items-center space-x-3">
                <button className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-xs font-medium transition-colors">
                  Department Setup
                </button>
                <span className="text-white/80 text-xs">
                  Used by HR / Payroll / Recruitment
                </span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center min-w-[120px]">
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">
                DEPARTMENTS
              </p>
              <p className="text-2xl font-bold mb-1">
                {departments.length}
              </p>
              <p className="text-white/70 text-xs">
                Active list used across modules
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls Section */}
      <div className="mb-4 p-6">
        <div className="rounded-3xl border p-4" style={{borderColor: 'var(--border-color, #e2e8f0)', backgroundColor: 'var(--card-bg, #ffffff)'}}>
          <div className="flex items-center justify-between">
            {/* Left side - Total and Showing */}
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                Total: {departments.length}
              </div>
              <div className="bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                Showing: {filteredDepartments.length}
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
                  className="pl-9 pr-4 py-2 border-dark rounded-full w-72 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                onClick={() => setFilter("with-description")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === "with-description" ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-primary"
                }`}
              >
                With description
              </button>
              <button 
                onClick={() => setFilter("without-description")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === "without-description" ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-primary"
                }`}
              >
                Without description
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Department List */}
      <div className="p-6">
        <div className="rounded-3xl border" style={{borderColor: 'var(--border-color, #e2e8f0)', backgroundColor: 'var(--card-bg, #ffffff)'}}>
          {filteredDepartments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                No departments found
              </h3>
              <p className=" mb-6" style={{color: 'var(--text-muted, #6b7280)'}}>
                Try changing your search/filter, or create a new department.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="min-w-full">
                <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-content border-b ">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="divide-y">
                  {filteredDepartments.map((dept, index) => (
                    <tr key={dept.id} className="hover:bg-content transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary">{dept.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted">
                          {dept.description || <span className="italic text-muted">No description</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditing(dept);
                              setEditName(dept.name);
                              setEditDesc(dept.description || "");
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteDepartment(dept.id)}
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
          <div className="w-96 p-6 rounded-xl shadow-xl" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
            <h2 className="text-lg font-semibold mb-4 text-primary">
              Create Department
            </h2>

            <input
              type="text"
              placeholder="Department name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-dark p-3 rounded-lg w-full mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            />

            <input
              type="text"
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="border-dark p-3 rounded-lg w-full mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setName("");
                  setDesc("");
                }}
                className="px-4 py-2 rounded-lg border-dark text-secondary hover:bg-content font-medium"
              >
                Cancel
              </button>

              <button
                onClick={addDepartment}
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
                  Edit Department
                </h2>

                <input
                  type="text"
                  className="border p-3 rounded-xl w-full mb-4" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />

                <input
                  type="text"
                  className="border p-3 rounded-xl w-full mb-4" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />

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
