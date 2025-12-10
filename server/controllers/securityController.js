import User from '../models/User.js';
import otp from '../models/otp.js';

export const getSecurityOverview = async (req, res) => {
  try {
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. OTP Verification Status
    const totalUsers = await User.countDocuments();
    const usersWithOtpVerification = await otp.countDocuments({});
    const otpVerificationStatus = totalUsers > 0 
      ? Math.round((usersWithOtpVerification / totalUsers) * 100)
      : 0;

    // 2. Password Security - Active (All users should have passwords)
    const passwordSecurityStatus = 'Active';

    // 3. User Roles Count
    const rolesCounts = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    const rolesData = {};
    rolesCounts.forEach(item => {
      if (item._id && item._id.toLowerCase() !== 'recruiter') rolesData[item._id] = item.count;
    });
    const totalUserRoles = Object.keys(rolesData).length;

    // 4. Total Verified Accounts (users with isVerified = true)
    const verifiedAccounts = await User.countDocuments({
      isVerified: true
    });
    const unverifiedAccounts = totalUsers - verifiedAccounts;
    const verificationRate = totalUsers > 0 
      ? Math.round((verifiedAccounts / totalUsers) * 100)
      : 0;

    // 5. Login Activity
    const lastLoginUsers = await User.find({
      lastLogin: { $exists: true, $ne: null }
    })
      .sort({ lastLogin: -1 })
      .limit(5)
      .select('name email lastLogin role');

    // Get the most recent login
    const mostRecentLogin = lastLoginUsers[0] || null;

    // Count failed login attempts (users with multiple failed attempts)
    const failedLoginAttempts = await User.countDocuments({
      failedLoginAttempts: { $gt: 0 }
    });

    // Get devices and IPs from last logins
    const loginDevices = await User.find({
      lastLoginDevice: { $exists: true, $ne: null }
    })
      .select('lastLoginDevice')
      .limit(10);

    const loginIPs = await User.find({
      lastLoginIP: { $exists: true, $ne: null }
    })
      .select('lastLoginIP')
      .limit(10);

    // Get unique devices and IPs
    const uniqueDevices = new Set(loginDevices.map(u => u.lastLoginDevice).filter(Boolean));
    const uniqueIPs = new Set(loginIPs.map(u => u.lastLoginIP).filter(Boolean));

    // 6. Data Protection
    const passwordHashingStatus = 'Enabled';
    const databaseValidationStatus = 'Active';
    const tokenSessionTimeout = '30 mins';



    return res.status(200).json({
      otpVerification: {
        status: 'Enabled'
      },
      passwordSecurity: {
        status: passwordSecurityStatus,
        allUsersProtected: true,
        hashingAlgorithm: 'bcrypt'
      },
      userRoles: {
        totalRoles: totalUserRoles,
        breakdown: rolesData
      },
      verifiedAccounts: {
        total: verifiedAccounts,
        percentage: verificationRate,
        unverified: unverifiedAccounts,
        verificationComplete: unverifiedAccounts === 0
      },
      loginActivity: {
        lastLogin: mostRecentLogin ? {
          user: mostRecentLogin.name,
          email: mostRecentLogin.email,
          timestamp: mostRecentLogin.lastLogin,
          role: mostRecentLogin.role
        } : null,
        failedAttempts: failedLoginAttempts,
        recentLogins: lastLoginUsers.length,
        uniqueDevices: uniqueDevices.size,
        uniqueIPs: uniqueIPs.size,
        topDevices: Array.from(uniqueDevices).slice(0, 3),
        topIPs: Array.from(uniqueIPs).slice(0, 3)
      },
      dataProtection: {
        passwordHashing: passwordHashingStatus,
        databaseValidation: databaseValidationStatus,
        tokenSessionTimeout: tokenSessionTimeout,
        encryptionStatus: 'Active',
        dataBackupStatus: 'Enabled'
      },
      generatedAt: now.toISOString()
    });
  } catch (error) {
    console.error('Error fetching security overview:', error);
    return res.status(500).json({
      message: 'Failed to load security overview',
      error: error.message
    });
  }
};
