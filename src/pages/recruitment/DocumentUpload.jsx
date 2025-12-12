import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

export default function DocumentUpload() {
  const { token } = useParams();
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [uploads, setUploads] = useState({});
  const [uploading, setUploading] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const requiredDocs = [
    { key: "aadhaar", label: "Aadhaar Card (Front & Back)", required: true },
    { key: "pan", label: "PAN Card", required: true },
    { key: "photo", label: "Passport Size Photo", required: true },
    { key: "education", label: "Educational Certificates", required: true },
    { key: "experience", label: "Experience Certificates", required: false },
    { key: "relieving", label: "Relieving Letter", required: false },
    { key: "salary_slips", label: "Salary Slips (Last 3 months)", required: false },
    { key: "bank", label: "Bank Passbook/Statement", required: true }
  ];

  useEffect(() => {
    fetchCandidateInfo();
  }, [token]);

  const fetchCandidateInfo = async () => {
    try {
      const res = await api.get(`/recruitment/offer/documents/${token}`);
      setCandidateInfo(res.data);
    } catch (err) {
      alert("Invalid or expired link");
    }
  };

  const handleFileUpload = async (docType, file) => {
    if (!file) return;

    setUploading({ ...uploading, [docType]: true });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", docType);

      await api.post(`/recruitment/offer/documents/${token}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setUploads({ ...uploads, [docType]: file.name });
      alert("Document uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload document");
    } finally {
      setUploading({ ...uploading, [docType]: false });
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post(`/recruitment/offer/documents/${token}/submit`);
      setSubmitted(true);
      alert("Documents submitted successfully! HR will review your documents.");
    } catch (err) {
      alert("Failed to submit documents");
    }
  };

  const getRequiredUploaded = () => {
    return requiredDocs.filter(doc => doc.required).filter(doc => uploads[doc.key]).length;
  };

  const getTotalRequired = () => {
    return requiredDocs.filter(doc => doc.required).length;
  };

  if (!candidateInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📄 Document Upload Portal
            </h1>
            <p className="text-lg text-gray-600">
              Welcome <strong>{candidateInfo.candidate_name}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Position: {candidateInfo.job_title} at NUTRYAH
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8 rounded-r-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            📋 Upload Instructions
          </h3>
          <ul className="text-blue-700 space-y-1">
            <li>• Upload clear, readable copies of all documents</li>
            <li>• Accepted formats: PDF, JPG, PNG (Max 5MB per file)</li>
            <li>• Required documents are marked with *</li>
            <li>• BGV process will begin after document verification</li>
          </ul>
        </div>

        {/* Document Upload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requiredDocs.map((doc) => (
            <div key={doc.key} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">
                  {doc.label}
                  {doc.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                {uploads[doc.key] && (
                  <span className="text-green-600 text-sm">✅ Uploaded</span>
                )}
              </div>

              <div className="space-y-3">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(doc.key, e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={uploading[doc.key]}
                />

                {uploading[doc.key] && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}

                {uploads[doc.key] && (
                  <p className="text-sm text-green-600">
                    📎 {uploads[doc.key]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Section */}
        <div className="bg-white rounded-xl shadow p-6 mt-8">
          <div className="text-center">
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-800">
                Progress: {getRequiredUploaded()} / {getTotalRequired()} Required Documents
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(getRequiredUploaded() / getTotalRequired()) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={getRequiredUploaded() < getTotalRequired()}
                className={`px-8 py-3 rounded-lg font-semibold text-lg ${
                  getRequiredUploaded() >= getTotalRequired()
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                📤 Submit All Documents
              </button>
            ) : (
              <div className="text-green-600">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-lg font-semibold">Documents Submitted Successfully!</p>
                <p className="text-sm text-gray-600 mt-2">
                  HR will review your documents and contact you soon.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl shadow p-6 mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Need help? Contact HR at <strong>hr@nutryah.com</strong>
          </p>
          <p className="text-sm text-gray-500">
            This link expires in 7 days. Please upload all documents promptly.
          </p>
        </div>

      </div>
    </div>
  );
}