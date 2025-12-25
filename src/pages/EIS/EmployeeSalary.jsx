import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiDollarSign, FiArrowLeft, FiPieChart, FiShield } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function EmployeeSalary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ctc: "",
    basic_percent: "40",
    hra_percent: "20",
    allowances_percent: "20",
    special_percent: "20",
    pf_eligible: true,
    esi_eligible: true,
  });
  const [salaryData, setSalaryData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchSalary = async () => {
    try {
      const res = await api.get(`/employee/salary/${id}`);
      setSalaryData(res.data);
      setForm({
        ctc: res.data.ctc || "",
        basic_percent: res.data.basic_percent || "40",
        hra_percent: res.data.hra_percent || "20",
        allowances_percent: res.data.allowances_percent || "20",
        special_percent: res.data.special_percent || "20",
        pf_eligible: res.data.pf_eligible ?? true,
        esi_eligible: res.data.esi_eligible ?? true,
      });
      setIsEditing(!!res.data.id);
    } catch {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    fetchSalary();
  }, [id]);

  const submit = async () => {
    const data = new FormData();
    data.append("employee_id", id);
    data.append("ctc", form.ctc);
    data.append("basic_percent", form.basic_percent);
    data.append("hra_percent", form.hra_percent);
    data.append("allowances_percent", form.allowances_percent);
    data.append("special_percent", form.special_percent);
    data.append("pf_eligible", form.pf_eligible);
    data.append("esi_eligible", form.esi_eligible);
    
    try {
      await api.post("/employee/salary/add", data);
      alert("Salary structure saved");
      fetchSalary();
    } catch (err) {
      console.error("Failed to save salary", err);
      alert("Failed to save salary structure");
    }
  };

  return (
    <Layout 
      title="Salary Structure" 
      subtitle="Compensation details and salary breakdown"
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
            {/* CTC Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiDollarSign className="text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">Cost to Company (CTC)</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual CTC (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1200000"
                  value={form.ctc}
                  onChange={(e) => setForm({ ...form, ctc: e.target.value })}
                />
              </div>
            </div>

            {/* Salary Breakdown */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiPieChart className="text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Salary Component Breakdown (%)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Basic Salary (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.basic_percent}
                    onChange={(e) => setForm({ ...form, basic_percent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HRA (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.hra_percent}
                    onChange={(e) => setForm({ ...form, hra_percent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allowances (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.allowances_percent}
                    onChange={(e) => setForm({ ...form, allowances_percent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Allowances (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.special_percent}
                    onChange={(e) => setForm({ ...form, special_percent: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Compliance & Benefits */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiShield className="text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900">Compliance & Benefits</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.pf_eligible}
                    onChange={(e) => setForm({ ...form, pf_eligible: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Provident Fund (PF) Eligible</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.esi_eligible}
                    onChange={(e) => setForm({ ...form, esi_eligible: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Employee State Insurance (ESI) Eligible</span>
                </label>
              </div>
            </div>

            {/* Salary Preview */}
            {form.ctc && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Breakdown Preview</h3>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Salary:</span>
                      <span className="font-medium">₹{Math.round((form.ctc * form.basic_percent) / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">HRA:</span>
                      <span className="font-medium">₹{Math.round((form.ctc * form.hra_percent) / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allowances:</span>
                      <span className="font-medium">₹{Math.round((form.ctc * form.allowances_percent) / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Special Allowances:</span>
                      <span className="font-medium">₹{Math.round((form.ctc * form.special_percent) / 100).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Total CTC:</span>
                      <span>₹{parseInt(form.ctc).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t">
            <button
              onClick={submit}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {isEditing ? 'Update Salary Structure' : 'Save Salary Structure'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}