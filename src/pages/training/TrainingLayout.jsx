import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  Users, 
  Award 
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function TrainingLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname;
    if (path.includes('programs')) return 'programs';
    if (path.includes('calendar')) return 'calendar';
    if (path.includes('requests')) return 'requests';
    if (path.includes('attendance')) return 'attendance';
    if (path.includes('certificates')) return 'certificates';
    return 'programs';
  });

  const tabs = [
    {
      id: 'programs',
      label: 'Training Programs',
      icon: BookOpen,
      path: '/training/programs'
    },
    {
      id: 'calendar',
      label: 'Training Calendar',
      icon: Calendar,
      path: '/training/calendar'
    },
    {
      id: 'requests',
      label: 'Training Requests',
      icon: FileText,
      path: '/training/requests'
    },
    {
      id: 'attendance',
      label: 'Attendance & Assessment',
      icon: Users,
      path: '/training/attendance'
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: Award,
      path: '/training/certificates'
    }
  ];

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen">
      {/* SIDEBAR */}
      <Sidebar />
      
      {/* CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <Header />
        
        {/* TOP TABS */}
        <div className="bg-white border-b border-gray-200 px-6 pt-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Training & Development</h1>
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* INNER PAGE CONTENT */}
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}