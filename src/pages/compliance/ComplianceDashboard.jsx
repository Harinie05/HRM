import React from 'react';
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, Users, Calendar, TrendingUp } from 'lucide-react';

const ComplianceDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-content rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Overall Compliance</p>
              <p className="text-2xl font-semibold text-green-900">95%</p>
            </div>
          </div>
        </div>
        <div className="bg-content rounded-lg p-4">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Active Policies</p>
              <p className="text-2xl font-semibold text-blue-900">12</p>
            </div>
          </div>
        </div>
        <div className="bg-content rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-600">Pending Actions</p>
              <p className="text-2xl font-semibold text-orange-900">3</p>
            </div>
          </div>
        </div>
        <div className="bg-content rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">Overdue Items</p>
              <p className="text-2xl font-semibold text-red-900">1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Compliance */}
      <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
        <h3 className="text-lg font-semibold mb-4">Statutory Compliance Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">PF Compliance</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Compliant</span>
            </div>
            <div className="text-sm text-secondary">Last filed: Dec 2024</div>
            <div className="text-sm text-secondary">Next due: Jan 15, 2025</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">ESI Compliance</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Compliant</span>
            </div>
            <div className="text-sm text-secondary">Last filed: Dec 2024</div>
            <div className="text-sm text-secondary">Next due: Jan 15, 2025</div>
          </div>
          <div className="p-4 border rounded-lg">
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
        <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
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

        <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
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
      <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
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
      <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
        <h3 className="text-lg font-semibold mb-4">Immediate Action Required</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border-l-4 border-red-500 bg-red-50">
            <div className="font-semibold text-red-800">Critical</div>
            <div className="text-sm text-red-700">File overdue Professional Tax return immediately</div>
            <button className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">
              Take Action
            </button>
          </div>
          <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
            <div className="font-semibold text-yellow-800">High Priority</div>
            <div className="text-sm text-yellow-700">Update overtime register for December 2024</div>
            <button className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700">
              Update Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;
