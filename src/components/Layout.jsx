import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function Layout({ children, title, subtitle, stats, breadcrumb }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out`}>
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={toggleSidebar}
          isMobile={true}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          isSidebarCollapsed={isSidebarCollapsed} 
          onMobileMenuToggle={toggleMobileMenu}
        />
        
        <main className="flex-1 overflow-auto bg-gray-50 pt-14 sm:pt-16 pb-0">
          {/* Breadcrumb */}
          {breadcrumb && (
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
              <nav className="text-sm text-gray-600 font-medium">
                {breadcrumb}
              </nav>
            </div>
          )}
          
          {/* Page Header */}
          {title && (
            <div className="bg-white px-4 sm:px-6 py-4 sm:py-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{title}</h1>
              {subtitle && (
                <p className="text-gray-600 text-sm">{subtitle}</p>
              )}
              
              {/* Stats Section */}
              {stats && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto">
                        {stats.action}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Page Content */}
          <div className="flex-1 min-h-0">
            {children}
          </div>
          
          {/* Footer */}
          <Footer />
        </main>
      </div>
    </div>
  );
}