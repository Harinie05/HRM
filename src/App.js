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
/*import Department from "./pages/organization/Department";
import Designation from "./pages/organization/Designation";
import Reporting from "./pages/organization/Reporting";
import Shifts from "./pages/organization/Shifts";
import Grades from "./pages/organization/Grades";
import Holidays from "./pages/organization/Holidays";
import Policies from "./pages/organization/Policies";*/

// ⭐ Added for authentication protection
import ProtectedRoute from "./components/ProctectedRoute";

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

          {/* <Route path="department" element={<Department />} />
          <Route path="designation" element={<Designation />} />
          <Route path="reporting" element={<Reporting />} />
          <Route path="shifts" element={<Shifts />} />
          <Route path="grades" element={<Grades />} />
          <Route path="holidays" element={<Holidays />} />
          <Route path="policies" element={<Policies />} /> */}
        </Route>

        {/* ----------------------------------------
           SECRET HOSPITAL REGISTER PAGE
        ----------------------------------------- */}
        <Route path="/register-hospital" element={<HospitalRegister />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
