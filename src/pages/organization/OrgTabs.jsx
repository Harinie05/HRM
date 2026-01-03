import { hasPermission, isAdmin } from "../../utils/permissions";

export default function OrgTabs({ tab, setTab }) {
  // Define all tabs with their permission requirements
  const allTabs = [
    { name: "Company Profile", permission: "view_company_profile" },
    { name: "Branch / Unit", permission: "view_branch" },
    { name: "Department", permission: "view_department" },
    { name: "Designation", permission: "view_designation" },
    { name: "Reporting Structure", permission: "view_reporting_levels" }, // Updated to use new permission
    { name: "Grades / Pay Structure", permission: null }, // No permission check for now
    { name: "Holiday Calendar", permission: "view_holiday" },
    { name: "Rules & Policies", permission: null } // No permission check for now
  ];

  // Filter tabs based on permissions
  const visibleTabs = allTabs.filter(tabItem => {
    if (!tabItem.permission) return true; // Show tabs without permission requirements
    return isAdmin() || hasPermission(tabItem.permission);
  });

  return (
    <div className="w-full bg-white border-b relative">
      <div 
        className="px-4 flex space-x-6 org-tabs-container"
        style={{
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {visibleTabs.map((tabItem) => (
          <button
            key={tabItem.name}
            onClick={() => setTab(tabItem.name)}
            className={`py-4 text-sm whitespace-nowrap flex-shrink-0 ${
              tab === tabItem.name
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "text-muted hover:text-secondary"
            }`}
          >
            {tabItem.name}
          </button>
        ))}
      </div>
      {/* Scroll indicator arrow */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
