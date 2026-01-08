import { useEffect, useState } from "react";
import { Award, Download, Search, Plus } from "lucide-react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function TrainingCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [acceptedApplicants, setAcceptedApplicants] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const { toast, showToast } = useToast();
  const [formData, setFormData] = useState({
    training_id: "",
    employee_id: "",
    score: "",
    has_expiry: false
  });

  // Check permissions
  if (!hasPermission('view_training_certificates') && !hasPermission('view_self') && !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view training certificates.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchCertificates();
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (formData.training_id) {
      fetchAcceptedApplicants(formData.training_id);
    } else {
      setAcceptedApplicants([]);
    }
  }, [formData.training_id]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await api.get("/api/training/certificates", {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setCertificates(res.data || []);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request timed out');
      } else {
        console.error("Error fetching training certificates:", error);
      }
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await api.get("/api/training/programs");
      setPrograms(res.data?.data?.filter(p => p.status === 'Published') || []);
    } catch (error) {
      console.error("Error fetching programs:", error);
      setPrograms([]);
    }
  };

  const fetchAcceptedApplicants = async (programId) => {
    try {
      const res = await api.get(`/api/training/programs/${programId}/accepted-applicants`);
      setAcceptedApplicants(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching accepted applicants:", error);
      setAcceptedApplicants([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post("/api/training/certificates", formData);
      await fetchCertificates();
      setShowModal(false);
      setFormData({
        training_id: "",
        employee_id: "",
        score: "",
        has_expiry: false
      });
    } catch (error) {
      console.error("Error generating certificate:", error);
      showToast('Failed to generate certificate. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificate) => {
    try {
      // Create download URL similar to payroll
      const downloadUrl = `http://localhost:8000/api/training/certificates/${certificate.id}/download`;
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${certificate.employee_name}_${certificate.program_title}_Certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download certificate', 'error');
    }
  };

  const filteredCertificates = certificates.filter(cert => 
    cert.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.program_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <div className="rounded-lg shadow-sm border border-black" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
        {/* Header */}
        <div className="p-6 border-b border-black">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Training Certificates</h3>
            {(hasPermission('generate_training_certificate') || isAdmin()) && (
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Award className="w-4 h-4" />
                Generate Certificate
              </button>
            )}
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-muted" />
              <h3 className="mt-2 text-sm font-medium text-primary">No certificates found</h3>
              <p className="mt-1 text-sm text-muted">
                {searchTerm ? "No certificates match your search criteria." : "Certificates will appear here when training programs are completed."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Training Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Certificate ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Issued Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-black">
                    {filteredCertificates.map((certificate) => {
                      const isExpired = certificate.expiry_date && new Date(certificate.expiry_date) < new Date();
                      const isExpiringSoon = certificate.expiry_date && !isExpired && new Date(certificate.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                      
                      return (
                        <tr key={certificate.id} className="hover:bg-gray-50 border-b border-black">
                          <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                            <div className="text-sm font-medium text-gray-900">{certificate.employee_name}</div>
                          </td>
                          <td className="px-6 py-4 border-r border-black">
                            <div className="text-sm text-gray-900">{certificate.program_title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                            <div className="text-sm text-gray-900 font-mono">{certificate.certificate_number}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                            <div className="text-sm text-gray-900">{new Date(certificate.issued_date).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                            <div className="text-sm text-gray-900">
                              {certificate.expiry_date ? new Date(certificate.expiry_date).toLocaleDateString() : 'No expiry'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isExpired ? 'bg-red-100 text-red-800' :
                              isExpiringSoon ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {(hasPermission('download_training_certificate') || isAdmin()) && (
                                <button 
                                  onClick={() => handleDownload(certificate)}
                                  className="text-green-600 hover:text-green-900 p-1 rounded"
                                  title="Download Certificate"
                                >
                                  <Download size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {filteredCertificates.map((certificate) => {
                  const isExpired = certificate.expiry_date && new Date(certificate.expiry_date) < new Date();
                  const isExpiringSoon = certificate.expiry_date && !isExpired && new Date(certificate.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <div key={certificate.id} className="p-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{certificate.employee_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{certificate.program_title}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isExpired ? 'bg-red-100 text-red-800' :
                          isExpiringSoon ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Certificate ID:</span>
                          <span className="text-gray-900 font-mono">{certificate.certificate_number}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Issued Date:</span>
                          <span className="text-gray-900">{new Date(certificate.issued_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Expiry Date:</span>
                          <span className="text-gray-900">
                            {certificate.expiry_date ? new Date(certificate.expiry_date).toLocaleDateString() : 'No expiry'}
                          </span>
                        </div>
                      </div>
                      
                      {(hasPermission('download_training_certificate') || isAdmin()) && (
                        <div className="flex justify-end">
                          <button 
                            onClick={() => handleDownload(certificate)}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-green-50 text-green-700 rounded-md border border-green-300 hover:bg-green-100"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Stats Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-black">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Total Certificates: {certificates.length}</span>
            <span>Active: {certificates.filter(c => !c.expiry_date || new Date(c.expiry_date) > new Date()).length}</span>
            <span>Expired: {certificates.filter(c => c.expiry_date && new Date(c.expiry_date) < new Date()).length}</span>
          </div>
        </div>
      </div>

      {/* Generate Certificate Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Generate Training Certificate</h3>
              <p className="text-sm text-gray-500 mt-1">Create a certificate for completed training</p>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Training Program</label>
                  <select
                    value={formData.training_id}
                    onChange={(e) => setFormData({...formData, training_id: e.target.value, employee_id: ""})}
                    className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white"
                    required
                  >
                    <option value="">Select Training Program</option>
                    {programs.map(program => (
                      <option key={program.id} value={program.id}>
                        {program.title} - {program.category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Candidate</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white"
                    required
                    disabled={!formData.training_id}
                  >
                    <option value="">Select Candidate</option>
                    {acceptedApplicants.map(applicant => (
                      <option key={applicant.id} value={applicant.id}>
                        {applicant.applicant_name}
                      </option>
                    ))}
                  </select>
                  {!formData.training_id && (
                    <p className="text-xs text-gray-500 mt-1">Please select a training program first</p>
                  )}
                  {formData.training_id && acceptedApplicants.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">No accepted candidates for this program</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => setFormData({...formData, score: e.target.value})}
                    className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white"
                    placeholder="Final score"
                    required
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_expiry}
                      onChange={(e) => setFormData({...formData, has_expiry: e.target.checked})}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Certificate has expiry date (1 year from issue)
                    </span>
                  </label>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-black rounded-lg text-black font-medium hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? "Generating..." : "Generate Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </div>
  );
}
