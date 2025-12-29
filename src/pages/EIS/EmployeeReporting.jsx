import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiTrendingUp, FiArrowLeft, FiUsers, FiUser } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";

export default function EmployeeReporting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({
    reporting_manager_id: "",
    reporting_start_date: "",
    employee_level_id: "",
    alternative_manager_id: "",
  });
  const [reportingData, setReportingData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [levels, setLevels] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      const response = await fetch(`http://localhost:8000/hospitals/users/${tenant}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        
        // Fetch onboarded employees to get employee codes
        try {
          const onboardingResponse = await api.get('/recruitment/onboarding/list');
          const onboardedEmployees = onboardingResponse.data || [];
          console.log('Onboarded employees:', onboardedEmployees);
          console.log('Users:', users.map(u => ({id: u.id, name: u.name})));
          
          // Merge user data with onboarded employee codes
          const usersWithCodes = users.map(user => {
            const onboardedEmployee = onboardedEmployees.find(emp => emp.application_id === user.id);
            console.log(`User ${user.id} (${user.name}):`, onboardedEmployee?.employee_id || 'No match');
            return {
              ...user,
              employee_code: onboardedEmployee?.employee_id || user.employee_code || ''
            };
          });
          
          setEmployees(usersWithCodes);
        } catch (onboardingErr) {
          console.error("Failed to fetch onboarding data", onboardingErr);
          setEmployees(users);
        }
      }
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  const fetchLevels = async () => {
    try {
      const res = await api.get('/organizational-levels');
      setLevels(res.data || []);
    } catch (err) {
      console.error("Failed to fetch organizational levels", err);
      // Fallback data
      setLevels([
        { id: 1, order: 1, level_name: "CEO" },
        { id: 2, order: 2, level_name: "Manager" },
        { id: 3, order: 3, level_name: "Team Lead" },
        { id: 4, order: 4, level_name: "Employee" }
      ]);
    }
  };

  const fetchReportingDetails = async () => {
    try {
      const res = await api.get(`/employee/reporting/${id}`);
      setReportingData(res.data);
      setForm({
        reporting_manager_id: res.data.reporting_manager_id || "",
        reporting_start_date: res.data.reporting_start_date || "",
        employee_level_id: res.data.employee_level_id || "",
        alternative_manager_id: res.data.alternative_manager_id || "",
      });
      setIsEditing(!!res.data.id);
    } catch {
      console.log("No existing reporting data found, starting fresh");
      setIsEditing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchLevels();
    fetchReportingDetails();
  }, [id]);

  const handleLevelChange = (levelId) => {
    setForm({ ...form, employee_level_id: levelId, reporting_manager_id: "" });
  };

  const selectedLevelInfo = levels.find(level => level.id.toString() === form.employee_level_id);
  const reportsToLevel = selectedLevelInfo ? levels.find(level => level.order === selectedLevelInfo.order - 1) : null;
  const availableManagers = employees.filter(emp => 
    emp.id !== parseInt(id) && 
    (reportsToLevel ? emp.level_id === reportsToLevel.id : true)
  );

  const submit = () => {
    console.log('Submit called');
    setLoading(true);
    try {
      const payload = {
        employee_id: id,
        reporting_manager_id: form.reporting_manager_id,
        reporting_start_date: form.reporting_start_date,
        employee_level_id: form.employee_level_id,
        alternative_manager_id: form.alternative_manager_id,
      };

      const storageKey = `employee_reporting_${id}`;
      localStorage.setItem(storageKey, JSON.stringify(payload));
      
      console.log('About to show toast');
      showToast("Reporting structure saved successfully", "success");
      console.log('Toast called, toast state:', toast);
    } catch (err) {
      console.error("Failed to save reporting details", err);
      showToast("Failed to save reporting structure", "error");
    }
    setLoading(false);
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-6 p-6 bg-white border border-black shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 border border-black rounded-2xl flex items-center justify-center">
              <FiUsers className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Reporting Hierarchy
              </h1>
              <p className="text-gray-600 mb-2">
                Manager hierarchy and reporting relationships
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Organizational Structure</span>
                </div>
                <span className="text-sm text-gray-600">Chain of Command</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-start mb-4">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-black hover:bg-gray-100 border border-black rounded-lg transition-colors text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>

        <div className="rounded-xl shadow-sm border border-black p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>

          <div className="space-y-6">
            {/* Employee Level Selection */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Organizational Level Assignment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Select Organizational Level *</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.employee_level_id}
                    onChange={(e) => handleLevelChange(e.target.value)}
                  >
                    <option value="">Choose Employee Level</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        Level {level.order}: {level.level_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Reporting structure will be automatically assigned based on organizational hierarchy</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Assignment Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.reporting_start_date}
                    onChange={(e) => setForm({ ...form, reporting_start_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Manager Selection */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 border border-black rounded-xl flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Select Reporting Manager</h3>
              </div>
              {form.employee_level_id && reportsToLevel && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Based on hierarchy:</strong> {selectedLevelInfo?.level_name} reports to {reportsToLevel?.level_name}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Assigned to *</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.reporting_manager_id}
                    onChange={(e) => setForm({ ...form, reporting_manager_id: e.target.value })}
                  >
                    <option value="">Select Manager</option>
                    {employees.filter(emp => emp.id !== parseInt(id)).map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} {emp.employee_code ? `(${emp.employee_code})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose any employee as manager</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Alternative Manager (Optional)</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.alternative_manager_id}
                    onChange={(e) => setForm({ ...form, alternative_manager_id: e.target.value })}
                  >
                    <option value="">Select Alternative Manager</option>
                    {employees.filter(emp => emp.id !== parseInt(id) && emp.id.toString() !== form.reporting_manager_id).map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} {emp.employee_code ? `(${emp.employee_code})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Backup manager when primary is assigned</p>
                </div>
              </div>
            </div>

            {/* Simple Reporting Summary */}
            {form.reporting_manager_id && (
              <div className="bg-gray-100 border border-black rounded-lg p-6">
                <h4 className="font-semibold text-primary mb-4">Reporting Structure</h4>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 border border-black rounded-full flex items-center justify-center">
                    <FiUsers className="text-blue-600 text-sm" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">Reports To</p>
                    <p className="text-sm text-secondary">
                      {employees.find(emp => emp.id.toString() === form.reporting_manager_id)?.name || 'Not selected'}
                      {employees.find(emp => emp.id.toString() === form.reporting_manager_id)?.employee_code && 
                        ` (${employees.find(emp => emp.id.toString() === form.reporting_manager_id)?.employee_code})`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-black">
            <button
              onClick={submit}
              disabled={loading}
              className="px-6 py-3 bg-black text-white border border-black rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Reporting Structure' : 'Save Reporting Structure')}
            </button>
          </div>
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}
