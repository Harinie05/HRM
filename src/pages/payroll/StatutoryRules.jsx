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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200 rounded-t-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Statutory Rules Configuration</h2>
            <p className="text-gray-600 mt-1">Configure PF, ESI, Professional Tax and TDS rules</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
        {/* PF Section */}
        <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={form.pf_enabled}
              onChange={(e) => setForm({ ...form, pf_enabled: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <h3 className="text-lg font-semibold text-blue-800">Provident Fund (PF)</h3>
          </div>
          
          {form.pf_enabled && (
            <div className="grid grid-cols-2 gap-4 ml-7">
              <div>
                <label className="block text-sm font-medium mb-1">Employee PF %</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.pf_percent}
                  onChange={(e) => setForm({ ...form, pf_percent: e.target.value })}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apply on</label>
                <select
                  value={form.pf_apply_on}
                  onChange={(e) => setForm({ ...form, pf_apply_on: e.target.value })}
                  className="border p-2 rounded w-full"
                >
                  <option value="Basic">Basic Salary</option>
                  <option value="Gross">Gross Salary</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ESI Section */}
        <div className="border-2 border-green-200 rounded-xl p-6 bg-green-50">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={form.esi_enabled}
              onChange={(e) => setForm({ ...form, esi_enabled: e.target.checked })}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <h3 className="text-lg font-semibold text-green-800">Employee State Insurance (ESI)</h3>
          </div>
          
          {form.esi_enabled && (
            <div className="grid grid-cols-2 gap-4 ml-7">
              <div>
                <label className="block text-sm font-medium mb-1">Threshold Amount (₹)</label>
                <input
                  type="number"
                  value={form.esi_threshold}
                  onChange={(e) => setForm({ ...form, esi_threshold: e.target.value })}
                  className="border p-2 rounded w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Salary &gt; threshold → ESI auto = 0</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Employee ESI %</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.esi_percent}
                  onChange={(e) => setForm({ ...form, esi_percent: e.target.value })}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Professional Tax Section */}
        <div className="border-2 border-purple-200 rounded-xl p-6 bg-purple-50">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={form.pt_enabled}
              onChange={(e) => setForm({ ...form, pt_enabled: e.target.checked })}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <h3 className="text-lg font-semibold text-purple-800">Professional Tax (PT)</h3>
          </div>
          
          {form.pt_enabled && (
            <div className="ml-7">
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">Monthly PT Amount (₹)</label>
                <input
                  type="number"
                  value={form.pt_amount}
                  onChange={(e) => setForm({ ...form, pt_amount: e.target.value })}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* TDS Section */}
        <div className="border-2 border-orange-200 rounded-xl p-6 bg-orange-50">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={form.tds_enabled}
              onChange={(e) => setForm({ ...form, tds_enabled: e.target.checked })}
              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
            />
            <h3 className="text-lg font-semibold text-orange-800">Tax Deducted at Source (TDS)</h3>
          </div>
          
          {form.tds_enabled && (
            <div className="ml-7">
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">TDS Flat % (for test)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.tds_percent}
                  onChange={(e) => setForm({ ...form, tds_percent: e.target.value })}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={submit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Save Statutory Rules
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-700 flex items-center gap-2">
          <span className="text-blue-600">✅</span>
          These rules are pulled dynamically during payroll run and applied to all employees based on their salary structure.
        </p>
      </div>
      </div>
    </div>
  );
}