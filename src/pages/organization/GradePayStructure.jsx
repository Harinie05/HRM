import { useState, useEffect } from "react";
import api from "../../api";

export default function GradePayStructure() {
  const tenant_db = localStorage.getItem("tenant_db");

  // Form States
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    min_salary: "",
    max_salary: "",
    basic_percent: "",
    hra_percent: "",
    allowance_percent: "",
    special_percent: "",
    pf_applicable: true,
    pf_percent: "",
    esi_applicable: true,
    esi_percent: "",
    effective_from: "",
    status: "Active"
  });

  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState([]);
  const [showViewGrades, setShowViewGrades] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [editingGrade, setEditingGrade] = useState(null);

  useEffect(() => {
    fetchGrades();
    fetchDepartments();
    fetchRoles();
  }, []);

  const fetchGrades = async () => {
    try {
      const res = await api.get('/grades');
      setGrades(res.data || []);
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get(`/hospitals/departments/${tenant_db}/list`);
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get(`/hospitals/roles/${tenant_db}/list`);
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    const total = +form.basic_percent + +form.hra_percent + +form.allowance_percent + +form.special_percent;
    if (total !== 100) {
      alert("Total percentage must equal 100%");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        min_salary: parseInt(form.min_salary),
        max_salary: parseInt(form.max_salary),
        basic_percent: parseFloat(form.basic_percent),
        hra_percent: parseFloat(form.hra_percent),
        allowance_percent: parseFloat(form.allowance_percent),
        special_percent: parseFloat(form.special_percent),
        pf_percent: form.pf_percent ? parseFloat(form.pf_percent) : null,
        esi_percent: form.esi_percent ? parseFloat(form.esi_percent) : null,
        departments: selectedDepartments,
        roles: selectedRoles
      };

      if (editingGrade) {
        await api.put(`/grades/${editingGrade}`, payload);
        alert("Grade updated successfully!");
        setEditingGrade(null);
      } else {
        await api.post('/grades', payload);
        alert("Grade & Pay Structure Saved Successfully!");
      }
      
      clearForm();
      fetchGrades();
    } catch (err) {
      alert('Failed to save grade structure');
    } finally {
      setLoading(false);
    }
  }

  const clearForm = () => {
    setForm({
      code: "", name: "", description: "", min_salary: "", max_salary: "",
      basic_percent: "", hra_percent: "", allowance_percent: "", special_percent: "",
      pf_applicable: true, pf_percent: "", esi_applicable: true, esi_percent: "",
      effective_from: "", status: "Active"
    });
    setSelectedDepartments([]);
    setSelectedRoles([]);
    setEditingGrade(null);
  };

  const loadGradeForEdit = (grade) => {
    setEditingGrade(grade.id);
    setForm({
      code: grade.code,
      name: grade.name,
      description: grade.description || "",
      min_salary: grade.min_salary.toString(),
      max_salary: grade.max_salary.toString(),
      basic_percent: grade.basic_percent.toString(),
      hra_percent: grade.hra_percent.toString(),
      allowance_percent: grade.allowance_percent.toString(),
      special_percent: grade.special_percent.toString(),
      pf_applicable: grade.pf_applicable,
      pf_percent: grade.pf_percent ? grade.pf_percent.toString() : "",
      esi_applicable: grade.esi_applicable,
      esi_percent: grade.esi_percent ? grade.esi_percent.toString() : "",
      effective_from: grade.effective_from,
      status: grade.status
    });
    setSelectedDepartments(grade.departments || []);
    setSelectedRoles(grade.roles || []);
    setShowViewGrades(false);
  };

  const deleteGrade = async (gradeId) => {
    if (!window.confirm("Delete this grade?")) return;
    try {
      await api.delete(`/grades/${gradeId}`);
      alert("Grade deleted successfully");
      fetchGrades();
    } catch (err) {
      alert("Failed to delete grade");
    }
  };

  const addDept = (d) => !selectedDepartments.includes(d) && setSelectedDepartments([...selectedDepartments, d]);
  const addRole = (r) => !selectedRoles.includes(r) && setSelectedRoles([...selectedRoles, r]);
  const removeDept = (d) => setSelectedDepartments(selectedDepartments.filter((x) => x !== d));
  const removeRole = (r) => setSelectedRoles(selectedRoles.filter((x) => x !== r));

  return (
    <div className="space-y-6">
      {/* Grade Configuration */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Grade & Pay Structure</h2>
                <p className="text-sm text-gray-600">Configure salary grades and compensation structure</p>
              </div>
            </div>
            <button
              onClick={() => setShowViewGrades(!showViewGrades)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View All Grades ({grades.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grade Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                name="code"
                value={form.code}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="e.g., G1, EXEC, MGR"
              />
            </div>

            {/* Grade Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="e.g., Executive, Manager"
              />
            </div>

            {/* Min Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Salary <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                name="min_salary"
                value={form.min_salary}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="25000"
              />
            </div>

            {/* Max Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Salary <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                name="max_salary"
                value={form.max_salary}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="50000"
              />
            </div>

            {/* Basic % */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Basic %</label>
              <input
                type="number"
                name="basic_percent"
                value={form.basic_percent}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="40"
              />
            </div>

            {/* HRA % */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">HRA %</label>
              <input
                type="number"
                name="hra_percent"
                value={form.hra_percent}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="20"
              />
            </div>

            {/* Allowance % */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allowance %</label>
              <input
                type="number"
                name="allowance_percent"
                value={form.allowance_percent}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="30"
              />
            </div>

            {/* Special % */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special %</label>
              <input
                type="number"
                name="special_percent"
                value={form.special_percent}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="10"
              />
            </div>

            {/* PF */}
            <div>
              <label className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  name="pf_applicable"
                  checked={form.pf_applicable}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">PF Applicable</span>
              </label>
              {form.pf_applicable && (
                <input
                  type="number"
                  name="pf_percent"
                  value={form.pf_percent}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="12"
                />
              )}
            </div>

            {/* ESI */}
            <div>
              <label className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  name="esi_applicable"
                  checked={form.esi_applicable}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">ESI Applicable</span>
              </label>
              {form.esi_applicable && (
                <input
                  type="number"
                  name="esi_percent"
                  value={form.esi_percent}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="3.25"
                />
              )}
            </div>

            {/* Effective From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effective From <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                name="effective_from"
                value={form.effective_from}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Description - Full Width */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              placeholder="Grade description and details"
            />
          </div>

          {/* Total Percentage Display */}
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Total: {(+form.basic_percent + +form.hra_percent + +form.allowance_percent + +form.special_percent) || 0}% (Must equal 100%)
            </p>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editingGrade ? 'Update Grade' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* View All Grades Section */}
        {showViewGrades && (
          <div className="border-t border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">All Grades</h3>
              {grades.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No grades found</h3>
                  <p className="text-gray-500 text-sm">Create your first grade to get started with grade management</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grades.map((grade) => (
                    <div key={grade.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                          </svg>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => loadGradeForEdit(grade)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => deleteGrade(grade.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{grade.name} ({grade.code})</h3>
                        <p className="text-sm text-gray-600">₹{grade.min_salary?.toLocaleString()} - ₹{grade.max_salary?.toLocaleString()}</p>
                        {grade.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{grade.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          grade.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {grade.status}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {grade.effective_from}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}