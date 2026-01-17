import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Eye, Edit, Trash2, Users, Building, Calendar, UserCheck } from "lucide-react";
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const { toast, showToast, hideToast } = useToast();
  const [formData, setFormData] = useState({
    selectedDepartment: '',
    selectedRole: '',
    selectedUser: '',
    employeeCode: '',
    designation: '',
    joiningDate: ''
  });

  // Permission checks
  const canView = isAdmin() || hasPermission("view_employees") || hasPermission("view_self");
  const canCreate = isAdmin() || hasPermission("create_employee_code");
  const canViewProfile = isAdmin() || hasPermission("view_employee_profile");
  const canDelete = isAdmin() || hasPermission("delete_employee");

  if (!canView) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <div className="bg-white rounded-2xl border-0 p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to view the Employee Directory.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const fetchEmployees = async (status = statusFilter) => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      const [onboardingRes, usersRes, offersRes] = await Promise.all([
        api.get(`/recruitment/onboarding/list?status=${status}`).catch(() => ({ data: [] })),
        fetch(`${api.defaults.baseURL}/hospitals/users/${tenant}/list?status=${status}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : { users: [] }).catch(() => ({ users: [] })),
        api.get('/recruitment/offer/list').catch(() => ({ data: [] }))
      ]);
      
      const userEmployees = usersRes.users || [];
      
      // If user has view_employees permission or is admin, show all users with employee codes
      if (isAdmin() || hasPermission("view_employees")) {
        // Get users with employee codes from users table
        const userEmployeeData = userEmployees
          .filter(user => user.employee_code)
          .map(user => ({
            id: `user_${user.id}`,
            original_user_id: user.id,
            name: user.name,
            email: user.email,
            designation: user.designation || 'N/A',
            department: user.department_name || 'No Department',
            employee_code: user.employee_code,
            joining_date: user.joining_date,
            work_location: 'N/A',
            reporting_manager: 'N/A',
            status: user.status || 'Active',
            source: 'user_management'
          }));
        
        // Get onboarded employees with employee_id
        const onboardedEmployees = onboardingRes.data.filter(emp => 
          emp.employee_id && emp.employee_id.trim() !== ''
        );
        
        const onboardedData = onboardedEmployees.map(emp => ({
          id: emp.application_id,
          name: emp.candidate_name,
          email: emp.candidate_email || 'N/A',
          designation: emp.job_title,
          department: emp.department,
          employee_code: emp.employee_id,
          joining_date: emp.joining_date,
          work_location: emp.work_location,
          reporting_manager: emp.reporting_manager,
          status: 'Active',
          source: 'onboarding'
        }));
        
        // Combine both sources, avoiding duplicates by employee_code
        const allEmployees = [...userEmployeeData];
        onboardedData.forEach(onboardedEmp => {
          const existingIndex = allEmployees.findIndex(emp => emp.employee_code === onboardedEmp.employee_code);
          if (existingIndex === -1) {
            allEmployees.push(onboardedEmp);
          }
        });
        
        setEmployees(allEmployees);
        return;
      }
      
      // If user has only view_self permission, the backend already filtered to show only their record
      // Just show users with employee codes from the filtered result
      const selfEmployeeData = userEmployees
        .filter(user => user.employee_code)
        .map(user => ({
          id: `user_${user.id}`,
          original_user_id: user.id,
          name: user.name,
          email: user.email,
          designation: user.designation || 'N/A',
          department: user.department_name || 'No Department',
          employee_code: user.employee_code,
          joining_date: user.joining_date,
          work_location: 'N/A',
          reporting_manager: 'N/A',
          status: user.status || 'Active',
          source: 'user_management'
        }));
      
      setEmployees(selfEmployeeData);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${api.defaults.baseURL}/hospitals/departments/${tenant}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${api.defaults.baseURL}/hospitals/roles/${tenant}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${api.defaults.baseURL}/hospitals/users/${tenant}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const generateEmployeeCode = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EMP${year}${randomNum}`;
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesDept = !formData.selectedDepartment || user.department_id === parseInt(formData.selectedDepartment);
      const matchesRole = !formData.selectedRole || user.role_id === parseInt(formData.selectedRole);
      const noEmployeeCode = !user.employee_code;
      return matchesDept && matchesRole && noEmployeeCode;
    });
  };

  const handleCreateEmployee = async () => {
    if (!canCreate) {
      showToast('You do not have permission to create employee codes', 'error');
      return;
    }
    
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      const response = await fetch(`${api.defaults.baseURL}/employee/convert-user-to-employee/${formData.selectedUser}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_code: formData.employeeCode,
          employee_type: 'Permanent',
          designation: formData.designation,
          joining_date: formData.joiningDate,
          status: 'Active'
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        showToast('Employee code created successfully!');
        setShowCreateForm(false);
        setFormData({
          selectedDepartment: '',
          selectedRole: '',
          selectedUser: '',
          employeeCode: '',
          designation: '',
          joiningDate: ''
        });
        fetchEmployees();
      } else {
        const errorData = await response.json().catch(() => null);
        if (response.status === 400 && errorData?.detail === "Employee code already exists") {
          showToast('Employee code already exists. Please use a different code.', 'error');
        } else {
          showToast('Failed to create employee code', 'error');
        }
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      showToast('Failed to create employee code', 'error');
    }
  };

  const handleRemoveEmployeeCode = async (userId) => {
    if (!confirm('Are you sure you want to remove this employee code?')) return;
    
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      const response = await fetch(`${api.defaults.baseURL}/users/${tenant}/remove-employee-code/${userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        showToast('Employee code removed successfully!');
        fetchEmployees();
      } else {
        showToast('Failed to remove employee code', 'error');
      }
    } catch (error) {
      console.error('Error removing employee code:', error);
      showToast('Failed to remove employee code', 'error');
    }
  };

  const handleDeleteEmployee = async (employee) => {
    if (!canDelete) {
      showToast('You do not have permission to delete employees', 'error');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete employee ${employee.name}? This will mark them as inactive.`)) return;
    
    try {
      const token = localStorage.getItem("access_token");
      
      // Use the soft delete endpoint
      const response = await fetch(`${api.defaults.baseURL}/employee/delete/${employee.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        showToast('Employee deleted successfully!');
        fetchEmployees();
      } else {
        showToast('Failed to delete employee', 'error');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      showToast('Failed to delete employee', 'error');
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchRoles();
    fetchUsers();
  }, [statusFilter]);

  useEffect(() => {
    if (showCreateForm) {
      setFormData(prev => ({ ...prev, employeeCode: generateEmployeeCode() }));
    }
  }, [showCreateForm]);

  if (loading) return (
    <Layout>
      <div className="p-6">Loading...</div>
    </Layout>
  );

  return (
    <Layout>
      <div className="overflow-x-hidden">
      {/* Hero Section */}
      <div className="mb-3 p-4 sm:p-6">
        <div className="rounded-2xl shadow-sm p-4 sm:p-6 relative overflow-hidden border" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
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
                <Users className="h-5 w-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">Employee Directory & Profiles</h1>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Comprehensive employee information management and profile system</p>
                <p className="text-gray-500 text-xs hidden sm:block">Employee Information System</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border" style={{
                borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
                  <Users className="h-3 w-3" />
                  <span className="text-xs font-medium">Employees</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{employees.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Search and Actions */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-3 relative overflow-hidden" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="inline-flex items-center bg-gray-50 rounded-full px-3 py-1 text-sm text-gray-600 border-0">
              Total: {employees.length}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border-0 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                  focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="resigned">Resigned</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2 bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                  focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {canCreate && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors border-0"
                  style={{
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                  }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                  }}
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Create Employee Code</span>
                  <span className="sm:hidden">Create</span>
                </button>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Employee Cards */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden relative" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="relative z-10">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }} onLoad={(e) => {
            e.target.style.setProperty('scrollbar-width', 'none');
            e.target.style.setProperty('-ms-overflow-style', 'none');
          }}>
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b-0">
                <tr>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Employee Code
                  </th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Joining Date
                  </th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">
                          {employee.employee_code}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-xs text-gray-500">{employee.email}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {employee.designation}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{employee.department}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <UserCheck className="w-3 h-3 mr-1" />
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {canViewProfile && (
                          <Link
                            to={`/eis/${employee.id}`}
                            className="group relative p-1.5 sm:p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                            title="View Profile"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteEmployee(employee)}
                            className="group relative p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4">
            <div className="space-y-4">
              {employees.map((employee) => (
                <div key={employee.id} className="bg-white rounded-xl p-4 shadow-sm relative overflow-hidden" style={{
                  background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
                  border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
                    transform: 'translate(30%, -30%)'
                  }}></div>
                  <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-500">{employee.employee_code}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <UserCheck className="w-3 h-3 mr-1" />
                      {employee.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Email:</span>
                      <span className="text-sm text-gray-900">{employee.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Designation:</span>
                      <span className="text-sm text-gray-900">{employee.designation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Department:</span>
                      <span className="text-sm text-gray-900">{employee.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Joining Date:</span>
                      <span className="text-sm text-gray-900">
                        {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                    {canViewProfile && (
                      <Link
                        to={`/eis/${employee.id}`}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteEmployee(employee)}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {employees.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-500">Get started by creating your first employee profile.</p>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Create Employee Code Modal */}
      {showCreateForm && canCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border-0 shadow-sm p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-3">
                <Plus className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Create Employee Code</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={formData.selectedDepartment}
                  onChange={(e) => setFormData(prev => ({ ...prev, selectedDepartment: e.target.value, selectedRole: '', selectedUser: '' }))}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
                  }}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.selectedRole}
                  onChange={(e) => setFormData(prev => ({ ...prev, selectedRole: e.target.value, selectedUser: '' }))}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
                  }}
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                <select
                  value={formData.selectedUser}
                  onChange={(e) => setFormData(prev => ({ ...prev, selectedUser: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
                  }}
                >
                  <option value="">Select User</option>
                  {getFilteredUsers().map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeCode: e.target.value }))}
                    className="flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
                    }}
                    placeholder="Enter manually or click Generate"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, employeeCode: generateEmployeeCode() }))}
                    className="px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors border border-black"
                  >
                    Generate
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
                  }}
                  placeholder="Enter designation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateEmployee}
                disabled={!formData.selectedUser || !formData.employeeCode}
                className="flex-1 px-4 py-3 text-white rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium border border-black text-sm"
                style={{
                  backgroundColor: !formData.selectedUser || !formData.employeeCode ? '' : 'var(--primary-color, #4575b5)'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-color, #4575b5)';
                  }
                }}
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium border border-black text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Toast toast={toast} hideToast={hideToast} />
      </div>
    </Layout>
  );
}




<style jsx>{`
  * {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  *::-webkit-scrollbar {
    display: none;
  }
  .overflow-x-auto::-webkit-scrollbar {
    display: none;
  }
`}</style>
