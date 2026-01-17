import React, { useEffect } from 'react';
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, Users, Calendar, TrendingUp } from 'lucide-react';
import useToast from '../../utils/useToast';
import Toast from '../../components/Toast';
import api from '../../api';

const ComplianceDashboard = () => {
  const { toast, showToast, hideToast } = useToast();

  // Fetch branding colors
  useEffect(() => {
    const fetchBrandingColors = async () => {
      try {
        const tenantCode = localStorage.getItem('tenant_code');
        if (tenantCode) {
          const response = await api.get(`/auth/branding/${tenantCode}`);
          document.documentElement.style.setProperty('--primary-color', response.data.primary_color || '#2862e9');
          document.documentElement.style.setProperty('--secondary-color', response.data.secondary_color || '#474e71');
        }
      } catch (error) {
        console.error('Error fetching branding colors:', error);
      }
    };
    fetchBrandingColors();
  }, []);

  const handleTakeAction = () => {
    showToast('Action initiated successfully!', 'success');
  };

  const handleUpdateNow = () => {
    showToast('Update completed successfully!', 'success');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border shadow-sm p-4 sm:p-6" style={{
        background: `linear-gradient(to right, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}10, ${getComputedStyle(document.documentElement).getPropertyValue('--secondary-color') || '#474e71'}10)`,
        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
      }}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{
            backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
          }}>
            <Shield className="h-5 w-5 sm:h-6 sm:w-6" style={{
              color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
            }} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Compliance Dashboard</h1>
            <p className="text-gray-600 text-xs sm:text-sm mb-1">Monitor & manage organizational compliance</p>
            <p className="text-gray-500 text-xs hidden sm:block">Compliance Management</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all duration-200" style={{
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
        }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Overall Compliance</p>
              <p className="text-2xl font-bold text-gray-900">95%</p>
              <p className="text-gray-400 text-xs mt-1">Excellent status</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all duration-200" style={{
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
        }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Active Policies</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-gray-400 text-xs mt-1">In effect</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all duration-200" style={{
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
        }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Pending Actions</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
              <p className="text-gray-400 text-xs mt-1">Requires attention</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all duration-200" style={{
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
        }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Overdue Items</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
              <p className="text-gray-400 text-xs mt-1">Immediate action</p>
            </div>
            <div className="p-3 rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Compliance */}
      <div className="bg-white rounded-xl shadow-sm border p-6" style={{
        border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}`
      }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{
            backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}20`
          }}>
            <FileText className="h-5 w-5" style={{
              color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'
            }} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Statutory Compliance Status</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border-0 rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">PF Compliance</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Compliant</span>
            </div>
            <div className="text-sm text-secondary">Last filed: Dec 2024</div>
            <div className="text-sm text-secondary">Next due: Jan 15, 2025</div>
          </div>
          <div className="p-4 border-0 rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">ESI Compliance</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Compliant</span>
            </div>
            <div className="text-sm text-secondary">Last filed: Dec 2024</div>
            <div className="text-sm text-secondary">Next due: Jan 15, 2025</div>
          </div>
          <div className="p-4 border-0 rounded-xl hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Professional Tax</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Due Soon</span>
            </div>
            <div className="text-sm text-secondary">Last filed: Nov 2024</div>
            <div className="text-sm text-secondary">Next due: Jan 7, 2025</div>
          </div>
        </div>
      </div>

      {/* Labour Law Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)', border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}` }}>
          <h3 className="text-lg font-semibold mb-4">Labour Law Registers</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Muster Roll</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Updated</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Wage Register</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Updated</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Overtime Register</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Pending</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Leave Register</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Updated</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)', border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}` }}>
          <h3 className="text-lg font-semibold mb-4">NABH Compliance (Healthcare)</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Staff Qualification Verification</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">98%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Medical Fitness</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">95%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Fire Safety Training</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Performance Monitoring</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">92%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Calendar */}
      <div className="bg-white rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)', border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}` }}>
        <h3 className="text-lg font-semibold mb-4">Upcoming Compliance Deadlines</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border-l-4 border-red-500 bg-red-50">
            <div>
              <div className="font-semibold text-red-800">Professional Tax Return</div>
              <div className="text-sm text-red-600">Due: January 7, 2025</div>
            </div>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Overdue</span>
          </div>
          <div className="flex items-center justify-between p-3 border-l-4 border-yellow-500 bg-yellow-50">
            <div>
              <div className="font-semibold text-yellow-800">PF Monthly Return</div>
              <div className="text-sm text-yellow-600">Due: January 15, 2025</div>
            </div>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Due Soon</span>
          </div>
          <div className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50">
            <div>
              <div className="font-semibold text-blue-800">ESI Monthly Return</div>
              <div className="text-sm text-blue-600">Due: January 15, 2025</div>
            </div>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Upcoming</span>
          </div>
          <div className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-green-50">
            <div>
              <div className="font-semibold text-green-800">Annual Labour Return</div>
              <div className="text-sm text-green-600">Due: March 31, 2025</div>
            </div>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">On Track</span>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-white rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)', border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4575b5'}` }}>
        <h3 className="text-lg font-semibold mb-4">Immediate Action Required</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border-l-4 border-red-500 bg-red-50">
            <div className="font-semibold text-red-800">Critical</div>
            <div className="text-sm text-red-700">File overdue Professional Tax return immediately</div>
            <button 
              onClick={handleTakeAction}
              style={{ backgroundColor: 'var(--primary-color, #2862e9)' }}
              className="mt-2 text-white px-3 py-1 rounded text-xs transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary-color, #474e71)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color, #2862e9)'}
            >
              Take Action
            </button>
          </div>
          <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
            <div className="font-semibold text-yellow-800">High Priority</div>
            <div className="text-sm text-yellow-700">Update overtime register for December 2024</div>
            <button 
              onClick={handleUpdateNow}
              style={{ backgroundColor: 'var(--secondary-color, #474e71)' }}
              className="mt-2 text-white px-3 py-1 rounded text-xs transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color, #2862e9)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary-color, #474e71)'}
            >
              Update Now
            </button>
          </div>
        </div>
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
};

export default ComplianceDashboard;



