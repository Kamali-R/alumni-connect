import React, { memo } from 'react';

const TrendBar = ({ label, count, max }) => {
  const width = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-sm text-gray-600">{label}</div>
      <div className="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden">
        <div
          className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${width}%` }}
        ></div>
      </div>
      <div className="w-10 text-right text-sm font-semibold text-gray-900">{count}</div>
    </div>
  );
};

const ReportsSection = memo(({ reportsData, reportsLoading, reportsError, onRefresh, fadeAnimation }) => {
  const summary = reportsData?.summaryCards || {};
  const registrationTrend = reportsData?.registrationTrend || [];
  const jobPostingTrend = reportsData?.jobPostingTrend || [];
  const platform = reportsData?.platformStats || {};
  const meta = reportsData?.meta || {};

  const maxRegistration = registrationTrend.reduce((m, v) => Math.max(m, v.count || 0), 0);
  const maxJobs = jobPostingTrend.reduce((m, v) => Math.max(m, v.count || 0), 0);

  return (
    <div className={`content-section p-8 ${fadeAnimation ? 'fade-in' : ''}`}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Live platform insights from backend data</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {reportsError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="font-semibold">Error loading reports</p>
          <p className="text-sm mt-1">{reportsError}</p>
        </div>
      )}

      {reportsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow">
              <p className="text-blue-100 text-sm font-medium">User Growth (vs prior 30 days)</p>
              <p className="text-3xl font-bold mt-2">{summary.userGrowthPercent ?? 0}%</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow">
              <p className="text-green-100 text-sm font-medium">Total Connections</p>
              <p className="text-3xl font-bold mt-2">{summary.totalConnections ?? 0}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow">
              <p className="text-purple-100 text-sm font-medium">Event Attendance Rate</p>
              <p className="text-3xl font-bold mt-2">{summary.eventAttendanceRate ?? 0}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">User Registration Trend (6 months)</h3>
                <span className="text-xs text-gray-500">Real data</span>
              </div>
              <div className="space-y-3">
                {registrationTrend.length === 0 && <p className="text-sm text-gray-500">No data</p>}
                {registrationTrend.map((item, idx) => (
                  <TrendBar key={idx} label={item.month} count={item.count || 0} max={maxRegistration} />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Job Posting Trend (6 months)</h3>
                <span className="text-xs text-gray-500">Real data</span>
              </div>
              <div className="space-y-3">
                {jobPostingTrend.length === 0 && <p className="text-sm text-gray-500">No data</p>}
                {jobPostingTrend.map((item, idx) => (
                  <TrendBar key={idx} label={item.month} count={item.count || 0} max={maxJobs} />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-gray-900">Platform Usage (last 7-30 days)</h3>
              <span className="text-xs text-gray-500">Generated at: {meta.generatedAt ? new Date(meta.generatedAt).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 mb-1">Daily Active Users</p>
                <p className="text-2xl font-bold text-blue-900">{platform.dailyActiveUsers ?? 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700 mb-1">New Registrations</p>
                <p className="text-2xl font-bold text-green-900">{platform.newRegistrations ?? 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-700 mb-1">Event Sign-ups</p>
                <p className="text-2xl font-bold text-purple-900">{platform.eventSignups ?? 0}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-700 mb-1">Job Applications</p>
                <p className="text-2xl font-bold text-orange-900">{platform.jobApplications ?? 0}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

ReportsSection.displayName = 'ReportsSection';

export default ReportsSection;
