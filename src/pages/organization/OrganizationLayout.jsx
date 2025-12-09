import { useState } from "react";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import OrgTabs from "./OrgTabs";

// Pages
import CompanyProfile from "./CompanyProfile";
import Branch from "./Branch";
import DepartmentList from "./DepartmentList";
import DesignationList from "./Designation";
import Shifts from "./Shifts";
import GradePayStructure from "./GradePayStructure";
import HolidayCalender from "./HolidayCalender";
import PolicySetup from "./PolicySetup";

export default function OrganizationLayout() {
  const [tab, setTab] = useState("Company Profile");

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">

      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <Header />

        {/* TOP TABS */}
        <OrgTabs tab={tab} setTab={setTab} />

        {/* INNER PAGE CONTENT */}
        <div className="p-6">

          {tab === "Company Profile" && <CompanyProfile />}

          {tab === "Branch / Unit" && <Branch />}

          {tab === "Department" && <DepartmentList />}

          {tab === "Designation" && <DesignationList />}
          {tab === "Shifts" && <Shifts /> }

          {/* Future Sections */}
          {tab === "Reporting Structure" && (
            <div className="text-gray-500">Reporting Structure Coming Soon...</div>
          )}

          {tab === "Grades / Pay Structure" && <GradePayStructure />}

          {tab === "Holiday Calendar" &&  <HolidayCalender/>}
          

          {tab === "Policies" && <PolicySetup/>}

        </div>
      </div>
    </div>
  );
}
