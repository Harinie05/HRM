import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiUserX, FiArrowLeft, FiCalendar, FiFileText, FiUpload } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";
import Toast from "../../components/Toast";
import useToast from "../../utils/useToast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function EmployeeExit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    resignation_date: "",
    last_working_day: "",
    notice_period: "30",
    reason: "",
    exit_interview_date: "",
    handover_status: "Pending",
  });
  const [exitData, setExitData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [saved, setSaved] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const canView = true;
  const canAdd = true;
  const canEdit = true;

  const fetchExitDetails = async () => {
    setIsEditing(false);
  };

  useEffect(() => {
    fetchExitDetails();
  }, [id]);

  const submit = async () => {
    setLoading(true);
    try {
      const jsonData = {
        employee_id: id,
        resignation_date: form.resignation_date,
        last_working_day: form.last_working_day,
        notice_period: form.notice_period,
        reason: form.reason,
        exit_interview_date: form.exit_interview_date,
        handover_status: form.handover_status
      };

      console.log('Sending JSON data:', jsonData);
      
      await api.post("/employee/exit/add-json", jsonData);
      
      setSaved(true);
      showToast("Exit details saved successfully", 'success');
      
      // Reset saved state after 3 seconds
      setTimeout(() => setSaved(false), 3000);
      fetchExitDetails();
    } catch (err) {
      console.error("Failed to save exit details", err);
      showToast("Failed to save exit details", 'error');
    }
    setLoading(false);
  };

  return (
    <Layout>
      {/* Hero Header matching EmployeeEducation */}
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-gray-200 shadow-sm p-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiUserX className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Exit Management</h1>
                <p className="text-gray-600 text-sm mb-1">Employee separation and exit formalities</p>
                <p className="text-gray-500 text-xs">Exit Process • Clearance Tracking</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-start mb-4">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm border"
            style={{
              backgroundColor: 'var(--primary-color, #4575b5)',
              color: 'white',
              borderColor: 'var(--primary-color, #4575b5)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
              e.target.style.borderColor = 'var(--secondary-color, #6b7280)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
              e.target.style.borderColor = 'var(--primary-color, #4575b5)';
            }}
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">

          <div className="space-y-6">
            {/* Resignation Details */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center">
                  <FiCalendar className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Resignation Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Resignation Date *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.resignation_date}
                    onChange={(e) => setForm({ ...form, resignation_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Last Working Date *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.last_working_day}
                    onChange={(e) => setForm({ ...form, last_working_day: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Notice Period (Days)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.notice_period}
                    onChange={(e) => setForm({ ...form, notice_period: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-secondary mb-2">Reason for Leaving</label>
                <textarea
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                  rows="3"
                  placeholder="Reason for resignation..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-secondary mb-2">Exit Interview Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                  value={form.exit_interview_date}
                  onChange={(e) => setForm({ ...form, exit_interview_date: e.target.value })}
                />
              </div>
            </div>

            {/* Handover Status */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center">
                  <FiFileText className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Handover & Status</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Handover Status</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.handover_status}
                    onChange={(e) => setForm({ ...form, handover_status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Exit Documents</label>
                  <div className="flex items-center gap-2">
                    <FiUpload className="" style={{color: 'var(--text-muted, #6b7280)'}} />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Exit Status Summary */}
            {form.resignation_date && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Exit Process Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Resignation Date:</span>
                    <span className="ml-2 font-medium">{form.resignation_date}</span>
                  </div>
                  <div>
                    <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Last Working Date:</span>
                    <span className="ml-2 font-medium">{form.last_working_day}</span>
                  </div>
                  <div>
                    <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Reason:</span>
                    <span className="ml-2 font-medium">{form.reason || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Handover Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium border border-gray-200 ${
                      form.handover_status === 'Completed' ? 'bg-gray-100 text-black' :
                      form.handover_status === 'In Progress' ? 'bg-gray-100 text-black' :
                      'bg-gray-100 text-black'
                    }`}>
                      {form.handover_status}
                    </span>
                  </div>
                  <div>
                    <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Exit Interview Date:</span>
                    <span className="ml-2 font-medium">{form.exit_interview_date || 'Not scheduled'}</span>
                  </div>
                  <div>
                    <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Notice Period:</span>
                    <span className="ml-2 font-medium">{form.notice_period} days</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
            {(canAdd || canEdit) && (
              <button
                onClick={submit}
                disabled={loading}
                className={`px-6 py-3 text-white rounded-2xl font-medium transition-colors ${
                  saved 
                    ? 'bg-green-100 text-green-800 border-green-500' 
                    : ''
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                  backgroundColor: saved ? '#dcfce7' : 'var(--primary-color, #4575b5)',
                  color: saved ? '#166534' : 'white'
                }}
                onMouseEnter={(e) => {
                  if (!saved && !loading) {
                    e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saved && !loading) {
                    e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
                  }
                }}
              >
                {loading ? 'Saving...' : saved ? '✓ Saved' : 'Save Exit Details'}
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}