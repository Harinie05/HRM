export default function ComplianceTabs({ tab, setTab }) {
  const tabs = [
    "Statutory Rules",
    "Labour Register", 
    "Leave Compliance",
    "NABH Compliance"
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
              : "text-muted hover:text-secondary"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
