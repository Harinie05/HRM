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
    terms:
      "Standard terms and conditions as per company policy will apply. Detailed terms will be provided in your employment contract."
  });

  // ===============================================================
  // FETCH CANDIDATES
  // ===============================================================
  const fetchCandidates = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (selectedJob !== "All Jobs") params.append("job_filter", selectedJob);
      if (selectedStatus !== "All Status")
        params.append("status_filter", selectedStatus);

      const url = `/recruitment/onboarding/candidates${
        params.toString() ? "?" + params.toString() : ""
      }`;

      const res = await api.get(url);
      setCandidates(res.data);
    } catch (err) {
      console.error("Failed to load candidates", err);
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
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [searchTerm, selectedJob, selectedStatus]);

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

          {/* Filters */}
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
              <option>All Jobs</option>
              {jobs.map((j) => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option>All Status</option>
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <table className="min-w-full bg-white rounded-xl shadow">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="p-3 text-left">Candidate</th>
                <th className="p-3 text-left">Job Role</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.job_title}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      {c.onboarding_status}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    {/* Start Onboarding */}
                    {c.onboarding_status === "Not Started" && (
                      <button
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                        onClick={() => {
                          setSelectedCandidate(c);
                          setShowOnboardingModal(true);
                        }}
                      >
                        Start
                      </button>
                    )}

                    {/* Upload Docs */}
                    {c.onboarding_status === "Pending Docs" && (
                      <button
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded"
                        onClick={() => {
                          getOnboardingDetails(c.onboarding_id);
                          setShowDocModal(true);
                        }}
                      >
                        Upload Docs
                      </button>
                    )}

                    {/* Verify Docs */}
                    {c.onboarding_status === "Docs Submitted" && (
                      <button
                        className="px-3 py-1 text-sm bg-orange-600 text-white rounded"
                        onClick={() => {
                          getOnboardingDetails(c.onboarding_id);
                          setShowVerifyModal(true);
                        }}
                      >
                        Verify Docs
                      </button>
                    )}

                    {/* Appointment / Employee Creation */}
                    {c.onboarding_status === "Ready for Joining" && (
                      <div className="space-x-2">
                        <button
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded"
                          onClick={() => {
                            getOnboardingDetails(c.onboarding_id);
                            setShowAppointmentModal(true);
                          }}
                        >
                          Appointment
                        </button>

                        <button
                          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded"
                          onClick={() => {
                            getOnboardingDetails(c.onboarding_id);
                            setShowEmployeeModal(true);
                          }}
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

          {/* ============================ MODALS BELOW ============================ */}

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
