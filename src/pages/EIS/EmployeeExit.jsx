import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiLogOut, FiArrowLeft, FiCalendar, FiFileText, FiUpload } from "react-icons/fi";
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
    <Layout 
      title="Exit Process" 
      subtitle="Employee separation and exit formalities"
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
            {/* Resignation Details */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiCalendar className="text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Resignation Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resignation Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.resignation_date}
                    onChange={(e) => setForm({ ...form, resignation_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Working Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.last_working_date}
                    onChange={(e) => setForm({ ...form, last_working_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notice Period (Days)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.notice_period_days}
                    onChange={(e) => setForm({ ...form, notice_period_days: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Leaving</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Reason for resignation..."
                  value={form.reason_for_leaving}
                  onChange={(e) => setForm({ ...form, reason_for_leaving: e.target.value })}
                />
              </div>
            </div>

            {/* Exit Interview */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiFileText className="text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Exit Interview</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exit Interview Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.exit_interview_date}
                    onChange={(e) => setForm({ ...form, exit_interview_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Handover Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Exit Interview Feedback</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Final Settlement Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Final settlement amount"
                    value={form.final_settlement_amount}
                    onChange={(e) => setForm({ ...form, final_settlement_amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exit Documents</label>
                  <div className="flex items-center gap-2">
                    <FiUpload className="text-gray-400" />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Relieving Letter Issued</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.experience_certificate_issued}
                    onChange={(e) => setForm({ ...form, experience_certificate_issued: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Experience Certificate Issued</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.assets_returned}
                    onChange={(e) => setForm({ ...form, assets_returned: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Company Assets Returned</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.exit_clearance_completed}
                    onChange={(e) => setForm({ ...form, exit_clearance_completed: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Exit Clearance Completed</span>
                </label>
              </div>
            </div>

            {/* Exit Status Summary */}
            {form.resignation_date && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Exit Process Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Resignation Date:</span>
                    <span className="ml-2 font-medium">{form.resignation_date}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Working Date:</span>
                    <span className="ml-2 font-medium">{form.last_working_date}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Handover Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      form.handover_status === 'Completed' ? 'bg-green-100 text-green-800' :
                      form.handover_status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {form.handover_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Exit Clearance:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      form.exit_clearance_completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {form.exit_clearance_completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
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
              {loading ? 'Saving...' : (isEditing ? 'Update Exit Details' : 'Save Exit Details')}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}