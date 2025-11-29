import { NavLink } from "react-router-dom";

const tabs = [
  { label: "Company Profile", path: "company-profile" },
  { label: "Branch / Unit", path: "branch" },
  { label: "Department", path: "department" },
  { label: "Designation", path: "designation" },
  { label: "Reporting Structure", path: "reporting" },
  { label: "Shifts", path: "shifts" },
  { label: "Grades / Pay Structure", path: "grades" },
  { label: "Holiday Calendar", path: "holidays" },
  { label: "Policies", path: "policies" },
];

export default function OrgTabs() {
  return (
    <div className="w-full bg-white border-b flex space-x-6 px-4">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `py-4 text-sm ${
              isActive
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
