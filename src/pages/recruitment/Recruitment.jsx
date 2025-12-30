import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiUsers, FiLink, FiPlay, FiPause, FiSearch, FiFilter } from 'react-icons/fi';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import useToast from '../../utils/useToast';
import api from '../../api';

export default function Recruitment() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState({});
  const { toast, showToast, hideToast } = useToast();
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
  const [employeeCode, setEmployeeCode] = useState(null);
  const [openLinkMenu, setOpenLinkMenu] = useState(null);

  const fetchMyProfile = async () => {
    try {
      // Get tenant_db from localStorage
      const tenantDb = localStorage.getItem("tenant_db");
      if (!tenantDb) {
        console.error("No tenant_db found");
        return;
      }
      
      // Get current user's email from token or localStorage
      const userEmail = localStorage.getItem("user_email") || "";
      
      // Try users table first (system users with employee_code)
      try {
        const res = await api.get(`/hospitals/users/${tenantDb}/list`);
        const currentUser = res.data.users?.find(user => user.email === userEmail);
        
        if (currentUser?.employee_code) {
          setEmployeeCode(currentUser.employee_code);
          return;
        }
      } catch (err) {
        console.log("User not found in users table");
      }
      
      // Try onboarding table for onboarded employees
      try {
        const onboardingRes = await api.get("/recruitment/onboarding/list");
        const onboardedEmployee = onboardingRes.data?.find(emp => 
          emp.candidate_name && emp.employee_id && 
          (emp.email === userEmail || emp.candidate_name.toLowerCase().includes(userEmail.split('@')[0]))
        );
        
        if (onboardedEmployee?.employee_id) {
          setEmployeeCode(onboardedEmployee.employee_id);
          return;
        }
      } catch (err) {
        console.log("Employee not found in onboarding table");
      }
    } catch (err) {
      console.error("Failed to fetch employee code", err);
    }
  };

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
      showToast("Failed to load jobs. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchMyProfile();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.link-dropdown')) {
        setOpenLinkMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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
    const currentPublishStatus = job.publish_status?.trim();
    const newPublishStatus = currentPublishStatus === "Published" ? "Draft" : "Published";
    
    try {
      // Use the existing update endpoint with the full job data
      await api.put(`/recruitment/update/${job.id}`, {
        ...job,
        publish_status: newPublishStatus
      });
      
      // Update the job publish_status locally for immediate UI feedback
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === job.id ? { ...j, publish_status: newPublishStatus } : j
        )
      );
      
      showToast(`Job ${newPublishStatus === 'Published' ? 'published' : 'unpublished'} successfully!`);
    } catch (err) {
      console.error("Failed to update job publish status", err);
      showToast(`Failed to update job publish status: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  // ========================= DELETE JOB =========================
  const deleteJob = async (job) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"?`)) return;
    
    try {
      await api.delete(`/recruitment/delete/${job.id}`);
      fetchJobs();
      showToast("Job deleted successfully!");
    } catch (err) {
      console.error("Failed to delete job", err);
      showToast("Failed to delete job", 'error');
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
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl mb-6 p-6 border border-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                <FiUsers className="w-7 h-7 text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Recruitment Setup</h1>
                <p className="text-gray-600 text-base font-medium">Manage job postings and recruitment process</p>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-medium">{jobs.length} Active Jobs</span>
                  </div>
                  <div className="w-px h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-semibold">Real-time Updates</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={openCreate}
              style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
              className="text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2"
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
            >
              <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center">
                <FiPlus className="w-3 h-3" />
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
                  <FiSearch className="w-3 h-3 text-gray-600" />
                </div>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 text-sm focus:outline-none"
                />
                <div className="flex items-center space-x-1">
                  <div className="w-px h-4 bg-gray-200"></div>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-1 rounded-md transition-colors ${
                      showFilters ? 'bg-gray-100 text-gray-600' : 'hover:bg-gray-100'
                    }`}
                  >
                    <FiFilter className={`w-3 h-3 transition-colors ${
                      showFilters ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                <FiUsers className="text-gray-600" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Published</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.publish_status?.trim() === 'Published').length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                <FiPlay className="text-gray-600" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.publish_status?.trim() !== 'Published').length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                <FiPause className="text-gray-600" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Closed</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.status?.trim() === 'Inactive').length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                <FiPause className="text-red-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mb-6">
            <div className="bg-white border border-black rounded-2xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                  className="border border-black rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="border border-black rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
                >
                  <option value="">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Posted">Published</option>
                </select>
                
                <select
                  value={filters.jobType}
                  onChange={(e) => setFilters({...filters, jobType: e.target.value})}
                  className="border border-black rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
                >
                  <option value="">All Job Types</option>
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                
                <button
                  onClick={clearFilters}
                  style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                  className="px-4 py-2 text-white border border-black rounded-xl transition-colors"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* JOB TABLE */}
        <div className="bg-white rounded-2xl border border-black overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No jobs found matching your criteria</p>
              <button
                onClick={clearFilters}
                style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                className="mt-2 text-white transition-colors"
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover, #1e4bb8)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-black">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Openings</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-black">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-500">{job.experience_years} years experience</div>
                          {job.location && (
                            <div className="text-xs text-gray-500">{job.location}</div>
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
                        <div className="flex flex-col items-center">
                          {job.publish_status?.trim() === "Published" ? (
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
                          {job.status === "Inactive" && (
                            <span className="text-xs text-red-600 font-medium mt-1">closed</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openView(job)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Job"
                          >
                            <FiEye size={16} />
                          </button>

                          <button
                            onClick={() => openEdit(job)}
                            className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Edit Job"
                          >
                            <FiEdit size={16} />
                          </button>

                          <button
                            onClick={() => window.location.href = `/screening?job=${job.id}`}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Screen Candidates"
                          >
                            <FiUsers size={16} />
                          </button>

                          <div className="relative link-dropdown">
                            <button
                              onClick={() =>
                                setOpenLinkMenu(openLinkMenu === job.id ? null : job.id)
                              }
                              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Job Links"
                            >
                              <FiLink size={16} />
                            </button>

                            {openLinkMenu === job.id && (
                              <div className="absolute right-0 mt-2 w-64 bg-white border border-black rounded-xl shadow-lg z-50">
                                <button
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-200"
                                  onClick={() => {
                                    const publicLink = `${window.location.origin}/apply/${job.id}`;
                                    setGeneratedLinks(prev => ({
                                      ...prev,
                                      [job.id]: { ...prev[job.id], public: publicLink }
                                    }));
                                    showToast("Public job link generated");
                                  }}
                                >
                                  🌍 Generate Public Link
                                </button>

                                {employeeCode && (
                                  <button
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
                                    onClick={() => {
                                      const referralLink = `${window.location.origin}/apply/${job.id}?ref=${employeeCode}`;
                                      setGeneratedLinks(prev => ({
                                        ...prev,
                                        [job.id]: { ...prev[job.id], referral: referralLink }
                                      }));
                                      showToast("Referral link generated");
                                    }}
                                  >
                                    👤 Generate My Referral Link
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => togglePublish(job)}
                            className={`p-2 rounded-lg transition-colors ${
                              job.publish_status?.trim() === "Published"
                                ? "text-gray-500 hover:text-red-600 hover:bg-red-50"
                                : "text-gray-500 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={job.publish_status?.trim() === "Published" ? "Unpublish" : "Publish"}
                          >
                            {job.publish_status?.trim() === "Published" ? <FiPause size={16} /> : <FiPlay size={16} />}
                          </button>

                          <button
                            onClick={() => deleteJob(job)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Job"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                        {generatedLinks[job.id] && (
                          <div className="mt-2 space-y-2">
                            {generatedLinks[job.id]?.public && (
                              <div>
                                <label className="text-xs text-gray-600 font-medium">Public Link:</label>
                                <input
                                  type="text"
                                  value={generatedLinks[job.id].public}
                                  readOnly
                                  className="w-full text-xs border p-2 rounded bg-gray-50 focus:outline-none cursor-pointer"
                                  onClick={(e) => {
                                    e.target.select();
                                    navigator.clipboard.writeText(e.target.value);
                                    showToast("Public link copied to clipboard!");
                                  }}
                                  placeholder="Public link will appear here"
                                />
                              </div>
                            )}
                            {generatedLinks[job.id]?.referral && (
                              <div>
                                <label className="text-xs text-gray-600 font-medium">Referral Link:</label>
                                <input
                                  type="text"
                                  value={generatedLinks[job.id].referral}
                                  readOnly
                                  className="w-full text-xs border p-2 rounded bg-gray-50 focus:outline-none cursor-pointer"
                                  onClick={(e) => {
                                    e.target.select();
                                    navigator.clipboard.writeText(e.target.value);
                                    showToast("Referral link copied to clipboard!");
                                  }}
                                  placeholder="Referral link will appear here"
                                />
                              </div>
                            )}
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
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}

// JobForm Modal Component
function JobFormModal({ mode, job, onClose }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: "",
    department: "",
    hiring_manager: "",
    openings: 1,
    experience_years: 0,
    salary_range: "",
    job_type: "Full-time",
    work_mode: "On-site",
    location: "",
    rounds: 2,
    round_names: [{name: "Technical Round", description: ""}, {name: "HR Round", description: ""}],
    skills: [],
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
        showToast("Job created successfully!");
      } else if (mode === "edit") {
        await api.put(`/recruitment/update/${job.id}`, form);
        showToast("Job updated successfully!");
      }
      onClose();
    } catch (err) {
      showToast("Failed to save job", 'error');
    }
  };

  const isView = mode === "view";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white border border-black rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black">
          <h2 className="text-xl font-semibold text-black">
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
        <div className="px-6 py-3 border-b border-black">
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
                  <label className="block text-sm font-medium text-black mb-2">Job Title *</label>
                  <div className="space-y-2">
                    <select
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      disabled={isView}
                      className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select existing job title</option>
                      {existingJobs.map((title, index) => (
                        <option key={index} value={title}>{title}</option>
                      ))}
                    </select>
                    <div className="text-center text-xs text-gray-600">OR</div>
                    <input
                      type="text"
                      placeholder="Enter new job title"
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      disabled={isView}
                      className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Department *</label>
                  <input
                    type="text"
                    placeholder="e.g., Engineering, Marketing"
                    value={form.department}
                    onChange={(e) => setForm({...form, department: e.target.value})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Hiring Manager</label>
                  <input
                    type="text"
                    placeholder="Manager name"
                    value={form.hiring_manager}
                    onChange={(e) => setForm({...form, hiring_manager: e.target.value})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Number of Openings</label>
                  <input
                    type="number"
                    min="1"
                    value={form.openings}
                    onChange={(e) => setForm({...form, openings: parseInt(e.target.value) || 1})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-black mb-2">Experience Years</label>
                  <input
                    type="number"
                    placeholder="e.g., 3"
                    min="0"
                    value={form.experience_years || ''}
                    onChange={(e) => setForm({...form, experience_years: parseInt(e.target.value) || 0})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g., $50,000 - $70,000"
                    value={form.salary_range}
                    onChange={(e) => setForm({...form, salary_range: e.target.value})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Job Type</label>
                  <select
                    value={form.job_type}
                    onChange={(e) => setForm({...form, job_type: e.target.value})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Work Mode</label>
                  <select
                    value={form.work_mode}
                    onChange={(e) => setForm({...form, work_mode: e.target.value})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="e.g., New York, NY"
                    value={form.location}
                    onChange={(e) => setForm({...form, location: e.target.value})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-2">Required Skills</label>
                  <input
                    type="text"
                    placeholder="e.g., React, Node.js, Python (comma-separated)"
                    value={Array.isArray(form.skills) ? form.skills.join(', ') : (form.skills || '')}
                    onChange={(e) => setForm({...form, skills: e.target.value ? e.target.value.split(',').map(s => s.trim()) : []})}
                    disabled={isView}
                    className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">Job Description</label>
                <textarea
                  placeholder="Describe the role, responsibilities, and requirements..."
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  disabled={isView}
                  rows={6}
                  className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-500"
                />
              </div>
            </div>
          )}

          {/* Interview Rounds Tab */}
          {activeTab === 'rounds' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-black">Interview Rounds</h3>
                  <p className="text-sm text-gray-600">Configure the interview process for this position</p>
                </div>
                {!isView && (
                  <button
                    type="button"
                    onClick={() => {
                      const newRounds = [...(form.round_names || []), {name: "", description: ""}];
                      setForm({...form, round_names: newRounds, rounds: newRounds.length});
                    }}
                    className="px-4 py-2 bg-black text-white border-2 border-black rounded-lg transition-colors flex items-center gap-2 hover:bg-gray-800"
                  >
                    <FiPlus size={16} />
                    Add Round
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {(form.round_names || []).map((round, index) => (
                  <div key={index} className="border border-black rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-black">Round {index + 1}</h4>
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
                        className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
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
                        className="w-full bg-white text-black border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isView ? 'Close' : 'Cancel'}
          </button>
          {!isView && (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-black text-white border border-black rounded-lg transition-colors flex items-center gap-2 hover:bg-gray-800"
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