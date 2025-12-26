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
            {/* Direct Reporting Manager */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Direct Reporting Manager</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Manager Name *</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Direct manager's full name"
                    value={form.reporting_manager_name}
                    onChange={(e) => setForm({ ...form, reporting_manager_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Manager Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="manager@company.com"
                    value={form.reporting_manager_email}
                    onChange={(e) => setForm({ ...form, reporting_manager_email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Manager Employee ID</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Manager's employee ID"
                    value={form.reporting_manager_id}
                    onChange={(e) => setForm({ ...form, reporting_manager_id: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Reporting Start Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.reporting_start_date}
                    onChange={(e) => setForm({ ...form, reporting_start_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Department Head */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Department Head</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Department Head Name</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Department head's full name"
                    value={form.department_head_name}
                    onChange={(e) => setForm({ ...form, department_head_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Department Head Employee ID</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Department head's employee ID"
                    value={form.department_head_id}
                    onChange={(e) => setForm({ ...form, department_head_id: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Secondary/Dotted Line Manager */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiTrendingUp className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Secondary Manager (Optional)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Secondary Manager Name</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Secondary/dotted line manager"
                    value={form.secondary_manager_name}
                    onChange={(e) => setForm({ ...form, secondary_manager_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Secondary Manager Employee ID</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Secondary manager's employee ID"
                    value={form.secondary_manager_id}
                    onChange={(e) => setForm({ ...form, secondary_manager_id: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Reporting Hierarchy Summary */}
            {form.reporting_manager_name && (
              <div className="bg-gray-100 border border-black rounded-lg p-6">
                <h4 className="font-semibold text-primary mb-4">Reporting Hierarchy</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 border border-black rounded-full flex items-center justify-center">
                      <FiUser className="text-black text-sm" />
                    </div>
                    <div>
                      <p className="font-medium text-primary">Direct Manager</p>
                      <p className="text-sm text-secondary">{form.reporting_manager_name}</p>
                    </div>
                  </div>
                  
                  {form.department_head_name && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 border border-black rounded-full flex items-center justify-center">
                        <FiUsers className="text-black text-sm" />
                      </div>
                      <div>
                        <p className="font-medium text-primary">Department Head</p>
                        <p className="text-sm text-secondary">{form.department_head_name}</p>
                      </div>
                    </div>
                  )}
                  
                  {form.secondary_manager_name && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 border border-black rounded-full flex items-center justify-center">
                        <FiTrendingUp className="text-black text-sm" />
                      </div>
                      <div>
                        <p className="font-medium text-primary">Secondary Manager</p>
                        <p className="text-sm text-secondary">{form.secondary_manager_name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-black">
            <button
              onClick={submit}
              disabled={loading}
              className="px-6 py-3 bg-white text-black border border-black rounded-2xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Reporting Structure' : 'Save Reporting Structure')}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
