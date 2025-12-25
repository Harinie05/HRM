import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api";

// ============================================================================
// MAIN COMPONENT — JOB REQUISITION PAGE
// ============================================================================

export default function JobRequisition() {
  const [requisitions, setRequisitions] = useState([]);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit | view
  const [selectedReq, setSelectedReq] = useState(null);

  // ---------------------- LOAD ALL REQUISITIONS ----------------------
  const fetchRequisitions = async () => {
    try {
      const res = await api.get("/recruitment/list");
      setRequisitions(res.data || []);
    } catch (err) {
      console.error("Failed to load requisitions");
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  // ---------------------- OPEN MODALS ----------------------
  const openCreate = () => {
    console.log("Create button clicked");
    setMode("create");
    setSelectedReq(null);
    setShowForm(true);
    console.log("showForm set to true");
  };

  const openView = (req) => {
    setMode("view");
    setSelectedReq(req);
    setShowForm(true);
  };

  const openEdit = (req) => {
    setMode("edit");
    setSelectedReq(req);
    setShowForm(true);
  };



  // ======================================================================
  // UI RENDER
  // ======================================================================
  return (
    <Layout breadcrumb="Recruitment · Job Requisition">
      <div className="w-full overflow-hidden">
        {/* Enhanced Header */}
        <div className="mb-6 px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Job Requisition</h1>
                  <p className="text-gray-600 mt-1">Create and manage job requisitions for hiring needs</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{requisitions.length}</div>
                  <div className="text-sm text-gray-500">Active Positions</div>
                </div>
                <button
                  onClick={openCreate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center space-x-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>New Requisition</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-6 px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search requisitions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Job List */}
        <div className="px-4">
          <div className="bg-white rounded-3xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Job Title</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Department</th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Openings</th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Experience</th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requisitions
                    .filter((r) =>
                      r.title?.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 truncate" title={req.title}>{req.title}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-600 truncate" title={req.department}>{req.department}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {req.openings}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm text-gray-600 truncate" title={req.experience}>{req.experience}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center space-x-1">
                            <button
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition-colors"
                              onClick={() => openView(req)}
                            >
                              View
                            </button>
                            <button
                              className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-md text-xs font-medium transition-colors"
                              onClick={() => openEdit(req)}
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MODAL FORM */}
        {showForm && (
          <JobRequisitionForm
            mode={mode}
            requisition={selectedReq}
            onClose={() => {
              setShowForm(false);
              fetchRequisitions();
            }}
          />
        )}
      </div>
    </Layout>
  );
}

// ============================================================================
// FORM COMPONENT (MERGED INSIDE SAME FILE)
// ============================================================================

function JobRequisitionForm({ mode, requisition, onClose }) {
  console.log("JobRequisitionForm rendered with mode:", mode);
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    title: "",
    department: "",
    hiring_manager: "",
    openings: 1,
    experience: "",
    salary_range: "",
    job_type: "Full-time",
    work_mode: "On-site",
    location: "",
    rounds: 1,
    round_names: {1: "Technical Round"},
    jd_text: "",
    skills: [],
    description: "",
    deadline: "",

  });

  useEffect(() => {
    if (isEdit || isView) {
      setForm(requisition);
    }
  }, [requisition]);

  const updateField = (key, value) =>
    setForm({ ...form, [key]: value });

  const submitForm = async () => {
    try {
      // Clean the form data - remove empty strings and convert to proper types
      const cleanedForm = {
        title: form.title || "",
        department: form.department || null,
        hiring_manager: form.hiring_manager || null,
        openings: parseInt(form.openings) || 1,
        experience: form.experience || null,
        salary_range: form.salary_range || null,
        job_type: form.job_type || null,
        work_mode: form.work_mode || null,
        location: form.location || null,
        rounds: parseInt(form.rounds) || 1,
        round_names: form.round_names || null,
        jd_text: form.jd_text || null,
        skills: Array.isArray(form.skills) ? form.skills : [],
        description: form.description || null,
        deadline: form.deadline || null,

      };

      if (mode === "create") {
        await api.post("/recruitment/create", cleanedForm);
        alert("Requisition Created!");
      } else {
        await api.put(`/recruitment/update/${requisition.id}`, cleanedForm);
        alert("Requisition Updated!");
      }

      onClose();
    } catch (err) {
      console.error("Form submission error:", err);
      alert("Failed to save requisition");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-[650px] max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-xl">

        <h2 className="text-xl font-semibold mb-4">
          {mode === "create" && "Create Job Requisition"}
          {mode === "edit" && "Edit Job Requisition"}
          {mode === "view" && "Requisition Details"}
        </h2>

        <div className="space-y-4">

          <input
            className="border p-2 rounded w-full"
            placeholder="Job Title"
            disabled={isView}
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
          />

          <input
            className="border p-2 rounded w-full"
            placeholder="Department"
            disabled={isView}
            value={form.department}
            onChange={(e) => updateField("department", e.target.value)}
          />

          <input
            className="border p-2 rounded w-full"
            placeholder="Hiring Manager"
            disabled={isView}
            value={form.hiring_manager}
            onChange={(e) => updateField("hiring_manager", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              className="border p-2 rounded"
              type="number"
              placeholder="Openings"
              disabled={isView}
              value={form.openings}
              onChange={(e) => updateField("openings", parseInt(e.target.value))}
            />

            <input
              className="border p-2 rounded"
              placeholder="Experience (e.g., 3-5 years)"
              disabled={isView}
              value={form.experience}
              onChange={(e) => updateField("experience", e.target.value)}
            />
          </div>

          <input
            className="border p-2 rounded w-full"
            placeholder="Salary Range (e.g., 5-8 LPA)"
            disabled={isView}
            value={form.salary_range}
            onChange={(e) => updateField("salary_range", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              className="border p-2 rounded"
              disabled={isView}
              value={form.job_type}
              onChange={(e) => updateField("job_type", e.target.value)}
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>

            <select
              className="border p-2 rounded"
              disabled={isView}
              value={form.work_mode}
              onChange={(e) => updateField("work_mode", e.target.value)}
            >
              <option>On-site</option>
              <option>Hybrid</option>
              <option>Remote</option>
            </select>
          </div>

          <input
            className="border p-2 rounded w-full"
            placeholder="Work Location"
            disabled={isView}
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
          />

          <textarea
            className="border p-2 rounded w-full h-24"
            placeholder="Job Description"
            disabled={isView}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          ></textarea>

          <textarea
            className="border p-2 rounded w-full h-24"
            placeholder="Detailed JD Text"
            disabled={isView}
            value={form.jd_text}
            onChange={(e) => updateField("jd_text", e.target.value)}
          ></textarea>

          <div className="grid grid-cols-2 gap-3">
            <input
              className="border p-2 rounded"
              type="number"
              placeholder="Rounds"
              disabled={isView}
              value={form.rounds}
              onChange={(e) => {
                const rounds = parseInt(e.target.value) || 1;
                updateField("rounds", rounds);
                // Auto-generate round names
                const roundNames = {};
                for(let i = 1; i <= rounds; i++) {
                  roundNames[i] = `Round ${i}`;
                }
                updateField("round_names", roundNames);
              }}
            />
            
            <input
              className="border p-2 rounded"
              type="date"
              placeholder="Deadline"
              disabled={isView}
              value={form.deadline}
              onChange={(e) => updateField("deadline", e.target.value)}
            />
          </div>

          <input
            className="border p-2 rounded w-full"
            placeholder="Skills Required (comma-separated)"
            disabled={isView}
            value={Array.isArray(form.skills) ? form.skills.join(', ') : (form.skills || '')}
            onChange={(e) => updateField("skills", e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])}
          />
        </div>

        <div className="flex justify-between mt-6">
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={onClose}
          >
            Close
          </button>

          {!isView && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={submitForm}
            >
              {mode === "create" ? "Create" : "Update"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
