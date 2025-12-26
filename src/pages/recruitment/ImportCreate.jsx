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

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">Import Candidates</h1>

            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add Candidate
            </button>
          </div>

          {/* TABLE */}
          <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="min-w-full bg-white rounded-xl shadow">
            <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-gray-100 text-secondary text-sm">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Job</th>
                <th className="p-3 text-left">Experience</th>
                <th className="p-3 text-center">Resume</th>
              </tr>
            </thead>

            <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
              {candidates.map((c) => (
                <tr key={c.id} className="border-t" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.email}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3">{c.job_title}</td>
                  <td className="p-3">{c.experience}</td>
                  <td className="p-3 text-center">
                    {c.resume_url ? (
                      <a
                        href={c.resume_url}
                        target="_blank"
                        className="text-blue-600 underline"
                      >
                        View Resume
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

        {/* MODAL FORM */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white w-[600px] p-6 rounded-xl shadow-xl">

              <h2 className="text-xl font-semibold mb-4">Add Candidate</h2>

              <div className="space-y-3">

                {/* Job selection */}
                <select
                  className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
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
                  className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <input
                  type="email"
                  placeholder="Email"
                  className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />

                <input
                  type="text"
                  placeholder="Experience (e.g. 2 years)"
                  className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                  value={form.experience}
                  onChange={(e) =>
                    setForm({ ...form, experience: e.target.value })
                  }
                />

                <textarea
                  placeholder="Skills"
                  className="border p-2 rounded w-full h-20" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />

                {/* Resume upload */}
                <div>
                  <label className="text-sm font-medium">Upload Resume</label>
                  <input
                    type="file"
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    onChange={(e) => setResumeFile(e.target.files[0])}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  className="px-4 py-2 bg-gray-300 rounded-lg"
                  onClick={() => setShowForm(false)}
                >
                  Close
                </button>

                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
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
