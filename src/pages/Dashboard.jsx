import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function Dashboard() {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-[#F7F9FB] min-h-screen">
        <Header />

        <div className="p-6">

          <h1 className="text-3xl font-bold text-[#0D3B66] mb-5">
            HRM Dashboard
          </h1>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
              <p className="text-gray-500">TOTAL EMPLOYEES</p>
              <p className="text-3xl font-bold">0</p>
            </div>

            <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
              <p className="text-gray-500">DEPARTMENTS</p>
              <p className="text-3xl font-bold">0</p>
            </div>

            <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
              <p className="text-gray-500">ACTIVE USERS</p>
              <p className="text-3xl font-bold">0</p>
            </div>

            <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
              <p className="text-gray-500">PENDING APPROVALS</p>
              <p className="text-3xl font-bold">0</p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
