import { useEffect, useState } from "react";
import api from "../../api";
import { useParams } from "react-router-dom";
import Toast from "../../components/Toast";
import useToast from "../../utils/useToast";
import { Briefcase, MapPin, Clock, DollarSign, Users, FileText, Mail, Phone, Award, Upload } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 mb-4 relative overflow-hidden border" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}15`
              }}>
                <Briefcase size={24} style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 text-center">
              {job.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}15`,
                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}>
                <Users size={14} />
                {job.department}
              </span>
              
              {job.location && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  <MapPin size={14} />
                  {job.location}
                </span>
              )}
              
              {job.job_type && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <Clock size={14} />
                  {job.job_type}
                </span>
              )}
            </div>

            {/* Job Details Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {job.experience_years && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                  <Award size={16} className="text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="text-xs font-medium text-gray-900">{job.experience_years} years</p>
                  </div>
                </div>
              )}
              
              {job.openings && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                  <Users size={16} className="text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">Openings</p>
                    <p className="text-xs font-medium text-gray-900">{job.openings} position{job.openings > 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
              
              {job.salary_range && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                  <DollarSign size={16} className="text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">Salary Range</p>
                    <p className="text-xs font-medium text-gray-900">{job.salary_range}</p>
                  </div>
                </div>
              )}
              
              {job.work_mode && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                  <MapPin size={16} className="text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">Work Mode</p>
                    <p className="text-xs font-medium text-gray-900">{job.work_mode}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Job Description */}
            {job.description && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Job Description
                  </h2>
                </div>
                <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                  {job.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* APPLICATION FORM */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 relative overflow-hidden border" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}05 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 left-0 w-24 h-24 rounded-full blur-3xl opacity-20" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(-30%, -30%)'
          }}></div>
          
          <div className="relative z-10">
            <div className="text-center mb-5">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Apply for this position
              </h2>
              <p className="text-xs text-gray-600">Fill in your details below to submit your application</p>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 focus:border-transparent transition-all text-sm"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}08`,
                      borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}40`
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 focus:border-transparent transition-all text-sm"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}08`,
                      borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}40`
                    }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 focus:border-transparent transition-all text-sm"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}08`,
                      borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}40`
                    }}
                  />
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Award size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., 3 years"
                    value={form.experience}
                    onChange={(e) => updateField("experience", e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 focus:border-transparent transition-all text-sm"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}08`,
                      borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}40`
                    }}
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills *
                </label>
                <textarea
                  placeholder="List your relevant skills (comma-separated)&#10;e.g., JavaScript, React, Node.js, Python"
                  value={form.skills}
                  onChange={(e) => updateField("skills", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:border-transparent transition-all resize-none text-sm"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}08`,
                    borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}40`
                  }}
                  rows={3}
                />
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Resume *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setResume(file);
                    }}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="flex items-center justify-center gap-2 w-full px-3 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all"
                    style={{
                      backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}05`,
                      borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}40`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}60`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}40`;
                    }}
                  >
                    <Upload size={18} className="text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {resume ? resume.name : 'Click to upload PDF or DOC file'}
                    </span>
                  </label>
                  {resume && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      File selected successfully
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={submitApplication}
              className="mt-6 w-full font-semibold py-3 px-6 rounded-lg text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
              style={{
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
              }}
            >
              Submit Application
            </button>
          </div>
        </div>

      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
}

