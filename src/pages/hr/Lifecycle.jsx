import { useState, useEffect } from "react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";
import { hasPermission } from "../../utils/permissions";

export default function Lifecycle() {
  const { toast, showToast } = useToast();
  
  // Permission checks
  const canView = hasPermission('view_lifecycle_actions');
  const canAdd = hasPermission('add_lifecycle_action');
  const canApprove = hasPermission('approve_lifecycle_action');
  
  if (!canView) {
    return (
      <div className="p-6 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view lifecycle actions.</p>
        </div>
      </div>
    );
  }
  const [formData, setFormData] = useState({
    employeeId: "",
    actionType: "",
    effectiveDate: "",
    currentRole: "",
    newRole: "",
    currentDepartment: "",
    newDepartment: "",
    currentGrade: "",
    newGrade: "",
    currentSalary: "",
    newSalary: "",
    reason: "",
    remarks: ""
  });

  const [employees, setEmployees] = useState([]);
  const [actions, setActions] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: '', actionId: null, approved: false, action: null });

  useEffect(() => {
    fetchEmployees();
    fetchPendingActions();
    fetchApprovedActions();
  }, []);

  const handleApproval = async (actionId, approved) => {
    try {
      const action = pendingActions.find(a => a.id === actionId);
      if (!action) return;

      const employeeEmail = getEmployeeEmail(action.employee);
      
      // Show email modal for confirmation
      setEmailData({ email: employeeEmail, actionId, approved, action });
      setShowEmailModal(true);
    } catch (error) {
      console.error('Error preparing approval:', error);
      showToast('Failed to prepare approval. Please try again.', 'error');
    }
  };

  const submitApproval = async () => {
    try {
      const { actionId, approved, action, email } = emailData;
      
      // Validate email
      if (!email || !email.trim()) {
        showToast('Please enter a valid email address', 'error');
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email format', 'error');
        return;
      }
      
      await api.post('/hr/lifecycle/approve', {
        actionId,
        approved,
        employeeEmail: email,
        actionDetails: action
      });

      if (approved) {
        // Move to approved actions with all details
        const approvedAction = {
          ...action,
          status: approved ? 'Approved' : 'Rejected',
          approvedDate: new Date().toISOString().split('T')[0]
        };
        setActions(prev => [approvedAction, ...(prev || [])]);
      } else {
        // Move rejected action to actions list too
        const rejectedAction = {
          ...action,
          status: 'Rejected',
          approvedDate: new Date().toISOString().split('T')[0]
        };
        setActions(prev => [rejectedAction, ...(prev || [])]);
      }

      // Remove from pending
      setPendingActions(prev => (prev || []).filter(a => a.id !== actionId));
      
      // Refresh approved actions to get latest data from database
      await fetchApprovedActions();
      
      setShowEmailModal(false);
      showToast(approved ? 'Action approved and email sent!' : 'Action rejected and email sent!', 'success');
    } catch (error) {
      console.error('Error processing approval:', error);
      if (error.response?.status === 404) {
        // Action not found, refresh data
        fetchPendingActions();
        fetchApprovedActions();
        setShowEmailModal(false);
        showToast('Action not found. Data has been refreshed.', 'error');
      } else {
        showToast('Failed to process approval. Please try again.', 'error');
      }
    }
  };

  const getEmployeeEmail = (employeeCode) => {
    if (!employeeCode) return 'employee@company.com';
    const employee = employees.find(emp => emp.employee_code === employeeCode);
    return employee?.email || `${employeeCode.toLowerCase()}@company.com`;
  };



  const fetchEmployees = async () => {
    try {
      const tenant = localStorage.getItem("tenant_db");
      const token = localStorage.getItem("access_token");
      
      if (!tenant) return;
      
      // Fetch from both onboarding and user management like EIS does
      const [onboardingRes, usersRes] = await Promise.all([
        api.get('/recruitment/onboarding/list').catch(() => ({ data: [] })),
        fetch(`http://localhost:8000/hospitals/users/${tenant}/list`, {
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
        email: emp.email || `${emp.employee_id}@company.com`,
        source: 'onboarding'
      }));
      
      // Process user management employees
      const userEmployeeData = userEmployees
        .filter(user => user.employee_code)
        .map(user => ({
          id: `user_${user.id}`,
          name: user.name,
          employee_code: user.employee_code,
          email: user.email || `${user.employee_code}@company.com`,
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

  const fetchPendingActions = async () => {
    try {
      const response = await api.get('/hr/lifecycle/pending');
      setPendingActions(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching pending actions:', error);
      setPendingActions([]);
    }
  };

  const fetchApprovedActions = async () => {
    try {
      const response = await api.get('/hr/lifecycle/');
      setActions(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching approved actions:', error);
      setActions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Lifecycle action:", formData);
    
    try {
      // Save as pending lifecycle action
      const pendingAction = {
        ...formData,
        employee_name: employees.find(emp => emp.employee_code === formData.employeeId)?.name || 'Unknown',
        action_type: formData.actionType,
        effective_date: formData.effectiveDate
      };
      
      await api.post('/hr/lifecycle/pending', pendingAction);
      
      // Refresh pending actions from database to get correct IDs
      await fetchPendingActions();
      
      // Show success message
      showToast('Lifecycle action submitted for approval!', 'success');
      
      // Reset form
      setFormData({
        employeeId: "",
        actionType: "",
        effectiveDate: "",
        currentRole: "",
        newRole: "",
        currentDepartment: "",
        newDepartment: "",
        currentGrade: "",
        newGrade: "",
        currentSalary: "",
        newSalary: "",
        reason: "",
        remarks: ""
      });
    } catch (error) {
      console.error('Error saving lifecycle action:', error);
      showToast('Failed to save action. Please try again.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-black shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs font-medium">Promotions</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{actions.filter(a => a.action === 'promotion' || a.actionType === 'promotion').length}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-black shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs font-medium">Transfers</p>
              <p className="text-xl font-bold text-gray-900">{actions.filter(a => a.action === 'transfer' || a.actionType === 'transfer').length}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-black shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs font-medium">Pending</p>
              <p className="text-xl font-bold text-gray-900">{pendingActions.length}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-black shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs font-medium">Demotions</p>
              <p className="text-xl font-bold text-gray-900">{actions.filter(a => a.action === 'demotion' || a.actionType === 'demotion').length}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-black shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs font-medium">Resignations</p>
              <p className="text-xl font-bold text-gray-900">{actions.filter(a => a.action === 'resignation' || a.actionType === 'resignation').length}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-black shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs font-medium">Terminations</p>
              <p className="text-xl font-bold text-gray-900">{actions.filter(a => a.action === 'termination' || a.actionType === 'termination').length}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Action Form */}
      <div className="rounded-2xl shadow-lg border border-black bg-white">
        <div className="px-6 py-4 border-b border-black rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-xl">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Employee Lifecycle Action</h3>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {!canAdd ? (
            <div className="text-center py-8">
              <p className="text-gray-500">You don't have permission to create lifecycle actions.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                  <select 
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.employee_code}>
                        {emp.employee_code} - {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                  <select 
                    value={formData.actionType}
                    onChange={(e) => setFormData({...formData, actionType: e.target.value})}
                    className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="">Select Action</option>
                    <option value="promotion">Promotion</option>
                    <option value="transfer">Transfer</option>
                    <option value="demotion">Demotion</option>
                    <option value="resignation">Resignation</option>
                    <option value="termination">Termination</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
                  <input 
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
                    className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Role</label>
                  <input 
                    type="text"
                    value={formData.currentRole}
                    onChange={(e) => setFormData({...formData, currentRole: e.target.value})}
                    className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Current designation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Role</label>
                  <input 
                    type="text"
                    value={formData.newRole}
                    onChange={(e) => setFormData({...formData, newRole: e.target.value})}
                    className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="New designation"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <textarea 
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Reason for this action"
                  />
                </div>
              </div>
              <div className="mt-4 sm:mt-6 flex justify-end">
                <button 
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 border border-black text-sm sm:text-base"
                >
                  Submit for Approval
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <div className="rounded-lg shadow-sm border border-black bg-white">
          <div className="px-6 py-4 border-b border-black">
            <h3 className="text-lg font-semibold text-gray-900">Pending Action Approvals</h3>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-black">
              <thead className="bg-gray-50 border-b border-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingActions.map((action) => (
                  <tr key={action.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{action.name}</div>
                        <div className="text-sm text-gray-500">{action.employee}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{action.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{action.from}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{action.to}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{action.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {canApprove && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproval(action.id, true)}
                          className="inline-flex items-center px-3 py-1 border border-black text-sm leading-4 font-medium rounded-md text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval(action.id, false)}
                          className="inline-flex items-center px-3 py-1 border border-black text-sm leading-4 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-4">
            {pendingActions.map((action) => (
              <div key={action.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{action.name}</h4>
                    <p className="text-sm text-gray-500">{action.employee}</p>
                  </div>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                    Pending
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Action:</span>
                    <span className="text-sm font-medium text-gray-900">{action.action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">From:</span>
                    <span className="text-sm font-medium text-gray-900">{action.from}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">To:</span>
                    <span className="text-sm font-medium text-gray-900">{action.to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm font-medium text-gray-900">{action.date}</span>
                  </div>
                </div>
                
                {canApprove && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproval(action.id, true)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-black text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(action.id, false)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-black text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions History */}
      <div className="rounded-lg shadow-sm border border-black bg-white">
        <div className="px-6 py-4 border-b border-black">
          <h3 className="text-lg font-semibold text-gray-900">Approved Actions</h3>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-black">
            <thead className="bg-gray-50 border-b border-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No actions found</td>
                </tr>
              ) : (
                actions.map((action) => (
                  <tr key={action.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{action.name || action.employee_name}</div>
                        <div className="text-sm text-gray-500">{action.employee || action.employeeId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{action.action || action.actionType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{action.from || action.currentRole}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{action.to || action.newRole}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{action.date || action.effectiveDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                          action.status === 'Approved' ? 'bg-gray-100 text-gray-800 border-gray-300' : 
                          action.status === 'Rejected' ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          {action.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden p-4">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No actions found</div>
          ) : (
            <div className="space-y-4">
              {actions.map((action) => (
                <div key={action.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{action.name || action.employee_name}</h4>
                      <p className="text-sm text-gray-500">{action.employee || action.employeeId}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                      action.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-300' : 
                      action.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}>
                      {action.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Action:</span>
                      <span className="text-sm font-medium text-gray-900">{action.action || action.actionType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">From:</span>
                      <span className="text-sm font-medium text-gray-900">{action.from || action.currentRole}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">To:</span>
                      <span className="text-sm font-medium text-gray-900">{action.to || action.newRole}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm font-medium text-gray-900">{action.date || action.effectiveDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Confirmation Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {emailData.approved ? 'Approve' : 'Reject'} Lifecycle Action
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Employee Email</label>
                <input
                  type="email"
                  value={emailData.email}
                  onChange={(e) => setEmailData({...emailData, email: e.target.value})}
                  className="w-full px-3 py-2 border-dark rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="employee@company.com"
                />
              </div>
              
              <div className="bg-content p-3 rounded-lg">
                <p className="text-sm text-secondary"><strong>Employee:</strong> {emailData.action?.name}</p>
                <p className="text-sm text-secondary"><strong>Action:</strong> {emailData.action?.action}</p>
                <p className="text-sm text-secondary"><strong>From:</strong> {emailData.action?.from} → <strong>To:</strong> {emailData.action?.to}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <button
                onClick={submitApproval}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  emailData.approved ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {emailData.approved ? 'Approve' : 'Reject'} & Send Email
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 bg-gray-300 text-secondary rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast {...toast} />
    </div>
  );
}
