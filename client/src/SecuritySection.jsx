import React, { memo } from 'react';

const SecuritySection = memo(({ 
  securityData, 
  securityLoading, 
  securityError,
  onRefresh 
}) => {
  if (securityLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (securityError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error loading security data</p>
          <p className="text-sm mt-1">{securityError}</p>
        </div>
      </div>
    );
  }

  const {
    otpVerification = {},
    passwordSecurity = {},
    userRoles = {},
    verifiedAccounts = {},
    loginActivity = {},
    dataProtection = {}
  } = securityData;

  // Helper component for metrics
  const MetricCard = ({ title, value, subtitle, icon, color = 'blue' }) => (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold mt-2 text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`text-${color}-500 opacity-20`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  // Status badge
  const StatusBadge = ({ status, type = 'success' }) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colors[type] || colors.success}`}>
        {status}
      </span>
    );
  };

  return (
    <div className={`content-section p-8 fade-in`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Overview</h1>
          <p className="text-gray-600 mt-2">Real-time security metrics and account protection status</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>



      {/* OTP Verification */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          OTP Verification
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">OTP Verification Status</span>
            <StatusBadge status={otpVerification.status || 'N/A'} type={otpVerification.status === 'Enabled' ? 'success' : 'warning'} />
          </div>
        </div>
      </div>

      {/* Password Security */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Password Security
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Security Status</span>
              <StatusBadge status={passwordSecurity.status || 'Active'} type="success" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Hashing Algorithm</span>
              <span className="text-gray-600">{passwordSecurity.hashingAlgorithm || 'bcrypt'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">All Users Protected</span>
              <div className={`w-3 h-3 rounded-full ${passwordSecurity.allUsersProtected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* User Roles & Verified Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* User Roles */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            User Roles
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 mb-4">Total Roles: <span className="font-bold text-2xl text-purple-600">{userRoles.totalRoles || 0}</span></p>
            <div className="space-y-3">
              {userRoles.breakdown && Object.entries(userRoles.breakdown)
                .filter(([role]) => role?.toLowerCase() !== 'recruiter')
                .map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="capitalize font-medium text-gray-700">{role}s</span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verified Accounts */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-2.126 3.066 3.066 0 00-5.012 0 3.066 3.066 0 001.745 2.126 3.066 3.066 0 105.012 0zm6 0a3.066 3.066 0 001.745-2.126 3.066 3.066 0 00-5.012 0 3.066 3.066 0 001.745 2.126 3.066 3.066 0 105.012 0zm6 0a3.066 3.066 0 001.745-2.126 3.066 3.066 0 10-5.012 2.126 3.066 3.066 0 005.012 0z" clipRule="evenodd" />
            </svg>
            Verified Accounts
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Verification Rate</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${verifiedAccounts.percentage || 0}%` }}
                  ></div>
                </div>
                <p className="text-sm font-semibold text-gray-700 mt-2">{verifiedAccounts.percentage || 0}%</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-emerald-600">{verifiedAccounts.total || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Unverified</p>
                  <p className="text-2xl font-bold text-yellow-600">{verifiedAccounts.unverified || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Activity */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM15.657 14.243a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM11 17a1 1 0 102 0v-1a1 1 0 10-2 0v1zM5.757 14.243a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM2 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.757 5.757a1 1 0 01-1.414-1.414l.707-.707a1 1 0 11-1.414 1.414l-.707-.707z" />
          </svg>
          Login Activity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Failed Login Attempts"
            value={loginActivity.failedAttempts || 0}
            subtitle="Accounts with attempts"
            color="red"
          />
          <MetricCard
            title="Recent Logins"
            value={loginActivity.recentLogins || 0}
            subtitle="Past 30 days"
            color="blue"
          />
          <MetricCard
            title="Unique Devices"
            value={loginActivity.uniqueDevices || 0}
            subtitle="Connected devices"
            color="purple"
          />
          <MetricCard
            title="Unique IPs"
            value={loginActivity.uniqueIPs || 0}
            subtitle="Access locations"
            color="indigo"
          />
        </div>

        {/* Last Login */}
        {loginActivity.lastLogin && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Last Login</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-medium">User</span>
                <span className="font-medium text-gray-900">{loginActivity.lastLogin.user}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-medium">Email</span>
                <span className="font-medium text-gray-900">{loginActivity.lastLogin.email}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-medium">Role</span>
                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">{loginActivity.lastLogin.role}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-medium">Timestamp</span>
                <span className="text-sm text-gray-700">
                  {new Date(loginActivity.lastLogin.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Protection */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Data Protection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Password Hashing', value: dataProtection.passwordHashing },
            { label: 'Database Validation', value: dataProtection.databaseValidation },
            { label: 'Token/Session Timeout', value: dataProtection.tokenSessionTimeout },
            { label: 'Encryption Status', value: dataProtection.encryptionStatus }
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-600 font-medium mb-2">{item.label}</p>
              <StatusBadge status={item.value || 'N/A'} type="success" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

SecuritySection.displayName = 'SecuritySection';

export default SecuritySection;
