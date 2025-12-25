import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api";
import { FiSearch, FiFilter, FiPlus, FiEye, FiEdit, FiUsers, FiLink, FiPlay, FiPause, FiTrash2 } from "react-icons/fi";

export default function Recruitment() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState({});
  const [filters, setFilters] = useState({
    department: "",
    status: "",
    jobType: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit | view
  const [selectedJob, setSelectedJob] = useState(null);

  // ========================= FETCH JOBS =========================
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/recruitment/list");
      console.log("Jobs fetched:", res.data);
      res.data?.forEach((job, index) => {
        console.log(`Job ${index}: status = '${job.status}', length = ${job.status?.length}`);
      });
      setJobs(res.data || []);
    } catch (err) {
      console.error("Failed to load jobs", err);
      alert("Failed to load jobs. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // ========================= MODALS =========================
  const openCreate = () => {
    setMode("create");
    setSelectedJob(null);
    setShowForm(true);
  };

  const openEdit = (job) => {
    setMode("edit");
    setSelectedJob(job);
    setShowForm(true);
  };

  const openView = (job) => {
    setMode("view");
    setSelectedJob(job);
    setShowForm(true);
  };

  // ========================= PUBLISH / UNPUBLISH =========================
  const togglePublish = async (job) => {
    const currentStatus = job.status?.trim();
    const newStatus = currentStatus === "Posted" ? "Completed" : "Posted";
    
    try {
      // Use the existing update endpoint with the full job data
      await api.put(`/recruitment/update/${job.id}`, {
        ...job,
        status: newStatus
      });
      
      // Update the job status locally for immediate UI feedback
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === job.id ? { ...j, status: newStatus } : j
        )
      );
      
      alert(`Job ${newStatus === 'Posted' ? 'published' : 'unpublished'} successfully!`);
    } catch (err) {
      console.error("Failed to update job status", err);
      alert(`Failed to update job status: ${err.message || 'Unknown error'}`);
    }
  };

  // ========================= GENERATE APPLY LINK =========================
  const generateApplyLink = async (job) => {
    try {
      const res = await api.post(`/recruitment/generate-link/${job.id}`);
      const url = res.data.url;
      
      setGeneratedLinks(prev => ({
        ...prev,
        [job.id]: url
      }));
      
      // Copy to clipboard
      navigator.clipboard.writeText(url);
      alert("Job link generated and copied to clipboard!");
    } catch (err) {
      console.error("Failed to generate link", err);
      alert("Failed to generate job link");
    }
  };

  // ========================= DELETE JOB =========================
  const deleteJob = async (job) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"?`)) return;
    
    try {
      await api.delete(`/recruitment/delete/${job.id}`);
      fetchJobs();
      alert("Job deleted successfully!");
    } catch (err) {
      console.error("Failed to delete job", err);
      alert("Failed to delete job");
    }
  };

  // ========================= FILTER JOBS =========================
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
                         job.department.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = !filters.department || job.department === filters.department;
    const matchesStatus = !filters.status || job.status === filters.status;
    const matchesJobType = !filters.jobType || job.job_type === filters.jobType;
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesJobType;
  });

  // Get unique values for filters
  const departments = [...new Set(jobs.map(job => job.department).filter(Boolean))];
  const jobTypes = [...new Set(jobs.map(job => job.job_type).filter(Boolean))];

  const clearFilters = () => {
    setFilters({ department: "", status: "", jobType: "" });
    setSearch("");
  };

  // ========================================================================
  return (
    <Layout breadcrumb="Recruitment · Job Management">
      <div className="p-6">
        {/* HEADER */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FiUsers className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Recruitment Setup</h1>
                  <p className="text-gray-600 mt-1">Manage job postings and recruitment process</p>
                </div>
              </div>
              
              <button
                onClick={openCreate}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium"
              >
                <FiPlus size={18} />
                Create Job
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search jobs by title or department..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiFilter size={16} />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Posted">Published</option>
                </select>
                
                <select
                  value={filters.jobType}
                  onChange={(e) => setFilters({...filters, jobType: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Job Types</option>
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-semibold text-gray-800">{jobs.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUsers className="text-blue-600" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-semibold text-green-600">{jobs.filter(j => j.status?.trim() === 'Posted').length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiPlay className="text-green-600" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-semibold text-yellow-600">{jobs.filter(j => j.status?.trim() === 'Completed').length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiPause className="text-yellow-600" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Departments</p>
                <p className="text-2xl font-semibold text-purple-600">{departments.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiUsers className="text-purple-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* JOB TABLE */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-8 text-center">
              <FiUsers className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No jobs found matching your criteria</p>
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Openings</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-500">{job.experience} experience</div>
                          {job.location && (
                            <div className="text-xs text-gray-400">{job.location}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {job.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-gray-900">{job.openings}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600">{job.job_type || 'Full-time'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {job.status?.trim() === "Posted" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FiPlay className="mr-1" size={10} />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FiPause className="mr-1" size={10} />
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          {/* VIEW */}
                          <button
                            onClick={() => openView(job)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Job"
                          >
                            <FiEye size={16} />
                          </button>

                          {/* EDIT */}
                          <button
                            onClick={() => openEdit(job)}
                            className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Edit Job"
                          >
                            <FiEdit size={16} />
                          </button>

                          {/* SCREEN CANDIDATES */}
                          <button
                            onClick={() => window.location.href = `/screening?job=${job.id}`}
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Screen Candidates"
                          >
                            <FiUsers size={16} />
                          </button>

                          {/* GENERATE LINK */}
                          <button
                            onClick={() => generateApplyLink(job)}
                            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Generate Apply Link"
                          >
                            <FiLink size={16} />
                          </button>

                          {/* PUBLISH / UNPUBLISH */}
                          <button
                            onClick={() => togglePublish(job)}
                            className={`p-2 rounded-lg transition-colors ${
                              job.status?.trim() === "Posted"
                                ? "text-gray-600 hover:text-red-600 hover:bg-red-50"
                                : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={job.status?.trim() === "Posted" ? "Unpublish" : "Publish"}
                          >
                            {job.status?.trim() === "Posted" ? <FiPause size={16} /> : <FiPlay size={16} />}
                          </button>

                          {/* DELETE */}
                          <button
                            onClick={() => deleteJob(job)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Job"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                        
                        {/* GENERATED LINK FIELD */}
                        {generatedLinks[job.id] && (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={generatedLinks[job.id]}
                              readOnly
                              className="w-full text-xs border border-gray-200 p-2 rounded bg-gray-50 focus:outline-none"
                              onClick={(e) => e.target.select()}
                              placeholder="Generated link will appear here"
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* MODAL */}
        {showForm && (
          <JobFormModal
            mode={mode}
            job={selectedJob}
            onClose={() => {
              setShowForm(false);
              fetchJobs();
            }}
          />
        )}
      </div>
    </Layout>
  );
}

// JobForm Modal Component
function JobFormModal({ mode, job, onClose }) {
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
    rounds: 2,
    round_names: [{name: "Technical Round", description: ""}, {name: "HR Round", description: ""}],
    description: "",
    status: "Draft"
  });
  
  const [activeTab, setActiveTab] = useState('basic');
  
  const [existingJobs, setExistingJobs] = useState([]);
  
  // Fetch existing job titles
  const fetchExistingJobs = async () => {
    try {
      const res = await api.get("/recruitment/list");
      const uniqueTitles = [...new Set(res.data.map(j => j.title))]; // Remove duplicates
      setExistingJobs(uniqueTitles);
    } catch (err) {
      console.error("Failed to load existing jobs");
    }
  };

  useEffect(() => {
    fetchExistingJobs();
    
    if (job && (mode === "edit" || mode === "view")) {
      // Convert round_names from different formats
      const roundNames = job.round_names;
      let convertedRoundNames = [];
      
      if (Array.isArray(roundNames)) {
        // Check if it's already in new format
        if (roundNames[0] && typeof roundNames[0] === 'object' && roundNames[0].name) {
          convertedRoundNames = roundNames;
        } else {
          // Convert from simple array to object array
          convertedRoundNames = roundNames.map(name => ({name, description: ""}));
        }
      } else if (roundNames && typeof roundNames === 'object') {
        // Convert from object format
        convertedRoundNames = Object.values(roundNames).map(name => ({name, description: ""}));
      } else {
        convertedRoundNames = [{name: "Technical Round", description: ""}, {name: "HR Round", description: ""}];
      }
      
      setForm({
        ...job,
        round_names: convertedRoundNames
      });
    }
  }, [job, mode]);

  const handleSubmit = async () => {
    try {
      if (mode === "create") {
        await api.post("/recruitment/create", form);
        alert("Job created successfully!");
      } else if (mode === "edit") {
        await api.put(`/recruitment/update/${job.id}`, form);
        alert("Job updated successfully!");
      }
      onClose();
    } catch (err) {
      alert("Failed to save job");
    }
  };

  const isView = mode === "view";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === "create" && "Create New Job"}
            {mode === "edit" && "Edit Job"}
            {mode === "view" && "Job Details"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {mode === "create" && "Fill in the details to create a new job posting"}
            {mode === "edit" && "Update the job information"}
            {mode === "view" && "View job posting details"}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('basic')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Job Details
            </button>
            <button
              onClick={() => setActiveTab('rounds')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rounds'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Interview Rounds
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                  <div className="space-y-2">
                    <select
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      disabled={isView}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select existing job title</option>
                      {existingJobs.map((title, index) => (
                        <option key={index} value={title}>{title}</option>
                      ))}
                    </select>
                    <div className="text-center text-xs text-gray-500">OR</div>
                    <input
                      type="text"
                      placeholder="Enter new job title"
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      disabled={isView}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <input
                    type="text"
                    placeholder="e.g., Engineering, Marketing"
                    value={form.department}
                    onChange={(e) => setForm({...form, department: e.target.value})}
                    disabled={isView}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hiring Manager</label>
                  <input
                    type="text"
                    placeholder="Manager name"
                    value={form.hiring_manager}
                    onChange={(e) => setForm({...form, hiring_manager: e.target.value})}
                    disabled={isView}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Openings</label>
                  <input
                    type="number"
                    min="1"
                    value={form.openings}
                    onChange={(e) => setForm({...form, openings: parseInt(e.target.value) || 1})}
                    disabled={isView}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Job Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Required</label>
                  <input
                    type="text"
                    placeholder="e.g., 2-5 years"
                    value={form.experience}
                    onChange={(e) => setForm({...form, experience: e.target.value})}
                    disabled={isView}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g., $50,000 - $70,000"
                    value={form.salary_range}
                    onChange={(e) => setForm({...form, salary_range: e.target.value})}
                    disabled={isView}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                  <select
                    value={form.job_type}
                    onChange={(e) => setForm({...form, job_type: e.target.value})}
                    disabled={isView}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
                  <select
                    value={form.work_mode}
                    onChange={(e) => setForm({...form, work_mode: e.target.value})}
                    disabled={isView}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="e.g., New York, NY"
                    value={form.location}
                    onChange={(e) => setForm({...form, location: e.target.value})}
                    disabled={isView}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                <textarea
                  placeholder="Describe the role, responsibilities, and requirements..."
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  disabled={isView}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* Interview Rounds Tab */}
          {activeTab === 'rounds' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">Interview Rounds</h3>
                  <p className="text-sm text-gray-600">Configure the interview process for this position</p>
                </div>
                {!isView && (
                  <button
                    type="button"
                    onClick={() => {
                      const newRounds = [...(form.round_names || []), {name: "", description: ""}];
                      setForm({...form, round_names: newRounds, rounds: newRounds.length});
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                  >
                    <FiPlus size={16} />
                    Add Round
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {(form.round_names || []).map((round, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-800">Round {index + 1}</h4>
                      {!isView && form.round_names.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newRounds = form.round_names.filter((_, i) => i !== index);
                            setForm({...form, round_names: newRounds, rounds: newRounds.length});
                          }}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder={`Round ${index + 1} Name (e.g., Technical Interview)`}
                        value={round.name || ""}
                        onChange={(e) => {
                          const newRounds = [...form.round_names];
                          newRounds[index] = {...newRounds[index], name: e.target.value};
                          setForm({...form, round_names: newRounds});
                        }}
                        disabled={isView}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <textarea
                        placeholder={`Round ${index + 1} Description (e.g., Technical skills assessment)`}
                        value={round.description || ""}
                        onChange={(e) => {
                          const newRounds = [...form.round_names];
                          newRounds[index] = {...newRounds[index], description: e.target.value};
                          setForm({...form, round_names: newRounds});
                        }}
                        disabled={isView}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isView ? 'Close' : 'Cancel'}
          </button>
          {!isView && (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {mode === "create" ? (
                <>
                  <FiPlus size={16} />
                  Create Job
                </>
              ) : (
                <>
                  <FiEdit size={16} />
                  Update Job
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
