import { useEffect, useState } from "react";
import api from "../../api";
import { useParams } from "react-router-dom";

export default function JobApply() {
  const { jobId } = useParams();

  // 🔹 Capture referral code silently from URL
  const referralCode = new URLSearchParams(window.location.search).get("ref");

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    skills: "",
  });

  const [resume, setResume] = useState(null);

  // -------------------- FETCH JOB DETAILS --------------------
  const fetchJob = async () => {
    try {
      const res = await api.get(`/recruitment/public/job/${jobId}`);
      setJob(res.data);
    } catch (err) {
      console.error("Failed to load job", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJob();
  }, []);

  // -------------------- FIELD UPDATE -------------------------
  const updateField = (key, value) =>
    setForm({ ...form, [key]: value });

  // -------------------- SUBMIT APPLICATION --------------------
  const submitApplication = async () => {
    if (!resume) {
      alert("Please upload your resume");
      return;
    }

    const data = new FormData();
    data.append("name", form.name);
    data.append("email", form.email);
    data.append("phone", form.phone);
    data.append("experience", form.experience);
    data.append("skills", form.skills);
    data.append("resume", resume);

    // 🔹 Attach referral silently (if exists)
    if (referralCode) {
      data.append("referral_code", referralCode);
    }

    try {
      await api.post(`/recruitment/public/apply/${jobId}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Application submitted successfully!");

      // Reset form
      setForm({
        name: "",
        email: "",
        phone: "",
        experience: "",
        skills: "",
      });
      setResume(null);
    } catch (err) {
      console.error("Application failed", err);
      alert("Failed to submit application");
    }
  };

  // -------------------- UI --------------------
  if (loading) return <div className="p-6">Loading job details...</div>;

  if (!job)
    return <div className="p-6 text-red-500">Job not found or expired.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* JOB HEADER */}
        <div className="bg-white rounded-2xl mb-6 p-8 border border-black">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {job.title}
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              {job.department}
            </p>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-3 text-gray-900">
                Job Description
              </h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {job.description}
              </p>
            </div>
          </div>
        </div>

        {/* APPLICATION FORM */}
        <div className="bg-white rounded-2xl border border-black p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Apply for this job
            </h2>
          </div>

          <div className="space-y-6">
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full px-4 py-3 bg-white text-black border border-black rounded-xl focus:ring-2 focus:ring-gray-500 transition-all"
            />

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full px-4 py-3 bg-white text-black border border-black rounded-xl focus:ring-2 focus:ring-gray-500 transition-all"
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full px-4 py-3 bg-white text-black border border-black rounded-xl focus:ring-2 focus:ring-gray-500 transition-all"
            />

            <input
              type="text"
              placeholder="Experience (e.g., 3 years)"
              value={form.experience}
              onChange={(e) => updateField("experience", e.target.value)}
              className="w-full px-4 py-3 bg-white text-black border border-black rounded-xl focus:ring-2 focus:ring-gray-500 transition-all"
            />

            <textarea
              placeholder="Skills (comma-separated)"
              value={form.skills}
              onChange={(e) => updateField("skills", e.target.value)}
              className="w-full px-4 py-3 bg-white text-black border border-black rounded-xl focus:ring-2 focus:ring-gray-500 transition-all resize-none"
              rows={4}
            />

            {/* Resume Upload */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block mb-2 text-sm font-medium text-gray-900">
                Upload Resume (PDF / DOC) *
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setResume(file);
                }}
                className="w-full px-4 py-3 bg-white text-black border border-black rounded-xl focus:ring-2 focus:ring-gray-500 transition-all"
              />
              {resume && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Selected: {resume.name}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={submitApplication}
            className="mt-8 w-full bg-white text-black font-semibold py-4 px-6 rounded-xl border border-black hover:bg-gray-50 transition-colors"
          >
            Submit Application
          </button>
        </div>

      </div>
    </div>
  );
}
