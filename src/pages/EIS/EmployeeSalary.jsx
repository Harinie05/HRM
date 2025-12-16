import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

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
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => navigate(`/eis/${id}`)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span>←</span> Back to Profile
              </button>
              <h2 className="text-lg font-semibold">Salary Structure</h2>
            </div>

      <div className="space-y-6">
        {/* CTC */}
        <div>
          <h3 className="text-md font-medium mb-3 text-gray-700">Cost to Company (CTC)</h3>
          <input
            placeholder="Total CTC (Annual)"
            type="number"
            className="border p-3 rounded-lg w-full"
            value={form.ctc}
            onChange={(e) => setForm({ ...form, ctc: e.target.value })}
          />
        </div>

        {/* Salary Breakdown */}
        <div>
          <h3 className="text-md font-medium mb-3 text-gray-700">Salary Component Breakdown (%)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Basic Salary %</label>
              <input
                placeholder="Basic %"
                type="number"
                className="border p-3 rounded-lg w-full"
                value={form.basic_percent}
                onChange={(e) => setForm({ ...form, basic_percent: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">HRA %</label>
              <input
                placeholder="HRA %"
                type="number"
                className="border p-3 rounded-lg w-full"
                value={form.hra_percent}
                onChange={(e) => setForm({ ...form, hra_percent: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Allowances %</label>
              <input
                placeholder="Allowances %"
                type="number"
                className="border p-3 rounded-lg w-full"
                value={form.allowances_percent}
                onChange={(e) => setForm({ ...form, allowances_percent: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Special Allowances %</label>
              <input
                placeholder="Special %"
                type="number"
                className="border p-3 rounded-lg w-full"
                value={form.special_percent}
                onChange={(e) => setForm({ ...form, special_percent: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div>
          <h3 className="text-md font-medium mb-3 text-gray-700">Compliance & Benefits</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={form.pf_eligible}
                onChange={(e) => setForm({ ...form, pf_eligible: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">Provident Fund (PF) Eligible</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={form.esi_eligible}
                onChange={(e) => setForm({ ...form, esi_eligible: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">Employee State Insurance (ESI) Eligible</span>
            </label>
          </div>
        </div>

        {/* Salary Preview */}
        {form.ctc && (
          <div>
            <h3 className="text-md font-medium mb-3 text-gray-700">Salary Breakdown Preview</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Basic Salary: ₹{Math.round((form.ctc * form.basic_percent) / 100).toLocaleString()}</div>
                <div>HRA: ₹{Math.round((form.ctc * form.hra_percent) / 100).toLocaleString()}</div>
                <div>Allowances: ₹{Math.round((form.ctc * form.allowances_percent) / 100).toLocaleString()}</div>
                <div>Special Allowances: ₹{Math.round((form.ctc * form.special_percent) / 100).toLocaleString()}</div>
              </div>
              <div className="mt-2 pt-2 border-t font-medium">
                Total CTC: ₹{parseInt(form.ctc).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={submit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          {isEditing ? 'Update Salary Structure' : 'Save Salary Structure'}
        </button>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}

