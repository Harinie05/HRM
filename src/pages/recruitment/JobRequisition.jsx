import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
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

  // ---------------------- APPROVE / REJECT ----------------------
  const approveReq = async (req) => {
    try {
      await api.put(`/recruitment/update/${req.id}`, { status: "Approved" });
      alert("Requisition Approved!");
      fetchRequisitions();
    } catch {
      alert("Failed to approve");
    }
  };

  const rejectReq = async (req) => {
    try {
      await api.put(`/recruitment/update/${req.id}`, { status: "Rejected" });
      alert("Requisition Rejected!");
      fetchRequisitions();
    } catch {
      alert("Failed to reject");
    }
  };

  // ======================================================================
  // UI RENDER
  // ======================================================================
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-gray-50">
        <Header />

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">Job Requisition</h1>

            <button
              onClick={openCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              + New Requisition
            </button>
          </div>

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search..."
            className="border p-2 rounded w-64 mb-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* TABLE */}
          <table className="min-w-full bg-white rounded-xl shadow">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="p-3 text-left">Job Title</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-center">Openings</th>
                <th className="p-3 text-center">Experience</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {requisitions
                .filter((r) =>
                  r.title?.toLowerCase().includes(search.toLowerCase())
                )
                .map((req) => (
                  <tr key={req.id} className="border-t">
                    <td className="p-3">{req.title}</td>
                    <td className="p-3">{req.department}</td>
                    <td className="p-3 text-center">{req.openings}</td>
                    <td className="p-3 text-center">{req.experience}</td>

                    <td className="p-3 text-center">
                      {req.status === "Approved" ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                          Approved
                        </span>
                      ) : req.status === "Rejected" ? (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                          Rejected
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          className="px-3 py-1 bg-gray-200 rounded"
                          onClick={() => openView(req)}
                        >
                          View
                        </button>

                        <button
                          className="px-3 py-1 bg-yellow-500 text-white rounded"
                          onClick={() => openEdit(req)}
                        >
                          Edit
                        </button>

                        {req.status === "Pending" && (
                          <>
                            <button
                              className="px-3 py-1 bg-green-600 text-white rounded"
                              onClick={() => approveReq(req)}
                            >
                              Approve
                            </button>
                            <button
                              className="px-3 py-1 bg-red-600 text-white rounded"
                              onClick={() => rejectReq(req)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* MODAL FORM */}
          {showForm && (
            <JobRequisitionForm
              mode={mode}
              requisition={selectedReq}
              onClose={() => {
                console.log("Closing modal");
                setShowForm(false);
                fetchRequisitions();
              }}
            />
          )}
          {console.log("showForm state:", showForm)}
        </div>
      </div>
    </div>
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
    status: "Draft"
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
        status: form.status || "Draft"
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
