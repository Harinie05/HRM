import { useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import ComplianceTabs from "./ComplianceTabs";

// Pages
import Statutory from "./Statutory";
import LabourRegister from "./LabourRegister";
import LeaveCompliance from "./LeaveCompliance";
import NABHCompliance from "./NABHCompliance";

export default function ComplianceLayout() {
  const location = useLocation();

  // ✅ DEFAULT TAB IS "Statutory Rules"
  const initialTab = location.state?.tab || "Statutory Rules";

  const [tab, setTab] = useState(initialTab);

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">

      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <Header />

        {/* TOP TABS */}
        <ComplianceTabs tab={tab} setTab={setTab} />

        {/* INNER PAGE CONTENT */}
        <div className="p-6">

          {tab === "Statutory Rules" && <Statutory />}
          {tab === "Labour Register" && <LabourRegister />}
          {tab === "Leave Compliance" && <LeaveCompliance />}
          {tab === "NABH Compliance" && <NABHCompliance />}
        </div>
      </div>
    </div>
  );
}
