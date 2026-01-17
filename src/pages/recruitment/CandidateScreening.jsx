import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission } from "../../utils/permissions";

export default function CandidateScreening() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job");
  const { toast, showToast, hideToast } = useToast();
  
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [interviewSchedules, setInterviewSchedules] = useState({});

  // Add style to hide scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Check permissions
  const canViewCandidates = hasPermission('view_candidates');
  const canScreenCandidates = hasPermission('screen_candidates');
  const canSelectCandidates = hasPermission('select_candidates');
  const canScheduleInterviews = hasPermission('schedule_interviews');
  const canViewATS = hasPermission('view_ats_pipeline');
  const canViewResumes = hasPermission('view_resumes');

  // Get base URL from api instance
  const getResumeUrl = (resumeUrl) => {
    return `${api.defaults.baseURL}/uploads/resumes/${resumeUrl}`;
  };

  if (!canViewCandidates) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">You don't have permission to view candidates.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ========================= FETCH APPLICATIONS =========================
  const fetchApplications = async () => {
    if (!jobId) return;
    
    try {
      const res = await api.get(`/recruitment/screening/pending/${jobId}`);
      setJob(res.data.job);
      setApplications(res.data.applications);
    } catch (err) {
      console.error("Failed to load applications", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  // ========================= OPEN SCHEDULE MODAL =========================
  const openScheduleModal = () => {
    if (selectedCandidates.length === 0) {
      showToast("Please select candidates to shortlist", "error");
      return;
    }
    
    // Initialize default interview schedules
    const defaultSchedules = {};
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];
    
    selectedCandidates.forEach(candidateId => {
      defaultSchedules[candidateId] = {
        interview_date: defaultDate,
        interview_time: "10:00"
      };
    });
    
    setInterviewSchedules(defaultSchedules);
    setShowScheduleModal(true);
  };

  // ========================= SHORTLIST WITH INTERVIEWS =========================
  const shortlistWithInterviews = async () => {
    try {
      const schedules = selectedCandidates.map(candidateId => ({
        candidate_id: candidateId,
        interview_date: interviewSchedules[candidateId].interview_date,
        interview_time: interviewSchedules[candidateId].interview_time
      }));
      
      await api.post("/recruitment/screening/shortlist-with-interviews", schedules);
      showToast(`Successfully shortlisted ${selectedCandidates.length} candidates with interview invitations sent!`, "success");
      
      setSelectedCandidates([]);
      setShowScheduleModal(false);
      setInterviewSchedules({});
      fetchApplications();
    } catch (err) {
      console.error("Failed to shortlist candidates", err);
      showToast("Failed to shortlist candidates", "error");
    }
  };

  // ========================= UPDATE SCHEDULE =========================
  const updateSchedule = (candidateId, field, value) => {
    setInterviewSchedules(prev => ({
      ...prev,
      [candidateId]: {
        ...prev[candidateId],
        [field]: value
      }
    }));
  };

  // ========================= TOGGLE SELECTION =========================
  const toggleSelection = (candidateId) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  // ========================= SELECT ALL =========================
  const selectAll = () => {
    if (selectedCandidates.length === applications.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(applications.map(app => app.id));
    }
  };

  if (loading) return <div className="p-6">Loading applications...</div>;
  if (!job) return <div className="p-6">Job not found</div>;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-0 shadow-sm p-4 sm:p-6 mb-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Candidate Screening</h1>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Job: <span className="font-medium">{job.title}</span> - {job.department}</p>
                <p className="text-gray-500 text-xs">Review applications and shortlist candidates for ATS pipeline</p>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="bg-white rounded-2xl border-0 p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <button
                onClick={selectAll}
                className="text-sm hover:text-blue-800 self-start"
                style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
              >
                {selectedCandidates.length === applications.length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-sm text-gray-600">
                {selectedCandidates.length} of {applications.length} selected
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {canScheduleInterviews && (
                <button
                  onClick={openScheduleModal}
                  disabled={selectedCandidates.length === 0}
                  className="text-white px-4 py-2 rounded-lg disabled:bg-gray-400 text-sm transition-colors"
                  style={{
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5')}
                >
                  Schedule Interviews ({selectedCandidates.length})
                </button>
              )}
              
              {canViewATS && (
                <button
                  onClick={() => window.location.href = `/ats?job=${jobId}`}
                  className="text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}
                >
                  View ATS Pipeline
                </button>
              )}
            </div>
          </div>
        </div>

        {/* APPLICATIONS TABLE */}
        <div className="bg-white rounded-2xl overflow-hidden relative border" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          {applications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 relative z-10">
              No applications found for this job
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto relative z-10" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <table className="min-w-full">
                  <thead className="bg-gray-100 text-gray-600 text-sm border-b-0">
                    <tr>
                      <th className="p-3 text-left">
                        {canSelectCandidates && (
                          <input style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                            type="checkbox"
                            checked={selectedCandidates.length === applications.length && applications.length > 0}
                            onChange={selectAll}
                          />
                        )}
                      </th>
                      <th className="p-3 text-left">Candidate</th>
                      <th className="p-3 text-left">Experience</th>
                      <th className="p-3 text-left">Skills</th>
                      <th className="p-3 text-left">Source</th>
                      <th className="p-3 text-center">Score</th>
                      <th className="p-3 text-center">Applied</th>
                      <th className="p-3 text-center">Resume</th>
                    </tr>
                  </thead>

                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="-t hover:bg-gray-50 border-gray-200">
                        <td className="p-3">
                          {canSelectCandidates && (
                            <input style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                              type="checkbox"
                              checked={selectedCandidates.includes(app.id)}
                              onChange={() => toggleSelection(app.id)}
                            />
                          )}
                        </td>
                        
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-base">{app.name}</div>
                            <div className="text-sm text-gray-600">{app.email}</div>
                          </div>
                        </td>
                        
                        <td className="p-3">{app.experience || "—"}</td>
                        
                        <td className="p-3">
                          <div className="text-sm max-w-xs truncate" title={app.skills}>
                            {app.skills || "—"}
                          </div>
                        </td>
                        
                        <td className="p-3">
                          {app.referral_code ? (
                            <div className="text-xs">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                👤 Referred by {app.referral_code}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Direct</span>
                          )}
                        </td>
                        
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 text-xs rounded ${
                            (app.match_score || 0) >= 80 ? 'bg-green-100 text-green-700' :
                            (app.match_score || 0) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {Math.round(app.match_score || 0)}%
                          </span>
                        </td>
                        
                        <td className="p-3 text-center text-sm text-gray-600">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </td>
                        
                        <td className="p-3 text-center">
                          {canViewResumes && app.resume_url ? (
                            <a
                              href={getResumeUrl(app.resume_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden relative z-10">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 border-b-0 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        {canSelectCandidates && (
                          <input style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                            type="checkbox"
                            checked={selectedCandidates.includes(app.id)}
                            onChange={() => toggleSelection(app.id)}
                            className="mt-1"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{app.name}</div>
                          <div className="text-sm text-gray-600">{app.email}</div>
                          <div className="text-sm text-gray-600">{app.phone}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        (app.match_score || 0) >= 80 ? 'bg-green-100 text-green-700' :
                        (app.match_score || 0) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {Math.round(app.match_score || 0)}%
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Experience:</span>
                        <span className="text-sm text-gray-600">{app.experience || "—"}</span>
                      </div>
                      
                      {app.skills && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">Skills:</span>
                          <span className="text-sm text-gray-600 text-right max-w-[200px] truncate" title={app.skills}>
                            {app.skills}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Source:</span>
                        <span className="text-sm text-gray-600">
                          {app.referral_code ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              👤 Referred
                            </span>
                          ) : (
                            "Direct"
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Applied:</span>
                        <span className="text-sm text-gray-600">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Resume:</span>
                        <span className="text-sm">
                          {canViewResumes && app.resume_url ? (
                            <a
                              href={getResumeUrl(app.resume_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View
                            </a>
                          ) : (
                            "—"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* INTERVIEW SCHEDULING MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-lg sm:max-w-2xl max-h-[80vh] overflow-y-auto relative border hide-scrollbar" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
              backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
              transform: 'translate(30%, -30%)'
            }}></div>
            <div className="relative z-10">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Schedule Round 1 Interviews</h2>
            <p className="text-gray-600 mb-2 text-sm sm:text-base">
              <strong>Job:</strong> {job?.title} - {job?.department}
            </p>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              <strong>Round 1:</strong> {job?.round_names?.[0]?.name || job?.round_names?.[0] || "Interview"}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Set Round 1 interview dates and times. Shortlist emails with complete interview process will be sent automatically.
            </p>

            <div className="space-y-4">
              {selectedCandidates.map(candidateId => {
                const candidate = applications.find(app => app.id === candidateId);
                return (
                  <div key={candidateId} className="p-3 sm:p-4 rounded bg-gray-50 relative overflow-hidden border" style={{
                    background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
                    borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
                  }}>
                    <div className="font-medium mb-2 text-sm sm:text-base">{candidate?.name}</div>
                    <div className="text-xs sm:text-sm text-gray-600 mb-2 truncate">{candidate?.email}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="text-sm font-medium">Round 1 Date</label>
                        <input
                          type="date"
                          value={interviewSchedules[candidateId]?.interview_date || ''}
                          onChange={(e) => updateSchedule(candidateId, 'interview_date', e.target.value)}
                          className="w-full p-2 rounded text-sm focus:ring-2 focus:outline-none"
                          style={{
                            backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                            border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Round 1 Time</label>
                        <input
                          type="time"
                          value={interviewSchedules[candidateId]?.interview_time || ''}
                          onChange={(e) => updateSchedule(candidateId, 'interview_time', e.target.value)}
                          className="w-full p-2 rounded text-sm focus:ring-2 focus:outline-none"
                          style={{
                            backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                            border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-white rounded transition-colors text-sm"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}
              >
                Cancel
              </button>
              <button
                onClick={shortlistWithInterviews}
                className="px-4 py-2 text-white rounded transition-colors text-sm"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}
              >
                Schedule Round 1 & Send Invitations
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}

