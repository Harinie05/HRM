import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCreditCard, FiArrowLeft, FiUpload, FiCheck, FiX, FiFileText } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function EmployeeIDDocs() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [type, setType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(true);

  // Check permissions
  const canView = isAdmin() || hasPermission("view_documents");
  const canAdd = isAdmin() || hasPermission("upload_employee_documents");
  const canEdit = isAdmin() || hasPermission("verify_employee_documents");
  const canDelete = isAdmin() || hasPermission("delete_employee_documents");

  const fetchDocs = async () => {
    if (!id) return;
    try {
      // Parse employee ID properly, removing any prefix
      const employeeId = parseInt(id.toString().replace('user_', ''), 10);
      if (isNaN(employeeId)) {
        console.error('Invalid employee ID:', id);
        return;
      }
      
      const res = await api.get(`/employee/id-docs/${employeeId}`);
      setDocs(res.data || []);
    } catch (err) {
      console.error("Failed to load ID documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [id]);


  const upload = async () => {
    if (!type || !file || !id) return;
    
    try {
      const data = new FormData();
      // Ensure employee_id is sent as integer by parsing the id
      const employeeId = parseInt(id.toString().replace('user_', ''), 10);
      if (isNaN(employeeId)) {
        console.error('Invalid employee ID:', id);
        return;
      }
      
      data.append("employee_id", employeeId.toString());
      data.append("document_type", type);
      data.append("file", file);
      if (expiryDate) {
        data.append("expiry_date", expiryDate);
      }

      await api.post("/employee/id-docs/upload", data);
      showToast("Document uploaded successfully", "success");
      setType("");
      setFile(null);
      setExpiryDate("");
      fetchDocs();
    } catch (err) {
      console.error("Failed to upload ID document", err);
      showToast("Failed to upload document", "error");
    }
  };

  const verify = async (docId, status) => {
    try {
      await api.post(`/employee/id-docs/verify/${docId}?action=${status}`);
      showToast(`Document ${status.toLowerCase()} successfully`, "success");
      fetchDocs();
    } catch (err) {
      console.error("Failed to verify document", err);
      showToast("Failed to verify document", "error");
    }
  };

  if (loading) {
    return (
      <Layout title="ID Documents" subtitle="Loading identity documents...">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Header matching EmployeeEducation */}
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl shadow-sm p-4 sm:p-6 border relative overflow-hidden" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiCreditCard className="h-5 h-5 sm:h-6 sm:w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div className="text-center sm:text-left min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">ID Documents</h1>
                <p className="text-gray-600 text-sm mb-1">Identity documents and verification status</p>
                <p className="text-gray-500 text-xs">{docs.length} Active Records • Real-time Updates</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-start mb-4">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm border"
            style={{
              backgroundColor: 'var(--primary-color, #4575b5)',
              color: 'white',
              borderColor: 'var(--primary-color, #4575b5)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
              e.target.style.borderColor = 'var(--secondary-color, #6b7280)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
              e.target.style.borderColor = 'var(--primary-color, #4575b5)';
            }}
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>

        {/* Upload Section */}
        {canAdd && (
          <div className="bg-white rounded-xl shadow-sm p-6 border relative" style={{
            background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
            borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
          }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
              backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
              transform: 'translate(30%, -30%)'
            }}></div>
            <div className="flex items-center gap-2 mb-4">
              <FiUpload className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Upload New Document</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                <select
                  className="w-full px-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                  }}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="">Select Document Type</option>
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Medical License">Medical License</option>
                  <option value="Nursing License">Nursing License</option>
                  <option value="Pharmacy License">Pharmacy License</option>
                  <option value="Dental License">Dental License</option>
                  <option value="Physiotherapy License">Physiotherapy License</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                <input
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                  }}
                  onChange={(e) => setFile(e.target.files[0])} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date (Optional)</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                  style={{
                    backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`,
                    border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}`
                  }}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
              
              <button 
                onClick={upload} 
                className="flex items-center gap-2 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: !type || !file ? '#d1d5db' : 'var(--primary-color, #4575b5)'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
                  }
                }}
                disabled={!type || !file}
              >
                <FiUpload className="w-4 h-4" />
                Upload Document
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
          </div>
        )}

        {/* Documents Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border relative" style={{
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}03 100%)`,
          borderColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
        }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5',
            transform: 'translate(30%, -30%)'
          }}></div>
          <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Document Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">File Name</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {docs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <FiCreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Uploaded</h3>
                      <p className="text-gray-500">Upload identity documents for verification.</p>
                    </td>
                  </tr>
                )}

                {docs.map((d) => {
                  const isExpiringSoon = d.expiry_date && new Date(d.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  const isExpired = d.expiry_date && new Date(d.expiry_date) < new Date();
                  
                  return (
                    <tr key={d.id} className={`hover:bg-white/50 transition-colors ${
                      isExpired ? 'bg-red-50' : isExpiringSoon ? 'bg-yellow-50' : ''
                    }`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-100 border-0 rounded-lg flex items-center justify-center mr-3">
                            <FiFileText className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="font-medium text-gray-900">{d.document_type}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{d.file_name}</td>
                      <td className="px-6 py-4 text-center">
                        {d.expiry_date ? (
                          <div className={`text-sm ${
                            isExpired ? 'text-red-600 font-medium' : 
                            isExpiringSoon ? 'text-yellow-600 font-medium' : 
                            'text-gray-600'
                          }`}>
                            {new Date(d.expiry_date).toLocaleDateString()}
                            {isExpired && <div className="text-xs">Expired</div>}
                            {isExpiringSoon && !isExpired && <div className="text-xs">Expiring Soon</div>}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border-0 ${
                          d.status === "Verified" 
                            ? "bg-gray-100 text-black"
                            : d.status === "Rejected"
                            ? "bg-gray-100 text-black"
                            : "bg-gray-100 text-black"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {d.status === "Uploaded" && canEdit && (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => verify(d.id, "Verified")} 
                              className="group relative p-2 text-white rounded-lg transition-all duration-200"
                              style={{
                                backgroundColor: 'var(--primary-color, #4575b5)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
                              }}
                            >
                              <FiCheck className="w-4 h-4" />
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Verify
                              </span>
                            </button>
                            <button 
                              onClick={() => verify(d.id, "Rejected")} 
                              className="group relative p-2 text-white rounded-lg transition-all duration-200"
                              style={{
                                backgroundColor: 'var(--primary-color, #4575b5)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'var(--primary-color, #4575b5)';
                              }}
                            >
                              <FiX className="w-4 h-4" />
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Reject
                              </span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}

<style jsx>{`
  * {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  *::-webkit-scrollbar {
    display: none;
  }
`}</style>

