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
    <Layout>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl mb-6 p-4 sm:p-6 border border-black">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto sm:mx-0">
                <FiUsers className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Applicant Tracking System</h1>
                <p className="text-gray-600 text-sm sm:text-base font-medium">Track and manage candidates through your recruitment pipeline</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mt-2 gap-2 sm:gap-0">
                  <div className="flex items-center justify-center sm:justify-start space-x-2">
                    <span className="text-xs text-gray-500 font-medium">{jobs.length} Active Positions</span>
                  </div>
                  <div className="hidden sm:block w-px h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-semibold text-center sm:text-left">Real-time Updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-2xl border border-black mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Active Job Positions</h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full self-start sm:self-auto">{jobs.length} positions</span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">No active job positions found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleJobSelect(job)}
                    className={`group p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedJob?.id === job.id 
                        ? "border-black bg-gray-50 shadow-md" 
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {job.department}
                          </span>
                        </div>
                      </div>
                      <FiArrowRight className={`text-gray-400 group-hover:text-gray-600 transition-colors ${
                        selectedJob?.id === job.id ? 'text-gray-600' : ''
                      }`} size={18} />
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
          <div className="rounded-xl shadow-sm border" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
            <div className="px-6 py-4 border-b ">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-primary">
                    Candidates for {selectedJob.title}
                  </h2>
                  <p className="text-sm text-secondary mt-1">
                    {filteredCandidates.length} candidates found
                  </p>
                </div>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                      <FiSearch className="w-3 h-3 text-blue-600" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search candidates..."
                      className="pl-11 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm"
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
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No candidates found for this position</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interview</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white/50 divide-y divide-gray-200">
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-white/80 transition-colors">
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
                          <span className="text-sm text-gray-500">Not scheduled</span>
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
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Move Candidate: {selectedCandidate?.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update candidate status and schedule next steps
                </p>
              </div>

              <div className="p-6">
                <div className="border-2 border-black rounded-xl p-4 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Action *</label>
                    <select
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={moveForm.action}
                      onChange={(e) => setMoveForm({ ...moveForm, action: e.target.value })}
                    >
                      <option value="">Select Action</option>
                      <option value="next_round">Move to Next Round</option>
                      <option value="selected">Select Candidate</option>
                      <option value="rejected">Reject Candidate</option>
                    </select>
                  </div>

                  {moveForm.action === "selected" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-3">✅ Candidate Selected</h4>
                        <p className="text-sm text-gray-600">
                          {selectedCandidate?.name} will be marked as selected and moved to the offer stage.
                        </p>
                      </div>
                    </div>
                  )}

                  {moveForm.action === "next_round" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Next Round</label>
                        <select
                          className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={moveForm.interview_time}
                            onChange={(e) => setMoveForm({ ...moveForm, interview_time: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
                <button
                  className="px-6 py-2 border border-black text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setShowMoveModal(false)}
                >
                  Cancel
                </button>

                <button
                  style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  onClick={submitMove}
                  disabled={!moveForm.action}
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)')}
                  onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--primary-color, #2862e9)')}
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
