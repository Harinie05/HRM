export default function OrgTabs({ tab, setTab }) {
  const tabs = [
    "Company Profile",
    "Branch / Unit",
    "Department",
    "Designation",
    "Reporting Structure",
    "Shifts & Roster",
    "Grades / Pay Structure",
    "Holiday Calendar",
    "Rules & Policies"
  ];

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
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`py-4 text-sm whitespace-nowrap flex-shrink-0 ${
              tab === item
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "text-muted hover:text-secondary"
            }`}
          >
            {item}
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
