import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../api";

export default function Onboarding() {
  const location = useLocation();
  const [candidates, setCandidates] = useState([]);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showNewOnboardingForm, setShowNewOnboardingForm] = useState(false);
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
    try {
      const [offersRes, onboardingRes] = await Promise.all([
        api.get("/recruitment/offer/list"),
        api.get("/recruitment/onboarding/candidates")
      ]);
      
      // Show only candidates who have started onboarding
      const onboardedOffers = offersRes.data.filter(offer => offer.offer_status === "Onboarding Started");
      
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
      alert("Onboarding started successfully!");
      setShowOnboardingModal(false);
      fetchCandidates();
    } catch (err) {
      alert("Failed to start onboarding");
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
      alert("Onboarding started successfully! Joining formalities email sent to candidate.");
      setShowNewOnboardingForm(false);
      fetchCandidates();
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to submit onboarding form");
    }
  };

  // ===============================================================
  // UPLOAD DOCUMENTS
  // ===============================================================
  const uploadDocuments = async (files) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      await api.post(
        `/recruitment/onboarding/documents/upload/${onboardingDetails.onboarding.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Documents uploaded successfully!");
      setShowDocModal(false);
      fetchCandidates();
    } catch (err) {
      alert("Failed to upload documents");
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
      alert("Failed to generate and send appointment");
    }
  };

  // SEND APPOINTMENT LETTER EMAIL
  const sendAppointmentEmail = async () => {
    try {
      const res = await api.post(
        `/recruitment/onboarding/appointment/send/${onboardingDetails.onboarding.id}`,
        {}
      );
      alert(res.data.message);
      setShowAppointmentModal(false);
    } catch (err) {
      alert("Failed to send appointment letter");
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
      alert(`Employee created! Code: ${res.data.employee_code}`);
      setShowEmployeeModal(false);
      fetchCandidates();
    } catch (err) {
      alert("Failed to create employee");
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
      alert("Documents rejected. Candidate can re-upload.");
      setShowVerifyModal(false);
      fetchCandidates();
    } catch (err) {
      alert("Failed to reject documents");
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
      alert("Documents approved!");
      setShowVerifyModal(false);
      fetchCandidates();
    } catch (err) {
      alert("Failed to approve documents");
    }
  };

  // ===================================================================
  // ========================  UI START  ===============================
  // ===================================================================
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-50 min-h-screen">
        <Header />

        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Onboarding</h1>

          {/* Search Filter */}
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search Onboarded Candidate"
              className="border p-2 rounded w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Onboarded Candidates Table */}
          <table className="min-w-full bg-white rounded-xl shadow">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="p-3 text-left">Candidate Name</th>
                <th className="p-3 text-left">Job Role</th>
                <th className="p-3 text-center">Employee ID</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>

            <tbody>
              {candidates
                .filter(c => 
                  searchTerm === "" || 
                  c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.job_title.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{c.job_title}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-mono">
                      {c.employee_id || 'Not Available'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-3 py-1 text-sm rounded bg-green-100 text-green-700 font-medium">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {candidates.filter(c => 
                searchTerm === "" || 
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.job_title.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    {searchTerm ? "No matching onboarded candidates found" : "No onboarded candidates yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

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
                      className="border p-2 rounded w-full"
                      value={newOnboardingForm.full_name}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, full_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      className="border p-2 rounded w-full"
                      value={newOnboardingForm.date_of_birth}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, date_of_birth: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender *</label>
                    <select
                      className="border p-2 rounded w-full"
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
                      className="border p-2 rounded w-full"
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
                      className="border p-2 rounded w-full"
                      value={newOnboardingForm.phone_number}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, phone_number: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Emergency Contact Name *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full"
                      value={newOnboardingForm.emergency_contact_name}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, emergency_contact_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Emergency Contact Phone *</label>
                    <input
                      type="tel"
                      className="border p-2 rounded w-full"
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
                        className="border p-2 rounded flex-1"
                        value={newOnboardingForm.employee_id}
                        onChange={(e) => setNewOnboardingForm({...newOnboardingForm, employee_id: e.target.value})}
                        required
                        placeholder="Auto-generated or enter manually"
                      />
                      <button
                        type="button"
                        className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
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
                      className="border p-2 rounded w-full"
                      value={newOnboardingForm.joining_date}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, joining_date: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Department *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full bg-gray-100"
                      value={newOnboardingForm.department}
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Designation *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full bg-gray-100"
                      value={newOnboardingForm.designation}
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Work Location</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full"
                      value={newOnboardingForm.work_location || ""}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, work_location: e.target.value})}
                      placeholder="Main Office"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Reporting Manager</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full"
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
                      className="border p-2 rounded w-full"
                      value={newOnboardingForm.bank_name}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, bank_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Number *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full"
                      value={newOnboardingForm.account_number}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, account_number: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full"
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
                      className="border p-2 rounded w-full"
                      value={newOnboardingForm.aadhar_number}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, aadhar_number: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">PAN Number *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full"
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
                      className="border p-2 rounded w-full h-20"
                      value={newOnboardingForm.current_address}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, current_address: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full"
                      value={newOnboardingForm.city}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, city: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">State *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full"
                      value={newOnboardingForm.state}
                      onChange={(e) => setNewOnboardingForm({...newOnboardingForm, state: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    className="px-6 py-2 bg-gray-300 rounded"
                    onClick={() => setShowNewOnboardingForm(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="px-6 py-2 bg-blue-600 text-white rounded"
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
                    className="border p-2 rounded w-full"
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
                    className="border p-2 rounded w-full"
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
                    className="border p-2 rounded w-full"
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
                    className="border p-2 rounded w-full"
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
                  <input type="file" className="border p-2 rounded w-full" multiple />
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
                  className="border p-2 rounded w-full mb-3"
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
                  className="border p-2 rounded w-full h-32"
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
                    className="border p-2 rounded w-full"
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
                    className="border p-2 rounded w-full"
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
                    className="border p-2 rounded w-full"
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

        </div>
      </div>
    </div>
  );
}
