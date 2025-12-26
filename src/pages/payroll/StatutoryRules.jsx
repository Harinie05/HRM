import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import api from "../../api";

export default function StatutoryRules() {
  const [form, setForm] = useState({
    pf_enabled: true,
    pf_percent: "12",
    pf_apply_on: "Basic",
    esi_enabled: true,
    esi_threshold: "21000",
    esi_percent: "1.75",
    pt_enabled: true,
    pt_amount: "200",
    tds_enabled: true,
    tds_percent: "10"
  });

  const fetchRules = async () => {
    try {
      const res = await api.get("/api/payroll/statutory/");
      setForm({
        pf_enabled: res.data.pf_enabled ?? true,
        pf_percent: res.data.pf_percent?.toString() || "12",
        pf_apply_on: res.data.pf_apply_on || "Basic",
        esi_enabled: res.data.esi_enabled ?? true,
        esi_threshold: res.data.esi_threshold?.toString() || "21000",
        esi_percent: res.data.esi_percent?.toString() || "1.75",
        pt_enabled: res.data.pt_enabled ?? true,
        pt_amount: res.data.pt_amount?.toString() || "200",
        tds_enabled: res.data.tds_enabled ?? true,
        tds_percent: res.data.tds_percent?.toString() || "10"
      });
    } catch (err) {
      console.error("Failed to fetch rules:", err);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const submit = async () => {
    const data = new FormData();
    Object.keys(form).forEach(key => {
      data.append(key, form[key]);
    });

    try {
      await api.post("/api/payroll/statutory/update", data);
      alert("Statutory rules updated successfully");
    } catch (err) {
      console.error("Failed to update rules:", err);
      alert("Failed to update statutory rules");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-black overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-black">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Statutory Rules Configuration</h2>
            <p className="text-sm text-gray-600">Configure PF, ESI, Professional Tax and TDS rules</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        <div className="space-y-6">
        {/* PF Section */}
        <div className="border border-black rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={form.pf_enabled}
              onChange={(e) => setForm({ ...form, pf_enabled: e.target.checked })}
              className="w-5 h-5 text-gray-600 rounded focus:ring-gray-500"
            />
            <h3 className="text-lg font-semibold text-gray-900">Provident Fund (PF)</h3>
          </div>
          
          {form.pf_enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-7">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee PF %</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.pf_percent}
                  onChange={(e) => setForm({ ...form, pf_percent: e.target.value })}
                  className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apply on</label>
                <select
                  value={form.pf_apply_on}
                  onChange={(e) => setForm({ ...form, pf_apply_on: e.target.value })}
                  className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                >
                  <option value="Basic">Basic Salary</option>
                  <option value="Gross">Gross Salary</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ESI Section */}
        <div className="border border-black rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={form.esi_enabled}
              onChange={(e) => setForm({ ...form, esi_enabled: e.target.checked })}
              className="w-5 h-5 text-gray-600 rounded focus:ring-gray-500"
            />
            <h3 className="text-lg font-semibold text-gray-900">Employee State Insurance (ESI)</h3>
          </div>
          
          {form.esi_enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-7">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Threshold Amount (₹)</label>
                <input
                  type="number"
                  value={form.esi_threshold}
                  onChange={(e) => setForm({ ...form, esi_threshold: e.target.value })}
                  className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Salary > threshold → ESI auto = 0</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ESI %</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.esi_percent}
                  onChange={(e) => setForm({ ...form, esi_percent: e.target.value })}
                  className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Professional Tax Section */}
        <div className="border border-black rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={form.pt_enabled}
              onChange={(e) => setForm({ ...form, pt_enabled: e.target.checked })}
              className="w-5 h-5 text-gray-600 rounded focus:ring-gray-500"
            />
            <h3 className="text-lg font-semibold text-gray-900">Professional Tax (PT)</h3>
          </div>
          
          {form.pt_enabled && (
            <div className="ml-7">
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly PT Amount (₹)</label>
                <input
                  type="number"
                  value={form.pt_amount}
                  onChange={(e) => setForm({ ...form, pt_amount: e.target.value })}
                  className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* TDS Section */}
        <div className="border border-black rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={form.tds_enabled}
              onChange={(e) => setForm({ ...form, tds_enabled: e.target.checked })}
              className="w-5 h-5 text-gray-600 rounded focus:ring-gray-500"
            />
            <h3 className="text-lg font-semibold text-gray-900">Tax Deducted at Source (TDS)</h3>
          </div>
          
          {form.tds_enabled && (
            <div className="ml-7">
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">TDS Flat % (for test)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.tds_percent}
                  onChange={(e) => setForm({ ...form, tds_percent: e.target.value })}
                  className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-8 flex justify-center sm:justify-end">
        <button
          onClick={submit}
          className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm border border-black w-full sm:w-auto justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Changes
        </button>
      </div>
      </div>
    </div>
  );
}
