import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFileText, FiEye } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function EmployeeDocuments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check permissions
  const canView = isAdmin() || hasPermission("view_documents");
  const canAdd = isAdmin() || hasPermission("add_documents_record");

  const fetchDocs = async () => {
    if (!id) return;
    try {
      // Extract numeric ID from "user_6" format
      const numericId = id.replace('user_', '');
      
      let allDocs = [];
      
      // Fetch education documents
      try {
        const eduRes = await api.get(`/employee/education/${numericId}`);
        const eduDocs = (eduRes.data || []).filter(e => e.file_name).map(e => ({
          id: `edu-${e.id}`,
          document_type: 'Education Certificate',
          file_name: e.file_name,
          category: 'Education',
          degree: e.degree,
          university: e.university,
          view_url: `/employee/education/certificate/${e.id}`
        }));
        allDocs = [...allDocs, ...eduDocs];
      } catch {}
      
      // Fetch experience documents
      try {
        const expRes = await api.get(`/employee/experience/${numericId}`);
        const expDocs = (expRes.data || []).filter(e => e.file_name).map(e => ({
          id: `exp-${e.id}`,
          document_type: 'Experience Certificate',
          file_name: e.file_name,
          category: 'Experience',
          company: e.company,
          job_title: e.job_title || e.role,
          view_url: `/employee/experience/document/${e.id}`
        }));
        allDocs = [...allDocs, ...expDocs];
      } catch {}
      
      // Fetch medical documents
      try {
        const medRes = await api.get(`/employee/medical/${numericId}`);
        if (medRes.data && medRes.data.certificate_name) {
          allDocs.push({
            id: `med-${medRes.data.id}`,
            document_type: 'Medical Certificate',
            file_name: medRes.data.certificate_name,
            category: 'Medical',
            view_url: `/employee/medical/certificate/${numericId}`
          });
        }
      } catch {}
      
      // Fetch certification documents
      try {
        const certRes = await api.get(`/employee/certifications/${numericId}`);
        const certDocs = (certRes.data || []).filter(c => c.file_name).map(c => ({
          id: `cert-${c.id}`,
          document_type: 'Certification',
          file_name: c.file_name,
          category: 'Certification',
          certification: c.certification,
          issued_by: c.issued_by,
          view_url: `/employee/certifications/certificate/${c.id}`
        }));
        allDocs = [...allDocs, ...certDocs];
      } catch {}
      
      // Fetch recruitment/onboarding documents
      try {
        const recentRes = await api.get(`/recruitment/onboarding/${numericId}/documents`);
        const recentDocs = (recentRes.data || []).map(d => ({
          id: `recent-${d.id}`,
          document_type: d.document_type,
          file_name: d.file_name,
          category: 'Onboarding',
          status: d.status,
          uploaded_at: d.uploaded_at,
          view_url: `/recruitment/onboarding/document/${d.id}/view`
        }));
        allDocs = [...allDocs, ...recentDocs];
      } catch {}
      
      setDocs(allDocs);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  // Show access denied if no view permission
  if (!canView) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiFileText className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to view employee documents.</p>
          </div>
        </div>
      </Layout>
    );
  }
  useEffect(() => {
    fetchDocs();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Header matching EmployeeEducation */}
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-gray-200 shadow-sm p-6" style={{
          background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
              }}>
                <FiFileText className="h-6 w-6" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Documents</h1>
                <p className="text-gray-600 text-sm mb-1">Employee documents and verification status</p>
                <p className="text-gray-500 text-xs">{docs.length} Active Records • Real-time Updates</p>
              </div>
            </div>
            {canAdd && (
              <button
                onClick={() => {}}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5';
                }}
              >
                <FiFileText className="w-4 h-4" />
                Upload Document
              </button>
            )}
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

        {/* Documents List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            {docs.length === 0 ? (
              <div className="text-center py-12">
                <FiFileText className="mx-auto text-muted mb-4" size={48} />
                <p className=" text-lg font-medium mb-2" style={{color: 'var(--text-secondary, #374151)'}}>No documents found</p>
                <p className="" style={{color: 'var(--text-muted, #6b7280)'}}>Documents will appear here once uploaded</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((d) => (
                  <div 
                    key={d.id} 
                    className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => {
                      const token = localStorage.getItem('access_token');
                      if (!token) {
                        showToast('Authentication token not found. Please login again.', "error");
                        return;
                      }
                      window.open(`${api.defaults.baseURL}${d.view_url}?token=${token}`, '_blank');
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border border-gray-200 ${
                        d.category === 'Education' ? 'bg-gray-100 text-black' :
                        d.category === 'Experience' ? 'bg-gray-100 text-black' :
                        d.category === 'Medical' ? 'bg-gray-100 text-black' :
                        d.category === 'Certification' ? 'bg-gray-100 text-black' :
                        'bg-gray-100 text-black'
                      }`}>
                        {d.category}
                      </span>
                      <FiEye className=" group-hover:text-black transition-colors" style={{color: 'var(--text-muted, #6b7280)'}} size={16} />
                    </div>
                    
                    <h3 className="font-semibold text-primary mb-2 group-hover:text-black transition-colors">
                      {d.document_type}
                    </h3>
                    
                    <p className="text-sm text-secondary mb-3 truncate">{d.file_name}</p>
                    
                    {d.degree && (
                      <p className="text-xs text-muted mb-2">{d.degree} - {d.university}</p>
                    )}
                    {d.company && (
                      <p className="text-xs text-muted mb-2">{d.job_title} at {d.company}</p>
                    )}
                    {d.certification && (
                      <p className="text-xs text-muted mb-2">
                        {d.certification} {d.issued_by && `by ${d.issued_by}`}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      {d.status && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border border-gray-200 ${
                          d.status === "Uploaded" 
                            ? "bg-gray-100 text-black"
                            : "bg-gray-100 text-black"
                        }`}>
                          {d.status}
                        </span>
                      )}
                      {d.uploaded_at && (
                        <span className="text-xs text-muted">
                          {new Date(d.uploaded_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}
