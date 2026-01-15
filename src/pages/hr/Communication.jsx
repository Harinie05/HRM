import { useState, useEffect } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import api from "../../api";
import Toast from "../../components/Toast";
import EmployeeDetailsModal from "../../components/EmployeeDetailsModal";
import useToast from "../../utils/useToast";
import { hasPermission, isAdmin } from "../../utils/permissions";

export default function Communication() {
  // Permission checks
  const canView = hasPermission('view_hr_letters') || hasPermission('view_self');
  const canAdd = hasPermission('add_hr_letter');
  const canEdit = hasPermission('edit_hr_letter');
  const canDelete = hasPermission('delete_hr_letter');
  const canPrint = hasPermission('print_hr_letter');
  const canViewDeleted = isAdmin() || hasPermission('show_deleted_hr_letters');
  const canRestore = isAdmin() || hasPermission('restore_hr_letter');
  const [colors, setColors] = useState({ primary: '#2862e9', secondary: '#474e71' });
  
  if (!canView) {
    return (
      <div className="p-6 text-center">
        <div className="bg-white rounded-2xl border-0 p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view HR letters.</p>
        </div>
      </div>
    );
  }
  const [formData, setFormData] = useState({
    employeeId: "",
    letterType: "",
    subject: "",
    content: "",
    priority: "",
    deliveryMethod: "",
    scheduledDate: "",
    approvalRequired: false
  });

  const [letters, setLetters] = useState([]);
  const [deletedLetters, setDeletedLetters] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view' or 'edit'
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      await fetchColors();
      await fetchEmployees();
      await fetchLetters();
    };
    loadData();
  }, []);

  const fetchColors = async () => {
    try {
      const tenantCode = localStorage.getItem('tenantCode');
      if (tenantCode) {
        const response = await api.get(`/auth/branding/${tenantCode}`);
        if (response.data.primary_color && response.data.secondary_color) {
          const newColors = {
            primary: response.data.primary_color,
            secondary: response.data.secondary_color
          };
          setColors(newColors);
          document.documentElement.style.setProperty('--primary-color', newColors.primary);
          document.documentElement.style.setProperty('--secondary-color', newColors.secondary);
        }
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  };
  
  // Auto-populate employee ID for non-admin users
  useEffect(() => {
    if (!isAdmin() && employees.length > 0 && !formData.employeeId) {
      const currentUserId = localStorage.getItem('user_id');
      const currentUserEmployee = employees.find(emp => {
        if (emp.source === 'user_management') {
          return emp.original_user_id == currentUserId;
        }
        return emp.id == currentUserId;
      });
      
      if (currentUserEmployee) {
        setFormData(prev => ({ ...prev, employeeId: currentUserEmployee.employee_code }));
      }
    }
  }, [employees]);

  useEffect(() => {
    if (employees.length > 0) {
      fetchLetters();
    }
  }, [employees]);

  const fetchLetters = async () => {
    try {
      const response = await api.get('/hr/communication/');
      const fetchedLetters = response.data.map(comm => {
        const employeeCode = comm.sent_to_ids?.[0];
        const employee = employees.find(emp => emp.employee_code === employeeCode);
        
        return {
          id: comm.id,
          employee: employeeCode || 'All',
          name: employee ? employee.name : (employeeCode ? 'Employee Name' : 'All Employees'),
          type: comm.letter_type,
          subject: comm.subject,
          date: comm.created_at ? new Date(comm.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: comm.status === 'Sent' ? 'Ready' : comm.status  // Convert Sent to Ready for display
        };
      });
      setLetters(fetchedLetters);
      
      // Fetch deleted letters only if user has permission
      if (canViewDeleted) {
        try {
          const deletedRes = await api.get('/hr/communication/deleted');
          const fetchedDeletedLetters = deletedRes.data.map(comm => {
            const employeeCode = comm.sent_to_ids?.[0];
            const employee = employees.find(emp => emp.employee_code === employeeCode);
            
            return {
              id: comm.id,
              employee: employeeCode || 'All',
              name: employee ? employee.name : (employeeCode ? 'Employee Name' : 'All Employees'),
              type: comm.letter_type,
              subject: comm.subject,
              date: comm.created_at ? new Date(comm.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              status: 'Deleted',
              deleted_at: comm.deleted_at
            };
          });
          setDeletedLetters(fetchedDeletedLetters);
        } catch (err) {
          console.log('No permission to view deleted letters or endpoint error:', err);
          setDeletedLetters([]);
        }
      }
    } catch (error) {
      console.error('Error fetching letters:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      if (!tenant) return;
      
      // Fetch from both onboarding and user management like EIS does
      const [onboardingRes, usersRes] = await Promise.all([
        api.get('/recruitment/onboarding/list').catch(() => ({ data: [] })),
        fetch(`${api.defaults.baseURL}/hospitals/users/${tenant}/list`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : { users: [] }).catch(() => ({ users: [] }))
      ]);
      
      const onboardedEmployees = onboardingRes.data || [];
      const userEmployees = usersRes.users || [];
      
      // Process onboarded employees
      const validOnboardedEmployees = onboardedEmployees.filter(emp => {
        if (!emp.employee_id || emp.employee_id.trim() === '') return false;
        const isAutoGenerated = /^[A-Z]{3}\d{6}$/.test(emp.employee_id);
        return !isAutoGenerated;
      });
      
      const onboardedData = validOnboardedEmployees.map(emp => ({
        id: emp.application_id,
        name: emp.candidate_name,
        employee_code: emp.employee_id,
        source: 'onboarding'
      }));
      
      // Process user management employees
      const userEmployeeData = userEmployees
        .filter(user => user.employee_code)
        .map(user => ({
          id: `user_${user.id}`,
          original_user_id: user.id,
          name: user.name,
          employee_code: user.employee_code,
          source: 'user_management'
        }));
      
      // Combine and remove duplicates
      const allEmployees = [...onboardedData];
      userEmployeeData.forEach(userEmp => {
        const existingIndex = allEmployees.findIndex(emp => emp.employee_code === userEmp.employee_code);
        if (existingIndex === -1) {
          allEmployees.push(userEmp);
        } else {
          allEmployees[existingIndex] = userEmp;
        }
      });
      
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleOK = async () => {
    try {
      // Save to database via API
      const response = await api.post('/hr/communication/', formData);
      
      // Add to letters list using the actual ID from backend
      const newLetter = {
        id: response.data.id, // Use actual backend ID
        employee: formData.employeeId,
        name: employees.find(emp => emp.employee_code === formData.employeeId)?.name || 'Unknown',
        type: formData.letterType,
        subject: formData.subject,
        date: new Date().toISOString().split('T')[0],
        status: 'Ready'
      };
      
      setLetters(prev => [newLetter, ...prev]);
      
      // Show success message
      showToast('Letter saved successfully!');
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving letter:', error);
      showToast('Failed to save letter. Please try again.', 'error');
    }
  };

  const handlePrint = async () => {
    if (!formData.content || !formData.subject) {
      showToast('Please fill in the subject and content before printing.', 'error');
      return;
    }

    try {
      // First save the letter to get an ID
      const response = await api.post('/hr/communication/', formData);
      const letterId = response.data.id;
      
      // Then print using the backend endpoint
      const printResponse = await api.get(`/hr/communication/print/${letterId}`, {
        responseType: 'blob'
      });
      
      // Create blob URL and trigger download/print
      const blob = new Blob([printResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        // Fallback: trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `hr_letter_${formData.letterType}_${formData.employeeId}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      // Add to letters list
      const newLetter = {
        id: letterId,
        employee: formData.employeeId,
        name: employees.find(emp => emp.employee_code === formData.employeeId)?.name || 'Unknown',
        type: formData.letterType,
        subject: formData.subject,
        date: new Date().toISOString().split('T')[0],
        status: 'Ready'
      };
      
      setLetters(prev => [newLetter, ...prev]);
      showToast('Letter saved and printed successfully!');
      resetForm();
      
    } catch (error) {
      console.error('Error printing letter:', error);
      showToast('Failed to print letter. Please try again.', 'error');
    }
  };

  const handleViewLetter = async (letterId) => {
    try {
      const response = await api.get(`/hr/communication/${letterId}`);
      setSelectedLetter(response.data);
      setModalMode('view');
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching letter:', error);
      showToast('Failed to load letter details.', 'error');
    }
  };

  const handleEditLetter = async (letterId) => {
    try {
      const response = await api.get(`/hr/communication/${letterId}`);
      setSelectedLetter(response.data);
      setModalMode('edit');
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching letter:', error);
      showToast('Failed to load letter details.', 'error');
    }
  };

  const handleUpdateLetter = async () => {
    try {
      const updateData = {
        letterType: selectedLetter.letter_type,
        subject: selectedLetter.subject,
        content: selectedLetter.content,
        employeeId: selectedLetter.sent_to_ids?.[0] || '',
        status: 'Ready'
      };
      
      await api.put(`/hr/communication/${selectedLetter.id}`, updateData);
      
      // Update the letter in the list
      setLetters(prev => prev.map(letter => 
        letter.id === selectedLetter.id 
          ? { ...letter, status: 'Ready', subject: selectedLetter.subject, type: selectedLetter.letter_type }
          : letter
      ));
      
      setShowModal(false);
      showToast('Letter updated and marked as ready!', 'success');
    } catch (error) {
      console.error('Error updating letter:', error);
      showToast('Failed to update letter. Please try again.', 'error');
    }
  };

  const handleDeleteLetter = async (letterId) => {
    if (window.confirm('Are you sure you want to delete this letter?')) {
      try {
        await api.delete(`/hr/communication/${letterId}`);
        
        // Remove the letter from the active list
        setLetters(prev => prev.filter(letter => letter.id !== letterId));
        
        // Refresh both lists to get updated data
        await fetchLetters();
        
        showToast('Letter deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting letter:', error);
        showToast('Failed to delete letter. Please try again.', 'error');
      }
    }
  };

  const handleRestoreLetter = async (letterId) => {
    if (window.confirm('Are you sure you want to restore this letter?')) {
      try {
        await api.put(`/hr/communication/restore/${letterId}`);
        
        // Refresh both lists
        await fetchLetters();
        
        showToast('Letter restored successfully!', 'success');
      } catch (error) {
        console.error('Error restoring letter:', error);
        showToast('Failed to restore letter. Please try again.', 'error');
      }
    }
  };

  const handleSendDraft = async (letterId) => {
    try {
      await api.put(`/hr/communication/${letterId}/send`);
      
      // Update the letter status in the list
      setLetters(prev => prev.map(letter => 
        letter.id === letterId ? { ...letter, status: 'Sent' } : letter
      ));
      
      showToast('Draft sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending draft:', error);
      showToast('Failed to send draft. Please try again.', 'error');
    }
  };

  const handlePrintLetter = async (letter) => {
    try {
      // First, get comprehensive employee details and show in modal
      if (letter.employee !== 'All') {
        try {
          const detailsResponse = await api.get(`/api/employee-details/${letter.employee}`);
          console.log('Employee Details:', detailsResponse.data);
          
          // Show employee details in modal
          setSelectedEmployeeDetails(detailsResponse.data);
          setShowEmployeeDetails(true);
          
          // Also log to console for debugging
          const details = detailsResponse.data;
          console.log('\n=== EMPLOYEE COMPREHENSIVE DETAILS ===');
          console.log('Basic Info:', {
            name: details.name,
            code: details.employee_code,
            email: details.email,
            designation: details.designation,
            department: details.department,
            joining_date: details.joining_date,
            status: details.status
          });
          
          if (details.experience?.length > 0) {
            console.log('Experience:', details.experience);
          }
          
          if (details.education?.length > 0) {
            console.log('Education:', details.education);
          }
          
          if (details.skills?.length > 0) {
            console.log('Skills:', details.skills);
          }
          
          if (details.family?.length > 0) {
            console.log('Family:', details.family);
          }
          
          if (details.medical) {
            console.log('Medical/Emergency Contact:', details.medical);
          }
          
          if (details.salary) {
            console.log('Salary Details:', details.salary);
          }
          
          if (details.bank_details) {
            console.log('Bank Details:', details.bank_details);
          }
          
          console.log('=== END EMPLOYEE DETAILS ===\n');
          
        } catch (detailsError) {
          console.log('Could not fetch detailed employee information:', detailsError.message);
          
          // Try to get list of available employees for debugging
          try {
            const employeeListResponse = await api.get('/api/employee-details/list/all');
            console.log('Available employees:', employeeListResponse.data);
            showToast(`Employee ${letter.employee} not found. Check console for available employees.`, 'warning');
          } catch (listError) {
            console.log('Could not fetch employee list:', listError.message);
            showToast('Could not fetch employee details, but proceeding with print', 'warning');
          }
        }
      }
      
      // Use backend PDF generation endpoint with comprehensive details
      const response = await api.get(`/hr/communication/print/${letter.id}`, {
        responseType: 'blob'
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        // Fallback: trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `hr_letter_${letter.type}_${letter.employee}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error printing letter:', error);
      showToast('Failed to print letter. Please try again.', 'error');
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Save as draft via API
      const response = await api.post('/hr/communication/draft', formData);
      
      // Add to letters list using the actual ID from backend
      const newLetter = {
        id: response.data.id, // Use actual backend ID
        employee: formData.employeeId,
        name: employees.find(emp => emp.employee_code === formData.employeeId)?.name || 'Unknown',
        type: formData.letterType,
        subject: formData.subject,
        date: new Date().toISOString().split('T')[0],
        status: 'Draft'
      };
      
      setLetters(prev => [newLetter, ...prev]);
      
      // Show success message
      showToast('Draft saved successfully!');
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving draft:', error);
      showToast('Failed to save draft. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      letterType: "",
      subject: "",
      content: "",
      priority: "",
      deliveryMethod: "",
      scheduledDate: "",
      approvalRequired: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Letter Creation Form */}
      <div className="rounded-lg shadow-sm  bg-white">
        <div className="px-6 py-4 border-b border-black">
          <h3 className="text-lg font-semibold text-gray-900">Create HR Letter</h3>
        </div>
        <form className="p-4 sm:p-6">
          {!canAdd ? (
            <div className="text-center py-8">
              <p className="text-gray-500">You don't have permission to create HR letters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                  {isAdmin() ? (
                    <select style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}}  
                      value={formData.employeeId}
                      onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                      className="w-full px-3 py-2  rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.employee_code}>
                          {emp.employee_code} - {emp.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2  rounded-md bg-gray-50 text-gray-700">
                      {(() => {
                        const currentUserId = localStorage.getItem('user_id');
                        const currentUserEmployee = employees.find(emp => {
                          if (emp.source === 'user_management') {
                            return emp.original_user_id == currentUserId;
                          }
                          return emp.id == currentUserId;
                        });
                        return currentUserEmployee ? `${currentUserEmployee.employee_code} - ${currentUserEmployee.name}` : 'Loading...';
                      })()} 
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Letter Type</label>
                  <select style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}}  
                    value={formData.letterType}
                    onChange={(e) => setFormData({...formData, letterType: e.target.value})}
                    className="w-full px-3 py-2  rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="">Select Type</option>
                    <option value="offer">Offer Letter</option>
                    <option value="appointment">Appointment Letter</option>
                    <option value="increment">Increment Letter</option>
                    <option value="promotion">Promotion Letter</option>
                    <option value="transfer">Transfer Letter</option>
                    <option value="warning">Warning Letter</option>
                    <option value="termination">Termination Letter</option>
                    <option value="experience">Experience Certificate</option>
                    <option value="relieving">Relieving Letter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}}  
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2  rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="">Select Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}}  
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-3 py-2  rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                    placeholder="Letter subject"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}}  
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2  rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                    placeholder="Letter content..."
                  />
                </div>
              </div>
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button 
                  type="button"
                  onClick={handleSaveDraft}
                  className="w-full sm:w-auto px-6 py-2  text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
                >
                  Save as Draft
                </button>
                {canPrint && (
                  <button 
                    type="button"
                    onClick={handlePrint}
                    className="w-full sm:w-auto px-6 py-2  text-green-600 rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                  >
                    Print
                  </button>
                )}
                <button 
                  type="button"
                  onClick={handleOK}
                  className="w-full sm:w-auto px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base transition-colors"
                  style={{
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = colors.secondary}
                  onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
                >
                  OK
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Letters History */}
      <div className="rounded-lg shadow-sm  bg-white">
        <div className="px-6 py-4 border-b border-black">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {showDeleted ? 'Deleted HR Letters' : 'Recent Letters'}
            </h3>
            <div className="flex gap-2">
              {canViewDeleted && (
                <button
                  onClick={() => setShowDeleted(!showDeleted)}
                  className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                    showDeleted 
                      ? 'bg-gray-800 text-white border-black hover:bg-gray-900' 
                      : 'bg-white text-gray-800 border-black hover:bg-gray-50'
                  }`}
                >
                  {showDeleted ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showDeleted ? 'Show Active' : 'Show Deleted'} ({showDeleted ? letters.length : deletedLetters.length})
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 ">
            <thead className="bg-gray-50 border-b border-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                {showDeleted && <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Deleted At</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(showDeleted ? deletedLetters : letters).length === 0 ? (
                <tr>
                  <td colSpan={showDeleted ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                    {showDeleted ? 'No deleted letters found' : 'No letters found'}
                  </td>
                </tr>
              ) : (
                (showDeleted ? deletedLetters : letters).map((letter) => (
                  <tr key={letter.id} className={showDeleted ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{letter.name}</div>
                        <div className="text-sm text-gray-500">{letter.employee}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{letter.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{letter.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{letter.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                        letter.status === 'Ready' ? 'bg-gray-100 text-gray-800 border-gray-300' : 
                        letter.status === 'Deleted' ? 'bg-red-100 text-red-800 border-red-300' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {letter.status}
                      </span>
                    </td>
                    {showDeleted && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {letter.deleted_at ? new Date(letter.deleted_at).toLocaleDateString() : 'N/A'}
                      </td>
                    )}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {showDeleted ? (
                          canRestore && (
                            <button
                              onClick={() => handleRestoreLetter(letter.id)}
                              className="p-1 text-green-600 hover:text-green-800 rounded"
                              title="Restore Letter"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )
                        ) : (
                          <>
                            <button
                              onClick={() => handleViewLetter(letter.id)}
                              className="p-1 hover:text-primary" style={{color: 'var(--text-secondary, #374151)'}}
                              title="View Letter"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {canEdit && letter.status === 'Draft' && (
                              <button
                                onClick={() => handleEditLetter(letter.id)}
                                className="p-1 text-green-600 hover:text-green-900"
                                title="Edit & Send"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {canPrint && (
                              <button
                                onClick={() => handlePrintLetter(letter)}
                                className="p-1 text-green-600 hover:text-green-900"
                                title="Print Letter"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteLetter(letter.id)}
                                className="p-1 text-red-600 hover:text-red-900"
                                title="Delete Letter"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {(showDeleted ? deletedLetters : letters).length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>{showDeleted ? 'No deleted letters found' : 'No letters found'}</p>
            </div>
          ) : (
            (showDeleted ? deletedLetters : letters).map((letter) => (
              <div key={letter.id} className={`p-4 border-b-0 hover:bg-gray-50 ${showDeleted ? 'bg-red-50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{letter.name}</div>
                    <div className="text-sm text-gray-500">{letter.employee}</div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                    letter.status === 'Ready' ? 'bg-gray-100 text-gray-800 border-gray-300' : 
                    letter.status === 'Deleted' ? 'bg-red-100 text-red-800 border-red-300' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {letter.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Type:</span>
                    <span className="text-sm text-gray-600">{letter.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Subject:</span>
                    <span className="text-sm text-gray-600 truncate ml-2">{letter.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Date:</span>
                    <span className="text-sm text-gray-600">{letter.date}</span>
                  </div>
                  {showDeleted && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Deleted At:</span>
                      <span className="text-sm text-gray-600">{letter.deleted_at ? new Date(letter.deleted_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                  {showDeleted ? (
                    canRestore && (
                      <button
                        onClick={() => handleRestoreLetter(letter.id)}
                        className="flex items-center gap-1 text-green-600 hover:text-green-900 px-3 py-1 rounded-lg hover:bg-green-50 transition-colors text-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </button>
                    )
                  ) : (
                    <>
                      <button
                        onClick={() => handleViewLetter(letter.id)}
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      {canEdit && letter.status === 'Draft' && (
                        <button
                          onClick={() => handleEditLetter(letter.id)}
                          className="flex items-center gap-1 text-green-600 hover:text-green-900 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      )}
                      {canPrint && (
                        <button
                          onClick={() => handlePrintLetter(letter)}
                          className="flex items-center gap-1 text-green-600 hover:text-green-900 px-3 py-1 rounded-lg hover:bg-green-50 transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteLetter(letter.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-900 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* View/Edit Modal */}
      {showModal && selectedLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {modalMode === 'view' ? 'View Letter' : 'Edit Letter'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className=" hover:text-secondary" style={{color: 'var(--text-muted, #6b7280)'}}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Letter Type</label>
                {modalMode === 'view' ? (
                  <p className="text-sm text-primary">{selectedLetter.letter_type}</p>
                ) : (
                  <select style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                    value={selectedLetter.letter_type}
                    onChange={(e) => setSelectedLetter({...selectedLetter, letter_type: e.target.value})}
                    className="w-full px-3 py-2  rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="offer">Offer Letter</option>
                    <option value="appointment">Appointment Letter</option>
                    <option value="increment">Increment Letter</option>
                    <option value="promotion">Promotion Letter</option>
                    <option value="transfer">Transfer Letter</option>
                    <option value="warning">Warning Letter</option>
                    <option value="termination">Termination Letter</option>
                    <option value="experience">Experience Certificate</option>
                    <option value="relieving">Relieving Letter</option>
                  </select>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Subject</label>
                {modalMode === 'view' ? (
                  <p className="text-sm text-primary">{selectedLetter.subject}</p>
                ) : (
                  <input style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                    type="text"
                    value={selectedLetter.subject}
                    onChange={(e) => setSelectedLetter({...selectedLetter, subject: e.target.value})}
                    className="w-full px-3 py-2  rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Content</label>
                {modalMode === 'view' ? (
                  <div className="text-sm text-primary whitespace-pre-line  rounded-md p-3 min-h-[200px]">
                    {selectedLetter.content}
                  </div>
                ) : (
                  <textarea style={{backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10`}} 
                    value={selectedLetter.content}
                    onChange={(e) => setSelectedLetter({...selectedLetter, content: e.target.value})}
                    rows={8}
                    className="w-full px-3 py-2  rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-secondary rounded-md hover:bg-gray-400"
              >
                {modalMode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modalMode === 'edit' && (
                <button
                  onClick={handleUpdateLetter}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Update & Mark Ready
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Employee Details Modal */}
      <EmployeeDetailsModal 
        isOpen={showEmployeeDetails}
        onClose={() => setShowEmployeeDetails(false)}
        employeeDetails={selectedEmployeeDetails}
      />
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
}

