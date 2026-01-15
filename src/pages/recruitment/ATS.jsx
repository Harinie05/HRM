import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api";
import { FiUsers, FiCalendar, FiClock, FiArrowRight, FiFilter, FiSearch, FiEye, FiUserCheck, FiUserX } from "react-icons/fi";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission } from "../../utils/permissions";

export default function ATS() {
  const { toast, showToast, hideToast } = useToast();
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

  // Check permissions
  const canViewActiveJobs = hasPermission('view_active_jobs');
  const canViewATSCandidates = hasPermission('view_ats_candidates');
  const canMoveCandidates = hasPermission('move_candidates');

  if (!canViewActiveJobs) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">You don't have permission to view active jobs.</p>
          </div>
        </div>
      </Layout>
    );
  }

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
    if (!canViewATSCandidates) {
      showToast("You don't have permission to view ATS candidates", "error");
      return;
    }
    setSelectedJob(job);
    fetchCandidates(job.id);
  };

  const handleMoveCandidate = (candidate) => {
    if (!canMoveCandidates) {
      showToast("You don't have permission to move candidates", "error");
      return;
    }
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

      showToast(`Candidate ${moveForm.action} successfully!`, "success");
      setShowMoveModal(false);
      fetchCandidates(selectedJob.id);
    } catch (err) {
      console.error("Failed to move candidate");
      showToast("Failed to move candidate", "error");
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
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-0 shadow-sm p-4 sm:p-6 mb-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiUsers className="h-5 w-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Applicant Tracking System</h1>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Track and manage candidates through your recruitment pipeline</p>
                <p className="text-gray-500 text-xs">{jobs.length} Active Positions • Real-time Updates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-xl shadow-sm mb-6 relative overflow-hidden border" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="p-5 border-b-0 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{
                  backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <FiUsers className="h-5 w-5" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Active Job Positions</h2>
              </div>
              <div className="bg-white rounded-lg p-3 border-0 shadow-sm">
                <span className="text-sm font-semibold text-gray-900">{jobs.length}</span>
                <span className="text-xs text-gray-500 ml-1">positions</span>
              </div>
            </div>
          </div>
          <div className="p-5 relative z-10">
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active job positions found</h3>
                <p className="text-gray-500 text-sm">Create job requisitions to start tracking candidates</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleJobSelect(job)}
                    className={`group p-5 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md relative overflow-hidden ${
                      selectedJob?.id === job.id 
                        ? "shadow-sm" 
                        : "hover:border-gray-300"
                    }`}
                    style={{
                      background: selectedJob?.id === job.id 
                        ? `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}08, white)` 
                        : `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
                      border: `2px solid ${selectedJob?.id === job.id ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5' : `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`}`
                    }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10" style={{
                      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
                      transform: 'translate(30%, -30%)'
                    }}></div>
                    <div className="flex items-start justify-between mb-3 relative z-10">
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
                    
                    <div className="space-y-2 relative z-10">
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
          <div className="rounded-xl shadow-sm relative overflow-hidden border" style={{
            background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
            borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
          }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
              backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
              transform: 'translate(30%, -30%)'
            }}></div>
            <div className="px-6 py-4 border-b relative z-10">
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
                      className="pl-11 pr-4 py-2.5 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:outline-none transition-all text-sm"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl text-gray-900 focus:ring-2 focus:outline-none transition-all text-sm"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                      border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                    }}
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
            <div className="text-center py-12 relative z-10">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No candidates found for this position</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto relative z-10">
                <table className="min-w-full">
                  <thead className="bg-gray-50/80 border-b-0">
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
                            {canMoveCandidates && (
                              <button
                                onClick={() => handleMoveCandidate(candidate)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-colors"
                                style={{
                                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                                }}
                              >
                                <FiArrowRight className="mr-1" size={12} />
                                Move
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden relative z-10">
                {filteredCandidates.map((candidate) => (
                  <div key={candidate.id} className="p-4 border-b-0 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(candidate.stage)}`}>
                        {candidate.stage}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Experience:</span>
                        <span className="text-sm text-gray-600">{candidate.experience} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Round:</span>
                        <span className="text-sm text-gray-600">Round {candidate.current_round}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Interview:</span>
                        <span className="text-sm text-gray-600">
                          {candidate.interview_date ? (
                            <div className="flex items-center">
                              <FiCalendar className="mr-1" size={12} />
                              {new Date(candidate.interview_date).toLocaleDateString()}
                            </div>
                          ) : (
                            "Not scheduled"
                          )}
                        </span>
                      </div>
                    </div>
                    {canMoveCandidates && (
                      <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleMoveCandidate(candidate)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded-md transition-colors"
                          style={{
                            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                          }}
                        >
                          <FiArrowRight size={12} />
                          Move
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          </div>
        )}

        {/* Move Candidate Modal */}
        {showMoveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border-0">
              <div className="px-6 py-4 border-b-0">
                <h2 className="text-xl font-semibold text-gray-900">
                  Move Candidate: {selectedCandidate?.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update candidate status and schedule next steps
                </p>
              </div>

              <div className="p-6">
                <div className="rounded-xl p-6 space-y-6 relative overflow-hidden border" style={{
                  background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
                  borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                }}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10" style={{
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
                    transform: 'translate(30%, -30%)'
                  }}></div>
                  <div className="relative z-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Action *</label>
                    <select
                      className="w-full rounded-lg px-3 py-2 focus:ring-2 focus:outline-none"
                      style={{
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                      }}
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
                          className="w-full rounded-lg px-3 py-2 focus:ring-2 focus:outline-none"
                          style={{
                            backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                            border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                          }}
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
                            className="w-full rounded-lg px-3 py-2 focus:ring-2 focus:outline-none"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                            }}
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
                            className="w-full rounded-lg px-3 py-2 focus:ring-2 focus:outline-none"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                            }}
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
                            className="w-full rounded-lg px-3 py-2 focus:ring-2 focus:outline-none"
                            style={{
                              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                              border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                            }}
                            value={moveForm.interview_time}
                            onChange={(e) => setMoveForm({ ...moveForm, interview_time: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
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
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)')}
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
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}

