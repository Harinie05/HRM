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
  const [isReferral, setIsReferral] = useState(false);
  const [referralData, setReferralData] = useState({
    employee_code: "",
    employee_name: "",
    department: "",
    role: ""
  });
  const [referralValidated, setReferralValidated] = useState(false);
  const [validatingReferral, setValidatingReferral] = useState(false);
  
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

  // -------------------- VALIDATE REFERRAL --------------------
  const validateReferral = async (employeeCode) => {
    if (!employeeCode.trim()) {
      setReferralValidated(false);
      return;
    }

    setValidatingReferral(true);
    try {
      const response = await api.get(`/employee/validate/${employeeCode}`);
      if (response.data.exists) {
        setReferralValidated(true);
      } else {
        setReferralValidated(false);
        alert("Employee code not found in EIS system.");
      }
    } catch (error) {
      setReferralValidated(false);
      alert("Failed to validate employee code.");
    } finally {
      setValidatingReferral(false);
    }
  };

  // -------------------- FIELD UPDATE -------------------------
  const updateField = (key, value) =>
    setForm({ ...form, [key]: value });

  // -------------------- REFERRAL FIELD UPDATE ----------------
  const updateReferralField = (key, value) => {
    setReferralData({ ...referralData, [key]: value });
    if (key === 'employee_code') {
      setReferralValidated(false);
    }
  };

  // -------------------- SUBMIT APPLICATION --------------------
  const submitApplication = async () => {
    console.log("Resume state:", resume);
    console.log("Resume name:", resume?.name);
    
    if (!resume) {
      alert("Please upload your resume");
      return;
    }

    // Validate referral if checkbox is checked
    if (isReferral && !referralValidated) {
      alert("Please provide a valid employee code for referral");
      return;
    }

    const data = new FormData();
    data.append("name", form.name);
    data.append("email", form.email);
    data.append("phone", form.phone);
    data.append("experience", form.experience);
    data.append("skills", form.skills);
    data.append("resume", resume);
    
    // Add referral data if applicable
    if (isReferral && referralValidated) {
      data.append("is_referral", "true");
      data.append("referral_employee_code", referralData.employee_code);
    }

    try {
      await api.post(`/recruitment/public/apply/${jobId}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const successMessage = isReferral && referralValidated
        ? `Application submitted successfully via employee referral!`
        : "Application submitted successfully!";
      
      alert(successMessage);
      
      // Reset form
      setForm({
        name: "",
        email: "",
        phone: "",
        experience: "",
        skills: "",
      });
      setResume(null);
      setIsReferral(false);
      setReferralData({ employee_code: "", employee_name: "", department: "", role: "" });
      setReferralValidated(false);
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
        <p className=" mb-4" style={{color: 'var(--text-secondary, #374151)'}}>{job.department}</p>

        <h2 className="text-lg font-semibold mb-1">Job Description</h2>
        <p className=" whitespace-pre-line mb-6" style={{color: 'var(--text-secondary, #374151)'}}>
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
            className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
          />

          <input
            type="tel"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
          />

          <input
            type="text"
            placeholder="Experience (e.g., 3 years)"
            value={form.experience}
            onChange={(e) => updateField("experience", e.target.value)}
            className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
          />

          <textarea
            placeholder="Skills (comma-separated)"
            value={form.skills}
            onChange={(e) => updateField("skills", e.target.value)}
            className="border p-2 rounded w-full h-24" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
          ></textarea>

          {/* Referral Section */}
          <div className="border-t pt-4" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="referral-checkbox"
                checked={isReferral}
                onChange={(e) => {
                  setIsReferral(e.target.checked);
                  if (!e.target.checked) {
                    setReferralData({ employee_code: "", employee_name: "", department: "", role: "" });
                    setReferralValidated(false);
                  }
                }}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="referral-checkbox" className="text-sm font-medium text-secondary">
                🔗 I was referred by an employee
              </label>
            </div>

            {isReferral && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-blue-800">Referral Information</h4>
                <p className="text-sm text-blue-600">
                  Please provide the employee code of the person who referred you.
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Employee Code *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter employee code (e.g., EMP001, 1234)"
                      value={referralData.employee_code}
                      onChange={(e) => updateReferralField("employee_code", e.target.value)}
                      className={`border p-2 rounded w-full ${
                        referralValidated ? 'border-green-500' : '-dark'
                      }`}
                    />
                    {validatingReferral && (
                      <div className="text-sm text-blue-600 mt-1">Validating...</div>
                    )}
                    {referralValidated && (
                      <div className="text-sm text-green-600 mt-1">✓ Valid employee code</div>
                    )}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => validateReferral(referralData.employee_code.trim())}
                  disabled={!referralData.employee_code.trim() || validatingReferral}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {validatingReferral ? 'Validating...' : 'Validate Employee'}
                </button>
              </div>
            )}
          </div>

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
                if (file) {
                  setResume(file);
                }
              }}
              className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
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
