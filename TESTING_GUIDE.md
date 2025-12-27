# Quick Test Guide - Admin Dashboard API Integration

## Prerequisites
✅ Backend server running on `http://localhost:5000`
✅ Frontend development server running on `http://localhost:3000`
✅ Logged in as admin user

## Quick Test Checklist

### 1. **Dashboard Section** ✅
- [ ] Navigate to Admin Dashboard → Dashboard tab
- [ ] Verify stat cards display:
  - Real "Total Users" count from database
  - Real "Active Jobs" count
  - Real "Pending Events" count
  - System Health percentage

### 2. **User Management Section** ✅
- [ ] Click on "User Management" in the sidebar
- [ ] Verify the user table populates with real users from database
- [ ] Check that each user shows:
  - Name and email
  - User type (Alumni/Student)
  - Status (Active)
  - Join date formatted correctly
  - Avatar initials based on name

### 3. **Event Management Section** ✅
- [ ] Click on "Event Management" in the sidebar
- [ ] Verify "Events Pending Approval" section shows pending events
- [ ] Verify "Approved Upcoming Events" section shows upcoming events
- [ ] Verify "Past Events" section shows completed events
- [ ] Check that event details display correctly:
  - Event title
  - Date and location
  - Submitter name (for pending)
  - Registration/attendance counts

### 4. **Skills & Technology Section** ✅
- [ ] Click on "Skills & Technology" in the sidebar
- [ ] Verify skills data loads from backend
- [ ] Test skill search functionality
- [ ] Check popularity ranking

### 5. **Error Scenarios** ✅
- [ ] Close backend server and refresh dashboard
  - Should display error messages
  - Loading states should appear
  - No crashes in UI
- [ ] Check browser console for API errors
- [ ] Restart backend and verify data loads again

## Browser Console Commands (for testing)

```javascript
// Check what's being fetched
localStorage.getItem('token');  // Should show JWT token

// Test API endpoints manually
fetch('/api/admin/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(d => console.log(d));
```

## Expected Data Structure

### Dashboard Stats Response
```
{
  "stats": {
    "totalUsers": [number],
    "activeJobs": [number],
    "pendingEvents": [number],
    "systemHealth": [number]
  }
}
```

### Users List Response
```
{
  "users": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "type": "Alumni" or "Student",
      "status": "Active",
      "joined": "ISO date string"
    }
  ]
}
```

### Events Response
```
{
  "events": {
    "pending": [...],
    "approved": [...],
    "past": [...]
  }
}
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized error | Check if user is logged in, token might be expired |
| No data appears | Check browser console for network errors, verify backend is running |
| Wrong data displays | Clear browser cache and localStorage, restart both servers |
| Users table is empty | Ensure there are users in the Alumni and Student collections |
| Events not showing | Check if events have proper `status` field values |

## Performance Testing

- Dashboard loads with all stat cards: **< 1s**
- Users table populates: **< 2s**
- Events sections load: **< 2s**
- Skill search response: **< 1s**

## Notes

- All timestamps are displayed in local browser timezone
- User avatars are auto-generated from initials
- Real-time updates can be enhanced with WebSocket integration
- Data refreshes on component mount, add refresh button for manual updates

---

**Testing Status:** Ready for QA ✅
