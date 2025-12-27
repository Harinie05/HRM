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
    <div className="flex h-screen" style={{ backgroundColor: 'var(--content-bg, #f8fafc)' }}>
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
        
        <main className="flex-1 overflow-auto pt-14 sm:pt-16 pb-0" style={{ backgroundColor: 'var(--content-bg, #f8fafc)' }}>
          {/* Breadcrumb */}
          {breadcrumb && (
            <div className="px-4 sm:px-6 py-3" style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
              <nav className="text-sm font-medium" style={{ color: 'var(--muted-text, #64748b)' }}>
                {breadcrumb}
              </nav>
            </div>
          )}
          
          {/* Page Header */}
          {title && (
            <div className="px-4 sm:px-6 py-4 sm:py-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2" style={{ color: 'var(--text-color, #1e293b)' }}>{title}</h1>
              {subtitle && (
                <p className="text-sm" style={{ color: 'var(--muted-text, #64748b)' }}>{subtitle}</p>
              )}
              
              {/* Stats Section */}
              {stats && (
                <div className="mt-4 rounded-lg p-4" style={{ backgroundColor: 'var(--content-bg, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold uppercase tracking-wide text-xs" style={{ color: 'var(--primary-color, #2862e9)' }}>
                        {stats.label}
                      </h3>
                      <div className="flex items-center mt-1">
                        <span className="text-xl sm:text-2xl font-bold mr-2" style={{ color: 'var(--primary-color, #2862e9)' }}>
                          {stats.count}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--muted-text, #64748b)' }}>
                          {stats.description}
                        </span>
                      </div>
                    </div>
                    {stats.action && (
                      <button className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors w-full sm:w-auto" style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}>
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
