import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import OrgTabs from "./OrgTabs";
import { Outlet } from "react-router-dom";

export default function OrganizationLayout() {
  return (
    <div className="flex h-screen w-full bg-gray-100">

      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* RIGHT CONTENT SIDE */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <Header />

        {/* MAIN CONTENT AREA */}
        <div className="p-6 overflow-auto">

          {/* Breadcrumb */}
          <p className="text-sm text-gray-500">Admin · Organization Setup</p>

          {/* Title */}
          <h1 className="text-2xl font-bold mt-1">Organization Setup</h1>
          <p className="text-gray-600 mt-1">
            Manage company profile, branches, departments & more.
          </p>

          {/* TAB BAR */}
          <div className="mt-6">
            <OrgTabs />
          </div>

          {/* Page Content Box */}
          <div className="bg-white shadow-md rounded-xl p-6 mt-6">
            <Outlet />
          </div>

        </div>
      </div>
    </div>
  );
}
