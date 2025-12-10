import { useState, useEffect } from "react";
import api from "../../api";

export default function ATS() {
  const tenant_db = localStorage.getItem("tenant_db");

  // ------------------------- VIEW STATE -------------------------
  const [view, setView] = useState("jobs"); // jobs | pipeline
  const [selectedJob, setSelectedJob] = useState(null);

  // ------------------------- JOB LIST DATA -------------------------
  const [jobList, setJobList] = useState([]);
  const [jobSearch, setJobSearch] = useState("");

  // ------------------------- PIPELINE DATA -------------------------
  const [pipeline, setPipeline] = useState({
    New: [],
    Screening: [],
    Shortlisted: [],
    Interview: [],
    Selected: [],
    Rejected: [],
  });

  // ------------------------- CANDIDATE DRAWER -------------------------
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);

  const stages = ["New", "Screening", "Shortlisted", "Interview", "Selected", "Rejected"];

  // ------------------------- LOAD JOB LIST -------------------------
  const fetchJobs = async () => {
    try {
      const res = await api.get(`/ats/${tenant_db}/jobs`);
      setJobList(res.data || []);
    } catch (err) {
      console.error("Failed to load jobs");
    }
  };

  // ------------------------- LOAD PIPELINE -------------------------
  const fetchPipeline = async (job) => {
    try {
      const res = await api.get(`/ats/${tenant_db}/jobs/${job.id}/pipeline`);

      setPipeline({
        New: res.data.New || [],
        Screening: res.data.Screening || [],
        Shortlisted: res.data.Shortlisted || [],
        Interview: res.data.Interview || [],
        Selected: res.data.Selected || [],
        Rejected: res.data.Rejected || [],
      });
    } catch (err) {
      console.error("Failed to load pipeline");
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // ------------------------- LOAD CANDIDATE PROFILE -------------------------
  const openCandidateDrawer = async (candidateId) => {
    try {
      const res = await api.get(`/ats/${tenant_db}/candidate/${candidateId}`);
      setCandidateProfile(res.data);
      setDrawerOpen(true);
    } catch {
      alert("Failed to load candidate");
    }
  };

  // ------------------------- MOVE CANDIDATE -------------------------
  const moveStage = async (candidateId, newStage) => {
    try {
      await api.put(`/ats/${tenant_db}/candidate/${candidateId}/stage`, {
        stage: newStage,
      });

      fetchPipeline(selectedJob); // reload pipeline
      setDrawerOpen(false);

    } catch {
      alert("Stage update failed");
    }
  };

  // =================================================================
  //                      VIEW 1 — JOBS LIST PAGE
  // =================================================================
  const renderJobList = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Applicant Tracking System</h2>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search Job..."
          value={jobSearch}
          onChange={(e) => setJobSearch(e.target.value)}
          className="border p-2 rounded-lg w-72"
        />
      </div>

      {/* Job Table */}
      <table className="min-w-full text-sm border">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="border p-3 text-left">Job Title</th>
            <th className="border p-3 text-center">Total</th>
            <th className="border p-3 text-center">New</th>
            <th className="border p-3 text-center">Screening</th>
            <th className="border p-3 text-center">Shortlisted</th>
            <th className="border p-3 text-center">Interview</th>
            <th className="border p-3 text-center">Selected</th>
            <th className="border p-3 text-center">Rejected</th>
            <th className="border p-3 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {jobList
            .filter((j) => j.title.toLowerCase().includes(jobSearch.toLowerCase()))
            .map((job) => (
              <tr key={job.id}>
                <td className="border p-3">{job.title}</td>
                <td className="border p-3 text-center">{job.total}</td>
                <td className="border p-3 text-center">{job.New}</td>
                <td className="border p-3 text-center">{job.Screening}</td>
                <td className="border p-3 text-center">{job.Shortlisted}</td>
                <td className="border p-3 text-center">{job.Interview}</td>
                <td className="border p-3 text-center">{job.Selected}</td>
                <td className="border p-3 text-center">{job.Rejected}</td>

                <td className="border p-3 text-center">
                  <button
                    className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-blue-700"
                    onClick={() => {
                      setSelectedJob(job);
                      setView("pipeline");
                      fetchPipeline(job);
                    }}
                  >
                    View ATS
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );

  // =================================================================
  //                     VIEW 2 — PIPELINE PAGE
  // =================================================================
  const renderPipeline = () => (
    <div className="p-4">

      <button
        className="text-blue-600 mb-4 hover:underline"
        onClick={() => setView("jobs")}
      >
        ← Back to Jobs
      </button>

      <h2 className="text-xl font-semibold mb-4">
        {selectedJob?.title} — ATS Pipeline
      </h2>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-6 gap-4">
        {stages.map((stageName) => (
          <div key={stageName} className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-2">
              {stageName} ({pipeline[stageName].length})
            </h3>

            {/* Candidate Cards */}
            <div className="space-y-3">
              {pipeline[stageName].map((c) => (
                <div
                  key={c.id}
                  className="border p-3 rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => openCandidateDrawer(c.id)}
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.experience} yrs exp</div>
                  <div className="text-xs text-blue-600 underline">View Resume</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // =================================================================
  //                   RIGHT SIDE CANDIDATE DRAWER
  // =================================================================
  const renderDrawer = () => (
    drawerOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-end z-50">
        <div className="bg-white w-[380px] h-full p-6 shadow-xl overflow-y-auto">

          <button
            className="text-gray-500 mb-4 hover:text-black"
            onClick={() => setDrawerOpen(false)}
          >
            ✕ Close
          </button>

          {candidateProfile && (
            <div className="space-y-4">

              <h2 className="text-lg font-semibold">{candidateProfile.name}</h2>

              <p className="text-sm text-gray-600">
                {candidateProfile.experience} years experience
              </p>

              <a
                href={candidateProfile.resume_url}
                target="_blank"
                className="text-blue-600 underline text-sm"
              >
                View Resume
              </a>

              <hr />

              <h3 className="font-semibold">Move to Stage</h3>

              <div className="space-y-2">
                {stages
                  .filter((s) => s !== candidateProfile.stage)
                  .map((stage) => (
                    <button
                      key={stage}
                      className="w-full border rounded-lg px-4 py-2 text-left hover:bg-gray-50"
                      onClick={() => moveStage(candidateProfile.id, stage)}
                    >
                      {stage}
                    </button>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    )
  );

  // =================================================================
  //                             RENDER
  // =================================================================
  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {view === "jobs" ? renderJobList() : renderPipeline()}
      {renderDrawer()}
    </div>
  );
}
