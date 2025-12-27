import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

export default function DocumentUpload() {
  const { token } = useParams();
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [uploads, setUploads] = useState({});
  const [uploading, setUploading] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [otherDocuments, setOtherDocuments] = useState([]);

  const requiredDocs = [
    { key: "aadhaar", label: "Aadhaar Card (Front & Back)", required: true },
    { key: "pan", label: "PAN Card", required: true },
    { key: "photo", label: "Passport Size Photo", required: true },
    { key: "education", label: "Educational Certificates", required: true },
    { key: "experience", label: "Experience Certificates", required: false },
    { key: "relieving", label: "Relieving Letter", required: false },
    { key: "salary_slips", label: "Salary Slips (Last 3 months)", required: false },
    { key: "bank", label: "Bank Passbook/Statement", required: true },
    { key: "medical_degree", label: "Medical Degree Certificate", required: true },
    { key: "council_registration", label: "Medical Council Registration", required: true },
    { key: "medical_license", label: "Medical License Copy", required: true },
    { key: "specialty_cert", label: "Specialty Certification (if applicable)", required: false }
  ];

  const handleSubmit = async () => {
    try {
      await api.post(`/recruitment/offer/documents/${token}/submit`);
      setSubmitted(true);
      alert("Documents submitted successfully! HR will review your documents.");
    } catch (err) {
      alert("Failed to submit documents");
    }
  };

  const handleOtherDocuments = (files) => {
    const fileArray = Array.from(files);
    setOtherDocuments(prev => [...prev, ...fileArray]);
  };

  const removeOtherDocument = (index) => {
    setOtherDocuments(prev => prev.filter((_, i) => i !== index));
  };

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl border border-black shadow-sm p-6 mb-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-lg">📄</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Document Upload Portal
            </h1>
            <p className="text-base text-gray-700">
              Welcome <span className="font-semibold">{candidateInfo.candidate_name}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Position: {candidateInfo.job_title} at NUTRYAH
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl border border-black shadow-sm p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-sm mr-2">📋</span>
            Upload Instructions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
            <div className="flex items-center">
              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
              Upload clear, readable copies of all documents
            </div>
            <div className="flex items-center">
              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
              Accepted formats: PDF, JPG, PNG (Max 5MB per file)
            </div>
            <div className="flex items-center">
              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
              Required documents are marked with *
            </div>
            <div className="flex items-center">
              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
              BGV process will begin after document verification
            </div>
          </div>
        </div>

        {/* Document Upload Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {requiredDocs.map((doc) => (
            <div key={doc.key} className="bg-white rounded-xl border border-black shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  {doc.label}
                  {doc.required && <span className="text-red-500 ml-1 text-sm">*</span>}
                </h3>
                {uploads[doc.key] && (
                  <div className="flex items-center text-green-600">
                    <span className="text-sm mr-1">✓</span>
                    <span className="text-xs font-medium">Uploaded</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(doc.key, e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading[doc.key]}
                  />
                  <div className={`border border-dashed rounded-lg p-3 text-center transition-colors ${
                    uploads[doc.key] 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}>
                    <div className="text-lg mb-1">
                      {uploads[doc.key] ? '📎' : '📁'}
                    </div>
                    <p className="text-xs text-gray-600">
                      {uploads[doc.key] ? 'File uploaded' : 'Click to upload or drag & drop'}
                    </p>
                  </div>
                </div>

                {uploading[doc.key] && (
                  <div className="flex items-center justify-center text-gray-600">
                    <div className="animate-spin rounded-full h-3 w-3 border border-gray-600 border-t-transparent mr-2"></div>
                    <span className="text-xs">Uploading...</span>
                  </div>
                )}

                {uploads[doc.key] && (
                  <div className="bg-gray-100 rounded-lg p-2">
                    <p className="text-xs text-gray-700 flex items-center">
                      <span className="text-sm mr-1">📎</span>
                      {uploads[doc.key]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Other Documents Section */}
        <div className="bg-white rounded-xl border border-black shadow-sm p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-sm mr-2">📋</span>
            Other Documents (Optional)
          </h3>
          <p className="text-xs text-gray-600 mb-3">Upload any additional documents you'd like to include</p>
          
          <div className="relative mb-3">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleOtherDocuments(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="border border-dashed border-gray-300 bg-gray-50 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <div className="text-lg mb-2">📁</div>
              <p className="text-sm font-medium text-gray-700 mb-1">Add More Documents</p>
              <p className="text-xs text-gray-500">Click to upload multiple files or drag & drop</p>
            </div>
          </div>

          {otherDocuments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Additional Documents:</h4>
              {otherDocuments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">📎</span>
                    <span className="text-xs text-gray-700">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeOtherDocument(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Section */}
        <div className="bg-white rounded-2xl border border-black shadow-sm p-6">
          <div className="text-center">
            <div className="mb-4">
              <p className="text-lg font-bold text-gray-900 mb-2">
                Progress: {getRequiredUploaded()} / {getTotalRequired()} Required Documents
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(getRequiredUploaded() / getTotalRequired()) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={getRequiredUploaded() < getTotalRequired()}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-colors ${
                  getRequiredUploaded() >= getTotalRequired()
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <span className="text-lg mr-2">📤</span>
                Submit All Documents
              </button>
            ) : (
              <div className="text-green-600">
                <div className="text-4xl mb-3">✓</div>
                <p className="text-lg font-bold mb-1">Documents Submitted Successfully!</p>
                <p className="text-sm text-gray-600">
                  HR will review your documents and contact you soon.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-2xl border border-black shadow-sm p-4 mt-6 text-center">
          <p className="text-sm text-gray-700 mb-2">
            Need help? Contact HR at <strong className="text-gray-900">hr@nutryah.com</strong>
          </p>
          <p className="text-xs text-gray-500">
            This link expires in 7 days. Please upload all documents promptly.
          </p>
        </div>

      </div>
    </div>
  );
}
