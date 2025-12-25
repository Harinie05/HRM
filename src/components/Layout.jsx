import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout({ children, title, subtitle, stats, breadcrumb }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      
      <div className="flex-1 flex flex-col">
        <Header isSidebarCollapsed={isSidebarCollapsed} />
        
        <main className="flex-1 overflow-auto bg-gray-50 pt-20">
          {/* Breadcrumb */}
          {breadcrumb && (
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <nav className="text-sm text-gray-600 font-medium">
                {breadcrumb}
              </nav>
            </div>
          )}
          
          {/* Page Header */}
          {title && (
            <div className="bg-white px-6 py-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
              {subtitle && (
                <p className="text-gray-600 text-sm">{subtitle}</p>
              )}
              
              {/* Stats Section */}
              {stats && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900 uppercase tracking-wide text-xs">
                        {stats.label}
                      </h3>
                      <div className="flex items-center mt-1">
                        <span className="text-2xl font-bold text-blue-900 mr-2">
                          {stats.count}
                        </span>
                        <span className="text-sm text-blue-700">
                          {stats.description}
                        </span>
                      </div>
                    </div>
                    {stats.action && (
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        {stats.action}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Page Content */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}