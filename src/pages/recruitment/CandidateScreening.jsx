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

        <div className="p-6">
          {/* HEADER */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Candidate Screening</h1>
            <p className="" style={{color: 'var(--text-secondary, #374151)'}}>
              Job: <span className="font-medium">{job.title}</span> - {job.department}
            </p>
            <p className="text-sm text-muted mt-1">
              Review applications and shortlist candidates for ATS pipeline
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedCandidates.length === applications.length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-sm text-secondary">
                {selectedCandidates.length} of {applications.length} selected
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={openScheduleModal}
                disabled={selectedCandidates.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Schedule Interviews ({selectedCandidates.length})
              </button>
              
              <button
                onClick={() => window.location.href = `/ats?job=${jobId}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                View ATS Pipeline
              </button>
            </div>
          </div>

          {/* APPLICATIONS TABLE */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="min-w-full">
              <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-gray-100 text-secondary text-sm">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.length === applications.length && applications.length > 0}
                      onChange={selectAll}
                    />
                  </th>
                  <th className="p-3 text-left">Candidate</th>
                  <th className="p-3 text-left">Experience</th>
                  <th className="p-3 text-left">Skills</th>
                  <th className="p-3 text-center">Match Score</th>
                  <th className="p-3 text-center">Applied</th>
                  <th className="p-3 text-center">Resume</th>
                </tr>
              </thead>

              <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                {applications.map((app) => (
                  <tr key={app.id} className="border-t hover:bg-content" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(app.id)}
                        onChange={() => toggleSelection(app.id)}
                      />
                    </td>
                    
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{app.name}</div>
                        <div className="text-sm text-secondary">{app.email}</div>
                        <div className="text-sm text-secondary">{app.phone}</div>
                      </div>
                    </td>
                    
                    <td className="p-3">{app.experience || "—"}</td>
                    
                    <td className="p-3">
                      <div className="text-sm max-w-xs truncate" title={app.skills}>
                        {app.skills || "—"}
                      </div>
                    </td>
                    
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded ${
                        app.match_score >= 80 ? 'bg-green-100 text-green-700' :
                        app.match_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {app.match_score}%
                      </span>
                    </td>
                    
                    <td className="p-3 text-center text-sm text-secondary">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    
                    <td className="p-3 text-center">
                      {app.resume_url ? (
                        <a
                          href={`http://localhost:8000/uploads/resumes/${app.resume_url}`}
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

            {applications.length === 0 && (
              <div className="p-8 text-center text-muted">
                No applications found for this job
              </div>
            )}
          </div>

          {/* INTERVIEW SCHEDULING MODAL */}
          {showScheduleModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Schedule Round 1 Interviews</h2>
                <p className=" mb-2" style={{color: 'var(--text-secondary, #374151)'}}>
                  <strong>Job:</strong> {job?.title} - {job?.department}
                </p>
                <p className=" mb-4" style={{color: 'var(--text-secondary, #374151)'}}>
                  <strong>Round 1:</strong> {job?.round_names?.[0]?.name || job?.round_names?.[0] || "Interview"}
                </p>
                <p className="text-sm text-muted mb-4">
                  Set Round 1 interview dates and times. Shortlist emails with complete interview process will be sent automatically.
                </p>

                <div className="space-y-4">
                  {selectedCandidates.map(candidateId => {
                    const candidate = applications.find(app => app.id === candidateId);
                    return (
                      <div key={candidateId} className="border p-4 rounded bg-content" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                        <div className="font-medium mb-2">{candidate?.name}</div>
                        <div className="text-sm text-secondary mb-2">{candidate?.email}</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Round 1 Date</label>
                            <input
                              type="date"
                              value={interviewSchedules[candidateId]?.interview_date || ''}
                              onChange={(e) => updateSchedule(candidateId, 'interview_date', e.target.value)}
                              className="w-full border p-2 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Round 1 Time</label>
                            <input
                              type="time"
                              value={interviewSchedules[candidateId]?.interview_time || ''}
                              onChange={(e) => updateSchedule(candidateId, 'interview_time', e.target.value)}
                              className="w-full border p-2 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={shortlistWithInterviews}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
