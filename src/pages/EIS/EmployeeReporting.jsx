import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, Building2, Calendar, UserCheck, ArrowLeft, Workflow, AlertCircle, History } from "lucide-react";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function EmployeeReporting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    reporting_to_id: "",
    alternate_supervisor_id: "",
    level_id: "",
    department_id: "",
    effective_from: new Date().toISOString().split('T')[0]
  });
  const [currentReporting, setCurrentReporting] = useState(null);
  const [levels, setLevels] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [validManagers, setValidManagers] = useState([]);

  const fetchData = async () => {
    try {
      // Fetch current reporting
      const reportingRes = await api.get(`/reporting/employees/${id}`).catch(() => ({ data: {} }));
      setCurrentReporting(reportingRes.data);
      
      // Fetch levels
      const levelsRes = await api.get("/reporting/levels");
      const levelsData = levelsRes.data?.data || levelsRes.data || [];
      setLevels(levelsData);
      
      // Get tenant database name
      const tenant_db = localStorage.getItem("tenant_db");
      
      // Fetch employees from user management
      const employeesRes = await api.get(`/hospitals/users/${tenant_db}/list`);
      const employeesData = (employeesRes.data?.users || employeesRes.data || []).filter(emp => emp.id != id);
      setEmployees(employeesData);
      
      // Fetch departments
      const deptsRes = await api.get(`/hospitals/departments/${tenant_db}/list`);
      const deptsData = deptsRes.data?.departments || [];
      setDepartments(deptsData);
      

      
      if (reportingRes.data.id) {
        // Handle missing or unavailable supervisor
        if (reportingRes.data.reporting_to_id) {
          const supervisor = employeesData.find(emp => emp.id == reportingRes.data.reporting_to_id);
          if (supervisor) {
            reportingRes.data.reporting_to_name = supervisor.name;
            reportingRes.data.supervisor_status = 'active';
          } else {
            // Supervisor not found (left, promoted, etc.)
            reportingRes.data.reporting_to_name = 'Manager Unavailable';
            reportingRes.data.supervisor_status = 'unavailable';
          }
          setCurrentReporting(reportingRes.data);
        }
        
        setForm({
          reporting_to_id: reportingRes.data.reporting_to_id || "",
          alternate_supervisor_id: reportingRes.data.alternate_supervisor_id || "",
          level_id: reportingRes.data.level_id || "",
          department_id: reportingRes.data.department_id || "",
          effective_from: reportingRes.data.effective_from || new Date().toISOString().split('T')[0]
        });
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const submit = async () => {
    try {
      // Assign/update employee reporting using the correct endpoint
      await api.post(`/reporting/employees/${id}`, form);
      alert("Reporting structure assigned successfully");
      fetchData();
    } catch (err) {
      console.error("Failed to save reporting", err);
      alert(err.response?.data?.message || "Failed to save reporting structure");
    }
  };

  // Fetch valid managers based on hierarchy rules
  const fetchValidManagers = async () => {
    if (form.level_id) {
      try {
        // Get hierarchy rules to find parent level
        const hierarchyRes = await api.get('/reporting/hierarchy');
        const hierarchyRules = hierarchyRes.data?.data || hierarchyRes.data || [];
        
        // Find parent level for selected level
        const parentRule = hierarchyRules.find(rule => rule.child_level_id == form.level_id);
        
        if (parentRule?.parent_level_id) {
          // Get parent level name
          const parentLevel = levels.find(level => level.id == parentRule.parent_level_id);
          const parentLevelName = parentLevel?.level_name?.toLowerCase() || '';
          
          console.log('Selected level needs parent:', parentLevelName);
          
          // Fetch all users from user management system
          const tenant_db = localStorage.getItem("tenant_db");
          const usersRes = await api.get(`/hospitals/users/${tenant_db}/list`);
          const allUsers = usersRes.data?.users || usersRes.data || [];
          
          // Filter users whose role matches the parent level name
          const validSupervisors = allUsers.filter(user => {
            if (user.id == id) return false;
            
            const userRole = (user.role || '').toLowerCase();
            console.log('User:', user.name, 'Role:', userRole, 'Required:', parentLevelName);
            
            // Match user role with required parent level
            return userRole.includes(parentLevelName) || 
                   (parentLevelName === 'manager' && userRole.includes('manager')) ||
                   (parentLevelName === 'ceo' && userRole.includes('ceo'));
          });
          
          console.log('Valid supervisors for hierarchy:', validSupervisors);
          
          setValidManagers(validSupervisors.map(user => ({
            id: user.id,
            name: user.name,
            designation: user.role,
            department: user.department
          })));
        } else {
          // No parent level (top level), show empty
          console.log('Selected level is top level, no supervisors needed');
          setValidManagers([]);
        }
      } catch (error) {
        console.error('Failed to fetch managers:', error);
        setValidManagers([]);
      }
    } else {
      setValidManagers([]);
    }
  };

  useEffect(() => {
    fetchValidManagers();
  }, [form.level_id, levels]);

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate(`/eis/${id}`)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={16} /> Back to Profile
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Employee Reporting Structure</h1>
                  <p className="text-gray-600">Assign organizational hierarchy and reporting relationships</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                <Workflow className="text-blue-600" size={20} />
                <span className="text-blue-800 font-medium">Workflow Integration</span>
              </div>
            </div>

            {/* Current Reporting Display */}
            {currentReporting?.id ? (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <UserCheck className="text-blue-600" size={24} />
                  <h3 className="text-lg font-semibold text-blue-800">Current Reporting Structure</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={16} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Level</span>
                    </div>
                    <p className="font-semibold text-gray-800">{currentReporting.level_name}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={16} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Reports To</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${
                        currentReporting.supervisor_status === 'unavailable' 
                          ? 'text-red-600' 
                          : 'text-gray-800'
                      }`}>
                        {currentReporting.reporting_to_name || 'Not Assigned'}
                      </p>
                      {currentReporting.supervisor_status === 'unavailable' && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                          ⚠️ Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={16} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Department</span>
                    </div>
                    <p className="font-semibold text-gray-800">{currentReporting.department_name || 'Not Specified'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={16} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Effective From</span>
                    </div>
                    <p className="font-semibold text-gray-800">{currentReporting.effective_from}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-yellow-600" size={24} />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">No Reporting Structure Assigned</h3>
                    <p className="text-yellow-700">This employee has not been assigned to any reporting structure yet.</p>
                  </div>
                </div>
              </div>
            )}



            <div className="space-y-8">
              {/* Reporting Assignment */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <UserCheck className="text-green-600" size={24} />
                  <h3 className="text-lg font-semibold text-gray-800">Assign Reporting Structure</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee Level</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.level_id}
                      onChange={(e) => setForm({ ...form, level_id: e.target.value })}
                    >
                      <option value="">Select Level</option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.level_name} (Order: {level.level_order})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reports To</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.reporting_to_id}
                      onChange={(e) => setForm({ ...form, reporting_to_id: e.target.value })}
                      disabled={!form.level_id}
                    >
                      <option value="">Select Supervisor ({validManagers.length} available)</option>
                      {validManagers.map((manager, index) => (
                        <option key={`manager-${manager.id}-${index}`} value={manager.id}>
                          {manager.name} - {manager.designation} ({manager.department || 'Any Dept'})
                        </option>
                      ))}
                    </select>
                    {!form.level_id && (
                      <p className="text-sm text-gray-500 mt-1">Select a level first to see available supervisors</p>
                    )}
                    {form.level_id && validManagers.length === 0 && (
                      <p className="text-sm text-red-500 mt-1">No supervisors found. Check console for debugging info.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Supervisor (Optional)</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.alternate_supervisor_id}
                      onChange={(e) => setForm({ ...form, alternate_supervisor_id: e.target.value })}
                      disabled={!form.level_id}
                      key={`alt-supervisor-${form.reporting_to_id}`}
                    >
                      <option value="">Select Backup Supervisor (Optional)</option>
                      {validManagers.filter(manager => manager.id != form.reporting_to_id).map((manager, index) => (
                        <option key={`alt-manager-${manager.id}-${index}`} value={manager.id}>
                          {manager.name} - {manager.designation} ({manager.department || 'Any Dept'})
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">Backup supervisor when primary is unavailable</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.department_id}
                      onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Effective From</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.effective_from}
                      onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={submit}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <UserCheck size={16} /> {currentReporting?.id ? 'Update' : 'Assign'} Reporting Structure
                  </button>
                  <button
                    onClick={() => navigate(`/eis/${id}`)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>



              {/* Reporting Chain */}
              {(form.reporting_to_id || form.level_id) && (
                <div>
                  <h3 className="text-md font-medium mb-3 text-gray-700">Reporting Chain</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm space-y-2">
                      <div className="font-medium">
                        Employee → {form.reporting_to_id ? employees.find(e => e.id == form.reporting_to_id)?.name : "(Optional)"}
                      </div>
                      <div className="text-gray-600">
                        This employee will report to {form.reporting_to_id ? employees.find(e => e.id == form.reporting_to_id)?.name : "no direct supervisor"}
                      </div>
                      {form.alternate_supervisor_id && (
                        <div className="text-blue-600 text-sm">
                          <span className="font-medium">Alternate:</span> {employees.find(e => e.id == form.alternate_supervisor_id)?.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}