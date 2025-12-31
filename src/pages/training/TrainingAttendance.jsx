import { useEffect, useState } from "react";
import { Users, CheckCircle, XCircle, Clock, Plus, UserCheck } from "lucide-react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";

export default function TrainingAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [acceptedApplicants, setAcceptedApplicants] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [trainingDays, setTrainingDays] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast, showToast } = useToast();
  const [formData, setFormData] = useState({
    training_id: "",
    employee_id: "",
    attendance: {},
    assessments: {}
  });

  useEffect(() => {
    fetchAttendanceRecords();
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (formData.training_id) {
      fetchAcceptedApplicants(formData.training_id);
      generateTrainingDays(formData.training_id);
    } else {
      setAcceptedApplicants([]);
      setTrainingDays([]);
    }
  }, [formData.training_id]);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await api.get("/api/training/attendance", {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setAttendanceRecords(res.data || []);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request timed out');
      } else {
        console.error("Error fetching training attendance:", error);
      }
      setAttendanceRecords([]);
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

  const generateTrainingDays = async (programId) => {
    try {
      const program = programs.find(p => p.id == programId);
      if (program && program.startDate && program.endDate) {
        const start = new Date(program.startDate);
        const end = new Date(program.endDate);
        const days = [];
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          days.push({
            date: new Date(d).toISOString().split('T')[0],
            label: `Day ${days.length + 1}`,
            displayDate: new Date(d).toLocaleDateString()
          });
        }
        
        setTrainingDays(days);
        setSelectedProgram(program);
        
        // Load existing attendance if editing
        if (editingRecord && formData.training_id && formData.employee_id) {
          await loadExistingAttendance(formData.training_id, formData.employee_id);
        }
      }
    } catch (error) {
      console.error("Error generating training days:", error);
    }
  };

  const loadExistingAttendance = async (trainingId, employeeId) => {
    try {
      const res = await api.get(`/api/training/attendance/${trainingId}/${employeeId}`);
      const existingData = res.data;
      
      if (existingData) {
        setFormData(prev => ({
          ...prev,
          attendance: existingData.attendance_days || {},
          assessments: existingData.assessments || {}
        }));
      }
    } catch (error) {
      console.error("Error loading existing attendance:", error);
    }
  };

  const handleAttendanceChange = (day, checked) => {
    setFormData(prev => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [day]: checked
      }
    }));
  };

  const handleAssessmentChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      assessments: {
        ...prev.assessments,
        [type]: value
      }
    }));
  };

  const isTrainingComplete = () => {
    const allDaysMarked = trainingDays.every(day => formData.attendance[day.date]);
    const hasAssessments = formData.assessments.assessment1 && formData.assessments.assessment2;
    return allDaysMarked && hasAssessments;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const attendancePayload = {
        training_id: formData.training_id,
        employee_id: formData.employee_id,
        attendance_days: formData.attendance,
        assessments: formData.assessments,
        completion_status: isTrainingComplete() ? "Completed" : "In Progress",
        is_update: editingRecord ? true : false
      };
      
      const endpoint = editingRecord 
        ? `/api/training/attendance/${formData.training_id}/${formData.employee_id}`
        : "/api/training/attendance";
      
      const method = editingRecord ? 'put' : 'post';
      
      await api[method](endpoint, attendancePayload);
      await fetchAttendanceRecords();
      setShowModal(false);
      setEditingRecord(null);
      setFormData({
        training_id: "",
        employee_id: "",
        attendance: {},
        assessments: {}
      });
      showToast(`Attendance ${editingRecord ? 'updated' : 'marked'} successfully!`, 'success');
    } catch (error) {
      console.error("Error marking attendance:", error);
      showToast('Failed to mark attendance. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="rounded-lg shadow-sm border border-black" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
        {/* Header */}
        <div className="p-6 border-b border-black">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Training Attendance & Assessment</h3>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              Mark Attendance
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted" />
              <h3 className="mt-2 text-sm font-medium text-primary">No attendance records</h3>
              <p className="mt-1 text-sm text-muted">Attendance records will appear here when training sessions are conducted.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Training Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Session Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Attendance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Assessment Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-black">
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 border-b border-black">
                      <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                        <div className="text-sm font-medium text-gray-900">{record.employee_name}</div>
                      </td>
                      <td className="px-6 py-4 border-r border-black">
                        <div className="text-sm text-gray-900">{record.program_title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                        <div className="text-sm text-gray-900">{new Date(record.session_date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'Present' ? 'bg-green-100 text-green-800' :
                          record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-black">
                        <div className="text-sm text-gray-900">
                          {record.assessment_score ? `${record.assessment_score}%` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.completion_status === 'Completed' ? 'bg-green-100 text-green-800' :
                            record.completion_status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-900'
                          }`}>
                            {record.completion_status || 'Not Started'}
                          </span>
                          <button
                            onClick={async () => {
                              setEditingRecord(record);
                              setFormData({
                                training_id: record.training_id || "",
                                employee_id: record.employee_id || "",
                                attendance: {},
                                assessments: {}
                              });
                              setShowModal(true);
                              
                              // Load existing data after modal opens
                              if (record.training_id && record.employee_id) {
                                try {
                                  const res = await api.get(`/api/training/attendance/${record.training_id}/${record.employee_id}`);
                                  const existingData = res.data;
                                  
                                  setFormData(prev => ({
                                    ...prev,
                                    attendance: existingData.attendance_days || {},
                                    assessments: existingData.assessments || {}
                                  }));
                                } catch (error) {
                                  console.error("Error loading existing attendance:", error);
                                }
                              }
                            }}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">{editingRecord ? 'Update' : 'Mark'} Training Attendance</h3>
              <p className="text-sm text-gray-500 mt-1">Record attendance and assessment scores</p>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Training Program</label>
                  <select
                    value={formData.training_id}
                    onChange={(e) => setFormData({...formData, training_id: e.target.value, employee_id: "", attendance: {}, assessments: {}})}
                    className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                    className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                
                {trainingDays.length > 0 && formData.employee_id && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Training Days Attendance</label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {trainingDays.map(day => (
                          <label key={day.date} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.attendance[day.date] || false}
                              onChange={(e) => handleAttendanceChange(day.date, e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{day.label} ({day.displayDate})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assessment 1 Score (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.assessments.assessment1 || ''}
                          onChange={(e) => handleAssessmentChange('assessment1', e.target.value)}
                          className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          placeholder="Assessment 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assessment 2 Score (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.assessments.assessment2 || ''}
                          onChange={(e) => handleAssessmentChange('assessment2', e.target.value)}
                          className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          placeholder="Assessment 2"
                        />
                      </div>
                    </div>
                    
                    {isTrainingComplete() && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 font-medium">✓ Training will be marked as Complete</p>
                      </div>
                    )}
                  </>
                )}
              </form>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingRecord(null);
                }}
                className="flex-1 px-4 py-2 border border-black rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? "Saving..." : editingRecord ? "Update Attendance" : "Mark Attendance"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </div>
  );
}
