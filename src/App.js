import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Departments from "./pages/Department";
import Roles from "./pages/Roles";
import HospitalRegister from "./pages/HospitalRegister";
import Users from "./pages/User";

// Organization Setup Module
import OrganizationLayout from "./pages/organization/OrganizationLayout";
import CompanyProfile from "./pages/organization/CompanyProfile";
import Branch from "./pages/organization/Branch";
import GradePayStructure from "./pages/organization/GradePayStructure";
import HolidayCalender from "./pages/organization/HolidayCalender";

// ⭐ Authentication protection
import ProtectedRoute from "./components/ProctectedRoute";

import PolicySetup from "./pages/organization/PolicySetup";
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
import Regularization from "./pages/attendance/Regularization";
import AttendanceReports from "./pages/attendance/AttendanceReports";
import AttendanceRules from "./pages/attendance/AttendanceRules";
import AttendanceLocations from "./pages/attendance/AttendanceLocations";

// Leave Management
import LeaveLayout from "./pages/leaves/LeaveLayout";

// ✅ PAYROLL
import PayrollLayout from "./pages/payroll/PayrollLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* DEFAULT ROUTE */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* DASHBOARD */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* USER MANAGEMENT */}
        <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute><Roles /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />

        {/* ORGANIZATION SETUP */}
        <Route path="/organization" element={<ProtectedRoute><OrganizationLayout /></ProtectedRoute>}>
          <Route index element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
          <Route path="company-profile" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
          <Route path="branch" element={<ProtectedRoute><Branch /></ProtectedRoute>} />
          <Route path="grade" element={<ProtectedRoute><GradePayStructure /></ProtectedRoute>} />
          <Route path="holiday-calender" element={<ProtectedRoute><HolidayCalender /></ProtectedRoute>} />
          <Route path="policy-setup" element={<ProtectedRoute><PolicySetup /></ProtectedRoute>} />
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
        <Route path="/shift-roster" element={<ProtectedRoute><ShiftRoster /></ProtectedRoute>} />
        <Route path="/attendance/logs" element={<ProtectedRoute><AttendanceLogs /></ProtectedRoute>} />
        <Route path="/attendance/regularization" element={<ProtectedRoute><Regularization /></ProtectedRoute>} />
        <Route path="/attendance/reports" element={<ProtectedRoute><AttendanceReports /></ProtectedRoute>} />
        <Route path="/attendance/rules" element={<ProtectedRoute><AttendanceRules /></ProtectedRoute>} />
        <Route path="/attendance/locations" element={<ProtectedRoute><AttendanceLocations /></ProtectedRoute>} />

        {/* LEAVE */}
        <Route path="/leave" element={<ProtectedRoute><LeaveLayout /></ProtectedRoute>} />

        {/* ✅ PAYROLL */}
        <Route path="/payroll" element={<ProtectedRoute><PayrollLayout /></ProtectedRoute>} />

        {/* PUBLIC */}
        <Route path="/apply/:jobId" element={<JobApply />} />
        <Route path="/document-upload/:token" element={<DocumentUpload />} />
        <Route path="/register-hospital" element={<HospitalRegister />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
