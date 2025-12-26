import React from 'react';

const ManpowerDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manpower Planning</h1>
      </div>

      {/* Manpower Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg shadow text-center" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <div className="text-2xl font-bold text-blue-600">245</div>
          <div className="text-sm text-secondary">Current Strength</div>
        </div>
        <div className="p-4 rounded-lg shadow text-center" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <div className="text-2xl font-bold text-green-600">280</div>
          <div className="text-sm text-secondary">Planned Strength</div>
        </div>
        <div className="p-4 rounded-lg shadow text-center" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <div className="text-2xl font-bold text-orange-600">35</div>
          <div className="text-sm text-secondary">Gap to Fill</div>
        </div>
        <div className="p-4 rounded-lg shadow text-center" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <div className="text-2xl font-bold text-purple-600">87.5%</div>
          <div className="text-sm text-secondary">Utilization Rate</div>
        </div>
      </div>

      {/* Department Wise Planning */}
      <div className="p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
        <h3 className="text-lg font-semibold mb-4">Department Wise Manpower Planning</h3>
        <div className="overflow-x-auto">
          <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="w-full">
            <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-content">
              <tr>
                <th className="text-left p-3 font-medium">Department</th>
                <th className="text-left p-3 font-medium">Current</th>
                <th className="text-left p-3 font-medium">Planned</th>
                <th className="text-left p-3 font-medium">Gap</th>
                <th className="text-left p-3 font-medium">Utilization</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
              <tr className="border-b" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                <td className="p-3">IT Department</td>
                <td className="p-3">85</td>
                <td className="p-3">100</td>
                <td className="p-3 text-red-600 font-semibold">-15</td>
                <td className="p-3">85%</td>
                <td className="p-3"><span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Understaffed</span></td>
              </tr>
              <tr className="border-b" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                <td className="p-3">Operations</td>
                <td className="p-3">65</td>
                <td className="p-3">70</td>
                <td className="p-3 text-orange-600 font-semibold">-5</td>
                <td className="p-3">93%</td>
                <td className="p-3"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Near Target</span></td>
              </tr>
              <tr className="border-b" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                <td className="p-3">Sales & Marketing</td>
                <td className="p-3">45</td>
                <td className="p-3">60</td>
                <td className="p-3 text-red-600 font-semibold">-15</td>
                <td className="p-3">75%</td>
                <td className="p-3"><span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Understaffed</span></td>
              </tr>
              <tr className="border-b" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                <td className="p-3">HR & Admin</td>
                <td className="p-3">25</td>
                <td className="p-3">25</td>
                <td className="p-3 text-green-600 font-semibold">0</td>
                <td className="p-3">100%</td>
                <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Optimal</span></td>
              </tr>
              <tr className="border-b" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                <td className="p-3">Finance</td>
                <td className="p-3">25</td>
                <td className="p-3">25</td>
                <td className="p-3 text-green-600 font-semibold">0</td>
                <td className="p-3">100%</td>
                <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Optimal</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Hiring Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <h3 className="text-lg font-semibold mb-4">Quarterly Hiring Forecast</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span>Q1 2025</span>
              <span className="font-semibold text-blue-600">15 hires planned</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span>Q2 2025</span>
              <span className="font-semibold text-green-600">12 hires planned</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
              <span>Q3 2025</span>
              <span className="font-semibold text-purple-600">8 hires planned</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
              <span>Q4 2025</span>
              <span className="font-semibold text-orange-600">5 hires planned</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
          <h3 className="text-lg font-semibold mb-4">Critical Positions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border-l-4 border-red-500 bg-red-50">
              <div>
                <div className="font-semibold text-red-800">Senior Software Engineer</div>
                <div className="text-sm text-red-600">IT Department - Urgent</div>
              </div>
              <span className="text-red-600 font-semibold">5 positions</span>
            </div>
            <div className="flex items-center justify-between p-3 border-l-4 border-orange-500 bg-orange-50">
              <div>
                <div className="font-semibold text-orange-800">Sales Manager</div>
                <div className="text-sm text-orange-600">Sales - High Priority</div>
              </div>
              <span className="text-orange-600 font-semibold">2 positions</span>
            </div>
            <div className="flex items-center justify-between p-3 border-l-4 border-yellow-500 bg-yellow-50">
              <div>
                <div className="font-semibold text-yellow-800">Operations Executive</div>
                <div className="text-sm text-yellow-600">Operations - Medium</div>
              </div>
              <span className="text-yellow-600 font-semibold">3 positions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Planning */}
      <div className="p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
        <h3 className="text-lg font-semibold mb-4">Manpower Budget Planning</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-bold text-blue-600">₹2.8Cr</div>
            <div className="text-sm text-secondary">Annual Salary Budget</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-bold text-green-600">₹2.45Cr</div>
            <div className="text-sm text-secondary">Current Utilization</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-bold text-orange-600">₹35L</div>
            <div className="text-sm text-secondary">Available Budget</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-bold text-purple-600">87.5%</div>
            <div className="text-sm text-secondary">Budget Utilization</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManpowerDashboard;
