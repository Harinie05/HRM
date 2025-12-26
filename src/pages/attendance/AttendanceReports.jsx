import { useState } from "react";
import api from "../../api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function AttendanceReports() {
  const [report, setReport] = useState([]);

  const loadDaily = async () => {
    const res = await api.get("/api/attendance/reports/daily");
    setReport(res.data);
  };

  const loadMonthly = async () => {
    const res = await api.get("/api/attendance/reports/monthly");
    setReport(res.data);
  };

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-6 space-y-6">
          {/* Header with gradient background matching Organization setup */}
          <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Reports</h1>
                  <p className="text-gray-600 text-lg mb-1">Comprehensive attendance analytics and reporting dashboard</p>
                  <p className="text-gray-500 text-sm">Real-time Analytics</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <span className="text-sm font-medium">Live Data</span>
                </div>
                <p className="text-lg font-bold text-gray-900">Analytics Dashboard</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl border border-black p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
              <span className="text-sm text-gray-600">Reports</span>
              <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto scrollbar-hide border border-black" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                <button
                  onClick={loadDaily}
                  className="px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 bg-white text-gray-900 shadow-sm mr-2"
                >
                  Daily Report
                </button>
                <button
                  onClick={loadMonthly}
                  className="px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 text-gray-600 hover:text-gray-900"
                >
                  Monthly Report
                </button>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-3xl shadow-sm border-2 border-black overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Report Data
              </h3>
            </div>
            
            <div className="p-6">
              {report.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No report data</h3>
                  <p className="text-gray-500 mb-6">Click on Daily Report or Monthly Report to generate attendance data</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-black p-6">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto max-h-96">
                    {JSON.stringify(report, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
