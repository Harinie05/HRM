import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, Calendar, CheckCircle, XCircle, Clock, Send } from "lucide-react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function TrainingApplications() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  
  console.log('TrainingApplications component loaded with programId:', programId);
  
  // Check permissions
  if (!hasPermission('view_enrolled_trainees') && !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view training applications.</p>
        </div>
      </div>
    );
  }
  
  const [program, setProgram] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState({
    subject: "Training Program Enrollment Confirmation",
    message: "Dear [Name],\n\nCongratulations! Your application for the training program '[Program Title]' has been accepted.\n\nProgram Details:\n• Program: [Program Title]\n• Category: [Category]\n• Type: [Type]\n• Trainer: [Trainer]\n• Duration: [Duration]\n• Start Date: [Start Date]\n• End Date: [End Date]\n• Department: [Department]\n\nAttendance Requirements:\n• Attendance is mandatory for all sessions\n• Please arrive 15 minutes before the session starts\n• Bring a notebook and pen for taking notes\n• Mobile phones should be on silent mode\n\nLocation & Logistics:\n• Training will be conducted [Type] format\n• Further location details will be shared closer to the start date\n• Refreshments will be provided during breaks\n\nNext Steps:\n1. Please confirm your attendance by replying to this email\n2. You will receive a calendar invite with session details\n3. Pre-training materials (if any) will be shared 2 days before\n\nFor any queries, please contact the HR team.\n\nWe look forward to your participation!\n\nBest regards,\nHR Team\nNutryah Healthcare Solutions"
  });

  useEffect(() => {
    if (programId) {
      fetchProgram();
      fetchApplications();
    }
  }, [programId]);

  const fetchProgram = async () => {
    try {
      const response = await api.get(`/api/training/programs/${programId}`);
      setProgram(response.data);
    } catch (error) {
      console.error("Error fetching program:", error);
      showToast("Failed to load program details", "error");
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/training/programs/${programId}/applications`);
      setApplications(response.data.data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await api.put(`/api/training/applications/${applicationId}/status`, { status });
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));
      showToast(`Application ${status.toLowerCase()} successfully!`, "success");
    } catch (error) {
      console.error("Error updating application:", error);
      showToast("Failed to update application status", "error");
    }
  };

  const handleSelectApplication = (applicationId) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredApplications.map(app => app.id);
    setSelectedApplications(prev => 
      prev.length === filteredIds.length ? [] : filteredIds
    );
  };

  const handleSendEmails = async () => {
    try {
      console.log('Send emails clicked');
      console.log('Selected applications:', selectedApplications);
      console.log('Program ID:', programId);
      console.log('Email template:', emailTemplate);
      
      const selectedApps = applications.filter(app => selectedApplications.includes(app.id));
      console.log('Selected apps:', selectedApps);
      
      const emailData = {
        program_id: parseInt(programId),
        application_ids: selectedApplications,
        subject: emailTemplate.subject,
        message: emailTemplate.message
      };
      
      console.log('Sending email data:', emailData);
      
      const response = await api.post('/api/training/send-enrollment-emails', emailData);
      console.log('Email response:', response);
      
      showToast(`Enrollment emails sent to ${selectedApps.length} candidates!`, "success");
      setShowEmailModal(false);
      setSelectedApplications([]);
    } catch (error) {
      console.error("Error sending emails:", error);
      console.error("Error details:", error.response?.data);
      showToast("Failed to send emails: " + (error.response?.data?.detail || error.message), "error");
    }
  };

  const filteredApplications = applications.filter(app => 
    !statusFilter || app.status === statusFilter
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "Accepted": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Accepted": return <CheckCircle className="w-4 h-4" />;
      case "Rejected": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate("/training/programs")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Applications</h1>
          <p className="text-gray-600">{program?.title}</p>
        </div>
      </div>

      {/* Program Info */}
      {program && (
        <div className="bg-white rounded-lg border border-black p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-gray-900">Program Details</h3>
              <p className="text-sm text-gray-600 mt-1">{program.description}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Duration</h3>
              <p className="text-sm text-gray-600 mt-1">
                {program.startDate && program.endDate 
                  ? `${Math.ceil((new Date(program.endDate) - new Date(program.startDate)) / (1000 * 60 * 60 * 24) + 1)} days`
                  : "TBD"
                }
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Max Participants</h3>
              <p className="text-sm text-gray-600 mt-1">{program.maxParticipants || "Unlimited"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      {selectedApplications.length > 0 && (hasPermission('select_send_training_emails') || isAdmin()) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">
              {selectedApplications.length} candidate(s) selected
            </span>
            <button
              onClick={() => {
                console.log('Send Email button clicked!');
                setShowEmailModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Email
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-black p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Applications</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg border border-black overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left border-b border-black">
                  <input
                    type="checkbox"
                    checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-black">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-black">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-black">Applied Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-black">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {statusFilter ? "No applications match your filter." : "No one has applied for this program yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 border-r border-black">
                      <input
                        type="checkbox"
                        checked={selectedApplications.includes(application.id)}
                        onChange={() => handleSelectApplication(application.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 border-r border-black">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{application.name}</div>
                          <div className="text-sm text-gray-500">{application.employee_id || "External"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-black">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {application.email}
                      </div>
                      {application.phone && (
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="w-4 h-4" />
                          {application.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 border-r border-black">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(application.applied_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-black">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {application.status === "Pending" && (hasPermission('approve_training_applications') || isAdmin()) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(application.id, "Accepted")}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(application.id, "Rejected")}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Send Email to Selected Candidates</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sending to {selectedApplications.length} candidate(s)
              </p>
            </div>
            
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={emailTemplate.subject}
                    onChange={(e) => setEmailTemplate({...emailTemplate, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={emailTemplate.message}
                    onChange={(e) => setEmailTemplate({...emailTemplate, message: e.target.value})}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                
                <div className="text-xs text-gray-500">
                  <p>Available placeholders: [Name], [Program Title], [Category], [Type], [Trainer], [Duration], [Start Date], [End Date], [Department]</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmails}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Emails
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}