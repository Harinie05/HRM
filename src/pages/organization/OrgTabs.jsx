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
    <div className="w-full bg-white border-b">
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
    </div>
  );
}
