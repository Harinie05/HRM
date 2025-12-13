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
