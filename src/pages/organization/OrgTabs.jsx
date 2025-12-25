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
    <div className="w-full bg-white border-b px-4 flex space-x-6">
      {tabs.map((item) => (
        <button
          key={item}
          onClick={() => setTab(item)}
          className={`py-4 text-sm ${
            tab === item
              ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
