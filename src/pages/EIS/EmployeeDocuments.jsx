import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFileText, FiEye } from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function EmployeeDocuments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    if (!id) return;
    try {
      let allDocs = [];
      
      // Fetch education documents
      try {
        const eduRes = await api.get(`/employee/education/${id}`);
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
        const expRes = await api.get(`/employee/experience/${id}`);
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
        const medRes = await api.get(`/employee/medical/${id}`);
        if (medRes.data && medRes.data.certificate_name) {
          allDocs.push({
            id: `med-${medRes.data.id}`,
            document_type: 'Medical Certificate',
            file_name: medRes.data.certificate_name,
            category: 'Medical',
            view_url: `/employee/medical/certificate/${id}`
          });
        }
      } catch {}
      
      // Fetch certification documents
      try {
        const certRes = await api.get(`/employee/certifications/${id}`);
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
        const recentRes = await api.get(`/recruitment/onboarding/${id}/documents`);
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
      {/* Header Section */}
      <div className="mb-6 p-6 bg-white border border-black shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 border border-black rounded-2xl flex items-center justify-center">
              <FiFileText className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                ID & Verification Documents
              </h1>
              <p className="text-gray-600 mb-2">
                Identity documents and verification status
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{docs.length} Active Records</span>
                </div>
                <span className="text-sm text-gray-600">Real-time Updates</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {}}
            className="flex items-center gap-2 bg-white text-black border-2 border-black px-6 py-3 rounded-2xl hover:bg-gray-100 transition-colors font-medium"
          >
            <FiFileText className="w-4 h-4" />
            Upload New Document
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-start mb-4">
          <button 
            onClick={() => navigate(`/eis/${id}`)}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-black hover:bg-gray-100 border border-black rounded-lg transition-colors text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>

        {/* Documents List */}
        <div className="rounded-xl shadow-sm border border-black" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
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
                    className="border border-black rounded-xl p-4 hover:border-gray-500 hover:shadow-md transition-all duration-200 cursor-pointer group" style={{borderColor: 'var(--border-color, #000000)'}}
                    onClick={() => {
                      const token = localStorage.getItem('access_token');
                      if (!token) {
                        alert('Authentication token not found. Please login again.');
                        return;
                      }
                      window.open(`http://localhost:8000${d.view_url}?token=${token}`, '_blank');
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border border-black ${
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border border-black ${
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
    </Layout>
  );
}
