import User from '../models/User.js';
import Job from '../models/Job.js';
import Event from '../models/Events.js';
import Connection from '../models/Connection.js';

// Helper to get start of month for a given date
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

// Helper to build last N months labels and counts
const buildMonthlyCounts = async ({
  model,
  dateField = 'createdAt',
  months = 6,
  match = {}
}) => {
  const now = new Date();
  const startBoundary = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const pipeline = [
    { $match: { [dateField]: { $gte: startBoundary }, ...match } },
    {
      $group: {
        _id: {
          year: { $year: `$${dateField}` },
          month: { $month: `$${dateField}` }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ];

  const raw = await model.aggregate(pipeline);

  // Build a continuous array of months with zero fill
  const monthsArr = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthsArr.push({ month: d.toLocaleString('en-US', { month: 'short' }), year: d.getFullYear(), count: 0 });
  }

  raw.forEach((item) => {
    const label = new Date(item._id.year, item._id.month - 1, 1).toLocaleString('en-US', { month: 'short' });
    const idx = monthsArr.findIndex((m) => m.month === label && m.year === item._id.year);
    if (idx !== -1) {
      monthsArr[idx].count = item.count;
    }
  });

  // Return only month label and count
  return monthsArr.map(({ month, count }) => ({ month, count }));
};

export const getReportsOverview = async (req, res) => {
  try {
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prev30 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const startMonth = startOfMonth(now);
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Users
    const [totalUsers, currentRegistrations, prevRegistrations, totalConnections] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: last30 } }),
      User.countDocuments({ createdAt: { $gte: prev30, $lt: last30 } }),
      Connection.countDocuments()
    ]);

    console.log('📊 Reports Overview Debug:', {
      totalUsers,
      currentRegistrations,
      prevRegistrations,
      totalConnections,
      collectionName: Connection.collection.name
    });

    const userGrowthPercent = prevRegistrations === 0
      ? (currentRegistrations > 0 ? 100 : 0)
      : Math.round(((currentRegistrations - prevRegistrations) / prevRegistrations) * 100);

    // Job applications (this month)
    const jobApplicationsAgg = await Job.aggregate([
      { $unwind: { path: '$applications', preserveNullAndEmptyArrays: false } },
      { $match: { 'applications.appliedAt': { $gte: startMonth } } },
      { $count: 'count' }
    ]);
    const jobApplicationsThisMonth = jobApplicationsAgg[0]?.count || 0;

    // Job posting trend (last 6 months)
    const jobPostingTrend = await buildMonthlyCounts({ model: Job, dateField: 'createdAt', months: 6 });

    // Registrations trend (last 6 months)
    const registrationTrend = await buildMonthlyCounts({ model: User, dateField: 'createdAt', months: 6 });

    // Events
    const [totalEvents, eventsWithAttendance] = await Promise.all([
      Event.countDocuments(),
      Event.aggregate([
        { $match: { createdAt: { $gte: last30 } } },
        {
          $project: {
            attendeeCount: { $size: { $ifNull: ['$attendees', []] } }
          }
        },
        { $group: { _id: null, totalAttendees: { $sum: '$attendeeCount' }, eventsWithAttendees: { $sum: { $cond: [{ $gt: ['$attendeeCount', 0] }, 1, 0] } } } }
      ])
    ]);

    const eventTotals = eventsWithAttendance[0] || { totalAttendees: 0, eventsWithAttendees: 0 };
    const eventAttendanceRate = totalEvents === 0 ? 0 : Math.round((eventTotals.eventsWithAttendees / totalEvents) * 100);

    // Platform stats (last 7/30 days)
    const [recentLogins, recentEventSignups, recentJobApplications] = await Promise.all([
      User.countDocuments({ lastLogin: { $gte: last7 } }),
      Event.aggregate([
        { $match: { createdAt: { $gte: last30 } } },
        { $project: { count: { $size: { $ifNull: ['$attendees', []] } } } },
        { $group: { _id: null, total: { $sum: '$count' } } }
      ]),
      Job.aggregate([
        { $unwind: { path: '$applications', preserveNullAndEmptyArrays: false } },
        { $match: { 'applications.appliedAt': { $gte: last30 } } },
        { $count: 'count' }
      ])
    ]);

    const eventSignups = recentEventSignups[0]?.total || 0;
    const jobApplications = recentJobApplications[0]?.count || 0;

    return res.status(200).json({
      summaryCards: {
        userGrowthPercent,
        totalConnections,
        eventAttendanceRate
      },
      registrationTrend,
      jobPostingTrend,
      platformStats: {
        dailyActiveUsers: recentLogins,
        newRegistrations: currentRegistrations,
        eventSignups,
        jobApplications
      },
      meta: {
        generatedAt: now.toISOString(),
        totalUsers,
        totalEvents
      }
    });
  } catch (error) {
    console.error('Error building reports overview:', error);
    return res.status(500).json({ message: 'Failed to load reports overview', error: error.message });
  }
};
