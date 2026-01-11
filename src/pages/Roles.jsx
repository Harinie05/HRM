import React, { useState, useEffect } from "react";
import api from "../api";
import Layout from "../components/Layout";
import Toast from "../components/Toast";
import useToast from "../utils/useToast";
import { hasPermission, isAdmin } from "../utils/permissions";

export default function Roles() {
  const tenant_db = localStorage.getItem("tenant_db");

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // NEW ROLE
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");

  // EDIT ROLE
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPerms, setEditPerms] = useState([]);
  const [editPermissionSearch, setEditPermissionSearch] = useState("");
  const [editModuleFilter, setEditModuleFilter] = useState("");
  const { toast, showToast, hideToast } = useToast();

  // Handle "Select All" for main sections and subsections
  const handleSelectAllSection = (sectionPerms, setter, currentList) => {
    const allSelected = sectionPerms.every(perm => currentList.includes(perm));
    if (allSelected) {
      setter(currentList.filter(perm => !sectionPerms.includes(perm)));
    } else {
      const newList = [...new Set([...currentList, ...sectionPerms])];
      setter(newList);
    }
  };

  // Get permissions for specific sections
  const getUserManagementPerms = () => permissions.filter(p => 
    p.name.includes('user') || p.name.includes('department') || p.name.includes('role')
  ).map(p => p.name);

  const getEmployeeManagementPerms = () => permissions.filter(p => 
    p.name === 'view_self' || p.name === 'view_employees' || p.name === 'edit_employee' || 
    p.name === 'delete_employee' || p.name === 'create_employee_code' || 
    p.name === 'view_employee_profile'
  ).map(p => p.name);

  const getProfileDocumentsPerms = () => permissions.filter(p => 
    p.name === 'edit_employee_profile' || p.name === 'view_employee_documents' || 
    p.name === 'upload_employee_documents' || p.name === 'delete_employee_documents' || 
    p.name === 'edit_profile' || p.name === 'view_documents'
  ).map(p => p.name);

  const getEmploymentProbationPerms = () => permissions.filter(p => 
    p.name === 'view_probation_details' || p.name === 'add_probation' || 
    p.name === 'extend_probation' || p.name === 'end_probation'
  ).map(p => p.name);

  const getOrganizationSetupPerms = () => permissions.filter(p => 
    p.name.includes('company') || p.name.includes('branch') || 
    (p.name.includes('department') && !p.name.includes('user')) ||
    p.name.includes('designation')
  ).map(p => p.name);

  const getReportingStructurePerms = () => permissions.filter(p => 
    p.name.includes('reporting') || p.name.includes('hierarchy')
  ).filter(p => 
    p.name !== 'view_employee_reporting' && 
    p.name !== 'manage_employee_reporting' && 
    p.name !== 'view_team_hierarchy' &&
    p.name !== 'delete_hierarchy_rule' &&
    p.name !== 'manage_reporting_manager' &&
    p.name !== 'assign_reporting_manager' &&
    p.name !== 'add_reporting_record' &&
    p.name !== 'edit_reporting_record' &&
    p.name !== 'delete_reporting_record' &&
    p.name !== 'view_reporting_details'
  ).map(p => p.name);

  const getHolidayCalendarPerms = () => permissions.filter(p => 
    p.name.includes('holiday')
  ).map(p => p.name);

  const getJobRequisitionPerms = () => permissions.filter(p => 
    p.name.includes('job_requisition')
  ).map(p => p.name);

  const getRecruitmentSetupPerms = () => permissions.filter(p => 
    p.name.includes('candidates') || p.name.includes('screen_candidates') || p.name === 'publish_job' || 
    p.name === 'generate_job_link' || p.name === 'view_candidate' || p.name === 'select_candidates' || 
    p.name === 'schedule_interviews' || p.name === 'view_resumes' || p.name === 'view_ats_pipeline' ||
    p.name === 'move_candidates' || p.name === 'view_active_jobs' || p.name === 'view_ats_candidates'
  ).map(p => p.name);

  const getOffersContractsPerms = () => permissions.filter(p => 
    p.name === 'generate_offer_link' || p.name === 'verify_documents' || p.name === 'view_documents' || 
    p.name === 'manage_bgv' || p.name === 'start_onboarding' || p.name === 'mark_onboarded' || 
    p.name === 'view_offers_sent' || p.name === 'view_selected_candidates'
  ).map(p => p.name);

  const getOnboardingPerms = () => permissions.filter(p => 
    p.name === 'view_onboarding_documents' || p.name === 'view_onboarding_candidates' || 
    p.name === 'view_document_collected' || p.name === 'add_document_collected' || 
    p.name === 'start_onboarding' || p.name === 'mark_onboarded'
  ).map(p => p.name);

  const getConsultantsPerms = () => permissions.filter(p => 
    p.name === 'view_consultants' || p.name === 'add_consultant' || p.name === 'edit_consultant' || 
    p.name === 'delete_consultant' || p.name === 'view_availability' || p.name === 'add_availability' ||
    p.name === 'view_payouts' || p.name === 'generate_payslip' || p.name === 'send_payslip_email' || 
    p.name === 'process_payroll'
  ).map(p => p.name);

  const getExitManagementPerms = () => permissions.filter(p => 
    p.name === 'apply_resignation' || p.name === 'view_resignations' || p.name === 'approve_resignation' ||
    p.name === 'manage_handover' || p.name === 'manage_clearance' || p.name === 'manage_assets' || 
    p.name === 'manage_settlement' || p.name === 'hr_clearance' || p.name === 'it_clearance' || 
    p.name === 'finance_clearance' || p.name === 'admin_clearance' || p.name === 'conduct_exit_interview' ||
    p.name === 'view_exit_interviews' || p.name.includes('kt_') || p.name.includes('settlement')
  ).map(p => p.name);

  const getStatutoryCompliancePerms = () => permissions.filter(p => 
    p.name.includes('statutory') || p.name.includes('labour_register') || p.name.includes('leave_compliance') ||
    p.name.includes('nabh_compliance')
  ).map(p => p.name);

  const getTrainingDevelopmentPerms = () => permissions.filter(p => 
    p.name.includes('training')
  ).map(p => p.name);

  const getPerformanceManagementPerms = () => permissions.filter(p => 
    p.name.includes('work_assignment') || p.name.includes('goals_kpi') || p.name.includes('review_cycle') ||
    p.name.includes('feedback') || p.name.includes('appraisal') || p.name.includes('quality_indicator')
  ).map(p => p.name);

  const getShiftRosterPerms = () => permissions.filter(p => 
    p.name === 'view_shifts' || p.name === 'create_shifts' || p.name === 'delete_shifts' ||
    p.name === 'view_roster' || p.name === 'manage_roster' || p.name === 'manage_night_shift_rules' ||
    p.name === 'manage_on_call_duty'
  ).map(p => p.name);

  const getAttendanceManagementPerms = () => permissions.filter(p => 
    p.name.includes('attendance') || p.name.includes('punch') || p.name.includes('gps') ||
    p.name.includes('regularization') || p.name.includes('od_') || p.name.includes('daily_update')
  ).map(p => p.name);

  const getHROperationsPerms = () => permissions.filter(p => 
    p.name.includes('lifecycle') || p.name.includes('hr_letter') || p.name.includes('grievance') ||
    p.name.includes('asset') || p.name.includes('insurance') || p.name.includes('staff_schedule')
  ).map(p => p.name);

  const getPayrollManagementPerms = () => permissions.filter(p => 
    p.name.includes('salary') || p.name.includes('payroll') || p.name.includes('statutory_rule')
  ).map(p => p.name);

  const getLeaveManagementPerms = () => permissions.filter(p => 
    p.name.includes('leave')
  ).map(p => p.name);

  const getBankDetailsPerms = () => permissions.filter(p => 
    p.name.includes('bank_details')
  ).map(p => p.name);

  const getDocumentVerificationPerms = () => permissions.filter(p => 
    p.name === 'verify_employee_documents' || p.name === 'reject_employee_documents'
  ).map(p => p.name);

  const getCustomizationPerms = () => permissions.filter(p => 
    p.name === 'view_customization'
  ).map(p => p.name);

  const getDashboardPerms = () => permissions.filter(p => 
    p.name === 'view_documents_alerts' || p.name === 'view_audit_log'
  ).map(p => p.name);

  // Get module heading
  const getModuleHeading = (moduleFilter) => {
    const moduleMap = {
      'organization_setup': '🏢 ORGANIZATION SETUP',
      'reporting_structure': '📊 REPORTING STRUCTURE',
      'holiday_calendar': '📅 HOLIDAY CALENDAR',
      'job_requisition': '💼 JOB REQUISITION',
      'recruitment_setup': '🎯 RECRUITMENT SETUP',
      'offers_contracts': '📄 OFFERS & CONTRACTS',
      'onboarding': '🎓 ONBOARDING',
      'consultants': '🩺 CONSULTANTS',
      'exit_management': '🚪 EXIT MANAGEMENT',
      'statutory_compliance': '💰 STATUTORY RULES & COMPLIANCE',
      'training_development': '🎓 TRAINING & DEVELOPMENT',
      'performance_management': '📊 PERFORMANCE MANAGEMENT SYSTEM',
      'shift_roster': '🕐 SHIFT & ROSTER MANAGEMENT',
      'attendance_management': '🕐 ATTENDANCE MANAGEMENT',
      'hr_operations': '🏢 HR OPERATIONS & WORKFORCE MANAGEMENT',
      'dashboard_permissions': '📊 DASHBOARD PERMISSIONS',
      'payroll_management': '💰 PAYROLL MANAGEMENT',
      'leave_management': '📅 LEAVE MANAGEMENT',
      'user_management': '👥 USER MANAGEMENT',
      'employee_management': '👤 EMPLOYEE MANAGEMENT'
    };
    return moduleMap[moduleFilter] || null;
  };
  const getFilteredPermissions = (searchTerm, moduleFilter) => {
    let filtered = permissions;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        // Search in permission name
        const nameMatch = p.name.toLowerCase().includes(searchLower);
        // Search in permission description
        const descMatch = p.description.toLowerCase().includes(searchLower);
        // Search in module names
        const moduleMatch = (
          searchLower.includes('organization') || searchLower.includes('setup') ||
          searchLower.includes('reporting') || searchLower.includes('structure') ||
          searchLower.includes('holiday') || searchLower.includes('calendar') ||
          searchLower.includes('job') || searchLower.includes('requisition') ||
          searchLower.includes('recruitment') || searchLower.includes('candidate') ||
          searchLower.includes('offer') || searchLower.includes('contract') ||
          searchLower.includes('onboarding') || searchLower.includes('consultant') ||
          searchLower.includes('exit') || searchLower.includes('management') ||
          searchLower.includes('statutory') || searchLower.includes('compliance') ||
          searchLower.includes('training') || searchLower.includes('development') ||
          searchLower.includes('performance') || searchLower.includes('shift') ||
          searchLower.includes('roster') || searchLower.includes('attendance') ||
          searchLower.includes('hr') || searchLower.includes('operation') ||
          searchLower.includes('dashboard') || searchLower.includes('payroll') ||
          searchLower.includes('leave') || searchLower.includes('user') ||
          searchLower.includes('employee')
        );
        return nameMatch || descMatch || moduleMatch;
      });
    }
    
    if (moduleFilter) {
      switch (moduleFilter) {
        case 'organization_setup':
          filtered = filtered.filter(p => 
            p.name.includes('company') || p.name.includes('branch') || 
            (p.name.includes('department') && !p.name.includes('user')) ||
            p.name.includes('designation')
          );
          break;
        case 'reporting_structure':
          filtered = filtered.filter(p => 
            p.name.includes('reporting') || p.name.includes('hierarchy')
          );
          break;
        case 'holiday_calendar':
          filtered = filtered.filter(p => p.name.includes('holiday'));
          break;
        case 'job_requisition':
          filtered = filtered.filter(p => p.name.includes('job_requisition'));
          break;
        case 'recruitment_setup':
          filtered = filtered.filter(p => 
            p.name.includes('candidates') || p.name.includes('screen_candidates') || 
            p.name === 'publish_job' || p.name === 'generate_job_link' || 
            p.name === 'view_candidate' || p.name === 'select_candidates' || 
            p.name === 'schedule_interviews' || p.name === 'view_resumes' || 
            p.name === 'view_ats_pipeline' || p.name === 'move_candidates' || 
            p.name === 'view_active_jobs' || p.name === 'view_ats_candidates'
          );
          break;
        case 'offers_contracts':
          filtered = filtered.filter(p => 
            p.name === 'generate_offer_link' || p.name === 'verify_documents' || 
            p.name === 'view_documents' || p.name === 'manage_bgv' || 
            p.name === 'start_onboarding' || p.name === 'mark_onboarded' || 
            p.name === 'view_offers_sent' || p.name === 'view_selected_candidates'
          );
          break;
        case 'onboarding':
          filtered = filtered.filter(p => 
            p.name === 'view_onboarding_documents' || p.name === 'view_onboarding_candidates' || 
            p.name === 'view_document_collected' || p.name === 'add_document_collected' || 
            p.name === 'start_onboarding' || p.name === 'mark_onboarded'
          );
          break;
        case 'consultants':
          filtered = filtered.filter(p => 
            p.name === 'view_consultants' || p.name === 'add_consultant' || 
            p.name === 'edit_consultant' || p.name === 'delete_consultant' || 
            p.name === 'view_availability' || p.name === 'add_availability' ||
            p.name === 'view_payouts' || p.name === 'generate_payslip' || 
            p.name === 'send_payslip_email' || p.name === 'process_payroll'
          );
          break;
        case 'exit_management':
          filtered = filtered.filter(p => 
            p.name === 'apply_resignation' || p.name === 'view_resignations' || 
            p.name === 'approve_resignation' || p.name === 'manage_handover' || 
            p.name === 'manage_clearance' || p.name === 'manage_assets' || 
            p.name === 'manage_settlement' || p.name === 'hr_clearance' || 
            p.name === 'it_clearance' || p.name === 'finance_clearance' || 
            p.name === 'admin_clearance' || p.name === 'conduct_exit_interview' ||
            p.name === 'view_exit_interviews' || p.name.includes('kt_') || 
            p.name.includes('settlement')
          );
          break;
        case 'statutory_compliance':
          filtered = filtered.filter(p => 
            p.name.includes('statutory') || p.name.includes('labour_register') || 
            p.name.includes('leave_compliance') || p.name.includes('nabh_compliance')
          );
          break;
        case 'training_development':
          filtered = filtered.filter(p => p.name.includes('training'));
          break;
        case 'performance_management':
          filtered = filtered.filter(p => 
            p.name.includes('work_assignment') || p.name.includes('goals_kpi') || 
            p.name.includes('review_cycle') || p.name.includes('feedback') || 
            p.name.includes('appraisal') || p.name.includes('quality_indicator')
          );
          break;
        case 'shift_roster':
          filtered = filtered.filter(p => 
            p.name === 'view_shifts' || p.name === 'create_shifts' || 
            p.name === 'delete_shifts' || p.name === 'view_roster' || 
            p.name === 'manage_roster' || p.name === 'manage_night_shift_rules' ||
            p.name === 'manage_on_call_duty'
          );
          break;
        case 'attendance_management':
          filtered = filtered.filter(p => 
            p.name.includes('attendance') || p.name.includes('punch') || 
            p.name.includes('regularization') || p.name.includes('od_') || 
            p.name.includes('daily_update')
          );
          break;
        case 'hr_operations':
          filtered = filtered.filter(p => 
            p.name.includes('lifecycle') || p.name.includes('hr_letter') || 
            p.name.includes('grievance') || p.name.includes('asset') || 
            p.name.includes('insurance') || p.name.includes('staff_schedule')
          );
          break;
        case 'dashboard_permissions':
          filtered = filtered.filter(p => 
            p.name === 'view_documents_alerts' || p.name === 'view_audit_log'
          );
          break;
        case 'payroll_management':
          filtered = filtered.filter(p => 
            p.name.includes('salary') || p.name.includes('payroll') || 
            p.name.includes('statutory_rule')
          );
          break;
        case 'leave_management':
          filtered = filtered.filter(p => p.name.includes('leave'));
          break;
        case 'user_management':
          filtered = filtered.filter(p => 
            (p.name.includes('user') || p.name.includes('department') || p.name.includes('role')) &&
            p.name !== 'view_department'
          );
          break;
        case 'employee_management':
          filtered = filtered.filter(p => 
            p.name === 'view_employees' || p.name === 'edit_employee' || 
            p.name === 'delete_employee' || p.name === 'create_employee_code' || 
            p.name === 'view_employee_profile'
          );
          break;
        case 'customization':
          filtered = filtered.filter(p => 
            p.name === 'view_customization'
          );
          break;
        default:
          break;
      }
    }
    
    return filtered;
  };



  // ------------------------------------
  // PERMISSION CHECK
  // ------------------------------------
  const canView = isAdmin() || hasPermission("view_user_roles");
  const canAdd = isAdmin() || hasPermission("add_user_role");
  const canEdit = isAdmin() || hasPermission("edit_user_role");
  const canDelete = isAdmin() || hasPermission("delete_user_role");

  if (!canView) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You do not have permission to view Roles.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const fetchPermissions = async () => {
    try {
      const res = await api.get(`/hospitals/roles/${tenant_db}/permissions`);
      setPermissions(res.data.permissions);
    } catch (err) {
      console.error("Permission load error:", err);
    }
  };

  const fetchRoles = async (status = statusFilter) => {
    try {
      const res = await api.get(`/hospitals/roles/${tenant_db}/list?status=${status}`);
      setRoles(res.data.roles);
    } catch (err) {
      console.error("Role load error:", err);
    }
  };

  useEffect(() => {
    fetchPermissions();
    fetchRoles();
  }, [statusFilter]);

  const togglePerm = (perm, setter, list) => {
    if (list.includes(perm)) {
      setter(list.filter((p) => p !== perm));
    } else {
      let newList = [...list, perm];
      
      // Auto-selecting dependent permissions
      if (perm === 'view_employees' && !newList.includes('mark_onboarded')) {
        newList.push('mark_onboarded');
      }
      
      if (perm === 'view_punch_logs' && !newList.includes('view_employees')) {
        newList.push('view_employees');
        // Also add mark_onboarded since view_employees was added
        if (!newList.includes('mark_onboarded')) {
          newList.push('mark_onboarded');
        }
      }
      
      setter(newList);
    }
  };

  const addRole = async () => {
    if (!canAdd) return showToast("You do not have permission to add roles", 'error');

    if (!name.trim()) {
      showToast("Role name is required to create a role", 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(`/hospitals/roles/${tenant_db}/create`, {
        name,
        description: desc,
        permissions: selectedPerms,
      });

      setName("");
      setDesc("");
      setSelectedPerms([]);
      setShowCreateModal(false);
      fetchRoles();
      
      // Show success toast with role name
      const message = response.data.message || `Role '${name}' created successfully`;
      showToast(message, 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Failed to create role";
      showToast(errorMessage, 'error');
      console.error(err);
    }

    setLoading(false);
  };

  const updateRole = async () => {
    if (!canEdit) return showToast("You do not have permission to edit roles", 'error');

    if (!editName.trim()) {
      showToast("Role name is required to update a role", 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await api.put(`/hospitals/roles/${tenant_db}/update/${editing.id}`, {
        name: editName,
        description: editDesc,
        permissions: editPerms,
      });

      setEditing(null);
      fetchRoles();
      
      // Show success toast with role name
      const message = response.data.message || `Role '${editName}' updated successfully`;
      showToast(message, 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Failed to update role";
      showToast(errorMessage, 'error');
      console.error(err);
    }

    setLoading(false);
  };

  const deleteRole = async (id) => {
    if (!canDelete)
      return showToast("You do not have permission to delete roles", 'error');

    const roleToDelete = roles.find(r => r.id === id);
    const roleName = roleToDelete ? roleToDelete.name : 'Role';
    
    if (!window.confirm(`Are you sure you want to delete the role '${roleName}'?`)) return;

    try {
      const response = await api.delete(`/hospitals/roles/${tenant_db}/delete/${id}`);
      fetchRoles();
      
      // Show success toast with role name
      const message = response.data.message || `Role '${roleName}' has been deleted successfully`;
      showToast(message, 'success');
    } catch (err) {
      console.error('Delete role failed:', err);
      const errorMessage = err.response?.data?.detail || `Failed to delete role '${roleName}'`;
      showToast(errorMessage, 'error');
    }
  };

  // Filter roles based on search
  const filteredRoles = roles.filter(role => {
    return role.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with gradient background matching Department page */}
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Roles & Permissions</h1>
                <p className="text-gray-600 text-base sm:text-lg mb-1">Define role templates and attach permission sets for access control</p>
                <p className="text-gray-500 text-xs sm:text-sm">Access Control & Security</p>
              </div>
            </div>
            <div className="text-left lg:text-right flex-shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-100 rounded-xl p-3 border border-black text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                    <span className="text-xs font-medium">Roles</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{roles.length}</p>
                </div>
                <div className="bg-gray-100 rounded-xl p-3 border border-black text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                    <span className="text-xs font-medium">Permissions</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{permissions.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter matching Department page */}
        <div className="bg-white rounded-2xl border border-black p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs sm:text-sm text-gray-600 border border-black">
              Total: {roles.length}
            </div>
            <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs sm:text-sm text-gray-600 border border-black">
              Showing: {filteredRoles.length}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-black rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            {canAdd && (
              <button 
                onClick={() => setShowCreateModal(true)}
                style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                className="inline-flex items-center justify-center gap-2 text-white px-4 py-2 rounded-full transition-colors text-sm font-medium whitespace-nowrap"
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color, #2862e9)'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">New Role</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
          </div>
        </div>

        {/* Role List matching Department page */}
        <div className="bg-white rounded-2xl border border-black overflow-hidden">
          {filteredRoles.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
              <p className="text-gray-500 text-sm">Try changing your search, or create a new role.</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRoles.map((role, index) => (
                  <div key={role.id} className="bg-white border border-black rounded-xl p-3 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-bold text-sm">
                            {role.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{role.name}</h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditing(role);
                              setEditName(role.name);
                              setEditDesc(role.description || "");
                              setEditPerms(role.permissions);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteRole(role.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-sm text-gray-700">
                          {role.description ? (
                            <span>{role.description}</span>
                          ) : (
                            <span className="text-gray-400 italic">No description provided</span>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Permissions</p>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            {role.permissions.length} permissions
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{role.is_active !== false ? 'Active Role' : 'Inactive Role'}</span>
                          <div className={`w-2 h-2 rounded-full ${role.is_active !== false ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && canAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border-2 border-black">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Create New Role</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setName("");
                    setDesc("");
                    setSelectedPerms([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Grid Layout: Left side for role info, Right side for permissions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Role Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                    <input
                      type="text"
                      placeholder="Enter role name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                    <textarea
                      placeholder="Enter role description"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Right Side - Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">Permissions ({selectedPerms.length} selected)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPerms(getFilteredPermissions(permissionSearch, moduleFilter).map(p => p.name))}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPerms([])}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search permissions..."
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="w-48">
                      <select
                        value={moduleFilter}
                        onChange={(e) => setModuleFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Modules</option>
                        <option value="organization_setup">🏢 Organization Setup</option>
                        <option value="reporting_structure">📊 Reporting Structure</option>
                        <option value="holiday_calendar">📅 Holiday Calendar</option>
                        <option value="job_requisition">💼 Job Requisition</option>
                        <option value="recruitment_setup">🎯 Recruitment Setup</option>
                        <option value="offers_contracts">📄 Offers & Contracts</option>
                        <option value="onboarding">🎓 Onboarding</option>
                        <option value="consultants">🩺 Consultants</option>
                        <option value="exit_management">🚪 Exit Management</option>
                        <option value="statutory_compliance">💰 Statutory Rules & Compliance</option>
                        <option value="training_development">🎓 Training & Development</option>
                        <option value="performance_management">📊 Performance Management System</option>
                        <option value="shift_roster">🕐 Shift & Roster Management</option>
                        <option value="attendance_management">🕐 Attendance Management</option>
                        <option value="hr_operations">🏢 HR Operations & Workforce Management</option>
                        <option value="dashboard_permissions">📊 Dashboard Permissions</option>
                        <option value="payroll_management">💰 Payroll Management</option>
                        <option value="leave_management">📅 Leave Management</option>
                        <option value="user_management">👥 User Management</option>
                        <option value="employee_management">👤 Employee Management</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 space-y-2">
                    {moduleFilter && (
                      <div className="mb-4 pb-2 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-800">{getModuleHeading(moduleFilter)}</h4>
                      </div>
                    )}
                    {getFilteredPermissions(permissionSearch, moduleFilter).map((p) => (
                      <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPerms.includes(p.name)}
                          onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                          className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.description}</p>
                          <p className="text-xs text-gray-500">{p.name}</p>
                        </div>
                      </label>
                    ))}

                    {/* 📊 REPORTING STRUCTURE */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>📊</span> REPORTING STRUCTURE
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getReportingStructurePerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getReportingStructurePerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          (p.name.includes('reporting') || p.name.includes('hierarchy')) &&
                          p.name !== 'view_employee_reporting' && 
                          p.name !== 'manage_employee_reporting' && 
                          p.name !== 'view_team_hierarchy' &&
                          p.name !== 'delete_hierarchy_rule' &&
                          p.name !== 'manage_reporting_manager' &&
                          p.name !== 'assign_reporting_manager' &&
                          p.name !== 'add_reporting_record' &&
                          p.name !== 'edit_reporting_record' &&
                          p.name !== 'delete_reporting_record' &&
                          p.name !== 'view_reporting_details'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 📅 HOLIDAY CALENDAR */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>📅</span> HOLIDAY CALENDAR
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getHolidayCalendarPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getHolidayCalendarPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name.includes('holiday')
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 💼 JOB REQUISITION */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>💼</span> JOB REQUISITION
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getJobRequisitionPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getJobRequisitionPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name.includes('job_requisition')
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 🎯 RECRUITMENT SETUP */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🎯</span> RECRUITMENT SETUP
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getRecruitmentSetupPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getRecruitmentSetupPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name.includes('candidates') || p.name.includes('screen_candidates') || p.name === 'publish_job' || p.name === 'generate_job_link'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Screen Candidates Page</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_candidate' || p.name === 'select_candidates' || p.name === 'schedule_interviews' || p.name === 'view_resumes' || p.name === 'view_ats_pipeline'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">ATS Page</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'move_candidates' || p.name === 'view_active_jobs' || p.name === 'view_ats_candidates'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 📄 OFFERS & CONTRACTS */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>📄</span> OFFERS & CONTRACTS
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getOffersContractsPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getOffersContractsPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name === 'generate_offer_link' || p.name === 'verify_documents' || p.name === 'view_documents' || p.name === 'manage_bgv' || p.name === 'start_onboarding' || p.name === 'mark_onboarded' || p.name === 'view_offers_sent' || p.name === 'view_selected_candidates'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 🎓 ONBOARDING */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🎓</span> ONBOARDING
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getOnboardingPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getOnboardingPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name === 'view_onboarding_documents' || p.name === 'view_onboarding_candidates' || p.name === 'view_document_collected' || p.name === 'add_document_collected' || p.name === 'start_onboarding' || p.name === 'mark_onboarded'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 🩺 CONSULTANTS */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🩺</span> CONSULTANTS
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getConsultantsPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getConsultantsPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Consultant Management</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_consultants' || p.name === 'add_consultant' || p.name === 'edit_consultant' || p.name === 'delete_consultant'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Availability Management</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_availability' || p.name === 'add_availability'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Payout Management</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_payouts' || p.name === 'generate_payslip' || p.name === 'send_payslip_email' || p.name === 'process_payroll'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 🚪 EXIT MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🚪</span> EXIT MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getExitManagementPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getExitManagementPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name === 'apply_resignation' || p.name === 'view_resignations' || p.name === 'approve_resignation' ||
                          p.name === 'manage_handover' || p.name === 'manage_clearance' || p.name === 'manage_assets' || p.name === 'manage_settlement'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Department Clearances</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'hr_clearance' || p.name === 'it_clearance' || p.name === 'finance_clearance' || p.name === 'admin_clearance'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Exit Interviews</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'conduct_exit_interview' || p.name === 'view_exit_interviews'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Knowledge Transfer</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_kt_plans' || p.name === 'add_kt_plan' || p.name === 'create_kt_plan' || p.name === 'complete_kt_items' || p.name === 'hr_approve_kt' || p.name === 'manager_approve_kt'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">F&F Settlement & Documents</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_settlements' || p.name === 'calculate_settlements' || p.name === 'approve_settlements' || p.name === 'generate_experience_letter' || p.name === 'edit_experience_letter' || p.name === 'download_settlement_pdf' || p.name === 'email_settlement_docs' || p.name === 'edit_settlements'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 💰 STATUTORY RULES & COMPLIANCE */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>💰</span> STATUTORY RULES & COMPLIANCE
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getStatutoryCompliancePerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getStatutoryCompliancePerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Statutory Calculations</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_statutory_calculations' || p.name === 'add_statutory_calculation' || p.name === 'edit_statutory_calculation' || p.name === 'delete_statutory_calculation' || p.name === 'view_deleted_statutory' || p.name === 'restore_statutory_calculation'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Labour Register</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_labour_register' || p.name === 'add_labour_register' || p.name === 'edit_labour_register' || p.name === 'delete_labour_register' || p.name === 'view_deleted_labour_register' || p.name === 'restore_labour_register'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Compliance</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_compliance' || p.name === 'add_leave_compliance' || p.name === 'edit_leave_compliance' || p.name === 'delete_leave_compliance' || p.name === 'view_deleted_leave_compliance' || p.name === 'restore_leave_compliance'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">NABH Compliance</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_nabh_compliance' || p.name === 'add_nabh_compliance' || p.name === 'edit_nabh_compliance' || p.name === 'delete_nabh_compliance' || p.name === 'view_deleted_nabh_compliance' || p.name === 'restore_nabh_compliance'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 🎓 TRAINING & DEVELOPMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🎓</span> TRAINING & DEVELOPMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getTrainingDevelopmentPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getTrainingDevelopmentPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Training Programs</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_training_programs' || p.name === 'add_training_program' || p.name === 'edit_training_program' || p.name === 'delete_training_program' || p.name === 'generate_training_link'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Training Applications</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_enrolled_trainees' || p.name === 'approve_training_applications' || p.name === 'select_send_training_emails'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Training Calendar</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_training_calendar' || p.name === 'add_training_schedule' || p.name === 'edit_training_schedule' || p.name === 'delete_training_schedule'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Training Requests</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_training_requests' || p.name === 'add_training_request' || p.name === 'approve_training_request' || p.name === 'reject_training_request'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Attendance & Assessment</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_training_attendance' || p.name === 'mark_training_attendance' || p.name === 'view_training_assessments' || p.name === 'conduct_training_assessment' || p.name === 'grade_training_assessment'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Certificates</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_training_certificates' || p.name === 'generate_training_certificate' || p.name === 'download_training_certificate' || p.name === 'email_training_certificate'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 📊 PERFORMANCE MANAGEMENT SYSTEM */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>📊</span> PERFORMANCE MANAGEMENT SYSTEM
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getPerformanceManagementPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getPerformanceManagementPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Work Assignments</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_work_assignments' || p.name === 'add_work_assignment' || p.name === 'edit_work_assignment' || p.name === 'delete_work_assignment' || p.name === 'view_deleted_work_assignments' || p.name === 'restore_work_assignment' || p.name === 'assign_to_employees'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Goals & KPI (Read-Only Auto-Calculated)</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_goals_kpi'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Review Cycle</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_review_cycles' || p.name === 'create_review_cycle' || p.name === 'edit_review_cycle' || p.name === 'delete_review_cycle' || p.name === 'view_deleted_review_cycles' || p.name === 'restore_review_cycle' || p.name === 'start_review_cycle' || p.name === 'close_review_cycle' || p.name === 'show_deleted_review_cycles'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Feedback</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_feedback' || p.name === 'give_feedback' || p.name === 'request_feedback' || p.name === 'view_360_feedback' || p.name === 'manage_feedback_forms' || p.name === 'edit_feedback' || p.name === 'delete_feedback' || p.name === 'restore_feedback' || p.name === 'show_deleted_feedback'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Appraisal</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_appraisals' || p.name === 'conduct_appraisal' || p.name === 'submit_self_appraisal' || p.name === 'approve_appraisal' || p.name === 'view_appraisal_reports' || p.name === 'edit_appraisal' || p.name === 'delete_appraisal' || p.name === 'restore_appraisal' || p.name === 'show_deleted_appraisals'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Quality Indicators</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_quality_indicators' || p.name === 'add_quality_indicator' || p.name === 'edit_quality_indicator' || p.name === 'delete_quality_indicator' || p.name === 'measure_quality_metrics' || p.name === 'restore_quality_indicator' || p.name === 'show_deleted_quality_indicators'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 🕐 SHIFT & ROSTER MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🕐</span> SHIFT & ROSTER MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getShiftRosterPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getShiftRosterPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Shift Management</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_shifts' || p.name === 'create_shifts' || p.name === 'delete_shifts'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Roster Management</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_roster' || p.name === 'manage_roster' || p.name === 'manage_night_shift_rules' || p.name === 'manage_on_call_duty'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 🕐 ATTENDANCE MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🕐</span> ATTENDANCE MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getAttendanceManagementPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getAttendanceManagementPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Real-time Attendance Tracking</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_attendance' || p.name === 'mark_attendance' || p.name === 'approve_attendance' || p.name === 'view_attendance_reports' || p.name === 'generate_attendance_reports' || p.name === 'export_attendance_data'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Punch Logs</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_punch_logs' || p.name === 'punch_in' || p.name === 'punch_out'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      

                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Regularization</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_regularization' || p.name === 'apply_regularization' || p.name === 'approve_regularization' || p.name === 'reject_regularization'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">OD Applications</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_od_applications' || p.name === 'apply_od' || p.name === 'approve_od' || p.name === 'reject_od' || p.name === 'edit_od_applications'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      

                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Attendance Rules & Policies</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_attendance_rules' || p.name === 'add_attendance_rule' || p.name === 'edit_attendance_rule' || p.name === 'delete_attendance_rule' || p.name === 'view_attendance_locations' || p.name === 'add_attendance_location' || p.name === 'edit_attendance_location' || p.name === 'delete_attendance_location'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Attendance Permission</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'apply_attendance_permission' || p.name === 'view_attendance_permission' || p.name === 'approve_attendance_permission' || p.name === 'reject_attendance_permission'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Daily Updates</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_daily_updates' || p.name === 'add_daily_update' || p.name === 'edit_daily_update' || p.name === 'delete_daily_update'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 🏢 HR OPERATIONS & WORKFORCE MANAGEMENT */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <span>🏢</span> HR OPERATIONS & WORKFORCE MANAGEMENT
                      </h4>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Lifecycle Actions</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_lifecycle_actions' || p.name === 'add_lifecycle_action' || p.name === 'edit_lifecycle_action' || p.name === 'delete_lifecycle_action' || p.name === 'approve_lifecycle_action' || p.name === 'restore_lifecycle_action' || p.name === 'show_deleted_lifecycle_actions'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">HR Letters</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_hr_letters' || p.name === 'add_hr_letter' || p.name === 'edit_hr_letter' || p.name === 'delete_hr_letter' || p.name === 'print_hr_letter' || p.name === 'generate_hr_letter' || p.name === 'send_hr_letter' || p.name === 'restore_hr_letter' || p.name === 'show_deleted_hr_letters'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Grievances Desk</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_grievances' || p.name === 'add_grievance' || p.name === 'edit_grievance' || p.name === 'delete_grievance' || p.name === 'assign_grievance' || p.name === 'resolve_grievance' || p.name === 'escalate_grievance' || p.name === 'restore_grievance' || p.name === 'show_deleted_grievances'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Assets</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_assets' || p.name === 'add_asset' || p.name === 'edit_asset' || p.name === 'delete_asset' || p.name === 'assign_asset' || p.name === 'return_asset' || p.name === 'track_asset' || p.name === 'restore_asset' || p.name === 'show_deleted_assets' || p.name === 'approve_asset' || p.name === 'reject_asset'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Insurance & Benefits</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_insurance_benefits' || p.name === 'add_insurance_benefit' || p.name === 'edit_insurance_benefit' || p.name === 'delete_insurance_benefit' || p.name === 'enroll_employee_benefits' || p.name === 'process_claims' || p.name === 'manage_beneficiaries' || p.name === 'add_insurance_policy' || p.name === 'delete_insurance_policy' || p.name === 'restore_insurance_benefit' || p.name === 'show_deleted_insurance_benefits'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Staff Scheduling</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_staff_schedules' || p.name === 'add_staff_schedule' || p.name === 'edit_staff_schedule' || p.name === 'delete_staff_schedule' || p.name === 'assign_shifts' || p.name === 'manage_shift_swaps' || p.name === 'approve_schedule_changes' || p.name === 'restore_staff_schedule' || p.name === 'show_deleted_staff_schedules'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 📊 DASHBOARD PERMISSIONS */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>📊</span> DASHBOARD PERMISSIONS
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getDashboardPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getDashboardPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name === 'view_documents_alerts' || p.name === 'view_audit_log'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 💰 PAYROLL MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>💰</span> PAYROLL MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getPayrollManagementPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getPayrollManagementPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Salary Structure</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_salary_structure' || p.name === 'add_salary_structure' || p.name === 'edit_salary_structure' || p.name === 'delete_salary_structure' || p.name === 'view_salary_structure_details' || p.name === 'link_employees_salary_structure'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Statutory Rules</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_statutory_rules' || p.name === 'add_statutory_rule' || p.name === 'edit_statutory_rule' || p.name === 'delete_statutory_rule'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Payroll Run</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_payroll_run' || p.name === 'create_payroll_run' || p.name === 'process_payroll_run' || p.name === 'approve_payroll_run' || p.name === 'delete_payroll_run'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Adjustments</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_payroll_adjustments' || p.name === 'add_payroll_adjustment' || p.name === 'edit_payroll_adjustment' || p.name === 'delete_payroll_adjustment' || p.name === 'approve_payroll_adjustment'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Salary Slip & Payment</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_salary_slips' || p.name === 'generate_salary_slips' || p.name === 'download_salary_slips' || p.name === 'email_salary_slips' || p.name === 'process_payments' || p.name === 'view_payment_status'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Reports & Compliance</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_payroll_reports' || p.name === 'generate_payroll_reports' || p.name === 'export_payroll_data' || p.name === 'view_compliance_reports' || p.name === 'generate_compliance_reports'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 📅 LEAVE MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>📅</span> LEAVE MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getLeaveManagementPerms().every(perm => selectedPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getLeaveManagementPerms(),
                              setSelectedPerms,
                              selectedPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Types</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_types' || p.name === 'add_leave_type' || p.name === 'edit_leave_type' || p.name === 'delete_leave_type'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Policies</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_policies' || p.name === 'add_leave_policy' || p.name === 'edit_leave_policy' || p.name === 'delete_leave_policy' || p.name === 'assign_leave_policy'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Rules</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_rules' || p.name === 'add_leave_rule' || p.name === 'edit_leave_rule' || p.name === 'delete_leave_rule'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Applications & Approvals</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_applications' || p.name === 'apply_leave' || p.name === 'edit_leave_application' || p.name === 'cancel_leave_application' || p.name === 'approve_leave' || p.name === 'reject_leave'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Calendar</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_calendar' || p.name === 'export_leave_calendar'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Reports</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_reports' || p.name === 'generate_leave_reports' || p.name === 'export_leave_reports' || p.name === 'view_leave_balance' || p.name === 'view_leave_trends'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setName("");
                    setDesc("");
                    setSelectedPerms([]);
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors text-sm border border-black"
                >
                  Cancel
                </button>
                <button
                  onClick={addRole}
                  disabled={loading || !name.trim()}
                  style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                  className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-black"
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)')}
                  onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--primary-color, #2862e9)')}
                >
                  {loading ? "Creating..." : "Create Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && canEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border-2 border-black">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Edit Role</h3>
                <button
                  onClick={() => setEditing(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Grid Layout: Left side for role info, Right side for permissions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Role Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Right Side - Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">Permissions ({editPerms.length} selected)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditPerms(getFilteredPermissions(editPermissionSearch, editModuleFilter).map(p => p.name))}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPerms([])}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search permissions..."
                        value={editPermissionSearch}
                        onChange={(e) => setEditPermissionSearch(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="w-48">
                      <select
                        value={editModuleFilter}
                        onChange={(e) => setEditModuleFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Modules</option>
                        <option value="organization_setup">🏢 Organization Setup</option>
                        <option value="reporting_structure">📊 Reporting Structure</option>
                        <option value="holiday_calendar">📅 Holiday Calendar</option>
                        <option value="job_requisition">💼 Job Requisition</option>
                        <option value="recruitment_setup">🎯 Recruitment Setup</option>
                        <option value="offers_contracts">📄 Offers & Contracts</option>
                        <option value="onboarding">🎓 Onboarding</option>
                        <option value="consultants">🩺 Consultants</option>
                        <option value="exit_management">🚪 Exit Management</option>
                        <option value="statutory_compliance">💰 Statutory Rules & Compliance</option>
                        <option value="training_development">🎓 Training & Development</option>
                        <option value="performance_management">📊 Performance Management System</option>
                        <option value="shift_roster">🕐 Shift & Roster Management</option>
                        <option value="attendance_management">🕐 Attendance Management</option>
                        <option value="hr_operations">🏢 HR Operations & Workforce Management</option>
                        <option value="dashboard_permissions">📊 Dashboard Permissions</option>
                        <option value="payroll_management">💰 Payroll Management</option>
                        <option value="leave_management">📅 Leave Management</option>
                        <option value="user_management">👥 User Management</option>
                        <option value="employee_management">👤 Employee Management</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 space-y-2">
                    {editModuleFilter && (
                      <div className="mb-4 pb-2 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-800">{getModuleHeading(editModuleFilter)}</h4>
                      </div>
                    )}
                    {getFilteredPermissions(editPermissionSearch, editModuleFilter).map((p) => (
                      <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPerms.includes(p.name)}
                          onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                          className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.description}</p>
                          <p className="text-xs text-gray-500">{p.name}</p>
                        </div>
                      </label>
                    ))}

                    {/* 👤 EMPLOYEE MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>👤</span> EMPLOYEE MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getEmployeeManagementPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getEmployeeManagementPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name === 'view_employees' || p.name === 'edit_employee' || p.name === 'delete_employee' || p.name === 'create_employee_code' || p.name === 'view_employee_profile'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Employee Directory</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_employee_directory' || p.name === 'search_employees' || p.name === 'export_directory'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 👤 EMPLOYEE INFORMATION SYSTEM (EIS) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>👤</span> EMPLOYEE INFORMATION SYSTEM (EIS)
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getProfileDocumentsPerms().concat(getEmploymentProbationPerms()).every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getProfileDocumentsPerms().concat(getEmploymentProbationPerms()),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Profile & Documents</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'edit_employee_profile' || p.name === 'view_employee_documents' || p.name === 'upload_employee_documents' || p.name === 'delete_employee_documents' || p.name === 'edit_profile' || p.name === 'view_documents' || p.name === 'verify_employee_documents' || p.name === 'verify_bank_details'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Employment & Probation</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_probation_details' || p.name === 'add_probation' || p.name === 'extend_probation' || p.name === 'end_probation'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      

                    </div>

                    {/* 🏢 ORGANIZATION SETUP */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🏢</span> ORGANIZATION SETUP
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getOrganizationSetupPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getOrganizationSetupPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name.includes('company') || p.name.includes('branch') || 
                          (p.name.includes('department') && !p.name.includes('user')) ||
                          p.name.includes('designation')
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 📊 REPORTING STRUCTURE */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>📊</span> REPORTING STRUCTURE
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getReportingStructurePerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getReportingStructurePerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          (p.name.includes('reporting') || p.name.includes('hierarchy')) &&
                          p.name !== 'view_employee_reporting' && 
                          p.name !== 'manage_employee_reporting' && 
                          p.name !== 'view_team_hierarchy' &&
                          p.name !== 'delete_hierarchy_rule' &&
                          p.name !== 'manage_reporting_manager' &&
                          p.name !== 'assign_reporting_manager' &&
                          p.name !== 'add_reporting_record' &&
                          p.name !== 'edit_reporting_record' &&
                          p.name !== 'delete_reporting_record' &&
                          p.name !== 'view_reporting_details'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 📅 HOLIDAY CALENDAR */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>📅</span> HOLIDAY CALENDAR
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getHolidayCalendarPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getHolidayCalendarPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name.includes('holiday')
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 💼 JOB REQUISITION */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>💼</span> JOB REQUISITION
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getJobRequisitionPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getJobRequisitionPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name.includes('job_requisition')
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 🎯 RECRUITMENT SETUP */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🎯</span> RECRUITMENT SETUP
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getRecruitmentSetupPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getRecruitmentSetupPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name.includes('candidates') || p.name.includes('screen_candidates') || p.name === 'publish_job' || p.name === 'generate_job_link'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Screen Candidates Page</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_candidate' || p.name === 'select_candidates' || p.name === 'schedule_interviews' || p.name === 'view_resumes' || p.name === 'view_ats_pipeline'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">ATS Page</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'move_candidates' || p.name === 'view_active_jobs' || p.name === 'view_ats_candidates'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 📄 OFFERS & CONTRACTS */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>📄</span> OFFERS & CONTRACTS
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getOffersContractsPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getOffersContractsPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name === 'generate_offer_link' || p.name === 'verify_documents' || p.name === 'view_documents' || p.name === 'manage_bgv' || p.name === 'start_onboarding' || p.name === 'mark_onboarded' || p.name === 'view_offers_sent' || p.name === 'view_selected_candidates'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 🎓 ONBOARDING */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🎓</span> ONBOARDING
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getOnboardingPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getOnboardingPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name === 'view_onboarding_documents' || p.name === 'view_onboarding_candidates' || p.name === 'view_document_collected' || p.name === 'add_document_collected' || p.name === 'start_onboarding' || p.name === 'mark_onboarded'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 🩺 CONSULTANTS */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🩺</span> CONSULTANTS
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getConsultantsPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getConsultantsPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Consultant Management</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_consultants' || p.name === 'add_consultant' || p.name === 'edit_consultant' || p.name === 'delete_consultant'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Availability Management</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_availability' || p.name === 'add_availability'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Payout Management</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_payouts' || p.name === 'generate_payslip' || p.name === 'send_payslip_email' || p.name === 'process_payroll'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 🚪 EXIT MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🚪</span> EXIT MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getExitManagementPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getExitManagementPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name === 'apply_resignation' || p.name === 'view_resignations' || p.name === 'approve_resignation' ||
                          p.name === 'manage_handover' || p.name === 'manage_clearance' || p.name === 'manage_assets' || p.name === 'manage_settlement'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Department Clearances</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'hr_clearance' || p.name === 'it_clearance' || p.name === 'finance_clearance' || p.name === 'admin_clearance'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Exit Interviews</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'conduct_exit_interview' || p.name === 'view_exit_interviews'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Knowledge Transfer</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_kt_plans' || p.name === 'add_kt_plan' || p.name === 'create_kt_plan' || p.name === 'complete_kt_items' || p.name === 'hr_approve_kt' || p.name === 'manager_approve_kt'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">F&F Settlement & Documents</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_settlements' || p.name === 'calculate_settlements' || p.name === 'approve_settlements' || p.name === 'generate_experience_letter' || p.name === 'edit_experience_letter' || p.name === 'download_settlement_pdf' || p.name === 'email_settlement_docs' || p.name === 'edit_settlements'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 📊 DASHBOARD PERMISSIONS */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>📊</span> DASHBOARD PERMISSIONS
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getDashboardPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getDashboardPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        {permissions.filter(p => 
                          p.name === 'view_documents_alerts' || p.name === 'view_audit_log'
                        ).map((p) => (
                          <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPerms.includes(p.name)}
                              onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                              className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.description}</p>
                              <p className="text-xs text-gray-500">{p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 💰 STATUTORY RULES & COMPLIANCE */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>💰</span> STATUTORY RULES & COMPLIANCE
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getStatutoryCompliancePerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getStatutoryCompliancePerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Statutory Calculations</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_statutory_calculations' || p.name === 'add_statutory_calculation' || p.name === 'edit_statutory_calculation' || p.name === 'delete_statutory_calculation' || p.name === 'view_deleted_statutory' || p.name === 'restore_statutory_calculation'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Labour Register</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_labour_register' || p.name === 'add_labour_register' || p.name === 'edit_labour_register' || p.name === 'delete_labour_register' || p.name === 'view_deleted_labour_register' || p.name === 'restore_labour_register'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Compliance</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_compliance' || p.name === 'add_leave_compliance' || p.name === 'edit_leave_compliance' || p.name === 'delete_leave_compliance' || p.name === 'view_deleted_leave_compliance' || p.name === 'restore_leave_compliance'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">NABH Compliance</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_nabh_compliance' || p.name === 'add_nabh_compliance' || p.name === 'edit_nabh_compliance' || p.name === 'delete_nabh_compliance' || p.name === 'view_deleted_nabh_compliance' || p.name === 'restore_nabh_compliance'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 🕐 ATTENDANCE MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🕐</span> ATTENDANCE MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getAttendanceManagementPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getAttendanceManagementPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Real-time Attendance Tracking</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_attendance' || p.name === 'mark_attendance' || p.name === 'approve_attendance' || p.name === 'view_attendance_reports' || p.name === 'generate_attendance_reports' || p.name === 'export_attendance_data'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Punch Logs</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_punch_logs' || p.name === 'punch_in' || p.name === 'punch_out'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Regularization</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            false
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Regularization</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_regularization' || p.name === 'apply_regularization' || p.name === 'approve_regularization' || p.name === 'reject_regularization'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">OD Applications</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_od_applications' || p.name === 'apply_od' || p.name === 'approve_od' || p.name === 'reject_od' || p.name === 'edit_od_applications'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Regularization</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_regularization' || p.name === 'apply_regularization' || p.name === 'approve_regularization' || p.name === 'reject_regularization'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Attendance Rules & Policies</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_attendance_rules' || p.name === 'add_attendance_rule' || p.name === 'edit_attendance_rule' || p.name === 'delete_attendance_rule' || p.name === 'view_attendance_locations' || p.name === 'add_attendance_location' || p.name === 'edit_attendance_location' || p.name === 'delete_attendance_location'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Daily Updates</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_daily_updates' || p.name === 'add_daily_update' || p.name === 'edit_daily_update' || p.name === 'delete_daily_update'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setSelectedPerms, selectedPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 🎓 TRAINING & DEVELOPMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🎓</span> TRAINING & DEVELOPMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getTrainingDevelopmentPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getTrainingDevelopmentPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Training Programs</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_training_programs' || p.name === 'add_training_program' || p.name === 'edit_training_program' || p.name === 'delete_training_program' || p.name === 'generate_training_link'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Training Applications</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_enrolled_trainees' || p.name === 'approve_training_applications' || p.name === 'select_send_training_emails'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Training Calendar</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_training_calendar'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Training Requests</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_training_requests' || p.name === 'add_training_request' || p.name === 'approve_training_request' || p.name === 'reject_training_request'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Attendance & Assessment</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_training_attendance' || p.name === 'mark_training_attendance' || p.name === 'view_training_assessments' || p.name === 'conduct_training_assessment' || p.name === 'grade_training_assessment'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Certificates</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_training_certificates' || p.name === 'generate_training_certificate' || p.name === 'download_training_certificate' || p.name === 'email_training_certificate'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 📊 PERFORMANCE MANAGEMENT SYSTEM */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>📊</span> PERFORMANCE MANAGEMENT SYSTEM
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getPerformanceManagementPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getPerformanceManagementPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Work Assignments</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_work_assignments' || p.name === 'add_work_assignment' || p.name === 'edit_work_assignment' || p.name === 'delete_work_assignment' || p.name === 'view_deleted_work_assignments' || p.name === 'restore_work_assignment' || p.name === 'view_my_assignments' || p.name === 'assign_to_employees'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Goals & KPI (Read-Only Auto-Calculated)</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_goals_kpi'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Review Cycle</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_review_cycles' || p.name === 'create_review_cycle' || p.name === 'edit_review_cycle' || p.name === 'delete_review_cycle' || p.name === 'view_deleted_review_cycles' || p.name === 'restore_review_cycle' || p.name === 'start_review_cycle' || p.name === 'close_review_cycle' || p.name === 'show_deleted_review_cycles'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Feedback</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_feedback' || p.name === 'give_feedback' || p.name === 'request_feedback' || p.name === 'view_360_feedback' || p.name === 'manage_feedback_forms' || p.name === 'edit_feedback' || p.name === 'delete_feedback' || p.name === 'restore_feedback' || p.name === 'show_deleted_feedback'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Appraisal</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_appraisals' || p.name === 'conduct_appraisal' || p.name === 'submit_self_appraisal' || p.name === 'approve_appraisal' || p.name === 'view_appraisal_reports' || p.name === 'edit_appraisal' || p.name === 'delete_appraisal' || p.name === 'restore_appraisal' || p.name === 'show_deleted_appraisals'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Quality Indicators</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_quality_indicators' || p.name === 'add_quality_indicator' || p.name === 'edit_quality_indicator' || p.name === 'delete_quality_indicator' || p.name === 'measure_quality_metrics' || p.name === 'restore_quality_indicator' || p.name === 'show_deleted_quality_indicators'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 🏢 HR OPERATIONS & WORKFORCE MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🏢</span> HR OPERATIONS & WORKFORCE MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getHROperationsPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getHROperationsPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Lifecycle Actions</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_lifecycle_actions' || p.name === 'add_lifecycle_action' || p.name === 'edit_lifecycle_action' || p.name === 'delete_lifecycle_action' || p.name === 'approve_lifecycle_action' || p.name === 'restore_lifecycle_action' || p.name === 'show_deleted_lifecycle_actions'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">HR Letters</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_hr_letters' || p.name === 'add_hr_letter' || p.name === 'edit_hr_letter' || p.name === 'delete_hr_letter' || p.name === 'print_hr_letter' || p.name === 'generate_hr_letter' || p.name === 'send_hr_letter' || p.name === 'restore_hr_letter' || p.name === 'show_deleted_hr_letters'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Grievances Desk</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_grievances' || p.name === 'add_grievance' || p.name === 'edit_grievance' || p.name === 'delete_grievance' || p.name === 'assign_grievance' || p.name === 'resolve_grievance' || p.name === 'escalate_grievance' || p.name === 'restore_grievance' || p.name === 'show_deleted_grievances'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Assets</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_assets' || p.name === 'add_asset' || p.name === 'edit_asset' || p.name === 'delete_asset' || p.name === 'assign_asset' || p.name === 'return_asset' || p.name === 'track_asset' || p.name === 'restore_asset' || p.name === 'show_deleted_assets' || p.name === 'approve_asset' || p.name === 'reject_asset'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Insurance & Benefits</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_insurance_benefits' || p.name === 'add_insurance_benefit' || p.name === 'edit_insurance_benefit' || p.name === 'delete_insurance_benefit' || p.name === 'enroll_employee_benefits' || p.name === 'process_claims' || p.name === 'manage_beneficiaries' || p.name === 'add_insurance_policy' || p.name === 'delete_insurance_policy' || p.name === 'restore_insurance_benefit' || p.name === 'show_deleted_insurance_benefits'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Staff Scheduling</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_staff_schedules' || p.name === 'add_staff_schedule' || p.name === 'edit_staff_schedule' || p.name === 'delete_staff_schedule' || p.name === 'assign_shifts' || p.name === 'manage_shift_swaps' || p.name === 'approve_schedule_changes' || p.name === 'restore_staff_schedule' || p.name === 'show_deleted_staff_schedules'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 💰 PAYROLL MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>💰</span> PAYROLL MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getPayrollManagementPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getPayrollManagementPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Salary Structure</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_salary_structure' || p.name === 'add_salary_structure' || p.name === 'edit_salary_structure' || p.name === 'delete_salary_structure' || p.name === 'view_salary_structure_details' || p.name === 'link_employees_salary_structure'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Statutory Rules</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_statutory_rules' || p.name === 'add_statutory_rule' || p.name === 'edit_statutory_rule' || p.name === 'delete_statutory_rule'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Payroll Run</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_payroll_run' || p.name === 'create_payroll_run' || p.name === 'process_payroll_run' || p.name === 'approve_payroll_run' || p.name === 'delete_payroll_run'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Adjustments</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_payroll_adjustments' || p.name === 'add_payroll_adjustment' || p.name === 'edit_payroll_adjustment' || p.name === 'delete_payroll_adjustment' || p.name === 'approve_payroll_adjustment'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Salary Slip & Payment</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_salary_slips' || p.name === 'generate_salary_slips' || p.name === 'download_salary_slips' || p.name === 'email_salary_slips' || p.name === 'process_payments' || p.name === 'view_payment_status'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Reports & Compliance</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_payroll_reports' || p.name === 'generate_payroll_reports' || p.name === 'export_payroll_data' || p.name === 'view_compliance_reports' || p.name === 'generate_compliance_reports'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 🕐 SHIFT & ROSTER MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🕐</span> SHIFT & ROSTER MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getShiftRosterPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getShiftRosterPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Shift Management</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'VIEW_SHIFTS' || p.name === 'CREATE_SHIFTS' || p.name === 'DELETE_SHIFTS'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Roster Management</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'VIEW_ROSTER' || p.name === 'MANAGE_ROSTER' || p.name === 'MANAGE_NIGHT_SHIFT_RULES' || p.name === 'MANAGE_ON_CALL_DUTY'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 🕐 ATTENDANCE MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>🕐</span> ATTENDANCE MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getAttendanceManagementPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getAttendanceManagementPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Real-time Attendance Tracking</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_attendance' || p.name === 'mark_attendance' || p.name === 'view_time_logs' || p.name === 'edit_time_logs' || p.name === 'approve_attendance' || p.name === 'view_attendance_reports' || p.name === 'generate_attendance_reports' || p.name === 'export_attendance_data'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Punch Logs</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_punch_logs' || p.name === 'edit_punch_logs' || p.name === 'delete_punch_logs' || p.name === 'view_daily_punch_logs' || p.name === 'punch_in' || p.name === 'punch_out'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Regularization</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_regularization' || p.name === 'apply_regularization' || p.name === 'approve_regularization' || p.name === 'reject_regularization'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Regularization</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_regularization' || p.name === 'apply_regularization' || p.name === 'approve_regularization' || p.name === 'reject_regularization'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">OD Applications</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_od_applications' || p.name === 'apply_od' || p.name === 'approve_od' || p.name === 'reject_od' || p.name === 'edit_od_applications'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Regularization</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_regularization' || p.name === 'apply_regularization' || p.name === 'approve_regularization' || p.name === 'reject_regularization'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Attendance Rules & Policies</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_attendance_rules' || p.name === 'add_attendance_rule' || p.name === 'edit_attendance_rule' || p.name === 'delete_attendance_rule' || p.name === 'view_attendance_locations' || p.name === 'add_attendance_location' || p.name === 'edit_attendance_location' || p.name === 'delete_attendance_location'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 📅 LEAVE MANAGEMENT */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <span>📅</span> LEAVE MANAGEMENT
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getLeaveManagementPerms().every(perm => editPerms.includes(perm))}
                            onChange={() => handleSelectAllSection(
                              getLeaveManagementPerms(),
                              setEditPerms,
                              editPerms
                            )}
                            className="w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 ml-6">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Types</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_types' || p.name === 'add_leave_type' || p.name === 'edit_leave_type' || p.name === 'delete_leave_type'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Policies</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_policies' || p.name === 'add_leave_policy' || p.name === 'edit_leave_policy' || p.name === 'delete_leave_policy' || p.name === 'assign_leave_policy'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Rules</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_rules' || p.name === 'add_leave_rule' || p.name === 'edit_leave_rule' || p.name === 'delete_leave_rule'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Applications & Approvals</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_applications' || p.name === 'apply_leave' || p.name === 'edit_leave_application' || p.name === 'cancel_leave_application' || p.name === 'approve_leave' || p.name === 'reject_leave'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Calendar</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_calendar' || p.name === 'export_leave_calendar'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 mt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Leave Reports</h5>
                        <div className="space-y-2 ml-3">
                          {permissions.filter(p => 
                            p.name === 'view_leave_reports' || p.name === 'generate_leave_reports' || p.name === 'export_leave_reports' || p.name === 'view_leave_balance' || p.name === 'view_leave_trends'
                          ).map((p) => (
                            <label key={p.name} className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editPerms.includes(p.name)}
                                onChange={() => togglePerm(p.name, setEditPerms, editPerms)}
                                className="mt-1 w-4 h-4 text-blue-600 border border-black rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors text-sm border border-black"
                >
                  Cancel
                </button>
                <button
                  onClick={updateRole}
                  disabled={loading || !editName.trim()}
                  style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
                  className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-black"
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--secondary-color, #6b7280)')}
                  onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'var(--primary-color, #2862e9)')}
                >
                  {loading ? "Updating..." : "Update Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} hideToast={hideToast} />
    </Layout>
  );
}
