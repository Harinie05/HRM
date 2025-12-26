import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { 
  FiUser, FiMail, FiMapPin, FiUsers, FiClock, FiCalendar, 
  FiFileText, FiBook, FiBriefcase, FiZap, FiAward,
  FiHeart, FiCreditCard, FiDollarSign, FiTrendingUp, FiLogOut,
  FiCamera, FiEye
} from "react-icons/fi";
import api from "../../api";
import Layout from "../../components/Layout";

export default function EmployeeProfile() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  // Function to get authenticated image URL
  const getAuthenticatedImageUrl = async (docId) => {
    try {
      const response = await api.get(`/recruitment/onboarding/document/${docId}/view`, {
        responseType: 'blob'
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Failed to load image:', error);
      return null;
    }
  };

  // ---------------- FETCH EMPLOYEE PROFILE ----------------
  const fetchEmployee = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      // Try to find employee in onboarding first
      let emp = null;
      try {
        const res = await api.get('/recruitment/onboarding/list');
        const employees = res.data || [];
        emp = employees.find(e => e.application_id.toString() === id);
      } catch (err) {
        console.log('No onboarding data found');
      }
      
      // If not found in onboarding, check user management
      if (!emp) {
        try {
          const usersRes = await fetch(`http://localhost:8000/hospitals/users/${tenant}/list`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (usersRes.ok) {
            const userData = await usersRes.json();
            // Handle prefixed user IDs
            const actualUserId = id.startsWith('user_') ? id.replace('user_', '') : id;
            const user = userData.users.find(u => u.id.toString() === actualUserId && u.employee_code);
            if (user) {
              // Convert user to employee format
              emp = {
                application_id: id, // Use the original ID (with prefix if applicable)
                candidate_name: user.name,
                candidate_email: user.email,
                job_title: user.designation || 'N/A',
                department: user.department_name,
                employee_id: user.employee_code,
                joining_date: user.joining_date,
                work_location: 'N/A',
                reporting_manager: 'N/A',
                work_shift: 'General',
                probation_period: '3 Months',
                status: user.status || 'Active',
                source: 'user_management'
              };
            }
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      }
      
      if (emp) {
        setEmployee(emp);
        // Fetch documents for this employee (only for onboarding employees)
        if (emp.source !== 'user_management') {
          try {
            const docsRes = await api.get(`/recruitment/onboarding/${emp.application_id}/documents`);
            const docs = docsRes.data || [];
            setDocuments(docs);
          
            // Find the most recent photo document (latest uploaded)
            const photoDocs = docs.filter(doc => doc.document_type === 'photo');
            if (photoDocs.length > 0) {
              // Get the most recent photo by uploaded_at date
              const latestPhoto = photoDocs.reduce((latest, current) => 
                new Date(current.uploaded_at) > new Date(latest.uploaded_at) ? current : latest
              );
              
              // Try authenticated URL first, fallback to direct URL
              try {
                const imageUrl = await getAuthenticatedImageUrl(latestPhoto.id);
                if (imageUrl) {
                  setPhotoUrl(imageUrl);
                }
              } catch {
                // Fallback to direct URL with token
                const token = localStorage.getItem('token');
                setPhotoUrl(`http://localhost:8000/recruitment/onboarding/document/${latestPhoto.id}/view?token=${token}`);
              }
            }
          } catch (docErr) {
            console.log('No documents found for employee');
          }
        }
      } else {
        console.error('Employee not found');
      }
    } catch (err) {
      console.error("Failed to load employee profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <Layout title="Employee Profile" subtitle="Loading employee information...">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="flex gap-6">
                <div className="w-28 h-28 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout title="Employee Profile" subtitle="Employee information not found">
        <div className="p-6">
          <div className="bg-white rounded-lg p-8 text-center">
            <FiUser className="mx-auto h-12 w-12 text-muted mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">Employee Not Found</h3>
            <p className="" style={{color: 'var(--text-muted, #6b7280)'}}>The requested employee profile could not be found.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div 
                  className="relative w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden group"
                  onClick={() => setShowPhotoUpload(true)}
                >
                  {photoUrl ? (
                    <>
                      <img 
                        src={photoUrl} 
                        alt="Employee Photo" 
                        className="w-full h-full object-cover rounded-xl"
                        onError={() => setPhotoUrl(null)}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <FiCamera className="text-white text-lg" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted">
                      <FiCamera className="text-2xl mb-1 mx-auto" />
                      <div className="text-xs font-medium">Add Photo</div>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary mb-1">{employee.candidate_name}</h1>
                  <p className=" font-medium mb-3" style={{color: 'var(--text-secondary, #374151)'}}>{employee.job_title} · {employee.department || 'HR Department'}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-blue-100 rounded">
                        <FiUser className="text-blue-600" size={12} />
                      </div>
                      <span className="font-medium">{employee.employee_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-green-100 rounded">
                        <FiCalendar className="text-green-600" size={12} />
                      </div>
                      <span>{employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        employee.status === "Active" || employee.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link
                  to={`/eis/${employee.application_id}/documents`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <FiEye size={16} />
                  View Documents
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
            <FiBriefcase className="text-blue-600" />
            Employment Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <FiMail className=" mt-1 flex-shrink-0" style={{color: 'var(--text-muted, #6b7280)'}} />
              <div>
                <p className="text-sm font-medium text-muted">Email</p>
                <p className="" style={{color: 'var(--text-primary, #111827)'}}>{employee.candidate_email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiMapPin className=" mt-1 flex-shrink-0" style={{color: 'var(--text-muted, #6b7280)'}} />
              <div>
                <p className="text-sm font-medium text-muted">Work Location</p>
                <p className="" style={{color: 'var(--text-primary, #111827)'}}>{employee.work_location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiUsers className=" mt-1 flex-shrink-0" style={{color: 'var(--text-muted, #6b7280)'}} />
              <div>
                <p className="text-sm font-medium text-muted">Reporting Manager</p>
                <p className="" style={{color: 'var(--text-primary, #111827)'}}>{employee.reporting_manager}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiClock className=" mt-1 flex-shrink-0" style={{color: 'var(--text-muted, #6b7280)'}} />
              <div>
                <p className="text-sm font-medium text-muted">Work Shift</p>
                <p className="" style={{color: 'var(--text-primary, #111827)'}}>{employee.work_shift}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiCalendar className=" mt-1 flex-shrink-0" style={{color: 'var(--text-muted, #6b7280)'}} />
              <div>
                <p className="text-sm font-medium text-muted">Probation Period</p>
                <p className="" style={{color: 'var(--text-primary, #111827)'}}>{employee.probation_period}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiFileText className=" mt-1 flex-shrink-0" style={{color: 'var(--text-muted, #6b7280)'}} />
              <div>
                <p className="text-sm font-medium text-muted">Application ID</p>
                <p className="" style={{color: 'var(--text-primary, #111827)'}}>{employee.application_id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Information Modules */}
        <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
            <FiFileText className="text-blue-600" />
            Employee Information Modules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Link
              to={`/eis/${employee.application_id}/education`}
              className="group p-5 border rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-center bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200"
            >
              <FiBook className="text-2xl text-blue-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-primary mb-1">Education</div>
              <div className="text-xs text-secondary">Academic Details</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/experience`}
              className="group p-5 border rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 text-center bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200"
            >
              <FiBriefcase className="text-2xl text-green-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-primary mb-1">Experience</div>
              <div className="text-xs text-secondary">Work History</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/skills`}
              className="group p-5 border rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 text-center bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200"
            >
              <FiZap className="text-2xl text-purple-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-primary mb-1">Skills</div>
              <div className="text-xs text-secondary">Technical Skills</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/certifications`}
              className="group p-5 border rounded-xl hover:border-yellow-300 hover:shadow-md transition-all duration-200 text-center bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200"
            >
              <FiAward className="text-2xl text-yellow-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-primary mb-1">Certifications</div>
              <div className="text-xs text-secondary">Professional Certs</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/family`}
              className="group p-5 border rounded-xl hover:border-pink-300 hover:shadow-md transition-all duration-200 text-center bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200"
            >
              <FiUsers className="text-2xl text-pink-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-primary mb-1">Family</div>
              <div className="text-xs text-secondary">Family Details</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/medical`}
              className="group p-5 border rounded-xl hover:border-red-300 hover:shadow-md transition-all duration-200 text-center bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200"
            >
              <FiHeart className="text-2xl text-red-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-primary mb-1">Medical</div>
              <div className="text-xs text-secondary">Health Records</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/id-docs`}
              className="group p-5 border rounded-xl hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-center bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200"
            >
              <FiCreditCard className="text-2xl text-indigo-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-primary mb-1">ID Documents</div>
              <div className="text-xs text-secondary">Identity Docs</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/salary`}
              className="group p-5 border rounded-xl hover:border-emerald-300 hover:shadow-md transition-all duration-200 text-center bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200"
            >
              <FiDollarSign className="text-2xl text-emerald-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-primary mb-1">Salary</div>
              <div className="text-xs text-secondary">Compensation</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/bank-details`}
              className="group p-5 border rounded-xl hover:border-teal-300 hover:shadow-md transition-all duration-200 text-center bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200"
            >
              <FiCreditCard className="text-2xl text-teal-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-primary mb-1">Bank Details</div>
              <div className="text-xs text-secondary">Banking Info</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/reporting`}
              className="group p-5 border rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200 text-center bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200"
            >
              <FiTrendingUp className="text-2xl text-orange-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-primary mb-1">Reporting</div>
              <div className="text-xs text-secondary">Manager & Hierarchy</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/exit`}
              className="group p-5 border rounded-xl hover:border-gray-400 hover:shadow-md transition-all duration-200 text-center bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200"
            >
              <FiLogOut className="text-2xl text-secondary mb-3 mx-auto group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-primary mb-1">Exit</div>
              <div className="text-xs text-secondary">Exit Process</div>
            </Link>
          </div>
        </div>

        {/* Photo Upload Modal */}
        {showPhotoUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <FiCamera className="text-blue-600 text-xl" />
                <h3 className="text-lg font-semibold text-primary">Upload Employee Photo</h3>
              </div>
              
              {previewUrl && (
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-full border-4 border-blue-100"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2">
                      <FiCamera className="text-sm" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Select Photo
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowPhotoUpload(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="px-4 py-2 text-secondary bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (selectedFile) {
                      const formData = new FormData();
                      formData.append('candidate_id', employee.application_id);
                      formData.append('document_type', 'photo');
                      formData.append('file', selectedFile);
                      
                      api.post('/recruitment/onboarding/upload-document', formData)
                        .then(() => {
                          setPhotoUrl(previewUrl);
                          setShowPhotoUpload(false);
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        })
                        .catch(err => console.error('Photo upload failed', err));
                    }
                  }}
                  disabled={!selectedFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Upload Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
