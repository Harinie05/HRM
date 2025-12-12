import { useEffect, useState } from "react";
import api from "../../api";
import { useParams } from "react-router-dom";

export default function JobApply() {
  const { jobId } = useParams();
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
  
  // Debug: Log resume state changes
  useEffect(() => {
    console.log("Resume state changed:", resume);
  }, [resume]);

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
    console.log("Resume state:", resume);
    console.log("Resume name:", resume?.name);
    
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

    try {
      await api.post(`/recruitment/public/apply/${jobId}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Application submitted successfully!");
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
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="bg-white w-full max-w-2xl p-6 shadow-lg rounded-xl">

        {/* JOB HEADER */}
        <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
        <p className="text-gray-600 mb-4">{job.department}</p>

        <h2 className="text-lg font-semibold mb-1">Job Description</h2>
        <p className="text-gray-700 whitespace-pre-line mb-6">
          {job.description}
        </p>

        <hr className="my-6" />

        {/* APPLICATION FORM */}
        <h2 className="text-xl font-semibold mb-4">Apply for this job</h2>

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="border p-2 rounded w-full"
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="border p-2 rounded w-full"
          />

          <input
            type="tel"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="border p-2 rounded w-full"
          />

          <input
            type="text"
            placeholder="Experience (e.g., 3 years)"
            value={form.experience}
            onChange={(e) => updateField("experience", e.target.value)}
            className="border p-2 rounded w-full"
          />

          <textarea
            placeholder="Skills (comma-separated)"
            value={form.skills}
            onChange={(e) => updateField("skills", e.target.value)}
            className="border p-2 rounded w-full h-24"
          ></textarea>

          {/* Resume Upload */}
          <div>
            <label className="block mb-1 text-sm font-medium">
              Upload Resume (PDF / DOC) *
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                console.log("File input changed:", file);
                console.log("Files array:", e.target.files);
                if (file) {
                  console.log("Setting resume to:", file.name);
                  setResume(file);
                } else {
                  console.log("No file selected");
                }
              }}
              className="border p-2 w-full rounded"
            />
            {resume && (
              <p className="text-sm text-green-600 mt-1">
                Selected: {resume.name}
              </p>
            )}
          </div>

        </div>

        <button
          onClick={submitApplication}
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Submit Application
        </button>

      </div>
    </div>
  );
}
