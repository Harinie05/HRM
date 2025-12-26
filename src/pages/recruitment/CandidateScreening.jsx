import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../api";

export default function CandidateScreening() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job");
  
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [interviewSchedules, setInterviewSchedules] = useState({});

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
      alert("Please select candidates to shortlist");
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
      alert(`Successfully shortlisted ${selectedCandidates.length} candidates with interview invitations sent!`);
      
      setSelectedCandidates([]);
      setShowScheduleModal(false);
      setInterviewSchedules({});
      fetchApplications();
    } catch (err) {
      console.error("Failed to shortlist candidates", err);
      alert("Failed to shortlist candidates");
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
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-content min-h-screen">
        <Header />

        <div className="p-4 sm:p-6">
          {/* HEADER */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold">Candidate Screening</h1>
            <p className="" style={{color: 'var(--text-secondary, #374151)'}}>
              Job: <span className="font-medium">{job.title}</span> - {job.department}
            </p>
            <p className="text-sm text-muted mt-1">
              Review applications and shortlist candidates for ATS pipeline
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-800 self-start"
              >
                {selectedCandidates.length === applications.length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-sm text-secondary">
                {selectedCandidates.length} of {applications.length} selected
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={openScheduleModal}
                disabled={selectedCandidates.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
              >
                Schedule Interviews ({selectedCandidates.length})
              </button>
              
              <button
                onClick={() => window.location.href = `/ats?job=${jobId}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                View ATS Pipeline
              </button>
            </div>
          </div>

          {/* APPLICATIONS TABLE */}
          <div className="bg-white rounded-xl shadow overflow-hidden border border-black">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 text-secondary text-sm border-b border-black">
                  <tr>
                    <th className="p-2 sm:p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.length === applications.length && applications.length > 0}
                        onChange={selectAll}
                      />
                    </th>
                    <th className="p-2 sm:p-3 text-left">Candidate</th>
                    <th className="p-2 sm:p-3 text-left hidden sm:table-cell">Experience</th>
                    <th className="p-2 sm:p-3 text-left hidden md:table-cell">Skills</th>
                    <th className="p-2 sm:p-3 text-center">Score</th>
                    <th className="p-2 sm:p-3 text-center hidden sm:table-cell">Applied</th>
                    <th className="p-2 sm:p-3 text-center">Resume</th>
                  </tr>
                </thead>

                <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-t hover:bg-content border-black">
                      <td className="p-2 sm:p-3">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(app.id)}
                          onChange={() => toggleSelection(app.id)}
                        />
                      </td>
                      
                      <td className="p-2 sm:p-3">
                        <div>
                          <div className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{app.name}</div>
                          <div className="text-xs sm:text-sm text-secondary truncate max-w-[120px] sm:max-w-none">{app.email}</div>
                          <div className="text-xs sm:text-sm text-secondary sm:hidden">{app.phone}</div>
                          <div className="text-xs text-secondary sm:hidden">{app.experience || "—"}</div>
                        </div>
                      </td>
                      
                      <td className="p-2 sm:p-3 hidden sm:table-cell">{app.experience || "—"}</td>
                      
                      <td className="p-2 sm:p-3 hidden md:table-cell">
                        <div className="text-sm max-w-xs truncate" title={app.skills}>
                          {app.skills || "—"}
                        </div>
                      </td>
                      
                      <td className="p-2 sm:p-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${
                          app.match_score >= 80 ? 'bg-green-100 text-green-700' :
                          app.match_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {app.match_score}%
                        </span>
                      </td>
                      
                      <td className="p-2 sm:p-3 text-center text-xs sm:text-sm text-secondary hidden sm:table-cell">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </td>
                      
                      <td className="p-2 sm:p-3 text-center">
                        {app.resume_url ? (
                          <a
                            href={`http://localhost:8000/uploads/resumes/${app.resume_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
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

            {applications.length === 0 && (
              <div className="p-8 text-center text-muted">
                No applications found for this job
              </div>
            )}
          </div>

          {/* INTERVIEW SCHEDULING MODAL */}
          {showScheduleModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
              <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-lg sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <h2 className="text-lg sm:text-xl font-bold mb-4">Schedule Round 1 Interviews</h2>
                <p className=" mb-2 text-sm sm:text-base" style={{color: 'var(--text-secondary, #374151)'}}>
                  <strong>Job:</strong> {job?.title} - {job?.department}
                </p>
                <p className=" mb-4 text-sm sm:text-base" style={{color: 'var(--text-secondary, #374151)'}}>
                  <strong>Round 1:</strong> {job?.round_names?.[0]?.name || job?.round_names?.[0] || "Interview"}
                </p>
                <p className="text-sm text-muted mb-4">
                  Set Round 1 interview dates and times. Shortlist emails with complete interview process will be sent automatically.
                </p>

                <div className="space-y-4">
                  {selectedCandidates.map(candidateId => {
                    const candidate = applications.find(app => app.id === candidateId);
                    return (
                      <div key={candidateId} className="border p-3 sm:p-4 rounded bg-content border-black">
                        <div className="font-medium mb-2 text-sm sm:text-base">{candidate?.name}</div>
                        <div className="text-xs sm:text-sm text-secondary mb-2 truncate">{candidate?.email}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="text-sm font-medium">Round 1 Date</label>
                            <input
                              type="date"
                              value={interviewSchedules[candidateId]?.interview_date || ''}
                              onChange={(e) => updateSchedule(candidateId, 'interview_date', e.target.value)}
                              className="w-full border border-black p-2 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Round 1 Time</label>
                            <input
                              type="time"
                              value={interviewSchedules[candidateId]?.interview_time || ''}
                              onChange={(e) => updateSchedule(candidateId, 'interview_time', e.target.value)}
                              className="w-full border border-black p-2 rounded text-sm"
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
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={shortlistWithInterviews}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Schedule Round 1 & Send Invitations
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
