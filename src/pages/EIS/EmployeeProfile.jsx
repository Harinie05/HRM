import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { 
  FiUser, FiMail, FiMapPin, FiUsers, FiClock, FiCalendar, 
  FiFileText, FiBook, FiBriefcase, FiZap, FiAward,
  FiHeart, FiCreditCard, FiDollarSign, FiTrendingUp, FiUserX,
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
      <div className="p-4 sm:p-6 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-black overflow-hidden shadow-lg">
          <div className="px-4 sm:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div 
                  className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-all duration-300 overflow-hidden group shadow-lg mx-auto sm:mx-0"
                  onClick={() => setShowPhotoUpload(true)}
                >
                  {photoUrl ? (
                    <>
                      <img 
                        src={photoUrl} 
                        alt="Employee Photo" 
                        className="w-full h-full object-cover rounded-2xl"
                        onError={() => setPhotoUrl(null)}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                        <FiCamera className="text-white text-lg" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-600">
                      <FiCamera className="text-xl sm:text-2xl mb-1 mx-auto" />
                      <div className="text-xs font-medium">Add Photo</div>
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{employee.candidate_name}</h1>
                  <p className="text-gray-600 font-medium mb-3">{employee.job_title} · {employee.department || 'HR Department'}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 rounded-lg">
                        <FiUser className="text-gray-600 w-3 h-3" />
                      </div>
                      <span className="font-medium text-gray-700">{employee.employee_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 rounded-lg">
                        <FiCalendar className="text-gray-600 w-3 h-3" />
                      </div>
                      <span className="text-gray-600">{employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        employee.status === "Active" || employee.status === "Completed"
                          ? "bg-gray-100 text-gray-800 border border-gray-300"
                          : "bg-gray-100 text-gray-800 border border-gray-300"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center sm:justify-end gap-3">
                <Link
                  to={`/eis/${employee.application_id}/documents`}
                  className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl border border-black"
                >
                  <FiEye size={16} />
                  <span className="hidden sm:inline">View Documents</span>
                  <span className="sm:hidden">Documents</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white rounded-2xl border border-black p-4 sm:p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-xl">
              <FiBriefcase className="text-gray-600 w-5 h-5" />
            </div>
            Employment Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-black">
              <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                <FiMail className="text-gray-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                <p className="text-gray-900 font-medium text-sm sm:text-base truncate">{employee.candidate_email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-black">
              <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                <FiMapPin className="text-gray-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Work Location</p>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{employee.work_location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-black">
              <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                <FiUsers className="text-gray-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Reporting Manager</p>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{employee.reporting_manager}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-black">
              <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                <FiClock className="text-gray-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Work Shift</p>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{employee.work_shift}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-black">
              <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                <FiCalendar className="text-gray-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Probation Period</p>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{employee.probation_period}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-black">
              <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                <FiFileText className="text-gray-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Application ID</p>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{employee.application_id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Information Modules */}
        <div className="bg-white rounded-2xl border border-black p-4 sm:p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-xl">
              <FiFileText className="text-gray-600 w-5 h-5" />
            </div>
            Employee Information Modules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            <Link
              to={`/eis/${employee.application_id}/education`}
              className="group p-4 sm:p-6 border border-black rounded-2xl hover:border-gray-500 hover:shadow-lg transition-all duration-300 text-center bg-white hover:bg-gray-50 hover:scale-105"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                <FiBook className="text-black w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Education</div>
              <div className="text-xs text-gray-600">Academic Details</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/experience`}
              className="group p-6 border border-black rounded-2xl hover:border-gray-500 hover:shadow-lg transition-all duration-300 text-center bg-white hover:bg-gray-50 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                <FiBriefcase className="text-black w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">Experience</div>
              <div className="text-xs text-gray-600">Work History</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/skills`}
              className="group p-6 border border-black rounded-2xl hover:border-gray-500 hover:shadow-lg transition-all duration-300 text-center bg-white hover:bg-gray-50 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                <FiZap className="text-black w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">Skills</div>
              <div className="text-xs text-gray-600">Technical Skills</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/certifications`}
              className="group p-6 border border-black rounded-2xl hover:border-gray-500 hover:shadow-lg transition-all duration-300 text-center bg-white hover:bg-gray-50 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                <FiAward className="text-black w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">Certifications</div>
              <div className="text-xs text-gray-600">Professional Certs</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/family`}
              className="group p-6 border border-black rounded-2xl hover:border-gray-500 hover:shadow-lg transition-all duration-300 text-center bg-white hover:bg-gray-50 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                <FiUsers className="text-black w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">Family</div>
              <div className="text-xs text-gray-600">Family Details</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/medical`}
              className="group p-6 border border-black rounded-2xl hover:border-gray-500 hover:shadow-lg transition-all duration-300 text-center bg-white hover:bg-gray-50 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                <FiHeart className="text-black w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">Medical</div>
              <div className="text-xs text-gray-600">Health Records</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/id-docs`}
              className="group p-6 border border-black rounded-2xl hover:border-gray-500 hover:shadow-lg transition-all duration-300 text-center bg-white hover:bg-gray-50 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                <FiCreditCard className="text-black w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">ID Documents</div>
              <div className="text-xs text-gray-600">Identity Docs</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/salary`}
              className="group p-6 border border-black rounded-2xl hover:border-gray-500 hover:shadow-lg transition-all duration-300 text-center bg-white hover:bg-gray-50 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                <FiDollarSign className="text-black w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">Salary</div>
              <div className="text-xs text-gray-600">Compensation</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/bank-details`}
              className="group p-6 border border-black rounded-2xl hover:border-gray-500 hover:shadow-lg transition-all duration-300 text-center bg-white hover:bg-gray-50 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                <FiCreditCard className="text-black w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">Bank Details</div>
              <div className="text-xs text-gray-600">Banking Info</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/reporting`}
              className="group p-6 border border-black rounded-2xl hover:border-gray-500 hover:shadow-lg transition-all duration-300 text-center bg-white hover:bg-gray-50 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                <FiTrendingUp className="text-black w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">Reporting</div>
              <div className="text-xs text-gray-600">Manager & Hierarchy</div>
            </Link>
            
            <Link
              to={`/eis/${employee.application_id}/exit`}
              className="group p-6 border border-black rounded-2xl hover:border-gray-500 hover:shadow-lg transition-all duration-300 text-center bg-white hover:bg-gray-50 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gray-100 border border-black rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                <FiUserX className="text-black w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">Exit</div>
              <div className="text-xs text-gray-600">Exit Process</div>
            </Link>
          </div>
        </div>

        {/* Photo Upload Modal */}
        {showPhotoUpload && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FiCamera className="text-gray-600 w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Employee Photo</h3>
              </div>
              
              {previewUrl && (
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-2xl border-4 border-indigo-100 shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-gray-600 text-white rounded-full p-2 shadow-lg">
                      <FiCamera className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowPhotoUpload(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
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
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium shadow-lg"
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
