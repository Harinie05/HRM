import { NavLink } from "react-router-dom";

export default function PayrollManagement() {
  return (
    <div className="p-6">
      {/* Header */}
      <h2 className="text-xl font-semibold">
        Payroll Management
      </h2>
      <p className="text-gray-600 mb-6">
        Manage salary structures, statutory rules, payroll processing,
        payslips, and compliance reports.
      </p>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-6 text-sm font-medium">
          <NavLink
            to="/payroll/salary-structure"
            className={({ isActive }) =>
              isActive
                ? "border-b-2 border-blue-600 pb-2 text-blue-600"
                : "pb-2 text-gray-600 hover:text-blue-600"
            }
          >
            Salary Structure
          </NavLink>

          <NavLink
            to="/payroll/statutory-rules"
            className={({ isActive }) =>
              isActive
                ? "border-b-2 border-blue-600 pb-2 text-blue-600"
                : "pb-2 text-gray-600 hover:text-blue-600"
            }
          >
            Statutory Rules
          </NavLink>

          <NavLink
            to="/payroll/run"
            className={({ isActive }) =>
              isActive
                ? "border-b-2 border-blue-600 pb-2 text-blue-600"
                : "pb-2 text-gray-600 hover:text-blue-600"
            }
          >
            Payroll Run
          </NavLink>

          <NavLink
            to="/payroll/adjustments"
            className={({ isActive }) =>
              isActive
                ? "border-b-2 border-blue-600 pb-2 text-blue-600"
                : "pb-2 text-gray-600 hover:text-blue-600"
            }
          >
            Adjustments
          </NavLink>

          <NavLink
            to="/payroll/payslips"
            className={({ isActive }) =>
              isActive
                ? "border-b-2 border-blue-600 pb-2 text-blue-600"
                : "pb-2 text-gray-600 hover:text-blue-600"
            }
          >
            Salary Slip & Payment
          </NavLink>

          <NavLink
            to="/payroll/reports"
            className={({ isActive }) =>
              isActive
                ? "border-b-2 border-blue-600 pb-2 text-blue-600"
                : "pb-2 text-gray-600 hover:text-blue-600"
            }
          >
            Reports & Compliance
          </NavLink>
        </div>
      </div>

      {/* Empty State / Info */}
      <div className="border rounded p-6 bg-gray-50 text-gray-600">
        Select a section above to manage payroll operations.
      </div>
    </div>
  );
}
