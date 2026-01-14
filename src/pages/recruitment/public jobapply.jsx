import { useEffect, useState } from "react";
import api from "../../api";
import { useParams } from "react-router-dom";
import Toast from "../../components/Toast";
import useToast from "../../utils/useToast";

export default function JobApply() {
  const { jobId } = useParams();
  const { toast, showToast, hideToast } = useToast();

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
      showToast("Failed to load job details", "error");
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
      showToast("Please upload your resume", "error");
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

      showToast("Application submitted successfully!");

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
      showToast("Failed to submit application", "error");
    }
  };

  // -------------------- UI --------------------
  if (loading) return <div className="p-6">Loading job details...</div>;

  if (!job)
    return <div className="p-6 text-red-500">Job not found or expired.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-0 shadow-sm p-6 mb-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{
              backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
            }}>
              <span className="text-lg">📄</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {job.title}
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              {job.department}
            </p>

            <div className="bg-gray-50 rounded-xl p-6 border-0">
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
        <div className="bg-white rounded-2xl border-0 p-8">
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
              className="w-full px-4 py-3 bg-white text-black border-0 rounded-xl focus:ring-2 focus:border-transparent transition-all"
              style={{
                focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}
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
            <div className="border-t-0 pt-6">
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
            className="mt-8 w-full font-semibold py-4 px-6 rounded-xl border-0 hover:bg-gray-50 transition-colors"
            style={{
              backgroundColor: 'white',
              color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') + '10' || '#4575b510';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
            }}
          >
            Submit Application
          </button>
        </div>

      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
}

