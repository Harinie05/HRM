import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api";
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2,
  Briefcase, 
  Users, 
  MapPin, 
  Clock,
  Building2,
  Filter,
  MoreHorizontal
} from "lucide-react";

export default function JobRequisition() {
  const [requisitions, setRequisitions] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("create");
  const [selectedReq, setSelectedReq] = useState(null);

  const fetchRequisitions = async () => {
    try {
      const res = await api.get("/recruitment/list");
      setRequisitions(res.data || []);
    } catch (err) {
      console.error("Failed to load requisitions");
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const openCreate = () => {
    setMode("create");
    setSelectedReq(null);
    setShowForm(true);
  };

  const openView = (req) => {
    setMode("view");
    setSelectedReq(req);
    setShowForm(true);
  };

  const openEdit = (req) => {
    setMode("edit");
    setSelectedReq(req);
    setShowForm(true);
  };

  const handleDelete = async (req) => {
    if (window.confirm('Are you sure you want to delete this job requisition?')) {
      try {
        await api.delete(`/recruitment/delete/${req.id}`);
        fetchRequisitions();
      } catch (err) {
        console.error("Failed to delete requisition");
      }
    }
  };

  const filteredRequisitions = requisitions.filter((r) =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl mb-6 p-6 border border-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Job Requisition</h1>
                <p className="text-gray-600 text-base font-medium">Manage job postings and recruitment process</p>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-medium">{requisitions.length} Active Jobs</span>
                  </div>
                  <div className="w-px h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-semibold">Real-time Updates</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={openCreate}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2"
            >
              <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center">
                <Plus className="w-3 h-3" />
              </div>
              <span className="text-sm">Create Job</span>
            </button>
          </div>
        </div>

        {/* Enhanced Search */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <div className="bg-white border border-black rounded-xl p-1">
              <div className="flex items-center space-x-2 px-3 py-2">
                <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
                  <Search className="w-3 h-3 text-gray-600" />
                </div>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Job Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequisitions.map((req) => (
            <div key={req.id} className="bg-white rounded-xl p-6 border border-black hover:shadow-lg transition-all duration-200">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{req.title}</h3>
                  <div className="flex items-center space-x-2 text-gray-500 mb-3">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm">{req.department}</span>
                  </div>
                </div>
                
                {/* Action Icons */}
                <div className="flex items-center space-x-1">
                  <div className="relative group">
                    <button
                      onClick={() => openView(req)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      View
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <button
                      onClick={() => openEdit(req)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-gray-500" />
                    </button>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Edit
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <button
                      onClick={() => handleDelete(req)}
                      className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Delete
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-900">{req.openings}</span>
                    <span className="text-xs text-gray-500">openings</span>
                  </div>
                  
                  {req.experience && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-gray-600">{req.experience}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-600">Active</span>
                </div>
              </div>
              
              {/* Location & Type */}
              {(req.location || req.work_mode) && (
                <div className="flex items-center space-x-4 mb-4">
                  {req.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{req.location}</span>
                    </div>
                  )}
                  
                  {req.work_mode && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-lg">
                      {req.work_mode}
                    </span>
                  )}
                </div>
              )}
              
              {/* Description */}
              {req.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {req.description}
                </p>
              )}
              
              {/* Salary */}
              {req.salary_range && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-sm font-semibold text-gray-900">{req.salary_range}</div>
                  <div className="text-xs text-gray-500">Salary Range</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRequisitions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No job requisitions found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first job requisition</p>
            <button
              onClick={openCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Create Job Requisition
            </button>
          </div>
        )}

        {/* Modal Form */}
        {showForm && (
          <JobRequisitionForm
            mode={mode}
            requisition={selectedReq}
            onClose={() => {
              setShowForm(false);
              fetchRequisitions();
            }}
          />
        )}
      </div>
    </Layout>
  );
}

function JobRequisitionForm({ mode, requisition, onClose }) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    title: "",
    department: "",
    hiring_manager: "",
    openings: 1,
    experience: "",
    salary_range: "",
    job_type: "Full-time",
    work_mode: "On-site",
    location: "",
    rounds: 1,
    round_names: {1: "Technical Round"},
    jd_text: "",
    skills: [],
    description: "",
    deadline: "",
  });

  useEffect(() => {
    if (isEdit || isView) {
      setForm(requisition);
    }
  }, [requisition]);

  const updateField = (key, value) => setForm({ ...form, [key]: value });

  const submitForm = async () => {
    try {
      const cleanedForm = {
        title: form.title || "",
        department: form.department || null,
        hiring_manager: form.hiring_manager || null,
        openings: parseInt(form.openings) || 1,
        experience: form.experience || null,
        salary_range: form.salary_range || null,
        job_type: form.job_type || null,
        work_mode: form.work_mode || null,
        location: form.location || null,
        rounds: parseInt(form.rounds) || 1,
        round_names: form.round_names || null,
        jd_text: form.jd_text || null,
        skills: Array.isArray(form.skills) ? form.skills : [],
        description: form.description || null,
        deadline: form.deadline || null,
      };

      if (mode === "create") {
        await api.post("/recruitment/create", cleanedForm);
        alert("Requisition Created!");
      } else {
        await api.put(`/recruitment/update/${requisition.id}`, cleanedForm);
        alert("Requisition Updated!");
      }

      onClose();
    } catch (err) {
      console.error("Form submission error:", err);
      alert("Failed to save requisition");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === "create" && "Create Job Requisition"}
                {mode === "edit" && "Edit Job Requisition"}
                {mode === "view" && "Requisition Details"}
              </h2>
              <p className="text-gray-500 mt-1">
                {mode === "create" && "Fill in the details to create a new job requisition"}
                {mode === "edit" && "Update the job requisition details"}
                {mode === "view" && "View the complete job requisition information"}
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                    <input
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., Senior Software Engineer"
                      disabled={isView}
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <input
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., Engineering"
                        disabled={isView}
                        value={form.department}
                        onChange={(e) => updateField("department", e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hiring Manager</label>
                      <input
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Manager name"
                        disabled={isView}
                        value={form.hiring_manager}
                        onChange={(e) => updateField("hiring_manager", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Openings</label>
                      <input
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        type="number"
                        min="1"
                        disabled={isView}
                        value={form.openings}
                        onChange={(e) => updateField("openings", parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                      <input
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., 3-5 years"
                        disabled={isView}
                        value={form.experience}
                        onChange={(e) => updateField("experience", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Job Details */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-green-600" />
                  Job Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                    <input
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., 5-8 LPA"
                      disabled={isView}
                      value={form.salary_range}
                      onChange={(e) => updateField("salary_range", e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                      <select
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        disabled={isView}
                        value={form.job_type}
                        onChange={(e) => updateField("job_type", e.target.value)}
                      >
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Internship</option>
                        <option>Contract</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
                      <select
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        disabled={isView}
                        value={form.work_mode}
                        onChange={(e) => updateField("work_mode", e.target.value)}
                      >
                        <option>On-site</option>
                        <option>Hybrid</option>
                        <option>Remote</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Location</label>
                    <input
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., Bangalore, India"
                      disabled={isView}
                      value={form.location}
                      onChange={(e) => updateField("location", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* Job Description */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Job Description
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brief Description</label>
                    <textarea
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      rows="3"
                      placeholder="Brief overview of the role..."
                      disabled={isView}
                      value={form.description}
                      onChange={(e) => updateField("description", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Job Description</label>
                    <textarea
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      rows="6"
                      placeholder="Detailed job description, responsibilities, requirements..."
                      disabled={isView}
                      value={form.jd_text}
                      onChange={(e) => updateField("jd_text", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                    <input
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., React, Node.js, Python (comma-separated)"
                      disabled={isView}
                      value={Array.isArray(form.skills) ? form.skills.join(', ') : (form.skills || '')}
                      onChange={(e) => updateField("skills", e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])}
                    />
                  </div>
                </div>
              </div>
              
              {/* Interview Process */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-orange-600" />
                  Interview Process
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interview Rounds</label>
                      <input
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        type="number"
                        min="1"
                        max="10"
                        disabled={isView}
                        value={form.rounds}
                        onChange={(e) => {
                          const rounds = parseInt(e.target.value) || 1;
                          updateField("rounds", rounds);
                          const roundNames = {};
                          for(let i = 1; i <= rounds; i++) {
                            roundNames[i] = `Round ${i}`;
                          }
                          updateField("round_names", roundNames);
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                      <input
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        type="date"
                        disabled={isView}
                        value={form.deadline}
                        onChange={(e) => updateField("deadline", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-6 rounded-b-3xl">
          <div className="flex items-center justify-between">
            <button
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            
            {!isView && (
              <button
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                onClick={submitForm}
              >
                {mode === "create" ? "Create Requisition" : "Update Requisition"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
