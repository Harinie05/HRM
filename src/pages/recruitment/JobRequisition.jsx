import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";
import { 
  Plus, 
  Search, 
  Eye, 
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
  const { toast, showToast, hideToast } = useToast();
  
  // Permission checks
  const canView = isAdmin() || hasPermission("view_job_requisition");
  const canAdd = isAdmin() || hasPermission("add_job_requisition");
  const canDelete = isAdmin() || hasPermission("delete_job_requisition");
  
  // Block access if no view permission
  if (!canView) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to view Job Requisitions.</p>
          </div>
        </div>
      </Layout>
    );
  }
  const [requisitions, setRequisitions] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("create");
  const [selectedReq, setSelectedReq] = useState(null);

  const fetchRequisitions = async () => {
    try {
      // Add timestamp to prevent caching
      const res = await api.get(`/recruitment/list?t=${Date.now()}`);
      console.log('Fetched requisitions:', res.data);
      setRequisitions(res.data || []);
    } catch (err) {
      console.error("Failed to load requisitions:", err);
      showToast('Failed to load job requisitions', 'error');
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const openCreate = () => {
    if (!canAdd) {
      showToast("You do not have permission to create job requisitions", 'error');
      return;
    }
    setMode("create");
    setSelectedReq(null);
    setShowForm(true);
  };

  const openView = (req) => {
    setMode("view");
    setSelectedReq(req);
    setShowForm(true);
  };

  const handleStatusToggle = async (req) => {
    const newStatus = req.status === 'Active' ? 'Inactive' : 'Active';
    
    try {
      await api.put(`/recruitment/update-status/${req.id}`, { status: newStatus });
      showToast(`Job ${newStatus.toLowerCase()} successfully!`);
      fetchRequisitions();
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast('Failed to update job status', 'error');
    }
  };

  const handleDelete = async (req) => {
    if (!canDelete) {
      showToast("You do not have permission to delete job requisitions", 'error');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this job requisition?')) {
      try {
        await api.put(`/recruitment/update-status/${req.id}`, { status: 'Inactive' });
        showToast('Job requisition deleted successfully!');
        fetchRequisitions();
      } catch (err) {
        console.error("Failed to delete requisition");
        showToast('Failed to delete job requisition', 'error');
      }
    }
  };

  const filteredRequisitions = requisitions.filter((r) => {
    const matchesSearch = r.title?.toLowerCase().includes(search.toLowerCase()) ||
                         r.department?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && (r.status === "Active" || r.status === "Draft" || !r.status)) ||
                         (statusFilter === "inactive" && r.status === "Inactive");
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <Users className="h-5 w-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Job Requisition</h1>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Manage job postings and recruitment process</p>
                <p className="text-gray-500 text-xs">{requisitions.length} Active Jobs • Real-time Updates</p>
              </div>
            </div>
            
            {canAdd && (
              <button
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 text-white px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium whitespace-nowrap hover:shadow-lg hover:transform hover:-translate-y-0.5 w-full sm:w-auto"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                  e.target.style.color = 'white';
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Create Job</span>
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{
                  focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All</option>
              </select>
            </div>
            
            <div className="relative max-w-md">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{
                  focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
              />
            </div>
          </div>
        </div>

        {/* Job Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequisitions.map((req) => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{req.title}</h3>
                  <div className="flex items-center space-x-2 text-gray-500 mb-2">
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
                  
                  {canDelete && (
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
                  )}
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-between mb-3">
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
                
                <button
                  onClick={() => handleStatusToggle(req)}
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg cursor-pointer transition-colors hover:opacity-80 ${
                    req.status === 'Active' ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
                  }`}
                  title="Click to toggle status"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    req.status === 'Active' ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className={`text-xs font-medium ${
                    req.status === 'Active' ? 'text-green-600' : 'text-red-600'
                  }`}>{req.status || 'Active'}</span>
                </button>
              </div>
              
              {/* Location & Type */}
              {(req.location || req.work_mode) && (
                <div className="flex items-center space-x-4 mb-3">
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
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {req.description}
                </p>
              )}
              
              {/* Salary */}
              {req.salary_range && (
                <div className="pt-3 border-t border-gray-100">
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
            {canAdd && (
              <button
                onClick={openCreate}
                className="text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                  e.target.style.color = 'white';
                }}
              >
                Create Job Requisition
              </button>
            )}
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
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}

function JobRequisitionForm({ mode, requisition, onClose }) {
  const { toast, showToast, hideToast } = useToast();
  const isView = mode === "view";

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
    if (isView) {
      setForm({
        title: requisition?.title || "",
        department: requisition?.department || "",
        hiring_manager: requisition?.hiring_manager || "",
        openings: requisition?.openings || 1,
        experience: requisition?.experience || "",
        salary_range: requisition?.salary_range || "",
        job_type: requisition?.job_type || "Full-time",
        work_mode: requisition?.work_mode || "On-site",
        location: requisition?.location || "",
        rounds: requisition?.rounds || 1,
        round_names: requisition?.round_names || {1: "Technical Round"},
        jd_text: requisition?.jd_text || "",
        skills: requisition?.skills || [],
        description: requisition?.description || "",
        deadline: requisition?.deadline || "",
      });
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
        status: "Active",
      };

      const response = await api.post("/recruitment/create", cleanedForm);
      console.log('Job created:', response.data);
      showToast("Job created successfully!");
      // Force refresh the parent component
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error("Form submission error:", err);
      showToast("Failed to save requisition", 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black">
                {mode === "create" && "Create Job Requisition"}
                {mode === "view" && "Requisition Details"}
              </h2>
              <p className="text-gray-600 mt-1">
                {mode === "create" && "Fill in the details to create a new job requisition"}
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
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{
                        focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }}
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                        style={{
                          focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }}
                        placeholder="e.g., Engineering"
                        disabled={isView}
                        value={form.department}
                        onChange={(e) => updateField("department", e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hiring Manager</label>
                      <input
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                        style={{
                          focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }}
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                        style={{
                          focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }}
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                        style={{
                          focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }}
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
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                  Job Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{
                        focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }}
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                        style={{
                          focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }}
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                        style={{
                          focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                        }}
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{
                        focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }}
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
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Job Description
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brief Description</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm resize-none"
                      style={{
                        focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }}
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm resize-none"
                      style={{
                        focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }}
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{
                        focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }}
                      placeholder="e.g., React, Node.js, Python (comma-separated)"
                      disabled={isView}
                      value={Array.isArray(form.skills) ? form.skills.join(', ') : (form.skills || '')}
                      onChange={(e) => updateField("skills", e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])}
                    />
                  </div>
                </div>
              </div>
              
              {/* Interview Process */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" style={{
                    color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                  }} />
                  Interview Process
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{
                        focusRingColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                      }}
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
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <button
              className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium transition-colors hover:bg-gray-50"
              onClick={onClose}
            >
              Cancel
            </button>
            
            {!isView && (
              <button
                className="px-8 py-3 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                }}
                onClick={submitForm}
              >
                Create Requisition
              </button>
            )}
          </div>
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
}
