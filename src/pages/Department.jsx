import React, { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import Toast from "../components/Toast";
import useToast from "../utils/useToast";
import { hasPermission, isAdmin } from "../utils/permissions";

export default function Departments() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const { toast, showToast, hideToast } = useToast();

  const tenant_db = localStorage.getItem("tenant_db");
  const canView = isAdmin() || hasPermission("view_user_departments");
  const canAdd = isAdmin() || hasPermission("add_user_department");
  const canEdit = isAdmin() || hasPermission("edit_user_department");
  const canDelete = isAdmin() || hasPermission("delete_user_department");

  if (!canView) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <div className="bg-white rounded-2xl border-0 p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to view Departments.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const fetchDepartments = async (status = statusFilter) => {
    try {
      console.log(`Fetching departments for tenant: ${tenant_db}`);
      const res = await api.get(`/hospitals/departments/${tenant_db}/list?status=${status}`);
      console.log('Departments loaded:', res.data.departments);
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error("List error:", err);
    }
  };

  const fetchUsers = async (status = statusFilter) => {
    try {
      const res = await api.get(`/hospitals/users/${tenant_db}/list?status=${status}`);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Users fetch error:", err);
    }
  };

  const getDepartmentHeadcount = (deptName) => {
    console.log('Calculating headcount for department:', deptName);
    console.log('Available users:', users);
    const count = users.filter(user => {
      console.log(`User ${user.name}: department_name='${user.department_name}', department='${user.department}'`);
      return user.department_name === deptName || user.department === deptName;
    }).length;
    console.log(`Headcount for ${deptName}:`, count);
    return count;
  };

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, [statusFilter]);

  const addDepartment = async () => {
    
    if (!canAdd) return showToast("You do not have permission to add departments", 'error');

    if (!name.trim()) {
      showToast("Department name required", 'error');
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
      showToast("Department created!");
    } catch (err) {
      showToast("Create failed", 'error');
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
      return showToast("You do not have permission to delete departments", 'error');

    if (!window.confirm("Delete this department?")) return;

    try {
      console.log(`Deleting department with ID: ${id}`);
      await api.delete(`/hospitals/departments/${tenant_db}/delete/${id}`);
      console.log('Department deleted successfully');
      fetchDepartments();
    } catch (err) {
      console.error('Delete department failed:', err);
      showToast("Delete failed", 'error');
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Hero Header matching Dashboard */}
        <div className="rounded-2xl shadow-sm p-4 sm:p-6 relative overflow-hidden border" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71',
            transform: 'translate(-40%, 40%)'
          }}></div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="h-5 w-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Department Management</h1>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Define organizational departments and structure for staff assignment</p>
                <p className="text-gray-500 text-xs hidden sm:block">Organizational Structure & Workforce Planning</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border" style={{
                borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  <span className="text-xs font-medium">Departments</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{departments.length}</p>
              </div>
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border" style={{
                borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <span className="text-xs font-medium">Total Staff</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators matching Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 border" style={{
            background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
            border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
          }}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Total Departments</p>
                <p className="text-xl font-bold text-gray-900">{departments.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-semibold text-gray-400">Organizational units</span>
                </div>
              </div>
              <div className="p-2 rounded" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="h-4 w-4" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 border" style={{
            background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
            border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
          }}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Total Staff</p>
                <p className="text-xl font-bold text-gray-900">{users.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-semibold text-gray-400">Active employees</span>
                </div>
              </div>
              <div className="p-2 rounded" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="h-4 w-4" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 border" style={{
            background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
            border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
          }}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Filtered Results</p>
                <p className="text-xl font-bold text-gray-900">{filteredDepartments.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-semibold text-gray-400">Currently showing</span>
                </div>
              </div>
              <div className="p-2 rounded" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="h-4 w-4" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 border" style={{
            background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
            border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
          }}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Avg Headcount</p>
                <p className="text-xl font-bold text-gray-900">{departments.length > 0 ? Math.round(users.length / departments.length) : 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-semibold text-gray-400">Per department</span>
                </div>
              </div>
              <div className="p-2 rounded" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="h-4 w-4" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Department Analytics Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden relative border" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(-40%, 40%)'
          }}></div>
          <div className="p-6 border-b-0 relative z-10" style={{
            background: `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}05)`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <svg className="h-6 w-6" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Department-wise Headcount Analysis</h2>
                  <p className="text-gray-600">Staff distribution across organizational departments</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`,
                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}>
                <div className="w-2 h-2 rounded-full" style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}></div>
                <span className="font-semibold text-sm">Live Data</span>
              </div>
            </div>
          </div>

          <div className="p-6">

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {departments.map((dept, index) => {
                const headcount = getDepartmentHeadcount(dept.name);
                return (
                  <div key={dept.id} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 group relative overflow-hidden border" style={{
                    background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
                  }}>
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20" style={{
                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
                      transform: 'translate(30%, -30%)'
                    }}></div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg transition-all duration-300" style={{
                          backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}15`
                        }}>
                          <span className="text-sm font-bold" style={{
                            color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }}>
                            {dept.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">{dept.name}</h3>
                          <p className="text-xs text-gray-600 mt-1">{dept.description || 'No description provided'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="text-xs font-medium text-gray-700">{dept.is_active === 1 || dept.is_active === true ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div className="text-lg font-bold" style={{
                          color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }}>{headcount}</div>
                        <div className="text-xs text-gray-500">Employees</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" style={{
                            color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                          <span className="text-sm text-gray-700">Staff Allocation</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {departments.length > 0 ? ((headcount / users.length) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Department Management Section */}
        <div className="bg-white rounded-xl shadow-sm relative overflow-hidden border" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(-40%, 40%)'
          }}></div>
          <div className="p-5 border-b-0 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <svg className="h-5 w-5" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Department Directory</h3>
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
                    className="px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`,
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
                  <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}` }}>
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
                          e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filter !== "all") {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6b7280';
                        }
                      }}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFilter("with-description")}
                      className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        filter === "with-description" 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      style={{
                        backgroundColor: filter === "with-description" ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : 'transparent',
                        color: filter === "with-description" ? 'white' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        if (filter !== "with-description") {
                          e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filter !== "with-description") {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6b7280';
                        }
                      }}
                    >
                      With description
                    </button>
                    <button 
                      onClick={() => setFilter("without-description")}
                      className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        filter === "without-description" 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      style={{
                        backgroundColor: filter === "without-description" ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : 'transparent',
                        color: filter === "without-description" ? 'white' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        if (filter !== "without-description") {
                          e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filter !== "without-description") {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6b7280';
                        }
                      }}
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
                    className="pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`,
                      focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                  />
                </div>
                {canAdd && (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center justify-center gap-2 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap hover:opacity-100"
                    style={{
                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                    }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                    }}
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
        </div>

        {/* Department List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden relative border" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(-40%, 40%)'
          }}></div>
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
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredDepartments.map((dept, index) => (
                  <div key={dept.id} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 group relative overflow-hidden border" style={{
                    background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
                  }}>
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20" style={{
                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
                      transform: 'translate(30%, -30%)'
                    }}></div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                          backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}15`
                        }}>
                          <span className="font-bold text-sm" style={{
                            color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }}>
                            {dept.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{dept.name}</h3>
                          <p className="text-xs text-gray-500">Department</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-100 transition-opacity flex-shrink-0">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditing(dept);
                              setEditName(dept.name);
                              setEditDesc(dept.description || "");
                            }}
                            className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
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
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-sm text-gray-700">
                          {dept.description ? (
                            <span>{dept.description}</span>
                          ) : (
                            <span className="text-gray-400 italic">No description provided</span>
                          )}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 border-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-600">Staff Count</span>
                          <span className="text-sm font-bold text-gray-900">{getDepartmentHeadcount(dept.name)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Status</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${dept.is_active === 1 || dept.is_active === true ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className="text-xs font-medium text-gray-700">{dept.is_active === 1 || dept.is_active === true ? 'Active' : 'Inactive'}</span>
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

      {/* Create Modal */}
      {showCreateModal && canAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}` }}>
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
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`,
                      focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea
                    placeholder="Enter department description"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm resize-none"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`,
                      focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
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
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm border-0"
                >
                  Cancel
                </button>
                <button
                  onClick={addDepartment}
                  disabled={loading || !name.trim()}
                  className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed border-0"
                  style={{
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                      e.currentTarget.style.backgroundColor = hoverColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                    }
                  }}
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && canEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" style={{ border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}` }}>
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
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`,
                      focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm resize-none"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`,
                      focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm border-0"
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
                      showToast("Updated successfully!");
                      setEditing(null);
                      fetchDepartments();
                    } catch (err) {
                      console.error('Update department failed:', err);
                      showToast("Update failed", 'error');
                    }
                  }}
                  className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors text-sm border-0"
                  style={{
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}
                  onMouseEnter={(e) => {
                    const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                    e.currentTarget.style.backgroundColor = hoverColor;
                  }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                  }}
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
