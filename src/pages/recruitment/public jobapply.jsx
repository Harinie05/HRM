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
    <div className="min-h-screen bg-gray-50 flex justify-center p-6">
      <div className="w-full max-w-2xl">
        
        {/* JOB HEADER */}
        <div className="bg-white rounded-2xl mb-6 p-8 border border-black">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <p className="text-lg text-gray-600 mb-4">{job.department}</p>
            
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-3 text-gray-900">Job Description</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {job.description}
              </p>
            </div>
          </div>
        </div>

        {/* APPLICATION FORM */}
        <div className="bg-white rounded-2xl border border-black p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply for this job</h2>
          </div>

          <div className="space-y-6">
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full px-4 py-3 bg-white text-black border border-black rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
            />

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full px-4 py-3 bg-white text-black border border-black rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full px-4 py-3 bg-white text-black border border-black rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
            />

            <input
              type="text"
              placeholder="Experience (e.g., 3 years)"
              value={form.experience}
              onChange={(e) => updateField("experience", e.target.value)}
              className="w-full px-4 py-3 bg-white text-black border border-black rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
            />

            <textarea
              placeholder="Skills (comma-separated)"
              value={form.skills}
              onChange={(e) => updateField("skills", e.target.value)}
              className="w-full px-4 py-3 bg-white text-black border border-black rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all resize-none"
              rows={4}
            />

            {/* Referral Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-4">
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
                  className="w-4 h-4 text-blue-600 bg-white border-black rounded focus:ring-blue-500"
                />
                <label htmlFor="referral-checkbox" className="text-gray-900 font-medium">
                  🔗 I was referred by an employee
                </label>
              </div>

              {isReferral && (
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                  <h4 className="font-semibold text-blue-800 mb-3">Referral Information</h4>
                  <p className="text-sm text-blue-600 mb-4">
                    Please provide the employee code of the person who referred you.
                  </p>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter employee code (e.g., EMP001, 1234)"
                      value={referralData.employee_code}
                      onChange={(e) => updateReferralField("employee_code", e.target.value)}
                      className={`w-full px-4 py-3 bg-white text-black border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                        referralValidated ? 'border-green-500' : 'border-black'
                      }`}
                    />
                    {referralValidated && (
                      <div className="text-sm text-green-600">✓ Valid employee code</div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => validateReferral(referralData.employee_code.trim())}
                      disabled={!referralData.employee_code.trim() || validatingReferral}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {validatingReferral ? 'Validating...' : 'Validate Employee'}
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                  if (file) {
                    setResume(file);
                  }
                }}
                className="w-full px-4 py-3 bg-white text-black border border-black rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
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
