import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import api from "./api";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Departments from "./pages/Department";
import Roles from "./pages/Roles";
import HospitalRegister from "./pages/HospitalRegister";
import Users from "./pages/User";
import AuditLogs from "./pages/AuditLogs";

// Organization Setup Module
import OrganizationLayout from "./pages/organization/OrganizationLayout";
import CompanyProfile from "./pages/organization/CompanyProfile";
import Branch from "./pages/organization/Branch";

import HolidayCalender from "./pages/organization/HolidayCalender";

// ⭐ Authentication protection
import ProtectedRoute from "./components/ProctectedRoute";


import RecruitmentSetup from "./pages/recruitment/Recruitment";
import JobRequisition from "./pages/recruitment/JobRequisition";
import ATS from "./pages/recruitment/ATS";
import Offer from "./pages/recruitment/offer";
import Onboarding from "./pages/recruitment/Onboarding";
import JobApply from "./pages/recruitment/public jobapply";
import CandidateScreening from "./pages/recruitment/CandidateScreening";
import DocumentUpload from "./pages/recruitment/DocumentUpload";
import MasterDashboard from "./pages/recruitment/MasterDashboard";

// EIS
import EmployeeListPage from "./pages/EIS/EmployeeListPage";
import EmployeeProfile from "./pages/EIS/EmployeeProfile";
import EmployeeEducation from "./pages/EIS/EmployeeEducation";
import EmployeeExperience from "./pages/EIS/EmployeeExperience";
import EmployeeSkills from "./pages/EIS/EmployeeSkills";
import EmployeeCertifications from "./pages/EIS/EmployeeCertifications";
import EmployeeFamily from "./pages/EIS/EmployeeFamily";
import EmployeeMedical from "./pages/EIS/EmployeeMedical";
import EmployeeDocuments from "./pages/EIS/EmployeeDocuments";
import EmployeeIDDocs from "./pages/EIS/EmployeeIDDocs";
import EmployeeSalary from "./pages/EIS/EmployeeSalary";
import EmployeeBankDetails from "./pages/EIS/EmployeeBankDetails";
import EmployeeReporting from "./pages/EIS/EmployeeReporting";
import EmployeeExit from "./pages/EIS/EmployeeExit";

import ReportingStructure from "./pages/organization/ReportingStructure";

// Attendance
import ShiftRoster from "./pages/attendance/ShiftRoster";
import AttendanceLogs from "./pages/attendance/AttendanceLogs";
import DailyUpdates from "./pages/attendance/DailyUpdates";
import AttendanceReports from "./pages/attendance/AttendanceReports";
import AttendanceRules from "./pages/attendance/AttendanceRules";
import AttendanceLocations from "./pages/attendance/AttendanceLocations";
import AttendanceDashboard from "./pages/attendance/AttendanceDashboard";
import ODApplications from "./pages/attendance/ODApplications";

// Leave Management
import LeaveLayout from "./pages/leaves/LeaveLayout";

// ✅ PAYROLL
import PayrollLayout from "./pages/payroll/PayrollLayout";
import PayrollDashboard from "./pages/payroll/PayrollDashboard";

// HR Operations & Workforce Management
import HRLayout from "./pages/hr/HRLayout";

// ======================= 🔥 PMS IMPORTS =======================
import PMSManagement from "./pages/pms/pmsmanagement";

// ======================= 🔥 TRAINING IMPORTS =======================
import TrainingLayout from "./pages/training/TrainingLayout";
import TrainingPrograms from "./pages/training/TrainingPrograms";
import TrainingCalendar from "./pages/training/TrainingCalendar";
import TrainingRequests from "./pages/training/TrainingRequests";
import TrainingAttendance from "./pages/training/TrainingAttendance";
import TrainingCertificates from "./pages/training/TrainingCertificates";
import TrainingApplications from "./pages/training/TrainingApplications";
import TrainingProgramApplication from "./pages/training/TrainingProgramApplication";

// ======================= 🔥 COMPLIANCE IMPORTS =======================
import ComplianceLayout from "./pages/compliance/ComplianceLayout";
import Statutory from "./pages/compliance/Statutory";
import LabourRegister from "./pages/compliance/LabourRegister";
import LeaveCompliance from "./pages/compliance/LeaveCompliance";
import NABHCompliance from "./pages/compliance/NABHCompliance";

// ======================= 🔥 ANALYTICS IMPORTS =======================
import AttritionDashboard from "./pages/analytics/AttritionDashboard";
import ManpowerComplianceDashboard from "./pages/analytics/ManpowerComplianceDashboard";

// ======================= 🔥 EXIT MANAGEMENT IMPORTS =======================
import ExitLayout from "./pages/exit/ExitLayout";

// ======================= 🔥 CUSTOMIZATION IMPORTS =======================
import Customization from "./pages/Customization";

// ======================= 🔥 NEW RECRUITMENT FEATURES =======================
import LocumConsultants from "./pages/recruitment/LocumConsultants";
import ProbationTracking from "./pages/recruitment/ProbationTracking";

