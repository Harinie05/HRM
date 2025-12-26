// ------------------------------------------------------------
//  OFFER MANAGEMENT + BGV + EMAIL + ATTACHMENTS  (FULL UI)
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../api";
import { FiMail, FiFileText, FiCheck, FiX, FiEye, FiLink, FiUser, FiCalendar, FiDollarSign, FiShield, FiUpload } from "react-icons/fi";

export default function Offer() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);

  const [offerForm, setOfferForm] = useState({
    candidate_id: "",
    job_title: "",
    department: "",
    location: "",
    email: "",
    ctc: "",
    basic_percent: 40,
    hra_percent: 20,
    joining_date: "",
    probation: "3 Months",
    notice: "30 Days",
    terms: "",
  });

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedOffer, setGeneratedOffer] = useState(null);
  const [attachments, setAttachments] = useState([]);

  const [offers, setOffers] = useState([]);

  // ---------- BGV ----------
  const [showBGVModal, setShowBGVModal] = useState(false);
  const [selectedBGV, setSelectedBGV] = useState(null);
  const [bgvForm, setBgvForm] = useState({
    verification_type: "Internal HR Team",
    agency_name: "",
    status: "Pending",
    identity_verified: false,
    address_verified: false,
    employment_verified: false,
    education_verified: false,
    criminal_verified: false,
    remarks: "",
  });

  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [linkCandidate, setLinkCandidate] = useState("");

  // ------------------------------------------------------------
  // FETCH SELECTED CANDIDATES
  // ------------------------------------------------------------
  const fetchCandidates = async () => {
    try {
      const jobs = await api.get("/recruitment/ats/jobs");
      let finalList = [];

      for (let job of jobs.data) {
        const candidates = await api.get(`/recruitment/ats/job/${job.id}`);
        const selected = candidates.data.filter(c => c.stage === "Selected");
        
        // Add job information to candidates
        const enriched = selected.map(c => ({
          ...c,
          job_title: job.title,
          department: job.department
        }));
        
        finalList.push(...enriched);
      }

      setCandidates(finalList);
    } catch (err) {
      console.error("Failed to load candidates", err);
    }
  };

  // ------------------------------------------------------------
  // FETCH OFFERS TABLE
  // ------------------------------------------------------------
  const fetchOffers = async () => {
    try {
      const res = await api.get("/recruitment/offer/list");
      
      // Remove duplicates by keeping only the latest offer per candidate
      const uniqueOffers = [];
      const seenCandidates = new Set();
      
      // Sort by created_at descending to get latest offers first
      const sortedOffers = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      for (const offer of sortedOffers) {
        if (!seenCandidates.has(offer.candidate_id)) {
          uniqueOffers.push(offer);
          seenCandidates.add(offer.candidate_id);
        }
      }
      
      setOffers(uniqueOffers);
    } catch (err) {
      console.error("Failed to load offers", err);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchOffers();
  }, []);

  // ------------------------------------------------------------
  // GENERATE OFFER LETTER
  // ------------------------------------------------------------
  const generateOffer = async () => {
    try {
      const res = await api.post(
        `/recruitment/offer/${offerForm.candidate_id}/create`,
        {
          ctc: parseInt(offerForm.ctc),
          basic_percent: parseInt(offerForm.basic_percent),
          hra_percent: parseInt(offerForm.hra_percent),
          joining_date: offerForm.joining_date,
          probation_period: offerForm.probation,
          notice_period: offerForm.notice,
          terms: offerForm.terms,
        }
      );

      setGeneratedOffer(res.data);
      setShowPreview(true);
    } catch (err) {
      alert("Failed to generate offer.");
    }
  };

  // ------------------------------------------------------------
  // SEND OFFER EMAIL
  // ------------------------------------------------------------
  const sendOffer = async () => {
    try {
      await api.post(`/recruitment/offer/${generatedOffer.id}/send`);

      alert("Offer letter sent successfully to candidate!");
      setShowPreview(false);
      setShowOfferModal(false);
      fetchOffers();
    } catch (err) {
      alert("Failed to send offer");
    }
  };

  // ------------------------------------------------------------
  // MANUALLY ACCEPT / REJECT OFFER
  // ------------------------------------------------------------
  const handleOfferResponse = async (offerId, action) => {
    try {
      const status = action === "accept" ? "Accepted" : "Rejected";
      await api.post(`/recruitment/offer/${offerId}/status?status=${status}`);
      alert(`Offer ${action}ed successfully`);
      fetchOffers();
    } catch {
      alert("Failed to update offer status");
    }
  };

  // ------------------------------------------------------------
  // START BGV
  // ------------------------------------------------------------
  const startBGV = async (applicationId) => {
    try {
      await api.post(`/recruitment/offer/bgv/start/${applicationId}`);
      alert("BGV Started");
      fetchOffers();
    } catch {
      alert("Failed");
    }
  };

  // ------------------------------------------------------------
  // OPEN BGV MODAL
  // ------------------------------------------------------------
  const openBGVModal = async (offer) => {
    try {
      if (offer.bgv_id) {
        const res = await api.get(`/recruitment/offer/bgv/${offer.bgv_id}`);
        setBgvForm({
          verification_type: res.data.verification_type || "Internal HR Team",
          agency_name: res.data.agency_name || "",
          status: res.data.status,
          identity_verified: res.data.identity_verified || false,
          address_verified: res.data.address_verified || false,
          employment_verified: res.data.employment_verified || false,
          education_verified: res.data.education_verified || false,
          criminal_verified: res.data.criminal_verified || false,
          remarks: res.data.remarks,
        });
      }
      setSelectedBGV(offer);
      setShowBGVModal(true);
    } catch (err) {
      alert("Failed to load BGV details");
    }
  };

  // ------------------------------------------------------------
  // UPDATE BGV
  // ------------------------------------------------------------
  const updateBGV = async () => {
    try {
      await api.put(
        `/recruitment/offer/bgv/update/${selectedBGV.bgv_id}`,
        bgvForm
      );
      
      // If BGV status is set to Cleared, update offer status
      if (bgvForm.status === "Cleared") {
        await api.post(`/recruitment/offer/${selectedBGV.id}/status?status=BGV Cleared`);
      }
      
      alert("BGV Updated!");
      setShowBGVModal(false);
      fetchOffers();
    } catch {
      alert("Failed to update");
    }
  };

  // ------------------------------------------------------------
  // START ONBOARDING - COMPREHENSIVE FORM
  // ------------------------------------------------------------
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [selectedOnboardingCandidate, setSelectedOnboardingCandidate] = useState(null);
  const [onboardingFormData, setOnboardingFormData] = useState({
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

  const startOnboarding = (candidateId, candidateName, jobTitle, department) => {
    setSelectedOnboardingCandidate({ candidateId, candidateName, jobTitle, department });
    setOnboardingFormData({
      full_name: candidateName,
      date_of_birth: "",
      gender: "",
      personal_email: "",
      phone_number: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      employee_id: "",
      joining_date: "",
      department: department,
      designation: jobTitle,
      work_location: "Main Office",
      reporting_manager: "TBD",
      bank_name: "",
      account_number: "",
      ifsc_code: "",
      aadhar_number: "",
      pan_number: "",
      current_address: "",
      city: "",
      state: ""
    });
    setShowOnboardingForm(true);
  };

  const generateEmployeeId = () => {
    const dept = onboardingFormData.department.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const empId = `${dept}${timestamp}`;
    setOnboardingFormData({...onboardingFormData, employee_id: empId});
  };

  const submitOnboardingForm = async () => {
    try {
      await api.post(`/recruitment/onboarding/create/${selectedOnboardingCandidate.candidateId}`, {
        job_title: onboardingFormData.designation,
        department: onboardingFormData.department,
        joining_date: onboardingFormData.joining_date,
        work_location: onboardingFormData.work_location,
        reporting_manager: onboardingFormData.reporting_manager,
        work_shift: "General",
        probation_period: "3 Months",
        employee_id: onboardingFormData.employee_id
      });
      
      alert("Onboarding started successfully! Joining formalities email sent to candidate.");
      setShowOnboardingForm(false);
      fetchOffers();
      
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to start onboarding");
    }
  };

  // ------------------------------------------------------------
  // VIEW DOCUMENTS
  // ------------------------------------------------------------
  const viewDocuments = async (offerId) => {
    try {
      const res = await api.get(`/recruitment/offer/documents/view/${offerId}`);
      setDocuments(res.data.documents);
      setShowDocuments(true);
    } catch {
      alert("Failed to load documents");
    }
  };

  // ------------------------------------------------------------
  // GENERATE DOCUMENT UPLOAD LINK
  // ------------------------------------------------------------
  const generateDocumentLink = async (offerId) => {
    try {
      const res = await api.post(`/recruitment/offer/${offerId}/generate-link`);
      setGeneratedLink(res.data.upload_url);
      setLinkCandidate(res.data.candidate_name);
      setShowLinkModal(true);
    } catch {
      alert("Failed to generate link");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert("Link copied to clipboard!");
  };

  // ------------------------------------------------------------
  // UI STARTS HERE
  // ------------------------------------------------------------
  return (
    <Layout breadcrumb="Recruitment · Offers & Contracts">
      <div className="p-6">
        {/* Header */}
        <div className="rounded-xl shadow-sm border mb-8" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <div className="px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <FiFileText className="text-green-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary">Offer & Pre-Onboarding</h1>
                  <p className=" mt-1" style={{color: 'var(--text-secondary, #374151)'}}>Manage job offers, background verification, and onboarding process</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{candidates.length}</div>
                  <div className="text-sm text-secondary">Selected Candidates</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== SENT OFFERS TABLE ==================== */}
        {offers.length > 0 && (
          <div className="mb-10">
            <div className="rounded-xl shadow-sm border" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
              <div className="px-6 py-4 border-b ">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-primary">Offers Sent</h2>
                  <span className="text-sm text-muted">{offers.length} offers</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="min-w-full">
                  <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-content border-b ">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Position</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="divide-y" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
                    {offers.map((o) => (
                      <tr key={o.id} className="hover:bg-content transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <FiUser className="text-blue-600" size={16} />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-primary">{o.candidate_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-primary">{o.job_title}</div>
                          <div className="text-sm text-muted">{o.department}</div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              o.offer_status === "Accepted"
                                ? "bg-green-100 text-green-800"
                                : o.offer_status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : o.offer_status === "Documents Submitted"
                                ? "bg-blue-100 text-blue-800"
                                : o.offer_status === "BGV Cleared"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {o.offer_status === "Accepted" && <FiCheck className="mr-1" size={10} />}
                            {o.offer_status === "Rejected" && <FiX className="mr-1" size={10} />}
                            {o.offer_status === "Documents Submitted" && <FiFileText className="mr-1" size={10} />}
                            {o.offer_status === "BGV Cleared" && <FiShield className="mr-1" size={10} />}
                            {o.offer_status === "Sent" && <FiMail className="mr-1" size={10} />}
                            {o.offer_status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">

                            {/* Accept/Reject */}
                            {o.offer_status === "Sent" && (
                              <>
                                <button
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                                  onClick={() => handleOfferResponse(o.id, "accept")}
                                >
                                  <FiCheck className="mr-1" size={12} />
                                  Accept
                                </button>

                                <button
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                                  onClick={() => handleOfferResponse(o.id, "reject")}
                                >
                                  <FiX className="mr-1" size={12} />
                                  Reject
                                </button>
                              </>
                            )}

                            {/* Step 1: Generate Document Upload Link */}
                            {(o.offer_status === "Accepted" || (o.offer_status === "Draft" && o.bgv_status === "Cleared")) && (
                              <button
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                                onClick={() => generateDocumentLink(o.id)}
                              >
                                <FiLink className="mr-1" size={12} />
                                Generate Link
                              </button>
                            )}

                            {/* Step 2: View Documents */}
                            {o.offer_status === "Documents Submitted" && (
                              <button
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                onClick={() => viewDocuments(o.id)}
                              >
                                <FiEye className="mr-1" size={12} />
                                View Docs
                              </button>
                            )}

                            {/* Step 3: Manage BGV */}
                            {o.offer_status === "Documents Submitted" && (
                              <button
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                                onClick={() => {
                                  if (!o.bgv_id) {
                                    startBGV(o.candidate_id);
                                  } else {
                                    openBGVModal(o);
                                  }
                                }}
                              >
                                <FiShield className="mr-1" size={12} />
                                Manage BGV
                              </button>
                            )}

                            {/* Step 4: Start Onboarding */}
                            {o.offer_status === "BGV Cleared" && o.offer_status !== "Onboarding Started" && (
                              <button
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                                onClick={() => startOnboarding(o.candidate_id, o.candidate_name, o.job_title, o.department)}
                              >
                                <FiUser className="mr-1" size={12} />
                                Start Onboarding
                              </button>
                            )}

                            {/* Onboarding Started Status */}
                            {o.offer_status === "Onboarding Started" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <FiUser className="mr-1" size={10} />
                                Onboarding In Progress
                              </span>
                            )}

                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SELECTED CANDIDATES ==================== */}
        <div className="rounded-xl shadow-sm border" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <div className="px-6 py-4 border-b ">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary">Selected Candidates</h2>
              <span className="text-sm text-muted">{candidates.length} candidates</span>
            </div>
          </div>

          {candidates.length === 0 ? (
            <div className="text-center py-12">
              <FiUser className="mx-auto text-muted mb-4" size={48} />
              <p className="" style={{color: 'var(--text-secondary, #374151)'}}>No selected candidates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="min-w-full">
                <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-content border-b ">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider">Stage</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="divide-y" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
                  {candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-content transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <FiUser className="text-green-600" size={16} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-primary">{c.name}</div>
                            <div className="text-sm text-muted">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-primary">{c.job_title}</div>
                        <div className="text-sm text-muted">{c.department}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiCheck className="mr-1" size={10} />
                          {c.stage}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {offers.some(offer => offer.candidate_id === c.id) ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FiMail className="mr-1" size={10} />
                            Offer Sent
                          </span>
                        ) : (
                          <button
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            onClick={() => {
                              setSelected(c);
                              setOfferForm({
                                ...offerForm,
                                candidate_id: c.id,
                                job_title: c.job_title,
                                department: c.department,
                                email: c.email,
                              });
                              setShowOfferModal(true);
                            }}
                          >
                            <FiFileText className="mr-2" size={16} />
                            Generate Offer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

          {/* ================================================================== */}
          {/*                         OFFER MODAL                               */}
          {/* ================================================================== */}
          {showOfferModal && selected && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 w-[550px] rounded-xl shadow-xl">

                <h2 className="text-lg font-semibold mb-3">
                  Generate Offer – {selected.name}
                </h2>

                {/* FORM */}
                <div className="space-y-3">

                  <input
                    type="number"
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    placeholder="CTC Offered"
                    value={offerForm.ctc}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, ctc: e.target.value })
                    }
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      className="border p-2 rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      placeholder="Basic %"
                      value={offerForm.basic_percent}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          basic_percent: e.target.value,
                        })
                      }
                    />

                    <input
                      type="number"
                      className="border p-2 rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      placeholder="HRA %"
                      value={offerForm.hra_percent}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          hra_percent: e.target.value,
                        })
                      }
                    />
                  </div>

                  <input
                    type="text"
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    placeholder="Location"
                    value={offerForm.location}
                    onChange={(e) =>
                      setOfferForm({
                        ...offerForm,
                        location: e.target.value,
                      })
                    }
                  />

                  <input
                    type="email"
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    placeholder="Email"
                    value={offerForm.email}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, email: e.target.value })
                    }
                  />

                  <input
                    type="date"
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    value={offerForm.joining_date}
                    onChange={(e) =>
                      setOfferForm({
                        ...offerForm,
                        joining_date: e.target.value,
                      })
                    }
                  />

                  <textarea
                    className="border p-2 rounded w-full h-20" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    placeholder="Terms & Conditions"
                    value={offerForm.terms}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, terms: e.target.value })
                    }
                  ></textarea>

                  {/* Attachment */}
                  <input
                    type="file"
                    multiple
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    onChange={(e) =>
                      setAttachments(Array.from(e.target.files))
                    }
                  />

                </div>

                <div className="flex justify-between mt-5">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowOfferModal(false)}
                  >
                    Close
                  </button>

                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={generateOffer}
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/*                        OFFER PREVIEW MODAL                        */}
          {/* ================================================================== */}
          {showPreview && generatedOffer && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
              <div className="bg-white p-6 w-[600px] rounded-xl shadow-lg">

                <h2 className="text-lg font-semibold mb-3">
                  Offer Letter Preview
                </h2>

                <p><b>Candidate:</b> {selected.name}</p>
                <p><b>Role:</b> {selected.job_title}</p>
                <p><b>CTC:</b> ₹{generatedOffer.ctc}</p>
                <p><b>Joining:</b> {generatedOffer.joining_date}</p>

                <p className="mt-3">
                  <b>Terms:</b>
                </p>
                <p className="text-sm">{generatedOffer.terms}</p>

                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowPreview(false)}
                  >
                    Back
                  </button>

                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    onClick={sendOffer}
                  >
                    Send Offer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/*                          BGV MODAL                                 */}
          {/* ================================================================== */}
          {showBGVModal && selectedBGV && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[450px] shadow-xl">

                <h2 className="text-lg font-semibold mb-4">
                  BGV – {selectedBGV.candidate_name}
                </h2>

                <div className="space-y-3">

                  <select
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    value={bgvForm.verification_type}
                    onChange={(e) =>
                      setBgvForm({
                        ...bgvForm,
                        verification_type: e.target.value,
                        agency_name: e.target.value === "Internal HR Team" ? "" : bgvForm.agency_name
                      })
                    }
                  >
                    <option value="Internal HR Team">Internal HR Team</option>
                    <option value="Agency">Agency</option>
                  </select>

                  {bgvForm.verification_type === "Agency" && (
                    <input
                      type="text"
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      placeholder="Agency Name"
                      value={bgvForm.agency_name}
                      onChange={(e) =>
                        setBgvForm({
                          ...bgvForm,
                          agency_name: e.target.value,
                        })
                      }
                    />
                  )}

                  <select
                    className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    value={bgvForm.status}
                    onChange={(e) =>
                      setBgvForm({ ...bgvForm, status: e.target.value })
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Failed">Failed</option>
                  </select>

                  {/* BGV Verification Checkboxes */}
                  <div className="border p-3 rounded bg-content" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                    <h4 className="font-medium mb-2 text-sm">Verification Checklist:</h4>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={bgvForm.identity_verified}
                          onChange={(e) =>
                            setBgvForm({ ...bgvForm, identity_verified: e.target.checked })
                          }
                        />
                        Identity Verification (Aadhaar, PAN)
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={bgvForm.address_verified}
                          onChange={(e) =>
                            setBgvForm({ ...bgvForm, address_verified: e.target.checked })
                          }
                        />
                        Address Verification
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={bgvForm.employment_verified}
                          onChange={(e) =>
                            setBgvForm({ ...bgvForm, employment_verified: e.target.checked })
                          }
                        />
                        Employment Verification
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={bgvForm.education_verified}
                          onChange={(e) =>
                            setBgvForm({ ...bgvForm, education_verified: e.target.checked })
                          }
                        />
                        Education Verification
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={bgvForm.criminal_verified}
                          onChange={(e) =>
                            setBgvForm({ ...bgvForm, criminal_verified: e.target.checked })
                          }
                        />
                        Criminal Background Check
                      </label>
                    </div>
                  </div>

                  <textarea
                    className="border p-2 rounded w-full h-20" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                    placeholder="Remarks"
                    value={bgvForm.remarks}
                    onChange={(e) =>
                      setBgvForm({ ...bgvForm, remarks: e.target.value })
                    }
                  ></textarea>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowBGVModal(false)}
                  >
                    Close
                  </button>

                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={updateBGV}
                  >
                    Update
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/*                      DOCUMENTS MODAL                              */}
          {/* ================================================================== */}
          {showDocuments && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[600px] shadow-xl max-h-[80vh] overflow-y-auto">

                <h2 className="text-lg font-semibold mb-4">
                  📄 Uploaded Documents
                </h2>

                {documents.length === 0 ? (
                  <p className=" text-center py-8" style={{color: 'var(--text-muted, #6b7280)'}}>
                    No documents uploaded yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{doc.document_type}</p>
                          <a 
                            href={`http://localhost:8000/recruitment/offer/documents/file/${doc.file_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
                          >
                            📄 {doc.file_name}
                          </a>
                          <p className="text-xs text-muted">
                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          doc.status === "Uploaded" 
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowDocuments(false)}
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/*                   COMPREHENSIVE ONBOARDING FORM                   */}
          {/* ================================================================== */}
          {showOnboardingForm && selectedOnboardingCandidate && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 w-[900px] max-h-[90vh] overflow-y-auto rounded-xl shadow-xl">
                <h2 className="text-2xl font-semibold mb-6 text-center">
                  Employee Onboarding Form - {selectedOnboardingCandidate.candidateName}
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
                      className="border p-2 rounded w-full bg-gray-100" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.full_name}
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.date_of_birth}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, date_of_birth: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender *</label>
                    <select
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.gender}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, gender: e.target.value})}
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
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.personal_email}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, personal_email: e.target.value})}
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
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.phone_number}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, phone_number: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Emergency Contact Name *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.emergency_contact_name}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, emergency_contact_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Emergency Contact Phone *</label>
                    <input
                      type="tel"
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.emergency_contact_phone}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, emergency_contact_phone: e.target.value})}
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
                        className="border p-2 rounded flex-1" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                        value={onboardingFormData.employee_id}
                        onChange={(e) => setOnboardingFormData({...onboardingFormData, employee_id: e.target.value})}
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
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.joining_date}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, joining_date: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Department *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full bg-gray-100" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.department}
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Designation *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full bg-gray-100" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.designation}
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Work Location</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.work_location}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, work_location: e.target.value})}
                      placeholder="Main Office"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Reporting Manager</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.reporting_manager}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, reporting_manager: e.target.value})}
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
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.bank_name}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, bank_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Number *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.account_number}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, account_number: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.ifsc_code}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, ifsc_code: e.target.value})}
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
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.aadhar_number}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, aadhar_number: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">PAN Number *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.pan_number}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, pan_number: e.target.value})}
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
                      className="border p-2 rounded w-full h-20" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.current_address}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, current_address: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.city}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, city: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">State *</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}}
                      value={onboardingFormData.state}
                      onChange={(e) => setOnboardingFormData({...onboardingFormData, state: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    className="px-6 py-2 bg-gray-300 rounded"
                    onClick={() => setShowOnboardingForm(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="px-6 py-2 bg-blue-600 text-white rounded"
                    onClick={submitOnboardingForm}
                  >
                    Submit Onboarding Form
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/*                      LINK GENERATION MODAL                        */}
          {/* ================================================================== */}
          {showLinkModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-xl w-[500px] shadow-xl">

                <h2 className="text-lg font-semibold mb-4">
                  🔗 Document Upload Link
                </h2>

                <p className=" mb-4" style={{color: 'var(--text-secondary, #374151)'}}>
                  Share this link with <strong>{linkCandidate}</strong> to upload documents:
                </p>

                <div className="bg-gray-100 p-3 rounded border mb-4">
                  <p className="text-sm font-mono break-all">{generatedLink}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">📋 Required Documents:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Aadhaar Card (Front & Back)</li>
                    <li>• PAN Card</li>
                    <li>• Passport Size Photo</li>
                    <li>• Educational Certificates</li>
                    <li>• Experience Certificates</li>
                    <li>• Relieving Letter</li>
                    <li>• Salary Slips (Last 3 months)</li>
                    <li>• Bank Passbook/Statement</li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded"
                    onClick={() => setShowLinkModal(false)}
                  >
                    Close
                  </button>

                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={copyToClipboard}
                  >
                    📋 Copy Link
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
    </Layout>
  );
}
