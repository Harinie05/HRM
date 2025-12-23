import React from 'react';

const RecruitmentDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Recruitment Pipeline</h1>
      </div>

      {/* Recruitment Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">45</div>
          <div className="text-sm text-gray-600">Open Positions</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">320</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-purple-600">85</div>
          <div className="text-sm text-gray-600">In Interview Process</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-orange-600">12</div>
          <div className="text-sm text-gray-600">Offers Extended</div>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recruitment Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">320</div>
            <div className="text-sm text-gray-600">Applied</div>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-xl font-bold text-indigo-600">180</div>
            <div className="text-sm text-gray-600">Screened</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">85</div>
            <div className="text-sm text-gray-600">Interview</div>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <div className="text-xl font-bold text-pink-600">35</div>
            <div className="text-sm text-gray-600">Final Round</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">12</div>
            <div className="text-sm text-gray-600">Offered</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-xl font-bold text-emerald-600">8</div>
            <div className="text-sm text-gray-600">Joined</div>
          </div>
        </div>
      </div>

      {/* Department Wise Hiring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Department Wise Open Positions</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>IT Department</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">18 positions</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Operations</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">12 positions</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Sales & Marketing</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-semibold">8 positions</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Customer Support</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-semibold">5 positions</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Finance</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">2 positions</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Hiring Activities</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">John Doe accepted offer for Software Engineer</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">5 candidates shortlisted for Marketing Manager</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Interview scheduled for Data Analyst position</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">New job posting: Senior Developer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hiring Metrics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Hiring Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-bold text-blue-600">25 days</div>
            <div className="text-sm text-gray-600">Avg. Time to Hire</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-bold text-green-600">₹15,000</div>
            <div className="text-sm text-gray-600">Avg. Cost per Hire</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-bold text-purple-600">65%</div>
            <div className="text-sm text-gray-600">Offer Acceptance Rate</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-bold text-orange-600">4.2/5</div>
            <div className="text-sm text-gray-600">Candidate Experience</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruitmentDashboard;