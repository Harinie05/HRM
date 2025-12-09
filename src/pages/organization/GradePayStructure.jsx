import { useState, useEffect } from "react";
import api from "../../api";

export default function GradePayStructure() {
  const tenant_db = localStorage.getItem("tenant_db");

  // ---------------------- STATES ----------------------
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


  // ---------------- FETCH INITIAL DATA ----------------
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

  // ---------------- ADD/REMOVE MAPS ----------------
  const addDept = (d) =>
    !selectedDepartments.includes(d) &&
    setSelectedDepartments([...selectedDepartments, d]);

  const addRole = (r) =>
    !selectedRoles.includes(r) &&
    setSelectedRoles([...selectedRoles, r]);

  const removeDept = (d) =>
    setSelectedDepartments(selectedDepartments.filter((x) => x !== d));

  const removeRole = (r) =>
    setSelectedRoles(selectedRoles.filter((x) => x !== r));

  // ---------------- DELETE GRADE ----------------
  const deleteGrade = async (gradeId) => {
    if (!window.confirm("Delete this grade?")) return;

    try {
      console.log(`Deleting grade with ID: ${gradeId}`);
      await api.delete(`/grades/${gradeId}`);
      console.log('Grade deleted successfully');
      fetchGrades();
      alert("Grade deleted successfully");
    } catch (err) {
      console.error('Delete grade failed:', err);
      alert(err.response?.data?.detail || "Failed to delete grade");
    }
  };

  // ---------------- EDIT GRADE ----------------
  const loadGradeForEdit = (grade) => {
    console.log('Loading grade for edit:', grade);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------------- SAVE GRADE ----------------
  const saveGrade = async () => {
    const total =
      +basic + +hra + +allowance + +special;

    if (total !== 100) return alert("Total percentage must be 100%");
    if (!code || !gradeName || !minSalary || !maxSalary || !effectiveFrom)
      return alert("All required fields must be filled");

    try {
      console.log(editingGrade ? `Updating grade ID: ${editingGrade}` : 'Creating new grade');
      
      const payload = {
        code,
        name: gradeName,
        description: description || null,
        min_salary: parseInt(minSalary),
        max_salary: parseInt(maxSalary),
        basic_percent: parseFloat(basic),
        hra_percent: parseFloat(hra),
        allowance_percent: parseFloat(allowance),
        special_percent: parseFloat(special),
        pf_applicable: pfEnable,
        pf_percent: pfPercent ? parseFloat(pfPercent) : null,
        esi_applicable: esiEnable,
        esi_percent: esiPercent ? parseFloat(esiPercent) : null,
        departments: selectedDepartments,
        roles: selectedRoles,
        effective_from: effectiveFrom,
        status,
      };

      if (editingGrade) {
        await api.put(`/grades/${editingGrade}`, payload);
        console.log('Grade updated successfully');
      } else {
        await api.post(`/grades`, payload);
        console.log('Grade created successfully');
      }

      alert(editingGrade ? "Grade updated successfully!" : "Grade saved successfully!");
      clearForm();
      fetchGrades();

    } catch (err) {
      console.error("Save grade error:", err);
      console.error("Error response:", err.response?.data);
      alert(err.response?.data?.detail || "Failed to save grade");
    }
  };


  // ---------------- RESET ----------------
  const clearForm = () => {
    setEditingGrade(null);
    setCode("");
    setGradeName("");
    setDescription("");

    setMinSalary("");
    setMaxSalary("");

    setBasic("");
    setHra("");
    setAllowance("");
    setSpecial("");

    setPfPercent("");
    setEsiPercent("");

    setSelectedDepartments([]);
    setSelectedRoles([]);
    setEffectiveFrom("");
    setStatus("Active");
  };


  // ---------------- UI ----------------
  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* CREATE FORM CARD */}
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              {editingGrade ? 'Edit Grade / Pay Structure' : 'Create Grade / Pay Structure'}
            </h2>
            <p className="text-gray-500 text-sm">Define salary structure & compliance.</p>
          </div>

          <button
            className="px-5 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 text-sm"
            onClick={() => setShowGradeList(true)}
          >
            View All Grades
          </button>
        </div>


        {/* Grade Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <input className="border p-2 rounded" placeholder="Grade Code"
            value={code} onChange={(e) => setCode(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Grade Name"
            value={gradeName} onChange={(e) => setGradeName(e.target.value)} />
        </div>
        <textarea className="border p-2 rounded w-full" rows="3"
          placeholder="Description" value={description}
          onChange={(e) => setDescription(e.target.value)} />


        {/* Salary Range */}
        <div>
          <h3 className="font-semibold mb-2">Salary Range</h3>
          <div className="grid grid-cols-2 gap-4">
            <input className="border p-2 rounded" type="number" placeholder="Minimum Salary"
              value={minSalary} onChange={(e) => setMinSalary(e.target.value)} />
            <input className="border p-2 rounded" type="number" placeholder="Maximum Salary"
              value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} />
          </div>
        </div>


        {/* Salary Split */}
        <div>
          <h3 className="font-semibold mb-2">Salary Components (%)</h3>
          <div className="grid grid-cols-4 gap-4">
            <input className="border p-2 rounded" placeholder="Basic %" value={basic} onChange={(e) => setBasic(e.target.value)} />
            <input className="border p-2 rounded" placeholder="HRA %" value={hra} onChange={(e) => setHra(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Allowance %" value={allowance} onChange={(e) => setAllowance(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Special %" value={special} onChange={(e) => setSpecial(e.target.value)} />
          </div>
          <p className="text-xs text-gray-500">Total must be 100%</p>
        </div>


        {/* Compliance */}
        <div>
          <h3 className="font-semibold mb-3">Compliance</h3>
          <div className="flex gap-10">

            <div>
              <label className="flex items-center gap-2 mb-1">
                <input type="checkbox" checked={pfEnable} onChange={(e)=>setPfEnable(e.target.checked)}/>
                PF Applicable
              </label>
              {pfEnable &&
                <input className="border p-2 rounded w-24" placeholder="PF %"
                value={pfPercent} onChange={(e)=>setPfPercent(e.target.value)} />}
            </div>

            <div>
              <label className="flex items-center gap-2 mb-1">
                <input type="checkbox" checked={esiEnable} onChange={(e)=>setEsiEnable(e.target.checked)}/>
                ESI Applicable
              </label>
              {esiEnable &&
                <input className="border p-2 rounded w-24" placeholder="ESI %"
                value={esiPercent} onChange={(e)=>setEsiPercent(e.target.value)} />}
            </div>

          </div>
        </div>


        {/* Department & Roles */}
        <div>
          <h3 className="font-semibold mb-3">Department & Role Mapping</h3>

          <select className="border p-2 rounded w-56 mb-2" value=""
            onChange={(e)=>{if(e.target.value) addDept(e.target.value);}}>
            <option value="">Select Department</option>
            {departments.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}
          </select>

          <div className="flex flex-wrap gap-2 mb-4">
            {selectedDepartments.map(d=>(
              <span key={d} className="px-3 py-1 text-sm bg-blue-100 rounded-full flex items-center gap-1">
                {d} <button onClick={()=>removeDept(d)}>✕</button>
              </span>
            ))}
          </div>


          <select className="border p-2 rounded w-56" value=""
            onChange={(e)=>{if(e.target.value) addRole(e.target.value);}}>
            <option value="">Select Role</option>
            {roles.map(r=><option key={r.id} value={r.name}>{r.name}</option>)}
          </select>

          <div className="flex flex-wrap gap-2 mt-2">
            {selectedRoles.map(r=>(
              <span key={r} className="px-3 py-1 text-sm bg-green-100 rounded-full flex items-center gap-1">
                {r} <button onClick={()=>removeRole(r)}>✕</button>
              </span>
            ))}
          </div>

        </div>


        {/* Date + Status */}
        <div>
          <h3 className="font-semibold mb-3">Effective Date & Status</h3>
          <div className="flex gap-4">
            <input type="date" className="border p-2 rounded"
              value={effectiveFrom} onChange={(e)=>setEffectiveFrom(e.target.value)} />
            <select className="border p-2 rounded"
              value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>


        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button onClick={clearForm} className="border px-5 py-2 rounded-lg">
            Reset
          </button>
          <button onClick={saveGrade}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            {editingGrade ? 'Update Grade' : 'Save Grade'}
          </button>
        </div>

      </div>



      {/* ---------------- GRADE LIST POPUP ---------------- */}
      {showGradeList && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-[600px] p-6 rounded-xl shadow-xl">
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">All Grades</h3>
              <button className="text-gray-500 hover:text-gray-800"
                onClick={()=>setShowGradeList(false)}>✕</button>
            </div>

            {gradeList.length===0 ? (
              <p className="text-gray-500 text-sm">No grades created.</p>
            ):(
              <div className="max-h-72 overflow-y-auto space-y-2">
                {gradeList.map((g)=>(
                  <div key={g.id}
                    className="border rounded-lg p-3 text-sm flex justify-between items-center">
                    <div>
                      <div className="font-medium">{g.name} ({g.code})</div>
                      <div className="text-xs text-gray-500">
                        Salary: {g.min_salary} - {g.max_salary}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => loadGradeForEdit(g)}
                        className="text-blue-600 text-xs hover:underline">Edit</button>
                      <button 
                        onClick={() => deleteGrade(g.id)}
                        className="text-red-600 text-xs hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