function App() {
  // Load saved theme colors on app startup
  useEffect(() => {
    const applyColors = (colors) => {
      Object.entries(colors).forEach(([key, value]) => {
        if (key === 'primaryColor') {
          document.documentElement.style.setProperty('--primary-color', value);
          document.documentElement.style.setProperty('--primary-bg', value);
          const num = parseInt(value.replace('#', ''), 16);
          const amt = Math.round(2.55 * -20);
          const R = (num >> 16) + amt;
          const G = (num >> 8 & 0x00FF) + amt;
          const B = (num & 0x0000FF) + amt;
          const hoverColor = '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
          document.documentElement.style.setProperty('--primary-hover', hoverColor);
        } else if (key === 'secondaryColor') {
          document.documentElement.style.setProperty('--secondary-color', value);
          document.documentElement.style.setProperty('--text-secondary', value);
          document.documentElement.style.setProperty('--muted-text', value);
        } else if (key === 'sidebarBg') {
          document.documentElement.style.setProperty('--sidebar-bg', value);
        } else if (key === 'headerFooterBg') {
          document.documentElement.style.setProperty('--header-bg', value);
          document.documentElement.style.setProperty('--footer-bg', value);
        } else if (key === 'sidebarTextColor') {
          document.documentElement.style.setProperty('--sidebar-text-color', value);
        } else if (key === 'headerTextColor') {
          document.documentElement.style.setProperty('--header-text-color', value);
          document.documentElement.style.setProperty('--text-color', value);
          document.documentElement.style.setProperty('--text-primary', value);
        }
      });
    };

    const loadColorsFromBackend = async () => {
      try {
        const response = await api.get('/api/organization/branding');
        
        if (response.data && response.data.primary_color) {
          const colors = {
            primaryColor: response.data.primary_color,
            secondaryColor: response.data.secondary_color,
            sidebarBg: response.data.sidebar_bg,
            headerFooterBg: response.data.header_footer_bg,
            sidebarTextColor: response.data.sidebar_text_color,
            headerTextColor: response.data.header_text_color
          };
          
          // Apply colors to CSS variables
          applyColors(colors);
        }
      } catch (error) {
        console.log('No branding data found in database');
      }
    };
    
    // Only load colors if user is authenticated
    if (localStorage.getItem('access_token')) {
      loadColorsFromBackend();
    }

    // Listen for theme updates from customization page
    const handleThemeUpdate = (event) => {
      applyColors(event.detail);
    };

    window.addEventListener('theme-updated', handleThemeUpdate);

    return () => {
      window.removeEventListener('theme-updated', handleThemeUpdate);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        {/* DEFAULT ROUTE */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* USER MANAGEMENT */}
        <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute><Roles /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />

        {/* ORGANIZATION SETUP */}
        <Route path="/organization" element={<ProtectedRoute><OrganizationLayout /></ProtectedRoute>}>
          <Route index element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
          <Route path="company-profile" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
          <Route path="branch" element={<ProtectedRoute><Branch /></ProtectedRoute>} />

          <Route path="holiday-calender" element={<ProtectedRoute><HolidayCalender /></ProtectedRoute>} />
          <Route path="reporting" element={<ProtectedRoute><ReportingStructure /></ProtectedRoute>} />
        </Route>

        {/* RECRUITMENT */}
        <Route path="/recruitment-master" element={<ProtectedRoute><MasterDashboard /></ProtectedRoute>} />
        <Route path="/job-requisition" element={<ProtectedRoute><JobRequisition /></ProtectedRoute>} />
        <Route path="/recruitment-setup" element={<ProtectedRoute><RecruitmentSetup /></ProtectedRoute>} />
        <Route path="/ats" element={<ProtectedRoute><ATS /></ProtectedRoute>} />
        <Route path="/offers" element={<ProtectedRoute><Offer /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/screening" element={<ProtectedRoute><CandidateScreening /></ProtectedRoute>} />
        <Route path="/locum-consultants" element={<ProtectedRoute><LocumConsultants /></ProtectedRoute>} />
        <Route path="/probation-tracking" element={<ProtectedRoute><ProbationTracking /></ProtectedRoute>} />
        <Route path="/employee-list" element={<ProtectedRoute><EmployeeListPage /></ProtectedRoute>} />

        {/* EIS */}
        <Route path="/eis" element={<ProtectedRoute><EmployeeListPage /></ProtectedRoute>} />
        <Route path="/eis/:id" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
        <Route path="/eis/:id/education" element={<ProtectedRoute><EmployeeEducation /></ProtectedRoute>} />
        <Route path="/eis/:id/experience" element={<ProtectedRoute><EmployeeExperience /></ProtectedRoute>} />
        <Route path="/eis/:id/skills" element={<ProtectedRoute><EmployeeSkills /></ProtectedRoute>} />
        <Route path="/eis/:id/certifications" element={<ProtectedRoute><EmployeeCertifications /></ProtectedRoute>} />
        <Route path="/eis/:id/family" element={<ProtectedRoute><EmployeeFamily /></ProtectedRoute>} />
        <Route path="/eis/:id/medical" element={<ProtectedRoute><EmployeeMedical /></ProtectedRoute>} />
        <Route path="/eis/:id/documents" element={<ProtectedRoute><EmployeeDocuments /></ProtectedRoute>} />
        <Route path="/eis/:id/id-docs" element={<ProtectedRoute><EmployeeIDDocs /></ProtectedRoute>} />
        <Route path="/eis/:id/salary" element={<ProtectedRoute><EmployeeSalary /></ProtectedRoute>} />
        <Route path="/eis/:id/bank-details" element={<ProtectedRoute><EmployeeBankDetails /></ProtectedRoute>} />
        <Route path="/eis/:id/reporting" element={<ProtectedRoute><EmployeeReporting /></ProtectedRoute>} />
        <Route path="/eis/:id/exit" element={<ProtectedRoute><EmployeeExit /></ProtectedRoute>} />

        {/* ATTENDANCE */}
        <Route path="/attendance/dashboard" element={<ProtectedRoute><AttendanceDashboard /></ProtectedRoute>} />
        <Route path="/shift-roster" element={<ProtectedRoute><ShiftRoster /></ProtectedRoute>} />
        <Route path="/attendance/logs" element={<ProtectedRoute><AttendanceLogs /></ProtectedRoute>} />
        <Route path="/attendance/daily-updates" element={<ProtectedRoute><DailyUpdates /></ProtectedRoute>} />
        <Route path="/attendance/reports" element={<ProtectedRoute><AttendanceReports /></ProtectedRoute>} />
        <Route path="/attendance/rules" element={<ProtectedRoute><AttendanceRules /></ProtectedRoute>} />
        <Route path="/attendance/locations" element={<ProtectedRoute><AttendanceLocations /></ProtectedRoute>} />

        {/* LEAVE */}
        <Route path="/leave" element={<ProtectedRoute><LeaveLayout /></ProtectedRoute>} />

        {/* PAYROLL */}
        <Route path="/payroll/dashboard" element={<ProtectedRoute><PayrollDashboard /></ProtectedRoute>} />
        <Route path="/payroll" element={<ProtectedRoute><PayrollLayout /></ProtectedRoute>} />

        {/* HR OPERATIONS */}
        <Route path="/hr" element={<ProtectedRoute><HRLayout /></ProtectedRoute>} />

        {/* PMS */}
        <Route path="/pms" element={<ProtectedRoute><PMSManagement /></ProtectedRoute>} />

        {/* TRAINING */}
        <Route path="/training" element={<ProtectedRoute><TrainingLayout /></ProtectedRoute>}>
          <Route index element={<ProtectedRoute><TrainingPrograms /></ProtectedRoute>} />
          <Route path="programs" element={<ProtectedRoute><TrainingPrograms /></ProtectedRoute>} />
          <Route path="programs/:programId/applications" element={<ProtectedRoute><TrainingApplications /></ProtectedRoute>} />
          <Route path="calendar" element={<ProtectedRoute><TrainingCalendar /></ProtectedRoute>} />
          <Route path="requests" element={<ProtectedRoute><TrainingRequests /></ProtectedRoute>} />
          <Route path="attendance" element={<ProtectedRoute><TrainingAttendance /></ProtectedRoute>} />
          <Route path="certificates" element={<ProtectedRoute><TrainingCertificates /></ProtectedRoute>} />
        </Route>

        {/* ======================= 🔥 COMPLIANCE MODULE ======================= */}
        <Route path="/compliance" element={<ProtectedRoute><ComplianceLayout /></ProtectedRoute>}>
          <Route index element={<ProtectedRoute><Statutory /></ProtectedRoute>} />
          <Route path="statutory" element={<ProtectedRoute><Statutory /></ProtectedRoute>} />
          <Route path="labour" element={<ProtectedRoute><LabourRegister /></ProtectedRoute>} />
          <Route path="leave" element={<ProtectedRoute><LeaveCompliance /></ProtectedRoute>} />
          <Route path="nabh" element={<ProtectedRoute><NABHCompliance /></ProtectedRoute>} />
        </Route>

        {/* ======================= 🔥 ANALYTICS MODULE ======================= */}
        <Route path="/analytics/attrition" element={<ProtectedRoute><AttritionDashboard /></ProtectedRoute>} />
        <Route path="/analytics/manpower" element={<ProtectedRoute><ManpowerComplianceDashboard /></ProtectedRoute>} />

        {/* ======================= 🔥 EXIT MANAGEMENT MODULE ======================= */}
        <Route path="/exit" element={<ProtectedRoute><ExitLayout /></ProtectedRoute>} />

        {/* ======================= 🔥 CUSTOMIZATION MODULE ======================= */}
        <Route path="/customization" element={<ProtectedRoute><Customization /></ProtectedRoute>} />

        {/* PUBLIC */}
        <Route path="/apply/:jobId" element={<JobApply />} />
        <Route path="/training/program/:programId" element={<TrainingProgramApplication />} />
        <Route path="/document-upload/:token" element={<DocumentUpload />} />
        <Route path="/register-hospital" element={<HospitalRegister />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
