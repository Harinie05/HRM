import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../api";
import { FiSearch, FiUser, FiFileText, FiEye, FiCalendar, FiMapPin, FiMail, FiPhone, FiCheck, FiClipboard } from "react-icons/fi";
import { hasPermission } from "../../utils/permissions";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import OriginalDocumentsModal from "../../components/OriginalDocumentsModal";

export default function Onboarding() {
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();
  const [candidates, setCandidates] = useState([]);

  // Check permissions
  const canViewOnboardingDocuments = hasPermission('view_onboarding_documents');
  const canViewOnboardingCandidates = hasPermission('view_onboarding_candidates');
  const canViewDocumentCollected = hasPermission('view_document_collected');
  const canAddDocumentCollected = hasPermission('add_document_collected');
  const canMarkOnboarded = hasPermission('mark_onboarded');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showNewOnboardingForm, setShowNewOnboardingForm] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showOriginalDocsModal, setShowOriginalDocsModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [onboardingDetails, setOnboardingDetails] = useState(null);
  const [candidateDocuments, setCandidateDocuments] = useState([]);

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

  // Comprehensive onboarding form
  const [newOnboardingForm, setNewOnboardingForm] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    personal_email: "",
    phone_number: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    employee_id: "",
    joining_date: "",
    department: "",
    designation: "",
    work_location: "",
    reporting_manager: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    aadhar_number: "",
    pan_number: "",
    current_address: "",
    city: "",
    state: ""
  });

  const [employeeForm, setEmployeeForm] = useState({
    employee_code: "",
    official_email: "",
    employee_type: "Permanent"
  });

  const [appointmentForm, setAppointmentForm] = useState({
    grade: "G3",
    terms:
      "Standard terms and conditions as per company policy will apply. Detailed terms will be provided in your employment contract."
  });

  // ===============================================================
  // FETCH ONBOARDED CANDIDATES
  // ===============================================================
  const fetchCandidates = async () => {
    if (!canViewOnboardingCandidates || !canMarkOnboarded) {
      setCandidates([]); // Set empty array if no permission
      return; // Don't make API call if no permission
    }
    
    try {
      const [offersRes, onboardingRes] = await Promise.all([
        api.get("/recruitment/offer/list"),
        api.get("/recruitment/onboarding/candidates")
      ]);
      
      // Show only candidates who have completed onboarding
      const onboardedOffers = offersRes.data.filter(offer => 
        offer.offer_status === "Onboarding completed"
      );
      
      // Map with employee IDs from onboarding records (get the latest record)
      const candidatesWithEmployeeIds = onboardedOffers.map(offer => {
        // Find all onboarding records for this candidate
        const candidateRecords = onboardingRes.data.filter(ob => ob.application_id === offer.candidate_id);
        // Get the most recent record (highest ID)
        const latestRecord = candidateRecords.reduce((latest, current) => 
          current.id > latest.id ? current : latest, candidateRecords[0]
        );
        
        return {
          id: offer.id,
          candidate_id: offer.candidate_id,
          name: offer.candidate_name,
          job_title: offer.job_title,
          department: offer.department,
          employee_id: latestRecord?.employee_id,
          status: "Onboarded"
        };
      });
      
      setCandidates(candidatesWithEmployeeIds);
    } catch (err) {
      console.error("Failed to load onboarded candidates", err);
      setCandidates([]); // Set empty array on error
      if (err.response?.status === 403) {
        showToast("Access denied: You don't have permission to view onboarding candidates", "error");
      }
    }
  };

  // ===============================================================
  // FETCH CANDIDATE DOCUMENTS
  // ===============================================================
  const fetchCandidateDocuments = async (candidateId) => {
    try {
      const res = await api.get(`/recruitment/onboarding/${candidateId}/documents`);
      setCandidateDocuments(res.data);
      setShowDocumentsModal(true);
    } catch (err) {
      console.error("Failed to load documents", err);
      showToast("Failed to load documents", "error");
    }
  };

  // ===============================================================
  // FETCH MASTER DATA 
  // ===============================================================
  const fetchMasterData = async () => {
    try {
      const [locRes, mgrRes, gradeRes, jobRes, statusRes] =
        await Promise.all([
          api.get("/recruitment/onboarding/locations"),
          api.get("/recruitment/onboarding/managers"),
          api.get("/recruitment/onboarding/grades"),
          api.get("/recruitment/onboarding/jobs"),
          api.get("/recruitment/onboarding/statuses")
        ]);

      setLocations(locRes.data);
      setManagers(mgrRes.data);
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
    
    // Check if navigated from offer page
    if (location.state?.fromOffer) {
      setNewOnboardingForm(prev => ({
        ...prev,
        full_name: location.state.candidateName,
        department: location.state.department,
        designation: location.state.jobTitle
      }));
      setShowNewOnboardingForm(true);
    }
  }, [location.state]);

  useEffect(() => {
    fetchCandidates();
  }, []);

  // ===============================================================
  // START ONBOARDING
  // ===============================================================
  const startOnboarding = async () => {
    try {
      await api.post(
        `/recruitment/onboarding/start/${selectedCandidate.id}`,
        onboardingForm
      );
      showToast("Onboarding started successfully!", "success");
      setShowOnboardingModal(false);
      fetchCandidates();
    } catch (err) {
      showToast("Failed to start onboarding", "error");
    }
  };

  // ===============================================================
  // VALIDATE EMPLOYEE ID
  // ===============================================================
  const validateEmployeeId = async (employeeId) => {
    if (!employeeId) return;
    
    try {
      const res = await api.get(`/eis/employee/validate/${employeeId}`);
      if (res.data.exists) {
        showToast(`Employee ID ${employeeId} already exists. Please use a different ID.`, "error");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Validation error:", err);
      return true; // Allow if validation fails
    }
  };

  // ===============================================================
  // GENERATE EMPLOYEE ID
  // ===============================================================
  const generateEmployeeId = () => {
    const dept = newOnboardingForm.department.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const empId = `${dept}${timestamp}`;
    setNewOnboardingForm({...newOnboardingForm, employee_id: empId});
  };

  // ===============================================================
  // SUBMIT NEW ONBOARDING FORM
  // ===============================================================
  const submitNewOnboarding = async () => {
    try {
      // Validate employee ID first
      const isValidEmployeeId = await validateEmployeeId(newOnboardingForm.employee_id);
      if (!isValidEmployeeId) {
        return; // Stop submission if employee ID is duplicate
      }
      
      await api.post(`/recruitment/onboarding/create/${location.state.candidateId}`, {
        job_title: newOnboardingForm.designation,
        department: newOnboardingForm.department,
        joining_date: newOnboardingForm.joining_date,
        work_location: newOnboardingForm.work_location || "Main Office",
        reporting_manager: newOnboardingForm.reporting_manager || "TBD",
        work_shift: "General",
        probation_period: "3 Months",
        employee_id: newOnboardingForm.employee_id
      });
      showToast("Onboarding started successfully! Joining formalities email sent to candidate.", "success");
      setShowNewOnboardingForm(false);
      fetchCandidates();
    } catch (err) {
      console.error("Error:", err);
      const errorMessage = err.response?.data?.detail || "Failed to submit onboarding form";
      showToast(errorMessage, "error");
    }
  };

  // ===============================================================
  // UPLOAD DOCUMENTS
  // ===============================================================
  const uploadDocuments = async (files) => {
    try {
      if (!files || files.length === 0) {
        showToast("Please select files to upload", "error");
        return;
      }

      const formData = new FormData();
      
      // Get candidate ID from the current context
      const candidateId = selectedCandidate?.candidate_id || onboardingDetails?.onboarding?.candidate_id;
      
      if (!candidateId) {
        showToast("Candidate ID not found", "error");
        return;
      }

      console.log('Uploading for candidate ID:', candidateId);
      
      // Add required fields
      formData.append('candidate_id', candidateId);
      formData.append('document_type', 'resume'); // Try with a specific document type
      
      // Add files
      Array.from(files).forEach((file, index) => {
        console.log(`Adding file ${index}:`, file.name, file.type, file.size);
        formData.append("file", file);
      });

      // Log FormData contents
      for (let pair of formData.entries()) {
        console.log('FormData:', pair[0], pair[1]);
      }

      const response = await api.post(
        `/recruitment/onboarding/upload-document`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log('Upload response:', response.data);
      showToast("Documents uploaded successfully!", "success");
      setShowDocModal(false);
      fetchCandidates();
    } catch (err) {
      console.error('Upload error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || "Failed to upload documents";
      showToast(errorMessage, "error");
    }
  };

  // ===============================================================
  // GENERATE APPOINTMENT LETTER
  // ===============================================================
  const generateAppointment = async () => {
    try {
      await api.post(
        `/recruitment/onboarding/appointment/${onboardingDetails.onboarding.id}`,
        appointmentForm
      );
      await sendAppointmentEmail();
    } catch (err) {
      showToast("Failed to generate and send appointment", "error");
    }
  };

  // SEND APPOINTMENT LETTER EMAIL
  const sendAppointmentEmail = async () => {
    try {
      const res = await api.post(
        `/recruitment/onboarding/appointment/send/${onboardingDetails.onboarding.id}`,
        {}
      );
      showToast(res.data.message, "success");
      setShowAppointmentModal(false);
    } catch (err) {
      showToast("Failed to send appointment letter", "error");
    }
  };

  // ===============================================================
  // CREATE EMPLOYEE IN HRM
  // ===============================================================
  const createEmployee = async () => {
    try {
      const res = await api.post(
        `/recruitment/onboarding/create-employee/${onboardingDetails.onboarding.id}`,
        employeeForm
      );
      showToast(`Employee created! Code: ${res.data.employee_code}`, "success");
      setShowEmployeeModal(false);
      fetchCandidates();
    } catch (err) {
      showToast("Failed to create employee", "error");
    }
  };

  // ===============================================================
  // GET FULL ONBOARDING DETAILS
  // ===============================================================
  const getOnboardingDetails = async (onboardingId) => {
    try {
      const res = await api.get(
        `/recruitment/onboarding/details/${onboardingId}`
      );
      setOnboardingDetails(res.data);
    } catch (err) {
      console.error("Failed to load onboarding details", err);
    }
  };

  // ===============================================================
  // REJECT DOCUMENTS
  // ===============================================================
  const rejectDocs = async () => {
    try {
      await api.put(
        `/recruitment/onboarding/reject/${onboardingDetails.onboarding.id}`
      );
      showToast("Documents rejected. Candidate can re-upload.", "success");
      setShowVerifyModal(false);
      fetchCandidates();
    } catch (err) {
      showToast("Failed to reject documents", "error");
    }
  };

  // ===============================================================
  // APPROVE DOCUMENTS
  // ===============================================================
  const approveDocs = async () => {
    try {
      await api.put(
        `/recruitment/onboarding/approve/${onboardingDetails.onboarding.id}`
      );
      showToast("Documents approved!", "success");
      setShowVerifyModal(false);
      fetchCandidates();
    } catch (err) {
      showToast("Failed to approve documents", "error");
    }
  };

  // ===================================================================
  // ========================  UI START  ===============================
  // ===================================================================
  
  // Show access denied if user lacks basic permission
  if (!canViewOnboardingCandidates || !canMarkOnboarded) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUser className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">🔒 Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to view onboarding candidates.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your administrator to request access to the onboarding module.
            </p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <>
      <Layout>
        <div className="p-6">
          {/* Header */}
          <div className="bg-white rounded-2xl mb-6 p-6 border border-black">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <FiUser className="w-7 h-7 text-gray-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Onboarding</h1>
                  <p className="text-gray-600 text-base font-medium">Manage employee onboarding process and documentation</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 font-medium">{candidates.filter(c => 
                        searchTerm === "" || 
                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.job_title.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length} Onboarded Candidates</span>
                    </div>
                    <div className="w-px h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-xs text-gray-600 font-semibold">Real-time Updates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <div className="bg-white border border-black rounded-xl p-1">
              <div className="flex items-center space-x-2 px-3 py-2">
                <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
                  <FiSearch className="w-3 h-3 text-gray-600" />
                </div>
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Onboarded Candidates Cards */}
        <div className="bg-white rounded-2xl border border-black p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Onboarded Candidates</h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
              {candidates.filter(c => 
                searchTerm === "" || 
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.job_title.toLowerCase().includes(searchTerm.toLowerCase())
              ).length} candidates
            </span>
          </div>

          {candidates.filter(c => 
            searchTerm === "" || 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.job_title.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-500">
                {searchTerm ? "No matching onboarded candidates found" : "No onboarded candidates yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates
                .filter(c => 
                  searchTerm === "" || 
                  c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.job_title.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((c) => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm border border-black p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {c.name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{c.job_title}</p>
                      <p className="text-sm text-gray-500">{c.department}</p>
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Employee ID:</span>
                          {c.employee_id ? (
                            <span className="text-xs font-medium text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded">
                              {c.employee_id}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Not Available</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Status:</span>
                          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded flex items-center">
                            <FiUser className="mr-1" size={8} />
                            {c.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-3 space-y-2">
                        <button
                          className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center"
                          onClick={() => {
                            if (!canViewOnboardingDocuments) {
                              showToast("You don't have permission to view documents", "error");
                              return;
                            }
                            fetchCandidateDocuments(c.candidate_id);
                          }}
                        >
                          <FiEye className="mr-1" size={12} />
                          View Documents
                        </button>
                        {canAddDocumentCollected && (
                        <button
                          className="w-full text-xs text-green-600 hover:text-green-800 font-medium bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center"
                          onClick={() => {
                            setSelectedCandidate(c);
                            setShowOriginalDocsModal(true);
                          }}
                        >
                          <FiClipboard className="mr-1" size={12} />
                          Documents Collected
                        </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

          {/* ============================ MODALS BELOW ============================ */}

          {/* New Comprehensive Onboarding Form */}
          {showNewOnboardingForm && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 w-[900px] max-h-[90vh] overflow-y-auto rounded-xl shadow-xl">
                <h2 className="text-2xl font-semibold mb-6 text-center">
                  Employee Onboarding Form
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium mb-3 text-blue-600 border-b pb-2">Personal Information</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.full_name}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, full_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.date_of_birth}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, date_of_birth: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender *</label>
                    <select
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.gender}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, gender: e.target.value})}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Personal Email *</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.personal_email}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, personal_email: e.target.value})}
                      required
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-lg font-medium mb-3 text-blue-600 border-b pb-2">Contact Information</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.phone_number}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, phone_number: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Emergency Contact Name *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.emergency_contact_name}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, emergency_contact_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Emergency Contact Phone *</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.emergency_contact_phone}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, emergency_contact_phone: e.target.value})}
                      required
                    />
                  </div>

                  {/* Employment Details */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-lg font-medium mb-3 text-blue-600 border-b pb-2">Employment Details</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee ID *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 flex-1"
                        value={newOnboardingForm.employee_id}
                        onChange={(e) => setNewOnboardingForm({...newOnboardingForm, employee_id: e.target.value})}
                        onBlur={() => validateEmployeeId(newOnboardingForm.employee_id)}
                        required
                        placeholder="Auto-generated or enter manually"
                      />
                      <button
                        type="button"
                        className="px-4 py-3 bg-white text-black font-semibold border border-black rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={generateEmployeeId}
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Joining Date *</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.joining_date}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, joining_date: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Department *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-gray-100"
                      value={newOnboardingForm.department}
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Designation *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-gray-100"
                      value={newOnboardingForm.designation}
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Work Location</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.work_location || ""}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, work_location: e.target.value})}
                      placeholder="Main Office"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Reporting Manager</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.reporting_manager || ""}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, reporting_manager: e.target.value})}
                      placeholder="To be assigned"
                    />
                  </div>

                  {/* Banking Information */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-lg font-medium mb-3 text-blue-600 border-b pb-2">Banking Information</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Bank Name *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.bank_name}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, bank_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Number *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.account_number}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, account_number: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.ifsc_code}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, ifsc_code: e.target.value})}
                      required
                    />
                  </div>

                  {/* Identity Documents */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-lg font-medium mb-3 text-blue-600 border-b pb-2">Identity Documents</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Aadhaar Number *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.aadhar_number}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, aadhar_number: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">PAN Number *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.pan_number}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, pan_number: e.target.value})}
                      required
                    />
                  </div>

                  {/* Address Information */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-lg font-medium mb-3 text-blue-600 border-b pb-2">Address Information</h3>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Current Address *</label>
                    <textarea
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none h-20"
                      value={newOnboardingForm.current_address}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, current_address: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.city}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, city: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">State *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white text-black border border-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      value={newOnboardingForm.state}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, state: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    className="px-6 py-3 bg-white text-black font-semibold border border-black rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setShowNewOnboardingForm(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="px-6 py-3 bg-white text-black font-semibold border border-black rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={submitNewOnboarding}
                  >
                    Submit Onboarding Form
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Start Onboarding Modal */}
          {showOnboardingModal && selectedCandidate && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="bg-white p-6 w-[500px] rounded-xl shadow-xl">
                <h2 className="text-xl font-semibold mb-4">
                  Start Onboarding — {selectedCandidate.name}
                </h2>

                <div className="space-y-3">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    value={onboardingForm.joining_date}
                    onChange={(e) =>
                      setOnboardingForm({
                        ...onboardingForm,
                        joining_date: e.target.value
                      })
                    }
                  />

                  <label>Work Location</label>
                  <select
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    value={onboardingForm.work_location}
                    onChange={(e) =>
                      setOnboardingForm({
                        ...onboardingForm,
                        work_location: e.target.value
                      })
                    }
                  >
                    <option>Select</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.name}>
                        {l.name}
                      </option>
                    ))}
                  </select>

                  <label>Reporting Manager</label>
                  <select
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    value={onboardingForm.reporting_manager}
                    onChange={(e) =>
                      setOnboardingForm({
                        ...onboardingForm,
                        reporting_manager: e.target.value
                      })
                    }
                  >
                    <option>Select</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  <label>Work Shift</label>
                  <select
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    value={onboardingForm.work_shift}
                    onChange={(e) =>
                      setOnboardingForm({
                        ...onboardingForm,
                        work_shift: e.target.value
                      })
                    }
                  >
                    <option>General</option>
                    <option>Rotational</option>
                  </select>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowOnboardingModal(false)}
                  >
                    Close
                  </button>

                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={startOnboarding}
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Document Upload Modal */}
          {showDocModal && onboardingDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="bg-white p-6 w-[600px] rounded-xl shadow-xl">
                <h2 className="text-xl font-semibold mb-4">
                  Upload Documents — {onboardingDetails.onboarding.candidate_name}
                </h2>

                <div className="space-y-3">
                  <input type="file" className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} multiple />
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowDocModal(false)}
                  >
                    Close
                  </button>

                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    onClick={() => {
                      const fileInput = document.querySelector("input[type='file']");
                      uploadDocuments(fileInput.files);
                    }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Document Verification Modal */}
          {showVerifyModal && onboardingDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="bg-white p-6 w-[500px] rounded-xl shadow-xl">
                <h2 className="text-xl font-semibold mb-4">
                  Verify Documents — {onboardingDetails.onboarding.candidate_name}
                </h2>

                <div className="space-y-4 text-sm">
                  <button
                    className="w-full bg-red-500 text-white py-2 rounded"
                    onClick={rejectDocs}
                  >
                    Reject — Ask Reupload
                  </button>

                  <button
                    className="w-full bg-green-600 text-white py-2 rounded"
                    onClick={approveDocs}
                  >
                    Approve Documents
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Appointment Letter Modal */}
          {showAppointmentModal && onboardingDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="bg-white p-6 w-[600px] rounded-xl shadow-xl">
                <h2 className="text-xl font-semibold mb-4">Generate Appointment Letter</h2>

                <label>Grade</label>
                <select
                  className="border p-2 rounded w-full mb-3" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                  value={appointmentForm.grade}
                  onChange={(e) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      grade: e.target.value
                    })
                  }
                >
                  {grades.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.code} — {g.name}
                    </option>
                  ))}
                </select>

                <label>Terms</label>
                <textarea
                  className="border p-2 rounded w-full h-32" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                  value={appointmentForm.terms}
                  onChange={(e) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      terms: e.target.value
                    })
                  }
                ></textarea>

                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowAppointmentModal(false)}
                  >
                    Close
                  </button>

                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    onClick={generateAppointment}
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Employee Creation Modal */}
          {showEmployeeModal && onboardingDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="bg-white p-6 w-[500px] rounded-xl shadow-xl">
                <h2 className="text-xl font-semibold mb-4">Create Employee</h2>

                <div className="space-y-3">
                  <input
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    placeholder="Employee Code"
                    value={employeeForm.employee_code}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        employee_code: e.target.value
                      })
                    }
                  />

                  <input
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    placeholder="Official Email"
                    value={employeeForm.official_email}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        official_email: e.target.value
                      })
                    }
                  />

                  <select
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    value={employeeForm.employee_type}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        employee_type: e.target.value
                      })
                    }
                  >
                    <option>Permanent</option>
                    <option>Contract</option>
                    <option>Intern</option>
                  </select>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowEmployeeModal(false)}
                  >
                    Close
                  </button>

                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    onClick={createEmployee}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Documents Modal */}
          {showDocumentsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b  bg-content">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-primary">Uploaded Documents</h2>
                    <button
                      className=" hover:text-secondary p-2 rounded-lg hover:bg-gray-200 transition-colors" style={{color: 'var(--text-muted, #6b7280)'}}
                      onClick={() => setShowDocumentsModal(false)}
                    >
                      <span className="text-2xl">×</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 120px)'}}>
                  {candidateDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {candidateDocuments.map((doc) => (
                        <div key={doc.id} className="border rounded-xl p-4 bg-content hover:shadow-md transition-shadow" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <FiFileText className="text-blue-600 mr-2" size={20} />
                              <h3 className="font-semibold text-primary capitalize text-sm">
                                {doc.document_type.replace('_', ' ')}
                              </h3>
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {doc.status}
                            </span>
                          </div>
                          
                          <p className="text-sm text-secondary mb-2 flex items-center">
                            <FiFileText className="mr-1" size={14} />
                            {doc.file_name}
                          </p>
                          
                          <p className="text-xs text-muted mb-4 flex items-center">
                            <FiCalendar className="mr-1" size={12} />
                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                          
                          <button
                            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                            onClick={() => window.open(`http://localhost:8000/recruitment/onboarding/document/${doc.id}/view`, '_blank')}
                          >
                            <FiEye className="mr-2" size={14} />
                            View Document
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiFileText className="mx-auto text-muted mb-4" size={48} />
                      <p className="" style={{color: 'var(--text-secondary, #374151)'}}>No documents uploaded yet</p>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t  bg-content flex justify-end">
                  <button
                    className="px-6 py-2 border-dark text-secondary rounded-lg hover:bg-content transition-colors"
                    onClick={() => setShowDocumentsModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </Layout>
      <Toast toast={toast} hideToast={hideToast} />
      
      {/* Original Documents Collection Modal */}
      <OriginalDocumentsModal
        isOpen={showOriginalDocsModal}
        onClose={() => setShowOriginalDocsModal(false)}
        employee={selectedCandidate}
      />
    </>
  );
}
