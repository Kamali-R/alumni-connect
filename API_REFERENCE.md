# API Reference - Admin Dashboard Endpoints

## Base URL
```
http://localhost:5000/api/admin
```

## Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Dashboard Statistics

### Endpoint
```
GET /api/admin/dashboard/stats
```

### Request
```bash
curl -X GET http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Response - Success (200)
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalAlumni": 80,
    "totalStudents": 70,
    "activeJobs": 25,
    "pendingEvents": 3,
    "systemHealth": 98
  }
}
```

### Response - Error (401)
```json
{
  "success": false,
  "message": "Authentication required. Please log in as an admin user to access this feature."
}
```

### What It Does
- Counts total users from Alumni and Student collections
- Counts active/open jobs from Job collection
- Counts pending events from Event collection
- Returns system health status

---

## 2. Users List

### Endpoint
```
GET /api/admin/users
```

### Request
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Response - Success (200)
```json
{
  "success": true,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Mike Johnson",
      "email": "mike.johnson@email.com",
      "type": "Alumni",
      "status": "Active",
      "joined": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Anna Smith",
      "email": "anna.smith@email.com",
      "type": "Student",
      "status": "Active",
      "joined": "2024-02-03T14:45:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Robert Brown",
      "email": "robert.brown@techcorp.com",
      "type": "Alumni",
      "status": "Active",
      "joined": "2024-01-28T09:20:00.000Z"
    }
  ],
  "total": 3
}
```

### Response - Error (500)
```json
{
  "success": false,
  "message": "Error fetching users list",
  "error": "Connection to database failed"
}
```

### Query Parameters
None (currently returns first 20 users)

### What It Does
- Fetches users from Alumni collection (first 10)
- Fetches users from Student collection (first 10)
- Combines and formats with user type
- Returns join date for each user

---

## 3. Events List

### Endpoint
```
GET /api/admin/events
```

### Request
```bash
curl -X GET http://localhost:5000/api/admin/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Response - Success (200)
```json
{
  "success": true,
  "events": {
    "pending": [
      {
        "id": "507f1f77bcf86cd799439014",
        "title": "Alumni Startup Pitch Night",
        "submitter": "Sarah Johnson",
        "date": "3/25/2024",
        "location": "Innovation Hub, Downtown",
        "description": "An evening where alumni entrepreneurs can pitch their startups to fellow alumni and potential investors.",
        "status": "pending"
      },
      {
        "id": "507f1f77bcf86cd799439015",
        "title": "Photography Workshop",
        "submitter": "Mike Chen",
        "date": "4/8/2024",
        "location": "University Art Building",
        "description": "Learn professional photography techniques from alumni working in the creative industry.",
        "status": "pending"
      }
    ],
    "approved": [
      {
        "id": "507f1f77bcf86cd799439016",
        "title": "Alumni Networking Night",
        "date": "3/15/2024",
        "location": "Downtown Conference Center",
        "registered": 45,
        "status": "approved"
      },
      {
        "id": "507f1f77bcf86cd799439017",
        "title": "Career Fair 2024",
        "date": "4/2/2024",
        "location": "University Campus",
        "registered": 128,
        "status": "approved"
      }
    ],
    "past": [
      {
        "id": "507f1f77bcf86cd799439018",
        "title": "Tech Talk: AI in Industry",
        "date": "2/20/2024",
        "attended": 67,
        "status": "past"
      },
      {
        "id": "507f1f77bcf86cd799439019",
        "title": "Alumni Reunion",
        "date": "1/15/2024",
        "attended": 203,
        "status": "past"
      }
    ]
  }
}
```

### Response - Error (401)
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

### What It Does
- Fetches events with status="pending"
- Fetches approved events with future dates
- Fetches events with past dates
- Returns formatted event data by category
- Shows attendee/registration counts

---

## Testing with JavaScript/React

### In Browser Console
```javascript
// Get dashboard stats
const statsResponse = await fetch('/api/admin/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});
const stats = await statsResponse.json();
console.log(stats);

// Get users
const usersResponse = await fetch('/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});
const users = await usersResponse.json();
console.log(users);

// Get events
const eventsResponse = await fetch('/api/admin/events', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});
const events = await eventsResponse.json();
console.log(events);
```

### In React Component
```javascript
import { useEffect, useState } from 'react';

function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    };

    fetchStats();
  }, []);

  if (!stats) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Total Users: {stats.totalUsers}</h2>
      <h2>Active Jobs: {stats.activeJobs}</h2>
      <h2>Pending Events: {stats.pendingEvents}</h2>
    </div>
  );
}

export default AdminDashboard;
```

---

## HTTP Status Codes

| Code | Meaning | Response |
|------|---------|----------|
| 200 | Success | Returns data object |
| 400 | Bad Request | Missing/invalid parameters |
| 401 | Unauthorized | Missing or invalid token |
| 500 | Server Error | Database or server error |

---

## Rate Limiting
Currently no rate limiting implemented. Can be added in middleware if needed.

## Caching
API calls are not cached. Each call fetches fresh data from the database.

## CORS
Enabled for localhost development. Configure in `server.js` for production.

---

## Notes for Developers

1. **Token Management**: Token is stored in localStorage and automatically included
2. **Error Handling**: Always check `success` field in response
3. **Date Formatting**: Dates are in ISO format, format in component as needed
4. **Pagination**: Currently not implemented, can add limit/offset parameters
5. **Filtering**: Can add query parameters for status, date range, search, etc.

---

**Last Updated:** December 27, 2025
