import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../api";

export default function ImportCandidates() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [resumeFile, setResumeFile] = useState(null);

  const [form, setForm] = useState({
    job_id: "",
    name: "",
    email: "",
    phone: "",
    experience: "",
    skills: "",
    resume_url: ""
  });

  // =============================== FETCH JOBS ===============================
  const fetchJobs = async () => {
    try {
      const res = await api.get("/recruitment/list");
      setJobs(res.data || []);
    } catch (err) {
      console.error("Failed to load jobs");
    }
  };

  // =============================== FETCH IMPORTED CANDIDATES ===============================
  const fetchImported = async () => {
    try {
      const res = await api.get("/recruitment/import/list");
      setCandidates(res.data || []);
    } catch (err) {
      console.error("Failed to load imported candidates");
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchImported();
  }, []);

  // =============================== UPLOAD RESUME ===============================
  const uploadResume = async () => {
    try {
      if (!resumeFile) return null;

      const fd = new FormData();
      fd.append("file", resumeFile);

      const res = await api.post("/recruitment/import/upload-resume", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return res.data.resume_url;

    } catch (err) {
      console.error("Resume upload failed");
      alert("Resume upload failed");
      return null;
    }
  };

  // =============================== SAVE CANDIDATE ===============================
  const saveCandidate = async () => {
    try {
      let uploadedResumeUrl = form.resume_url;

      // Upload resume file if selected
      if (resumeFile) {
        uploadedResumeUrl = await uploadResume();
      }

      const payload = {
        ...form,
        resume_url: uploadedResumeUrl,
      };

      await api.post("/recruitment/import-candidate", payload);

      alert("Candidate Imported Successfully!");
      setShowForm(false);
      setForm({
        job_id: "",
        name: "",
        email: "",
        phone: "",
        experience: "",
        skills: "",
        resume_url: ""
      });
      setResumeFile(null);
      fetchImported();

    } catch (err) {
      console.error("Failed to import candidate");
      alert("Failed to import candidate");
    }
  };

  // =============================== RENDER ===============================
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-content min-h-screen">
        <Header />

        <div className="p-4 sm:p-6 pt-32">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold">Import Candidates</h1>

            <button
              onClick={() => setShowForm(true)}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm sm:text-base border border-black"
            >
              + Add Candidate
            </button>
          </div>

          {/* CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-black p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 border border-black">
                    {c.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{c.email}</p>
                    <p className="text-sm text-gray-500">{c.phone}</p>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Job:</span>
                        <span className="text-xs font-medium text-gray-700 truncate ml-2">{c.job_title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Experience:</span>
                        <span className="text-xs font-medium text-gray-700">{c.experience}</span>
                      </div>
                    </div>
                    
                    {/* Resume Link */}
                    <div className="mt-3">
                      {c.resume_url ? (
                        <a
                          href={c.resume_url}
                          target="_blank"
                          className="inline-flex items-center text-xs text-gray-900 hover:text-gray-700 font-medium border border-black px-2 py-1 rounded"
                        >
                          📄 View Resume
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No resume</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Empty State */}
          {candidates.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates imported yet</h3>
              <p className="text-gray-500">Start by adding your first candidate using the button above.</p>
            </div>
          )}
        </div>

        {/* MODAL FORM */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white w-full max-w-lg sm:max-w-xl p-4 sm:p-6 rounded-xl shadow-xl border border-black max-h-[90vh] overflow-y-auto">

              <h2 className="text-lg sm:text-xl font-semibold mb-4">Add Candidate</h2>

              <div className="space-y-3">

                {/* Job selection */}
                <select
                  className="border border-black p-2 rounded w-full text-sm sm:text-base"
                  value={form.job_id}
                  onChange={(e) => setForm({ ...form, job_id: e.target.value })}
                >
                  <option value="">Select Job</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {j.department}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Candidate Name"
                  className="border border-black p-2 rounded w-full text-sm sm:text-base"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <input
                  type="email"
                  placeholder="Email"
                  className="border border-black p-2 rounded w-full text-sm sm:text-base"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  className="border border-black p-2 rounded w-full text-sm sm:text-base"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />

                <input
                  type="text"
                  placeholder="Experience (e.g. 2 years)"
                  className="border border-black p-2 rounded w-full text-sm sm:text-base"
                  value={form.experience}
                  onChange={(e) =>
                    setForm({ ...form, experience: e.target.value })
                  }
                />

                <textarea
                  placeholder="Skills"
                  className="border border-black p-2 rounded w-full h-20 text-sm sm:text-base"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />

                {/* Resume upload */}
                <div>
                  <label className="text-sm font-medium">Upload Resume</label>
                  <input
                    type="file"
                    className="border border-black p-2 rounded w-full text-sm"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-300 rounded-lg text-sm sm:text-base border border-black hover:bg-gray-400"
                  onClick={() => setShowForm(false)}
                >
                  Close
                </button>

                <button
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm sm:text-base border border-black hover:bg-gray-700"
                  onClick={saveCandidate}
                >
                  Save Candidate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
