import { useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import ExitTabs from "./ExitTabs";

// Pages
import ResignationTracking from "./ResignationTrackingEnhanced";
import ClearanceWorkflow from "./ClearanceWorkflow";
import SettlementDocuments from "./SettlementDocuments";

export default function ExitLayout() {
  const location = useLocation();

  // ✅ DEFAULT TAB IS "Resignation & Notice"
  const initialTab = location.state?.tab || "Resignation & Notice";

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
        <ExitTabs tab={tab} setTab={setTab} />

        {/* INNER PAGE CONTENT */}
        <div className="p-6">

          {tab === "Resignation & Notice" && <ResignationTracking />}
          {tab === "Clearance & Exit Process" && <ClearanceWorkflow />}
          {tab === "F&F Settlement & Documents" && <SettlementDocuments />}
        </div>
      </div>
    </div>
  );
}