import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function EmployeeExit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    resignation_date: "",
    last_working_day: "",
    reason: "",
    notice_period: "30",
    exit_interview_date: "",
    handover_status: "Pending",
    asset_return_status: "Pending",
    final_settlement: "Pending",
    clearance_status: "Pending",
    notes: ""
  });
  const [exitData, setExitData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchExit = async () => {
    try {
      const res = await api.get(`/employee/exit/${id}`);
      setExitData(res.data);
      setForm({
        resignation_date: res.data.resignation_date || "",
        last_working_day: res.data.last_working_day || "",
        reason: res.data.reason || "",
        notice_period: res.data.notice_period || "30",
        exit_interview_date: res.data.exit_interview_date || "",
        handover_status: res.data.handover_status || "Pending",
        asset_return_status: res.data.asset_return_status || "Pending",
        final_settlement: res.data.final_settlement || "Pending",
        clearance_status: res.data.clearance_status || "Pending",
        notes: res.data.notes || ""
      });
      setIsEditing(!!res.data.id);
    } catch {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    fetchExit();
  }, [id]);

  const submit = async () => {
    try {
      if (isEditing && exitData?.id) {
        await api.put(`/employee/exit/${exitData.id}`, {
          employee_id: id,
          ...form,
        });
      } else {
        await api.post("/employee/exit/add", {
          employee_id: id,
          ...form,
        });
      }
      alert("Exit process saved successfully");
      fetchExit();
    } catch (err) {
      console.error("Failed to save exit details", err);
      alert("Failed to save exit details");
    }
  };

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => navigate(`/eis/${id}`)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span>←</span> Back to Profile
              </button>
            </div>
            <h1 className="text-2xl font-bold text-[#0D3B66] mb-2">Employee Exit Process</h1>
            <p className="text-gray-600">Manage employee resignation and exit formalities</p>
          </div>

          {/* Exit Form */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-6 text-[#0D3B66] border-b pb-2">Exit Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resignation Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resignation Date *
                </label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.resignation_date}
                  onChange={(e) => setForm({ ...form, resignation_date: e.target.value })}
                  required
                />
              </div>

              {/* Last Working Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Working Day *
                </label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.last_working_day}
                  onChange={(e) => setForm({ ...form, last_working_day: e.target.value })}
                  required
                />
              </div>

              {/* Notice Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notice Period (Days)
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.notice_period}
                  onChange={(e) => setForm({ ...form, notice_period: e.target.value })}
                >
                  <option value="15">15 Days</option>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>

              {/* Exit Interview Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exit Interview Date
                </label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.exit_interview_date}
                  onChange={(e) => setForm({ ...form, exit_interview_date: e.target.value })}
                />
              </div>
            </div>

            {/* Reason for Leaving */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Leaving
              </label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              >
                <option value="">Select Reason</option>
                <option value="Better Opportunity">Better Opportunity</option>
                <option value="Personal Reasons">Personal Reasons</option>
                <option value="Relocation">Relocation</option>
                <option value="Higher Studies">Higher Studies</option>
                <option value="Health Issues">Health Issues</option>
                <option value="Retirement">Retirement</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Exit Clearance */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-6 text-[#0D3B66] border-b pb-2">Exit Clearance Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Handover Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Knowledge Handover
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.handover_status}
                  onChange={(e) => setForm({ ...form, handover_status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Asset Return */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Return Status
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.asset_return_status}
                  onChange={(e) => setForm({ ...form, asset_return_status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Completed">Completed</option>
                  <option value="N/A">Not Applicable</option>
                </select>
              </div>

              {/* Final Settlement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Settlement
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.final_settlement}
                  onChange={(e) => setForm({ ...form, final_settlement: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Processed">Processed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Overall Clearance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Clearance Status
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.clearance_status}
                  onChange={(e) => setForm({ ...form, clearance_status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4 text-[#0D3B66] border-b pb-2">Additional Notes</h2>
            <textarea
              placeholder="Enter any additional notes, comments, or special instructions regarding the exit process..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex justify-end space-x-4">
              <button 
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submit}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                {isEditing ? 'Update Exit Process' : 'Accept & Complete Exit Process'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
