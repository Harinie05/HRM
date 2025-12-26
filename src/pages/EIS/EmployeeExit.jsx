import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiUserX, FiArrowLeft, FiCalendar, FiFileText, FiUpload } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function EmployeeExit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    resignation_date: "",
    last_working_date: "",
    notice_period_days: "30",
    reason_for_leaving: "",
    exit_interview_date: "",
    exit_interview_feedback: "",
    handover_status: "Pending",
    final_settlement_amount: "",
    relieving_letter_issued: false,
    experience_certificate_issued: false,
    assets_returned: false,
    exit_clearance_completed: false,
  });
  const [exitData, setExitData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const fetchExitDetails = async () => {
    try {
      const res = await api.get(`/employee/exit/${id}`);
      setExitData(res.data);
      setForm({
        resignation_date: res.data.resignation_date || "",
        last_working_date: res.data.last_working_date || "",
        notice_period_days: res.data.notice_period_days || "30",
        reason_for_leaving: res.data.reason_for_leaving || "",
        exit_interview_date: res.data.exit_interview_date || "",
        exit_interview_feedback: res.data.exit_interview_feedback || "",
        handover_status: res.data.handover_status || "Pending",
        final_settlement_amount: res.data.final_settlement_amount || "",
        relieving_letter_issued: res.data.relieving_letter_issued || false,
        experience_certificate_issued: res.data.experience_certificate_issued || false,
        assets_returned: res.data.assets_returned || false,
        exit_clearance_completed: res.data.exit_clearance_completed || false,
      });
      setIsEditing(!!res.data.id);
    } catch {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    fetchExitDetails();
  }, [id]);

  const submit = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append("employee_id", id);
      Object.keys(form).forEach(key => {
        data.append(key, form[key]);
      });
      if (file) data.append("file", file);

      if (isEditing && exitData?.id) {
        await api.put(`/employee/exit/${exitData.id}`, data);
      } else {
        await api.post("/employee/exit/add", data);
      }
      
      alert("Exit details saved successfully");
      fetchExitDetails();
    } catch (err) {
      console.error("Failed to save exit details", err);
      alert("Failed to save exit details");
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
              <FiUserX className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Exit Management
              </h1>
              <p className="text-gray-600 mb-2">
                Employee separation and exit formalities
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Exit Process</span>
                </div>
                <span className="text-sm text-gray-600">Clearance Tracking</span>
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
            {/* Resignation Details */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiCalendar className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Resignation Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Resignation Date *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.resignation_date}
                    onChange={(e) => setForm({ ...form, resignation_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Last Working Date *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.last_working_date}
                    onChange={(e) => setForm({ ...form, last_working_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Notice Period (Days)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.notice_period_days}
                    onChange={(e) => setForm({ ...form, notice_period_days: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-secondary mb-2">Reason for Leaving</label>
                <textarea
                  className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                  rows="3"
                  placeholder="Reason for resignation..."
                  value={form.reason_for_leaving}
                  onChange={(e) => setForm({ ...form, reason_for_leaving: e.target.value })}
                />
              </div>
            </div>

            {/* Exit Interview */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiFileText className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Exit Interview</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Exit Interview Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.exit_interview_date}
                    onChange={(e) => setForm({ ...form, exit_interview_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Handover Status</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.handover_status}
                    onChange={(e) => setForm({ ...form, handover_status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-secondary mb-2">Exit Interview Feedback</label>
                <textarea
                  className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                  rows="4"
                  placeholder="Exit interview feedback and comments..."
                  value={form.exit_interview_feedback}
                  onChange={(e) => setForm({ ...form, exit_interview_feedback: e.target.value })}
                />
              </div>
            </div>

            {/* Final Settlement */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Settlement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Final Settlement Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    placeholder="Final settlement amount"
                    value={form.final_settlement_amount}
                    onChange={(e) => setForm({ ...form, final_settlement_amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Exit Documents</label>
                  <div className="flex items-center gap-2">
                    <FiUpload className="" style={{color: 'var(--text-muted, #6b7280)'}} />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Exit Clearance Checklist */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Exit Clearance Checklist</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.relieving_letter_issued}
                    onChange={(e) => setForm({ ...form, relieving_letter_issued: e.target.checked })}
                    className="rounded border border-black text-gray-600 focus:ring-gray-500"
                  />
                  <span className="text-sm text-secondary">Relieving Letter Issued</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.experience_certificate_issued}
                    onChange={(e) => setForm({ ...form, experience_certificate_issued: e.target.checked })}
                    className="rounded border border-black text-gray-600 focus:ring-gray-500"
                  />
                  <span className="text-sm text-secondary">Experience Certificate Issued</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.assets_returned}
                    onChange={(e) => setForm({ ...form, assets_returned: e.target.checked })}
                    className="rounded border border-black text-gray-600 focus:ring-gray-500"
                  />
                  <span className="text-sm text-secondary">Company Assets Returned</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.exit_clearance_completed}
                    onChange={(e) => setForm({ ...form, exit_clearance_completed: e.target.checked })}
                    className="rounded border border-black text-gray-600 focus:ring-gray-500"
                  />
                  <span className="text-sm text-secondary">Exit Clearance Completed</span>
                </label>
              </div>
            </div>

            {/* Exit Status Summary */}
            {form.resignation_date && (
              <div className="bg-gray-100 border border-black rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Exit Process Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Resignation Date:</span>
                    <span className="ml-2 font-medium">{form.resignation_date}</span>
                  </div>
                  <div>
                    <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Last Working Date:</span>
                    <span className="ml-2 font-medium">{form.last_working_date}</span>
                  </div>
                  <div>
                    <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Handover Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium border border-black ${
                      form.handover_status === 'Completed' ? 'bg-gray-100 text-black' :
                      form.handover_status === 'In Progress' ? 'bg-gray-100 text-black' :
                      'bg-gray-100 text-black'
                    }`}>
                      {form.handover_status}
                    </span>
                  </div>
                  <div>
                    <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Exit Clearance:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium border border-black ${
                      form.exit_clearance_completed ? 'bg-gray-100 text-black' : 'bg-gray-100 text-black'
                    }`}>
                      {form.exit_clearance_completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
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
              {loading ? 'Saving...' : (isEditing ? 'Update Exit Details' : 'Save Exit Details')}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
