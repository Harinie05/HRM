import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../api";

export default function ATS() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [moveForm, setMoveForm] = useState({
    action: "",
    next_round: 2,
    interview_date: "",
    interview_time: ""
  });

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      const res = await api.get("/recruitment/ats/jobs");
      setJobs(res.data || []);
    } catch (err) {
      console.error("Failed to load jobs");
    }
  };

  // Fetch candidates for selected job
  const fetchCandidates = async (jobId) => {
    try {
      const res = await api.get(`/recruitment/ats/job/${jobId}`);
      setCandidates(res.data || []);
    } catch (err) {
      console.error("Failed to load candidates");
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    fetchCandidates(job.id);
  };

  const handleMoveCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setMoveForm({
      action: "",
      next_round: candidate.current_round + 1,
      interview_date: "",
      interview_time: ""
    });
    setShowMoveModal(true);
  };

  const submitMove = async () => {
    try {
      await api.post("/recruitment/ats/move-to-next-round", {
        candidate_id: selectedCandidate.id,
        ...moveForm
      });

      alert(`Candidate ${moveForm.action} successfully!`);
      setShowMoveModal(false);
      fetchCandidates(selectedJob.id);
    } catch (err) {
      console.error("Failed to move candidate");
      alert("Failed to move candidate");
    }
  };

  const getRoundNames = (job) => {
    if (!job.round_names) return [];
    if (Array.isArray(job.round_names)) {
      return job.round_names.map(r => typeof r === 'object' ? r.name : r);
    }
    if (typeof job.round_names === 'object') {
      return Object.values(job.round_names);
    }
    return [];
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case "Shortlisted": return "bg-blue-100 text-blue-800";
      case "Selected": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-50 min-h-screen">
        <Header />

        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-6">Applicant Tracking System</h1>

          {/* Jobs List */}
          <div className="bg-white rounded-xl shadow mb-6">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Jobs</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleJobSelect(job)}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedJob?.id === job.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <h3 className="font-medium">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.department}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Rounds: {getRoundNames(job).join(", ") || "Not specified"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Candidates Table */}
          {selectedJob && (
            <div className="bg-white rounded-xl shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">
                  Candidates for {selectedJob.title}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100 text-gray-600 text-sm">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Experience</th>
                      <th className="p-3 text-left">Current Stage</th>
                      <th className="p-3 text-left">Current Round</th>
                      <th className="p-3 text-left">Interview Date</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {candidates.map((candidate) => (
                      <tr key={candidate.id} className="border-t">
                        <td className="p-3">{candidate.name}</td>
                        <td className="p-3">{candidate.email}</td>
                        <td className="p-3">{candidate.experience} years</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStageColor(candidate.stage)}`}>
                            {candidate.stage}
                          </span>
                        </td>
                        <td className="p-3">Round {candidate.current_round}</td>
                        <td className="p-3">
                          {candidate.interview_date 
                            ? new Date(candidate.interview_date).toLocaleDateString()
                            : "—"
                          }
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleMoveCandidate(candidate)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Move
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Move Candidate Modal */}
          {showMoveModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white w-[500px] p-6 rounded-xl shadow-xl">
                <h2 className="text-xl font-semibold mb-4">
                  Move Candidate: {selectedCandidate?.name}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Action</label>
                    <select
                      className="border p-2 rounded w-full"
                      value={moveForm.action}
                      onChange={(e) => setMoveForm({ ...moveForm, action: e.target.value })}
                    >
                      <option value="">Select Action</option>
                      <option value="next_round">Move to Next Round</option>
                      <option value="selected">Select Candidate</option>
                      <option value="rejected">Reject Candidate</option>
                    </select>
                  </div>

                  {moveForm.action === "next_round" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Next Round</label>
                        <input
                          type="number"
                          className="border p-2 rounded w-full"
                          value={moveForm.next_round}
                          onChange={(e) => setMoveForm({ ...moveForm, next_round: parseInt(e.target.value) })}
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Interview Date</label>
                        <input
                          type="date"
                          className="border p-2 rounded w-full"
                          value={moveForm.interview_date}
                          onChange={(e) => setMoveForm({ ...moveForm, interview_date: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Interview Time</label>
                        <input
                          type="time"
                          className="border p-2 rounded w-full"
                          value={moveForm.interview_time}
                          onChange={(e) => setMoveForm({ ...moveForm, interview_time: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded-lg"
                    onClick={() => setShowMoveModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    onClick={submitMove}
                    disabled={!moveForm.action}
                  >
                    Send Email & Move
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}