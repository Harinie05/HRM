import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api";
import { FiUsers, FiCalendar, FiClock, FiArrowRight, FiFilter, FiSearch, FiEye, FiUserCheck, FiUserX } from "react-icons/fi";

export default function ATS() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [moveForm, setMoveForm] = useState({
    action: "",
    next_round: 2,
    interview_date: "",
    interview_time: "",
    custom_round_name: ""
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
    const nextRound = candidate.current_round + 1;
    setMoveForm({
      action: "",
      next_round: nextRound,
      interview_date: "",
      interview_time: "",
      custom_round_name: ""
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

  // Filter candidates based on search and stage
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = !stageFilter || candidate.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Get unique stages for filter
  const stages = [...new Set(candidates.map(c => c.stage).filter(Boolean))];

  return (
    <Layout breadcrumb="Recruitment · ATS">
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FiUsers className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Applicant Tracking System</h1>
                  <p className="text-gray-600 mt-1">Track and manage candidates through your recruitment pipeline</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
                  <div className="text-sm text-gray-600">Active Positions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Active Job Positions</h2>
              <span className="text-sm text-gray-500">{jobs.length} positions</span>
            </div>
          </div>
          <div className="p-6">
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No active job positions found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleJobSelect(job)}
                    className={`group p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedJob?.id === job.id 
                        ? "border-blue-500 bg-blue-50 shadow-md" 
                        : "border-gray-200 hover:border-blue-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {job.department}
                          </span>
                        </div>
                      </div>
                      <FiArrowRight className={`text-gray-400 group-hover:text-blue-500 transition-colors ${
                        selectedJob?.id === job.id ? 'text-blue-500' : ''
                      }`} size={20} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiUsers className="mr-2" size={14} />
                        <span>Rounds: {getRoundNames(job).join(", ") || "Not specified"}</span>
                      </div>
                      {job.openings && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">📍</span>
                          <span>{job.openings} openings</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Candidates Section */}
        {selectedJob && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Candidates for {selectedJob.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredCandidates.length} candidates found
                  </p>
                </div>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search candidates..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Stages</option>
                    {stages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {filteredCandidates.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No candidates found for this position</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interview</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                            <div className="text-sm text-gray-500">{candidate.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{candidate.experience} years</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(candidate.stage)}`}>
                            {candidate.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">Round {candidate.current_round}</span>
                        </td>
                        <td className="px-6 py-4">
                          {candidate.interview_date ? (
                            <div className="flex items-center text-sm text-gray-600">
                              <FiCalendar className="mr-1" size={14} />
                              {new Date(candidate.interview_date).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not scheduled</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleMoveCandidate(candidate)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                              <FiArrowRight className="mr-1" size={12} />
                              Move
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Move Candidate Modal */}
        {showMoveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Move Candidate: {selectedCandidate?.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update candidate status and schedule next steps
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action *</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Next Round</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={moveForm.next_round}
                        onChange={(e) => setMoveForm({ ...moveForm, next_round: parseInt(e.target.value) })}
                      >
                        {getRoundNames(selectedJob).map((roundName, index) => {
                          const roundNumber = index + 1;
                          if (roundNumber > selectedCandidate?.current_round) {
                            return (
                              <option key={roundNumber} value={roundNumber}>
                                Round {roundNumber}: {roundName}
                              </option>
                            );
                          }
                          return null;
                        })}
                        {selectedCandidate?.current_round >= getRoundNames(selectedJob).length && (
                          <option value={selectedCandidate.current_round + 1}>
                            Round {selectedCandidate.current_round + 1}: Additional Round
                          </option>
                        )}
                      </select>
                    </div>

                    {moveForm.next_round > getRoundNames(selectedJob).length && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Round Name</label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter round name (e.g., Final Interview, CEO Round)"
                          value={moveForm.custom_round_name}
                          onChange={(e) => setMoveForm({ ...moveForm, custom_round_name: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FiCalendar className="inline mr-1" size={14} />
                          Interview Date
                        </label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={moveForm.interview_date}
                          onChange={(e) => setMoveForm({ ...moveForm, interview_date: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FiClock className="inline mr-1" size={14} />
                          Interview Time
                        </label>
                        <input
                          type="time"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={moveForm.interview_time}
                          onChange={(e) => setMoveForm({ ...moveForm, interview_time: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
                <button
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setShowMoveModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  onClick={submitMove}
                  disabled={!moveForm.action}
                >
                  <FiArrowRight size={16} />
                  Send Email & Move
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
    </Layout>
  );
}