import { useState, useEffect } from "react";
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
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-6">Statutory Rules Configuration</h2>

      <div className="space-y-8">
        {/* PF Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={form.pf_enabled}
              onChange={(e) => setForm({ ...form, pf_enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <h3 className="text-lg font-medium">Provident Fund (PF)</h3>
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
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={form.esi_enabled}
              onChange={(e) => setForm({ ...form, esi_enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <h3 className="text-lg font-medium">Employee State Insurance (ESI)</h3>
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
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={form.pt_enabled}
              onChange={(e) => setForm({ ...form, pt_enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <h3 className="text-lg font-medium">Professional Tax (PT)</h3>
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
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={form.tds_enabled}
              onChange={(e) => setForm({ ...form, tds_enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <h3 className="text-lg font-medium">Tax Deducted at Source (TDS)</h3>
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Save Statutory Rules
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          ✅ These rules are pulled dynamically during payroll run and applied to all employees based on their salary structure.
        </p>
      </div>
    </div>
  );
}