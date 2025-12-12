import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../api";

export default function Recruitment() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState({});

  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit | view
  const [selectedJob, setSelectedJob] = useState(null);

  // ========================= FETCH JOBS =========================
  const fetchJobs = async () => {
    try {
      const res = await api.get("/recruitment/list");
      setJobs(res.data || []);
    } catch (err) {
      console.error("Failed to load jobs", err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // ========================= MODALS =========================
  const openCreate = () => {
    setMode("create");
    setSelectedJob(null);
    setShowForm(true);
  };

  const openEdit = (job) => {
    setMode("edit");
    setSelectedJob(job);
    setShowForm(true);
  };

  const openView = (job) => {
    setMode("view");
    setSelectedJob(job);
    setShowForm(true);
  };

  // ========================= PUBLISH / UNPUBLISH =========================
  const togglePublish = async (job) => {
    const newStatus = job.status === "Posted" ? "Draft" : "Posted";

    try {
      await api.put(`/recruitment/update-status/${job.id}?status=${newStatus}`);
      fetchJobs();
    } catch (err) {
      console.error("Failed to update job status", err);
    }
  };

  // ========================= GENERATE APPLY LINK =========================
  const generateApplyLink = async (job) => {
    try {
      const res = await api.post(`/recruitment/generate-link/${job.id}`);
      const url = res.data.url;
      
      setGeneratedLinks(prev => ({
        ...prev,
        [job.id]: url
      }));
    } catch (err) {
      console.error("Failed to generate link", err);
      alert("Failed to generate job link");
    }
  };

  // ========================================================================
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-50 min-h-screen">
        <Header />

        <div className="p-6">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">Recruitment Setup</h1>

            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Create Job
            </button>
          </div>

          {/* SEARCH */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search job..."
              className="border p-2 rounded w-72"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* JOB TABLE */}
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
              {jobs
                .filter((j) =>
                  j.title.toLowerCase().includes(search.toLowerCase())
                )
                .map((job) => (
                  <tr key={job.id} className="border-t">
                    <td className="p-3">{job.title}</td>
                    <td className="p-3">{job.department}</td>
                    <td className="p-3 text-center">{job.openings}</td>
                    <td className="p-3 text-center">{job.experience}</td>

                    <td className="p-3 text-center">
                      {job.status === "Posted" ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                          Draft
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex flex-wrap gap-2 justify-center">

                        {/* VIEW */}
                        <button
                          onClick={() => openView(job)}
                          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                        >
                          View
                        </button>

                        {/* EDIT */}
                        <button
                          onClick={() => openEdit(job)}
                          className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Edit
                        </button>

                        {/* SCREEN CANDIDATES */}
                        <button
                          onClick={() => window.location.href = `/screening?job=${job.id}`}
                          className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                        >
                          Screen Candidates
                        </button>

                        {/* GENERATE LINK */}
                        <button
                          onClick={() => generateApplyLink(job)}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Generate Link
                        </button>

                        {/* PUBLISH / UNPUBLISH */}
                        <button
                          onClick={() => togglePublish(job)}
                          className={
                            job.status === "Posted"
                              ? "px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                              : "px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          }
                        >
                          {job.status === "Posted" ? "Unpublish" : "Publish"}
                        </button>

                      </div>
                      
                      {/* GENERATED LINK FIELD */}
                      {generatedLinks[job.id] && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={generatedLinks[job.id]}
                            readOnly
                            className="w-full text-xs border p-1 rounded bg-gray-50"
                            onClick={(e) => e.target.select()}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {showForm && (
          <JobFormModal
            mode={mode}
            job={selectedJob}
            onClose={() => {
              setShowForm(false);
              fetchJobs();
            }}
          />
        )}
      </div>
    </div>
  );
}

// JobForm Modal Component
function JobFormModal({ mode, job, onClose }) {
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
    rounds: 2,
    round_names: [{name: "Technical Round", description: ""}, {name: "HR Round", description: ""}],
    description: "",
    status: "Draft"
  });
  
  const [existingJobs, setExistingJobs] = useState([]);
  
  // Fetch existing job titles
  const fetchExistingJobs = async () => {
    try {
      const res = await api.get("/recruitment/list");
      const uniqueTitles = [...new Set(res.data.map(j => j.title))]; // Remove duplicates
      setExistingJobs(uniqueTitles);
    } catch (err) {
      console.error("Failed to load existing jobs");
    }
  };

  useEffect(() => {
    fetchExistingJobs();
    
    if (job && (mode === "edit" || mode === "view")) {
      // Convert round_names from different formats
      const roundNames = job.round_names;
      let convertedRoundNames = [];
      
      if (Array.isArray(roundNames)) {
        // Check if it's already in new format
        if (roundNames[0] && typeof roundNames[0] === 'object' && roundNames[0].name) {
          convertedRoundNames = roundNames;
        } else {
          // Convert from simple array to object array
          convertedRoundNames = roundNames.map(name => ({name, description: ""}));
        }
      } else if (roundNames && typeof roundNames === 'object') {
        // Convert from object format
        convertedRoundNames = Object.values(roundNames).map(name => ({name, description: ""}));
      } else {
        convertedRoundNames = [{name: "Technical Round", description: ""}, {name: "HR Round", description: ""}];
      }
      
      setForm({
        ...job,
        round_names: convertedRoundNames
      });
    }
  }, [job, mode]);

  const handleSubmit = async () => {
    try {
      if (mode === "create") {
        await api.post("/recruitment/create", form);
        alert("Job created successfully!");
      } else if (mode === "edit") {
        await api.put(`/recruitment/update/${job.id}`, form);
        alert("Job updated successfully!");
      }
      onClose();
    } catch (err) {
      alert("Failed to save job");
    }
  };

  const isView = mode === "view";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {mode === "create" && "Create Job"}
          {mode === "edit" && "Edit Job"}
          {mode === "view" && "View Job"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Job Title</label>
            <div className="flex gap-2">
              <select
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                disabled={isView}
                className="flex-1 border p-2 rounded"
              >
                <option value="">Select existing job title</option>
                {existingJobs.map((title, index) => (
                  <option key={index} value={title}>{title}</option>
                ))}
              </select>
              <span className="text-gray-500 self-center">OR</span>
              <input
                type="text"
                placeholder="Enter new job title"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                disabled={isView}
                className="flex-1 border p-2 rounded"
              />
            </div>
          </div>
          
          <input
            type="text"
            placeholder="Department"
            value={form.department}
            onChange={(e) => setForm({...form, department: e.target.value})}
            disabled={isView}
            className="w-full border p-2 rounded"
          />
          
          <input
            type="text"
            placeholder="Hiring Manager"
            value={form.hiring_manager}
            onChange={(e) => setForm({...form, hiring_manager: e.target.value})}
            disabled={isView}
            className="w-full border p-2 rounded"
          />
          
          <input
            type="number"
            placeholder="Openings"
            value={form.openings}
            onChange={(e) => setForm({...form, openings: parseInt(e.target.value)})}
            disabled={isView}
            className="w-full border p-2 rounded"
          />
          
          {/* Interview Rounds */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Interview Rounds:</label>
              {!isView && (
                <button
                  type="button"
                  onClick={() => {
                    const newRounds = [...(form.round_names || []), {name: "", description: ""}];
                    setForm({...form, round_names: newRounds, rounds: newRounds.length});
                  }}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Add Round
                </button>
              )}
            </div>
            {(form.round_names || []).map((round, index) => (
              <div key={index} className="border p-3 rounded bg-gray-50 space-y-2">
                <input
                  type="text"
                  placeholder={`Round ${index + 1} Name`}
                  value={round.name || ""}
                  onChange={(e) => {
                    const newRounds = [...form.round_names];
                    newRounds[index] = {...newRounds[index], name: e.target.value};
                    setForm({...form, round_names: newRounds});
                  }}
                  disabled={isView}
                  className="w-full border p-2 rounded text-sm"
                />
                <textarea
                  placeholder={`Round ${index + 1} Description`}
                  value={round.description || ""}
                  onChange={(e) => {
                    const newRounds = [...form.round_names];
                    newRounds[index] = {...newRounds[index], description: e.target.value};
                    setForm({...form, round_names: newRounds});
                  }}
                  disabled={isView}
                  className="w-full border p-2 rounded text-sm h-16 resize-none"
                />
              </div>
            ))}
          </div>

          
          <textarea
            placeholder="Job Description"
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            disabled={isView}
            className="w-full border p-2 rounded h-20"
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Close
          </button>
          {!isView && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {mode === "create" ? "Create" : "Update"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
