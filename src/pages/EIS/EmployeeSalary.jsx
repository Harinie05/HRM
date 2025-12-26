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
    <Layout>
      {/* Header Section */}
      <div className="mb-6 p-6 bg-white border border-black shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 border border-black rounded-2xl flex items-center justify-center">
              <FiDollarSign className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Salary Structure
              </h1>
              <p className="text-gray-600 mb-2">
                Compensation details and salary breakdown
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">CTC Management</span>
                </div>
                <span className="text-sm text-gray-600">Real-time Updates</span>
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
            {/* CTC Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiDollarSign className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Cost to Company (CTC)</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Annual CTC (₹)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                  placeholder="e.g., 1200000"
                  value={form.ctc}
                  onChange={(e) => setForm({ ...form, ctc: e.target.value })}
                />
              </div>
            </div>

            {/* Salary Breakdown */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiPieChart className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Salary Component Breakdown (%)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Basic Salary (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.basic_percent}
                    onChange={(e) => setForm({ ...form, basic_percent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">HRA (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.hra_percent}
                    onChange={(e) => setForm({ ...form, hra_percent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Allowances (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.allowances_percent}
                    onChange={(e) => setForm({ ...form, allowances_percent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Special Allowances (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    value={form.special_percent}
                    onChange={(e) => setForm({ ...form, special_percent: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Compliance & Benefits */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 border border-black rounded-xl flex items-center justify-center">
                  <FiShield className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Compliance & Benefits</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.pf_eligible}
                    onChange={(e) => setForm({ ...form, pf_eligible: e.target.checked })}
                    className="rounded border border-black text-gray-600 focus:ring-gray-500"
                  />
                  <span className="text-sm text-secondary">Provident Fund (PF) Eligible</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.esi_eligible}
                    onChange={(e) => setForm({ ...form, esi_eligible: e.target.checked })}
                    className="rounded border border-black text-gray-600 focus:ring-gray-500"
                  />
                  <span className="text-sm text-secondary">Employee State Insurance (ESI) Eligible</span>
                </label>
              </div>
            </div>

            {/* Salary Preview */}
            {form.ctc && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Breakdown Preview</h3>
                <div className="bg-gray-100 border border-black rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Basic Salary:</span>
                      <span className="font-medium">₹{Math.round((form.ctc * form.basic_percent) / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="" style={{color: 'var(--text-secondary, #374151)'}}>HRA:</span>
                      <span className="font-medium">₹{Math.round((form.ctc * form.hra_percent) / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Allowances:</span>
                      <span className="font-medium">₹{Math.round((form.ctc * form.allowances_percent) / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="" style={{color: 'var(--text-secondary, #374151)'}}>Special Allowances:</span>
                      <span className="font-medium">₹{Math.round((form.ctc * form.special_percent) / 100).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-black">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Total CTC:</span>
                      <span>₹{parseInt(form.ctc).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-black">
            <button
              onClick={submit}
              className="px-6 py-3 bg-white text-black border border-black rounded-2xl hover:bg-gray-100 transition-colors font-medium"
            >
              {isEditing ? 'Update Salary Structure' : 'Save Salary Structure'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
