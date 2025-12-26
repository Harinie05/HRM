import React from 'react';
import Layout from '../../components/Layout';

const RecruitmentDashboard = () => {
  return (
    <Layout breadcrumb="Recruitment · Dashboard">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-primary mb-2">Recruitment & Onboarding Pipeline</h1>
          <p className="" style={{color: 'var(--text-secondary, #374151)'}}>Overview of recruitment activities and candidate pipeline</p>
        </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Job Requisitions */}
        <div className="bg-content p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-4">
            <h3 className=" font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Job Requisitions</h3>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-1">4</div>
          <p className="text-sm text-muted">Total job openings</p>
        </div>

        {/* Applied Candidates */}
        <div className="bg-content p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-4">
            <h3 className=" font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Applied Candidates</h3>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-1">7</div>
          <p className="text-sm text-muted">Total applications received</p>
        </div>

        {/* Onboarded Candidates */}
        <div className="bg-content p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-4">
            <h3 className=" font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Onboarded Candidates</h3>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-1">9</div>
          <p className="text-sm text-muted">Successfully joined employees</p>
        </div>

        {/* Completed Jobs */}
        <div className="bg-content p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-4">
            <h3 className=" font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Completed Jobs</h3>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-1">4</div>
          <p className="text-sm text-muted">Filled positions</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Selected Candidates */}
        <div className="bg-content p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-4">
            <h3 className=" font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Selected Candidates</h3>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-1">5</div>
          <p className="text-sm text-muted">Candidates cleared all rounds</p>
        </div>

        {/* Rejected Candidates */}
        <div className="bg-content p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-4">
            <h3 className=" font-medium" style={{color: 'var(--text-secondary, #374151)'}}>Rejected Candidates</h3>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600 mb-1">0</div>
          <p className="text-sm text-muted">Not selected candidates</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl border">
        <h3 className="text-lg font-semibold text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg hover:bg-content cursor-pointer transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-primary">Create Job</h4>
                <p className="text-sm text-muted">Add new job requisition</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg hover:bg-content cursor-pointer transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-primary">View ATS</h4>
                <p className="text-sm text-muted">Manage candidates</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default RecruitmentDashboard;
