import { useState, useEffect } from "react";
import { Plus, DollarSign, Building2, Users, Edit3, Trash2, Eye, X } from "lucide-react";
import api from "../../api";

export default function GradePayStructure() {
  const tenant_db = localStorage.getItem("tenant_db");

  // States
  const [code, setCode] = useState("");
  const [gradeName, setGradeName] = useState("");
  const [description, setDescription] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [basic, setBasic] = useState("");
  const [hra, setHra] = useState("");
  const [allowance, setAllowance] = useState("");
  const [special, setSpecial] = useState("");
  const [pfEnable, setPfEnable] = useState(true);
  const [pfPercent, setPfPercent] = useState("");
  const [esiEnable, setEsiEnable] = useState(true);
  const [esiPercent, setEsiPercent] = useState("");
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [status, setStatus] = useState("Active");
  const [showGradeList, setShowGradeList] = useState(false);
  const [gradeList, setGradeList] = useState([]);
  const [editingGrade, setEditingGrade] = useState(null);

  useEffect(() => {
    fetchDepartments();
    fetchRoles();
    fetchGrades();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get(`/hospitals/departments/${tenant_db}/list`);
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error("Failed to fetch departments:", err.response?.data || err.message);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get(`/hospitals/roles/${tenant_db}/list`);
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error("Failed to fetch roles:", err.response?.data || err.message);
    }
  };

  const fetchGrades = async () => {
    try {
      const res = await api.get(`/grades`);
      setGradeList(res.data || []);
    } catch {}
  };

  const addDept = (d) => !selectedDepartments.includes(d) && setSelectedDepartments([...selectedDepartments, d]);
  const addRole = (r) => !selectedRoles.includes(r) && setSelectedRoles([...selectedRoles, r]);
  const removeDept = (d) => setSelectedDepartments(selectedDepartments.filter((x) => x !== d));
  const removeRole = (r) => setSelectedRoles(selectedRoles.filter((x) => x !== r));

  const deleteGrade = async (gradeId) => {
    if (!window.confirm("Delete this grade?")) return;
    try {
      await api.delete(`/grades/${gradeId}`);
      fetchGrades();
      alert("Grade deleted successfully");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete grade");
    }
  };

  const loadGradeForEdit = (grade) => {
    setEditingGrade(grade.id);
    setCode(grade.code);
    setGradeName(grade.name);
    setDescription(grade.description || "");
    setMinSalary(grade.min_salary.toString());
    setMaxSalary(grade.max_salary.toString());
    setBasic(grade.basic_percent.toString());
    setHra(grade.hra_percent.toString());
    setAllowance(grade.allowance_percent.toString());
    setSpecial(grade.special_percent.toString());
    setPfEnable(grade.pf_applicable);
    setPfPercent(grade.pf_percent ? grade.pf_percent.toString() : "");
    setEsiEnable(grade.esi_applicable);
    setEsiPercent(grade.esi_percent ? grade.esi_percent.toString() : "");
    setSelectedDepartments(grade.departments || []);
    setSelectedRoles(grade.roles || []);
    setEffectiveFrom(grade.effective_from);
    setStatus(grade.status);
    setShowGradeList(false);
  };

  const saveGrade = async () => {
    const total = +basic + +hra + +allowance + +special;
    if (total !== 100) return alert("Total percentage must be 100%");
    if (!code || !gradeName || !minSalary || !maxSalary || !effectiveFrom)
      return alert("All required fields must be filled");

    try {
      const payload = {
        code, name: gradeName, description: description || null,
        min_salary: parseInt(minSalary), max_salary: parseInt(maxSalary),
        basic_percent: parseFloat(basic), hra_percent: parseFloat(hra),
        allowance_percent: parseFloat(allowance), special_percent: parseFloat(special),
        pf_applicable: pfEnable, pf_percent: pfPercent ? parseFloat(pfPercent) : null,
        esi_applicable: esiEnable, esi_percent: esiPercent ? parseFloat(esiPercent) : null,
        departments: selectedDepartments, roles: selectedRoles,
        effective_from: effectiveFrom, status,
      };

      if (editingGrade) {
        await api.put(`/grades/${editingGrade}`, payload);
      } else {
        await api.post(`/grades`, payload);
      }

      alert(editingGrade ? "Grade updated successfully!" : "Grade saved successfully!");
      clearForm();
      fetchGrades();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save grade");
    }
  };

  const clearForm = () => {
    setEditingGrade(null); setCode(""); setGradeName(""); setDescription("");
    setMinSalary(""); setMaxSalary(""); setBasic(""); setHra(""); setAllowance(""); setSpecial("");
    setPfPercent(""); setEsiPercent(""); setSelectedDepartments([]); setSelectedRoles([]);
    setEffectiveFrom(""); setStatus("Active");
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex-shrink-0">
              <DollarSign className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Grade & Pay Structure</h1>
              <p className="text-gray-600 mt-1">Define salary grades and compensation structure</p>
            </div>
          </div>
          <button
            onClick={() => setShowGradeList(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            <Eye size={16} /> View All Grades ({gradeList.length})
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingGrade ? 'Edit Grade Structure' : 'Create Grade Structure'}
              </h2>
              <p className="text-gray-600 text-sm">Define salary structure & compliance settings</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade Code</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., G1, EXEC, MGR"
                    value={code} onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade Name</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Executive, Manager"
                    value={gradeName} onChange={(e) => setGradeName(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3" placeholder="Grade description"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Salary Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Salary</label>
                  <input
                    type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="25000"
                    value={minSalary} onChange={(e) => setMinSalary(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Salary</label>
                  <input
                    type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="50000"
                    value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Salary Components */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Salary Components (%)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Basic %</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="40" value={basic} onChange={(e) => setBasic(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HRA %</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="20" value={hra} onChange={(e) => setHra(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allowance %</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="30" value={allowance} onChange={(e) => setAllowance(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special %</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="10" value={special} onChange={(e) => setSpecial(e.target.value)} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Total must equal 100%. Current: {(+basic + +hra + +allowance + +special) || 0}%</p>
            </div>

            {/* Compliance */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Compliance Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="flex items-center gap-3 mb-3">
                    <input type="checkbox" checked={pfEnable} onChange={(e) => setPfEnable(e.target.checked)} className="rounded" />
                    <span className="font-medium text-gray-900">PF Applicable</span>
                  </label>
                  {pfEnable && (
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="12" value={pfPercent} onChange={(e) => setPfPercent(e.target.value)} />
                  )}
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="flex items-center gap-3 mb-3">
                    <input type="checkbox" checked={esiEnable} onChange={(e) => setEsiEnable(e.target.checked)} className="rounded" />
                    <span className="font-medium text-gray-900">ESI Applicable</span>
                  </label>
                  {esiEnable && (
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="3.25" value={esiPercent} onChange={(e) => setEsiPercent(e.target.value)} />
                  )}
                </div>
              </div>
            </div>

            {/* Department & Role Mapping */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Department & Role Mapping</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departments</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3" value="" onChange={(e) => { if (e.target.value) addDept(e.target.value); }}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {selectedDepartments.map(d => (
                      <span key={d} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                        {d} <button onClick={() => removeDept(d)} className="hover:text-blue-600"><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3" value="" onChange={(e) => { if (e.target.value) addRole(e.target.value); }}>
                    <option value="">Select Role</option>
                    {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoles.map(r => (
                      <span key={r} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                        {r} <button onClick={() => removeRole(r)} className="hover:text-green-600"><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Effective Date & Status */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Effective Date & Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Effective From</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button onClick={clearForm} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Reset
              </button>
              <button onClick={saveGrade} className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                {editingGrade ? 'Update Grade' : 'Save Grade'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grade List Modal */}
      {showGradeList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl mx-4 rounded-xl shadow-xl max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">All Grades ({gradeList.length})</h3>
              <button onClick={() => setShowGradeList(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {gradeList.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No grades created yet</p>
                  <p className="text-gray-400 text-sm">Create your first grade to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gradeList.map((g) => (
                    <div key={g.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{g.name} ({g.code})</h4>
                          <p className="text-sm text-gray-600">₹{g.min_salary.toLocaleString()} - ₹{g.max_salary.toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          g.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {g.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => loadGradeForEdit(g)} className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-md hover:bg-indigo-200 transition-colors">
                          <Edit3 size={14} /> Edit
                        </button>
                        <button onClick={() => deleteGrade(g.id)} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}