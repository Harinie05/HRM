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
        <Route path="/recruitment-setup" element={<ProtectedRoute><RecruitmentSetup /></ProtectedRoute>} />
       
        {/* ----------------------------------------
           SECRET HOSPITAL REGISTER PAGE
        ----------------------------------------- */}
        <Route path="/register-hospital" element={<HospitalRegister />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
