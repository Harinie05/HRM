import { useState } from "react";
import { useLocation } from "react-router-dom";
import { BookOpen, Plus } from "lucide-react";
import Layout from "../../components/Layout";

// Pages
import TrainingPrograms from "./TrainingPrograms";
import TrainingCalendar from "./TrainingCalendar";
import TrainingRequests from "./TrainingRequests";
import TrainingAttendance from "./TrainingAttendance";
import TrainingCertificates from "./TrainingCertificates";

export default function TrainingLayout() {
  const location = useLocation();
  
  const initialTab = location.state?.tab || "Training Programs";
  const [tab, setTab] = useState(initialTab);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const tabs = [
    "Training Programs",
    "Training Calendar", 
    "Training Requests",
    "Attendance & Assessment",
    "Certificates"
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with gradient background */}
        <div className="bg-white rounded-3xl border-2 border-black shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-black">
                  <BookOpen className="w-8 h-8 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Training & Development</h1>
                  <p className="text-gray-600 text-base sm:text-lg mb-1">Manage training programs, schedules, and employee development</p>
                  <p className="text-gray-500 text-sm">Employee Learning & Development</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <span className="text-sm font-medium">{tabs.length} Modules</span>
                </div>
                <p className="text-lg font-bold text-gray-900">Training components</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black overflow-hidden">
            {/* Content */}
            <div className="p-4 sm:p-6">
              {/* Tab Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
                <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto border border-black">
                  {tabs.map((tabName) => (
                    <button
                      key={tabName}
                      onClick={() => setTab(tabName)}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        tab === tabName
                          ? "bg-white text-gray-900 shadow-sm border border-gray-300"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tabName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              {tab === "Training Programs" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Training Programs</h2>
                      <p className="text-sm text-gray-600">Manage and organize training programs and courses</p>
                    </div>
                  </div>
                  <TrainingPrograms />
                </div>
              )}
              {tab === "Training Calendar" && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Training Calendar</h2>
                      <p className="text-sm text-gray-600">View and schedule training sessions and events</p>
                    </div>
                  </div>
                  <TrainingCalendar />
                </div>
              )}
              {tab === "Training Requests" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">Training Requests</h2>
                        <p className="text-sm text-gray-600">Handle employee training requests and approvals</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowRequestModal(true)}
                      className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-black text-sm sm:text-base"
                    >
                      <Plus size={16} />
                      New Request
                    </button>
                  </div>
                  <TrainingRequests showModal={showRequestModal} setShowModal={setShowRequestModal} />
                </div>
              )}
              {tab === "Attendance & Assessment" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">Attendance & Assessment</h2>
                        <p className="text-sm text-gray-600">Track training attendance and assess performance</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowAttendanceModal(true)}
                      className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-black text-sm sm:text-base"
                    >
                      <Plus size={16} />
                      Mark Attendance
                    </button>
                  </div>
                  <TrainingAttendance showModal={showAttendanceModal} setShowModal={setShowAttendanceModal} />
                </div>
              )}
              {tab === "Certificates" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">Certificates</h2>
                        <p className="text-sm text-gray-600">Manage training certificates and achievements</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowCertificateModal(true)}
                      className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-black text-sm sm:text-base"
                    >
                      <Plus size={16} />
                      Generate Certificate
                    </button>
                  </div>
                  <TrainingCertificates showModal={showCertificateModal} setShowModal={setShowCertificateModal} />
                </div>
              )}
            </div>
          </div>
      </div>
    </Layout>
  );
}
