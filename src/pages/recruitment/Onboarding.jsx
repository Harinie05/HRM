import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../api";

export default function Onboarding() {
  const [candidates, setCandidates] = useState([]);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [onboardingDetails, setOnboardingDetails] = useState(null);
  const [locations, setLocations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState("All Jobs");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  
  const [onboardingForm, setOnboardingForm] = useState({
    work_location: "",
    reporting_manager: "",
    work_shift: "General",
    probation_period: "3 Months",
    joining_date: ""
  });
  
  const [employeeForm, setEmployeeForm] = useState({
    employee_code: "",
    official_email: "",
    employee_type: "Permanent"
  });
  
  const [appointmentForm, setAppointmentForm] = useState({
    grade: "G3",
    terms: "Standard terms and conditions as per company policy will apply. Detailed terms will be provided in your employment contract."
  });

  const fetchCandidates = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedJob !== "All Jobs") params.append('job_filter', selectedJob);
      if (selectedStatus !== "All Status") params.append('status_filter', selectedStatus);
      
      const url = `/onboarding/candidates${params.toString() ? '?' + params.toString() : ''}`;
      const res = await api.get(url);
      setCandidates(res.data);
    } catch (err) {
      console.error("Failed to load candidates", err);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [locRes, mgRes, gradeRes, jobRes, statusRes] = await Promise.all([
        api.get("/onboarding/locations"),
        api.get("/onboarding/managers"),
        api.get("/onboarding/grades"),
        api.get("/onboarding/jobs"),
        api.get("/onboarding/statuses")
      ]);
      setLocations(locRes.data);
      setManagers(mgRes.data);
      setGrades(gradeRes.data);
      setJobs(jobRes.data);
      setStatuses(statusRes.data);
    } catch (err) {
      console.error("Failed to load master data", err);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchMasterData();
  }, []);
  
  useEffect(() => {
    fetchCandidates();
  }, [searchTerm, selectedJob, selectedStatus]);

  const startOnboarding = async () => {
    try {
      await api.post(`/onboarding/start/${selectedCandidate.id}`, onboardingForm);
      alert("Onboarding started successfully!");
      setShowOnboardingModal(false);
      fetchCandidates();
    } catch (err) {
      alert("Failed to start onboarding");
    }
  };

  const uploadDocuments = async (files) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      await api.post(`/onboarding/documents/upload/${onboardingDetails.onboarding.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert("Documents uploaded successfully!");
      setShowDocModal(false);
      fetchCandidates();
    } catch (err) {
      alert("Failed to upload documents");
    }
  };

  const generateAppointment = async () => {
    try {
      await api.post(`/onboarding/appointment/${onboardingDetails.onboarding.id}`, appointmentForm);
      await sendAppointmentEmail();
    } catch (err) {
      alert("Failed to generate and send appointment");
    }
  };
  
  const sendAppointmentEmail = async () => {
    try {
      const res = await api.post(`/onboarding/appointment/send/${onboardingDetails.onboarding.id}`, {});
      alert(res.data.message);
      setShowAppointmentModal(false);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to send appointment letter");
    }
  };

  const createEmployee = async () => {
    try {
      const res = await api.post(`/onboarding/create-employee/${onboardingDetails.onboarding.id}`, employeeForm);
      alert(`Employee created! Code: ${res.data.employee_code}`);
      setShowEmployeeModal(false);
      fetchCandidates();
    } catch (err) {
      alert("Failed to create employee");
    }
  };

  const getOnboardingDetails = async (onboardingId) => {
    try {
      const res = await api.get(`/onboarding/details/${onboardingId}`);
      setOnboardingDetails(res.data);
    } catch (err) {
      console.error("Failed to load onboarding details", err);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-50 min-h-screen">
        <Header />
        
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Onboarding & Employee Creation</h1>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search Candidate"
              className="border p-2 rounded w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="border p-2 rounded"
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
            >
              <option value="All Jobs">All Jobs</option>
              {jobs.map(job => (
                <option key={job.value} value={job.value}>{job.label}</option>
              ))}
            </select>
            <select 
              className="border p-2 rounded"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All Status">All Status</option>
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <table className="min-w-full bg-white rounded-xl shadow">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="p-3 text-left">Candidate</th>
                <th className="p-3 text-left">Job Role</th>
                <th className="p-3 text-center">Onboarding Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="border-t">
                  <td className="p-3">{candidate.name}</td>
                  <td className="p-3">{candidate.job_title}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      candidate.onboarding_status === 'Completed' ? 'bg-green-100 text-green-800' :
                      candidate.onboarding_status === 'Ready for Joining' ? 'bg-blue-100 text-blue-800' :
                      candidate.onboarding_status === 'Docs Submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {candidate.onboarding_status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {candidate.onboarding_status === 'Not Started' && (
                      <button
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setShowOnboardingModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Start Onboarding
                      </button>
                    )}
                    
                    {candidate.onboarding_status === 'Pending Docs' && (
                      <button
                        onClick={() => {
                          getOnboardingDetails(candidate.onboarding_id);
                          setShowDocModal(true);
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                      >
                        Upload Docs
                      </button>
                    )}
                    
                    {candidate.onboarding_status === 'Docs Submitted' && (
                      <button
                        onClick={() => {
                          getOnboardingDetails(candidate.onboarding_id);
                          setShowVerifyModal(true);
                        }}
                        className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                      >
                        Verify Docs
                      </button>
                    )}
                    
                    {candidate.onboarding_status === 'Ready for Joining' && (
                      <div className="space-x-1">
                        <button
                          onClick={() => {
                            getOnboardingDetails(candidate.onboarding_id);
                            setAppointmentForm({
                              grade: "G3",
                              terms: "Standard terms and conditions as per company policy will apply. Detailed terms will be provided in your employment contract."
                            });
                            setShowAppointmentModal(true);
                          }}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Generate Appointment
                        </button>
                        <button
                          onClick={() => {
                            getOnboardingDetails(candidate.onboarding_id);
                            setEmployeeForm({
                              ...employeeForm,
                              employee_code: `EMP-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
                              official_email: `${candidate.name.toLowerCase().replace(' ', '.')}@company.com`
                            });
                            setShowEmployeeModal(true);
                          }}
                          className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                        >
                          Create Employee
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Start Onboarding Modal */}
          {showOnboardingModal && selectedCandidate && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[500px] shadow-xl">
                <h2 className="text-xl font-semibold mb-4">
                  Start Onboarding - {selectedCandidate.name}
                </h2>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Job Role</label>
                    <input
                      type="text"
                      value={selectedCandidate.job_title}
                      disabled
                      className="border p-2 rounded w-full bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={onboardingForm.joining_date || ''}
                      onChange={(e) => setOnboardingForm({...onboardingForm, joining_date: e.target.value})}
                      className="border p-2 rounded w-full"
                    />
                    {selectedCandidate.joining_date && (
                      <p className="text-xs text-gray-500 mt-1">From offer: {selectedCandidate.joining_date}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Work Location</label>
                    <select
                      className="border p-2 rounded w-full"
                      value={onboardingForm.work_location}
                      onChange={(e) => setOnboardingForm({...onboardingForm, work_location: e.target.value})}
                    >
                      <option value="">Select Location</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name} - {loc.city}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Reporting Manager</label>
                    <select
                      className="border p-2 rounded w-full"
                      value={onboardingForm.reporting_manager}
                      onChange={(e) => setOnboardingForm({...onboardingForm, reporting_manager: e.target.value})}
                    >
                      <option value="">Select Manager</option>
                      {managers.map(mgr => (
                        <option key={mgr.id} value={mgr.name}>{mgr.name} - {mgr.department}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Work Shift</label>
                    <select
                      className="border p-2 rounded w-full"
                      value={onboardingForm.work_shift}
                      onChange={(e) => setOnboardingForm({...onboardingForm, work_shift: e.target.value})}
                    >
                      <option value="General">General</option>
                      <option value="Rotational">Rotational</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Probation Period</label>
                    <select
                      className="border p-2 rounded w-full"
                      value={onboardingForm.probation_period}
                      onChange={(e) => setOnboardingForm({...onboardingForm, probation_period: e.target.value})}
                    >
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                    </select>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p><strong>Pre-joining Checklist:</strong></p>
                    <p>☑ Offer Accepted</p>
                    <p>☑ BGV Initiated</p>
                    <p>☑ BGV Completed</p>
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded-lg"
                    onClick={() => setShowOnboardingModal(false)}
                  >
                    Close
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    onClick={startOnboarding}
                  >
                    Proceed to Document Submission
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Document Upload Modal */}
          {showDocModal && onboardingDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[600px] shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">
                  Documents Upload - {onboardingDetails.onboarding.candidate_name}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Aadhaar Card *</label>
                    <input type="file" accept=".pdf,.jpg,.png" className="border p-2 rounded w-full text-sm" placeholder="Upload Aadhaar" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">PAN Card *</label>
                    <input type="file" accept=".pdf,.jpg,.png" className="border p-2 rounded w-full text-sm" placeholder="Upload PAN" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Degree Certificate *</label>
                    <input type="file" accept=".pdf,.jpg,.png" className="border p-2 rounded w-full text-sm" placeholder="Upload Degree" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Consolidated Marksheet</label>
                    <input type="file" accept=".pdf,.jpg,.png" className="border p-2 rounded w-full text-sm" placeholder="Upload Marksheet" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Experience Letter</label>
                    <input type="file" accept=".pdf,.jpg,.png" className="border p-2 rounded w-full text-sm" placeholder="Upload Experience Letter" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Salary Slip (Last 3 months)</label>
                    <input type="file" accept=".pdf,.jpg,.png" className="border p-2 rounded w-full text-sm" placeholder="Upload Salary Slips" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Passport Size Photo *</label>
                    <input type="file" accept=".jpg,.png" className="border p-2 rounded w-full text-sm" placeholder="Upload Photo" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Digital Signature *</label>
                    <input type="file" accept=".jpg,.png" className="border p-2 rounded w-full text-sm" placeholder="Upload Signature" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Bank Account Details</label>
                    <input type="file" accept=".pdf,.jpg,.png" className="border p-2 rounded w-full text-sm" placeholder="Upload Bank Passbook/Cheque" />
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-4">
                    <p>* Required documents</p>
                    <p>Supported formats: PDF, JPG, PNG (Max 5MB each)</p>
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded-lg"
                    onClick={() => setShowDocModal(false)}
                  >
                    Close
                  </button>
                  <div className="space-x-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                      Save
                    </button>
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded-lg"
                      onClick={() => {
                        const fileInputs = document.querySelectorAll('input[type="file"]');
                        const files = Array.from(fileInputs).map(input => input.files[0]).filter(Boolean);
                        if (files.length > 0) {
                          uploadDocuments(files);
                        } else {
                          alert("Please select files to upload");
                        }
                      }}
                    >
                      Submit for Verification
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Verification Modal */}
          {showVerifyModal && onboardingDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[500px] shadow-xl">
                <h2 className="text-xl font-semibold mb-4">
                  Verify Documents - {onboardingDetails.onboarding.candidate_name}
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Document Review Status</p>
                    <p className="text-xs text-blue-600">All submitted documents are under review by HR team</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Verification Decision</label>
                    <select className="border p-2 rounded w-full">
                      <option value="pending">Under Review</option>
                      <option value="approved">All Documents Approved</option>
                      <option value="rejected">Documents Need Revision</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">HR Comments</label>
                    <textarea
                      className="border p-2 rounded w-full h-24"
                      placeholder="Add verification notes, feedback, or instructions for candidate..."
                    ></textarea>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <p><strong>Verification Guidelines:</strong></p>
                    <p>• Ensure all documents are clear and legible</p>
                    <p>• Verify personal details match across documents</p>
                    <p>• Check document authenticity and validity</p>
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded-lg"
                    onClick={() => setShowVerifyModal(false)}
                  >
                    Close
                  </button>
                  <div className="space-x-2">
                    <button 
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg"
                      onClick={async () => {
                        try {
                          // Update onboarding status back to Pending Docs for re-upload
                          await api.put(`/onboarding/reject/${onboardingDetails.onboarding.id}`);
                          alert("Documents rejected. Candidate can re-upload documents.");
                          setShowVerifyModal(false);
                          fetchCandidates();
                        } catch (err) {
                          alert("Failed to reject documents");
                        }
                      }}
                    >
                      Request Re-upload
                    </button>
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded-lg"
                      onClick={async () => {
                        try {
                          // Update onboarding status to Ready for Joining
                          await api.put(`/onboarding/approve/${onboardingDetails.onboarding.id}`);
                          alert("Documents approved!");
                          setShowVerifyModal(false);
                          fetchCandidates();
                        } catch (err) {
                          alert("Failed to approve documents");
                        }
                      }}
                    >
                      Approve Documents
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appointment Letter Modal */}
          {showAppointmentModal && onboardingDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[600px] shadow-xl">
                <h2 className="text-xl font-semibold mb-4">
                  Generate Appointment Letter - {onboardingDetails.onboarding.candidate_name}
                </h2>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Designation</label>
                      <input
                        type="text"
                        value={onboardingDetails.onboarding.job_title}
                        disabled
                        className="border p-2 rounded w-full bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Grade</label>
                      <select
                        className="border p-2 rounded w-full"
                        value={appointmentForm.grade}
                        onChange={(e) => setAppointmentForm({...appointmentForm, grade: e.target.value})}
                      >
                        {grades.map(grade => (
                          <option key={grade.code} value={grade.code}>
                            {grade.code} - {grade.name} (₹{grade.min_salary.toLocaleString()} - ₹{grade.max_salary.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Salary Structure</label>
                    <input
                      type="text"
                      value="Auto from Offer"
                      disabled
                      className="border p-2 rounded w-full bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Joining Date</label>
                    <input
                      type="text"
                      value={onboardingDetails.onboarding.joining_date || "Auto Filled"}
                      disabled
                      className="border p-2 rounded w-full bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Terms & Conditions</label>
                    <textarea
                      className="border p-2 rounded w-full h-32"
                      value={appointmentForm.terms}
                      onChange={(e) => setAppointmentForm({...appointmentForm, terms: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded-lg"
                    onClick={() => setShowAppointmentModal(false)}
                  >
                    Close
                  </button>
                  <div className="space-x-2">
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded-lg"
                      onClick={generateAppointment}
                    >
                      Generate & Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Employee Modal */}
          {showEmployeeModal && onboardingDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[500px] shadow-xl">
                <h2 className="text-xl font-semibold mb-4">
                  Employee Code Generation - {onboardingDetails.onboarding.candidate_name}
                </h2>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee Code</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full"
                      value={employeeForm.employee_code}
                      onChange={(e) => setEmployeeForm({...employeeForm, employee_code: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <input
                      type="text"
                      value={onboardingDetails.onboarding.department}
                      disabled
                      className="border p-2 rounded w-full bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Designation</label>
                    <input
                      type="text"
                      value={onboardingDetails.onboarding.job_title}
                      disabled
                      className="border p-2 rounded w-full bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Official Email</label>
                    <input
                      type="email"
                      className="border p-2 rounded w-full"
                      value={employeeForm.official_email}
                      onChange={(e) => setEmployeeForm({...employeeForm, official_email: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee Type</label>
                    <select
                      className="border p-2 rounded w-full"
                      value={employeeForm.employee_type}
                      onChange={(e) => setEmployeeForm({...employeeForm, employee_type: e.target.value})}
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <label className="text-sm">Create System Account</label>
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded-lg"
                    onClick={() => setShowEmployeeModal(false)}
                  >
                    Close
                  </button>
                  <div className="space-x-2">
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded-lg"
                      onClick={createEmployee}
                    >
                      Create Employee
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                      Complete Onboarding
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}