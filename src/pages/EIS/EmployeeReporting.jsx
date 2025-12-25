import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiTrendingUp, FiArrowLeft, FiUsers, FiUser } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function EmployeeReporting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    reporting_manager_id: "",
    reporting_manager_name: "",
    reporting_manager_email: "",
    department_head_id: "",
    department_head_name: "",
    secondary_manager_id: "",
    secondary_manager_name: "",
    reporting_start_date: "",
  });
  const [reportingData, setReportingData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchReportingDetails = async () => {
    try {
      const res = await api.get(`/employee/reporting/${id}`);
      setReportingData(res.data);
      setForm({
        reporting_manager_id: res.data.reporting_manager_id || "",
        reporting_manager_name: res.data.reporting_manager_name || "",
        reporting_manager_email: res.data.reporting_manager_email || "",
        department_head_id: res.data.department_head_id || "",
        department_head_name: res.data.department_head_name || "",
        secondary_manager_id: res.data.secondary_manager_id || "",
        secondary_manager_name: res.data.secondary_manager_name || "",
        reporting_start_date: res.data.reporting_start_date || "",
      });
      setIsEditing(!!res.data.id);
    } catch {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    fetchReportingDetails();
  }, [id]);

  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        employee_id: id,
        ...form,
      };

      if (isEditing && reportingData?.id) {
        await api.put(`/employee/reporting/${reportingData.id}`, payload);
      } else {
        await api.post("/employee/reporting/add", payload);
      }
      
      alert("Reporting structure saved successfully");
      fetchReportingDetails();
    } catch (err) {
      console.error("Failed to save reporting details", err);
      alert("Failed to save reporting structure");
    }
    setLoading(false);
  };

  return (
    <Layout 
      title="Reporting Structure" 
      subtitle="Manager hierarchy and reporting relationships"
    >
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => navigate(`/eis/${id}`)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-sm" />
              Back to Profile
            </button>
          </div>

          <div className="space-y-8">
            {/* Direct Reporting Manager */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiUser className="text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Direct Reporting Manager</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager Name *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Direct manager's full name"
                    value={form.reporting_manager_name}
                    onChange={(e) => setForm({ ...form, reporting_manager_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="manager@company.com"
                    value={form.reporting_manager_email}
                    onChange={(e) => setForm({ ...form, reporting_manager_email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager Employee ID</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Manager's employee ID"
                    value={form.reporting_manager_id}
                    onChange={(e) => setForm({ ...form, reporting_manager_id: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Start Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.reporting_start_date}
                    onChange={(e) => setForm({ ...form, reporting_start_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Department Head */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiUsers className="text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">Department Head</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Head Name</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Department head's full name"
                    value={form.department_head_name}
                    onChange={(e) => setForm({ ...form, department_head_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Head Employee ID</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Department head's employee ID"
                    value={form.department_head_id}
                    onChange={(e) => setForm({ ...form, department_head_id: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Secondary/Dotted Line Manager */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiTrendingUp className="text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900">Secondary Manager (Optional)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Manager Name</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Secondary/dotted line manager"
                    value={form.secondary_manager_name}
                    onChange={(e) => setForm({ ...form, secondary_manager_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Manager Employee ID</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Secondary manager's employee ID"
                    value={form.secondary_manager_id}
                    onChange={(e) => setForm({ ...form, secondary_manager_id: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Reporting Hierarchy Summary */}
            {form.reporting_manager_name && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Reporting Hierarchy</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiUser className="text-blue-600 text-sm" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Direct Manager</p>
                      <p className="text-sm text-gray-600">{form.reporting_manager_name}</p>
                    </div>
                  </div>
                  
                  {form.department_head_name && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <FiUsers className="text-green-600 text-sm" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Department Head</p>
                        <p className="text-sm text-gray-600">{form.department_head_name}</p>
                      </div>
                    </div>
                  )}
                  
                  {form.secondary_manager_name && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <FiTrendingUp className="text-purple-600 text-sm" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Secondary Manager</p>
                        <p className="text-sm text-gray-600">{form.secondary_manager_name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t">
            <button
              onClick={submit}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Reporting Structure' : 'Save Reporting Structure')}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}