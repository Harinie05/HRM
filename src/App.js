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
// ⭐ Added for authentication protection
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
import ShiftRoster from "./pages/attendance/ShiftRoster";



function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ----------------------------------------
           DEFAULT ROUTE → LOGIN
        ----------------------------------------- */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* ----------------------------------------
           DASHBOARD (After Login)
        ----------------------------------------- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ----------------------------------------
           USER MANAGEMENT
        ----------------------------------------- */}
        <Route
          path="/departments"
          element={
            <ProtectedRoute>
              <Departments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <Roles />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* ----------------------------------------
           ORGANIZATION SETUP MODULE
        ----------------------------------------- */}
        <Route
          path="/organization"
          element={
            <ProtectedRoute>
              <OrganizationLayout />
            </ProtectedRoute>
          }
        >
          {/* DEFAULT PAGE → COMPANY PROFILE */}
          <Route
            index
            element={
              <ProtectedRoute>
                <CompanyProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="company-profile"
            element={
              <ProtectedRoute>
                <CompanyProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="branch"
            element={
              <ProtectedRoute>
                <Branch />
              </ProtectedRoute>
            }
          />
         <Route
            path="grade"
            element={
              <ProtectedRoute>
                <GradePayStructure />
              </ProtectedRoute>
            }
          />
           <Route path="holiday-calender" element={<ProtectedRoute> <HolidayCalender /></ProtectedRoute>     } />
         <Route path="policy-setup" element={<ProtectedRoute> <PolicySetup /></ProtectedRoute>     } />
         <Route path="reporting" element={<ProtectedRoute> <ReportingStructure /></ProtectedRoute>     } />
        </Route>
       

        {/* ----------------------------------------
           RECRUITMENT & ONBOARDING MODULE
        ----------------------------------------- */}
        <Route path="/recruitment-master" element={<ProtectedRoute><MasterDashboard /></ProtectedRoute>} />
        <Route path="/job-requisition" element={<ProtectedRoute><JobRequisition /></ProtectedRoute>} />
        <Route path="/recruitment-setup" element={<ProtectedRoute><RecruitmentSetup /></ProtectedRoute>} />
        <Route path="/ats" element={<ProtectedRoute><ATS /></ProtectedRoute>} />
        <Route path="/offers" element={<ProtectedRoute><Offer /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/screening" element={<ProtectedRoute><CandidateScreening /></ProtectedRoute>} />
        {/* EIS - Employee Information System */}
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

        {/* ----------------------------------------
           ATTENDANCE & BIOMETRIC MODULE
        ----------------------------------------- */}
        <Route path="/shift-roster" element={<ProtectedRoute><ShiftRoster /></ProtectedRoute>} />

        {/* ----------------------------------------
           PUBLIC JOB APPLICATION PAGE
        ----------------------------------------- */}
        <Route path="/apply/:jobId" element={<JobApply />} />
        
        {/* ----------------------------------------
           PUBLIC DOCUMENT UPLOAD PAGE
        ----------------------------------------- */}
        <Route path="/document-upload/:token" element={<DocumentUpload />} />
        
        {/* ----------------------------------------
           SECRET HOSPITAL REGISTER PAGE
        ----------------------------------------- */}
        <Route path="/register-hospital" element={<HospitalRegister />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
