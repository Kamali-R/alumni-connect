# Architecture Diagram - Admin Dashboard Backend Integration

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD                              │
│                   (React Frontend - Port 3000)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Component Tree                             │   │
│  │                                                                │   │
│  │  AdminDashboard                                              │   │
│  │    ├─ useState: dashboardStats                               │   │
│  │    ├─ useState: users                                        │   │
│  │    ├─ useState: events                                       │   │
│  │    ├─ useState: loading/error states                         │   │
│  │    │                                                          │   │
│  │    ├─ useEffect: fetchDashboardStats()                       │   │
│  │    ├─ useEffect: fetchUsersList()                            │   │
│  │    └─ useEffect: fetchEventsList()                           │   │
│  │                                                                │   │
│  │    └─ Sections:                                              │   │
│  │        ├─ DashboardSection (Stat Cards)                      │   │
│  │        ├─ UserManagementSection (User Table)                 │   │
│  │        ├─ EventManagementSection (Event Lists)               │   │
│  │        ├─ SkillsSection (Skills)                             │   │
│  │        ├─ ReportsSection (Analytics)                         │   │
│  │        └─ SecuritySection (Security)                         │   │
│  │                                                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│                    API Calls (Authenticated)                         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
              │                    │                    │
              │                    │                    │
              ▼                    ▼                    ▼
        ┌──────────┐          ┌──────────┐         ┌──────────┐
        │GET /api/ │          │GET /api/ │         │GET /api/ │
        │admin/    │          │admin/    │         │admin/    │
        │dashboard/│          │users     │         │events    │
        │stats     │          │          │         │          │
        └──────────┘          └──────────┘         └──────────┘
              │                    │                    │
              └────────┬───────────┼────────┬──────────┘
                       │           │        │
                       ▼           ▼        ▼
        ┌────────────────────────────────────────────┐
        │       EXPRESS BACKEND (Port 5000)          │
        └────────────────────────────────────────────┘
        │                                              │
        │  ┌──────────────────────────────────────┐   │
        │  │         Router: /api/admin           │   │
        │  │                                      │   │
        │  │  GET /dashboard/stats                │   │
        │  │    └─→ getDashboardStats()           │   │
        │  │                                      │   │
        │  │  GET /users                          │   │
        │  │    └─→ getAdminUsers()               │   │
        │  │                                      │   │
        │  │  GET /events                         │   │
        │  │    └─→ getAdminEvents()              │   │
        │  │                                      │   │
        │  └──────────────────────────────────────┘   │
        │                                              │
        │  ┌──────────────────────────────────────┐   │
        │  │    Controller Functions              │   │
        │  │                                      │   │
        │  │  getDashboardStats()                 │   │
        │  │    ├─ Count Alumni users             │   │
        │  │    ├─ Count Student users            │   │
        │  │    ├─ Count active jobs              │   │
        │  │    ├─ Count pending events           │   │
        │  │    └─ Return aggregated stats        │   │
        │  │                                      │   │
        │  │  getAdminUsers()                     │   │
        │  │    ├─ Fetch Alumni (limit 20)        │   │
        │  │    ├─ Fetch Students (limit 20)      │   │
        │  │    ├─ Format response                │   │
        │  │    └─ Return user list               │   │
        │  │                                      │   │
        │  │  getAdminEvents()                    │   │
        │  │    ├─ Fetch pending events           │   │
        │  │    ├─ Fetch approved events          │   │
        │  │    ├─ Fetch past events              │   │
        │  │    ├─ Populate postedBy              │   │
        │  │    └─ Return organized events        │   │
        │  │                                      │   │
        │  └──────────────────────────────────────┘   │
        │                                              │
        └────────────────────────────────────────────┘
                       │
                       ▼
        ┌────────────────────────────────────────────┐
        │         MONGODB DATABASE                   │
        │                                            │
        │  Collections:                              │
        │  ├─ alumni                                 │
        │  │  └─ name, email, skills, createdAt     │
        │  │                                         │
        │  ├─ students                               │
        │  │  └─ name, email, skills, createdAt     │
        │  │                                         │
        │  ├─ jobs                                   │
        │  │  └─ title, status (open/active), ...    │
        │  │                                         │
        │  └─ events                                 │
        │     └─ title, status, date, attendees ... │
        │                                            │
        └────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
User Opens Admin Dashboard
    │
    ▼
Component Mounts (useEffect)
    │
    ├──────────────────────────────────────┐
    │                                      │
    ▼                                      ▼
fetchDashboard        fetchUsersList    fetchEventsList
Stats()               ()                 ()
    │                     │                  │
    ├─ Check Token        ├─ Check Token    ├─ Check Token
    ├─ Set Loading        ├─ Set Loading    └─ Call API
    └─ Call API           └─ Call API           │
        │                     │                  │
        ▼                     ▼                  ▼
    /api/admin/         /api/admin/         /api/admin/
    dashboard/stats     users               events
        │                   │                  │
        └───────────────────┼──────────────────┘
                            │
                            ▼
                      JWT Authentication
                            │
                            ▼
                      Database Query
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    Alumni.count    Alumni.find()         Event.find()
    Student.count   Student.find()        Event.find()
    Job.count       (format data)         (populate)
    Event.count     (return users)        (return events)
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                      Response (JSON)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    setDashboardStats setUsers            setEvents
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    Component Re-render
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    Stat Cards      User Table         Event Lists
    Display         Display            Display
    Real Data       Real Data          Real Data
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    User Sees Dashboard
                    with Real Data ✅
```

---

## State Management Diagram

```
AdminDashboard Component State

┌─────────────────────────────────────────────────────┐
│              Dashboard State                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  dashboardStats = {                                  │
│    totalUsers: 150      ◄─── From API              │
│    activeJobs: 25       ◄─── From API              │
│    pendingEvents: 3     ◄─── From API              │
│    systemHealth: 98     ◄─── Hardcoded/API         │
│  }                                                   │
│                                                      │
│  statsLoading = true/false ◄─── Async state        │
│  statsError = null/"error message" ◄─── Error      │
│                                                      │
├─────────────────────────────────────────────────────┤
│              Users State                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  users = [                                           │
│    {                                                 │
│      _id: "507f...",                                │
│      name: "Mike Johnson",   ◄─── From API         │
│      email: "mike@...",      ◄─── From API         │
│      type: "Alumni",         ◄─── From API         │
│      status: "Active",       ◄─── From API         │
│      joined: "2024-01-15"    ◄─── From API         │
│    },                                                │
│    ...                                               │
│  ]                                                   │
│                                                      │
│  usersLoading = true/false ◄─── Async state        │
│  usersError = null/"error" ◄─── Error              │
│                                                      │
├─────────────────────────────────────────────────────┤
│              Events State                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  events = {                                          │
│    pending: [/* pending events */]  ◄─── From API  │
│    approved: [/* approved events */] ◄─── From API │
│    past: [/* past events */]         ◄─── From API │
│  }                                                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Request/Response Cycle

```
FRONTEND REQUEST:
┌───────────────────────────────────────────┐
│ fetch('/api/admin/dashboard/stats', {     │
│   headers: {                              │
│     'Authorization': 'Bearer <token>',    │
│     'Content-Type': 'application/json'    │
│   }                                       │
│ })                                        │
└───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  BACKEND PROCESSING             │
│                                 │
│  1. Auth Middleware             │
│     └─ Verify JWT Token         │
│  2. Route Handler               │
│     └─ /api/admin/dashboard/    │
│        stats                    │
│  3. Controller Function         │
│     └─ getDashboardStats()      │
│  4. Database Queries            │
│     ├─ Alumni.countDocuments()  │
│     ├─ Student.countDocuments() │
│     ├─ Job.countDocuments()     │
│     └─ Event.countDocuments()   │
│  5. Format Response             │
│     └─ Aggregate data           │
└─────────────────────────────────┘
              │
              ▼
BACKEND RESPONSE:
┌──────────────────────────────────┐
│ {                                │
│   "success": true,               │
│   "stats": {                     │
│     "totalUsers": 150,           │
│     "activeJobs": 25,            │
│     "pendingEvents": 3,          │
│     "systemHealth": 98           │
│   }                              │
│ }                                │
└──────────────────────────────────┘
              │
              ▼
FRONTEND PROCESSING:
┌──────────────────────────────────┐
│ 1. Parse JSON Response           │
│ 2. Update State                  │
│    setDashboardStats(data.stats) │
│ 3. Clear Loading State           │
│    setStatsLoading(false)        │
│ 4. Trigger Re-render             │
│    Component Renders with        │
│    Real Data                     │
└──────────────────────────────────┘
              │
              ▼
USER SEES:
┌──────────────────────────────────┐
│  Stat Cards with Real Numbers:   │
│  ┌────────────────────────────┐  │
│  │ Total Users      │   150    │  │
│  │ Active Jobs      │    25    │  │
│  │ Pending Events   │     3    │  │
│  │ System Health    │    98%   │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

## Error Handling Flow

```
API Call Made
    │
    ├─ No Token?
    │  └─ Throw Error: "No authentication token"
    │     └─ Catch Block
    │        └─ setError(message)
    │           └─ Show to User: Error Message
    │
    ├─ Network Error?
    │  └─ Throw Error: Network Error
    │     └─ Catch Block
    │        └─ setError(message)
    │           └─ Show to User: Error Message
    │
    ├─ 401 Unauthorized?
    │  └─ Backend: Auth Failed
    │     └─ Return Error Response
    │        └─ Frontend: Catch Error
    │           └─ Show to User: Login Required
    │
    ├─ 500 Server Error?
    │  └─ Backend: Database/Server Error
    │     └─ Return Error Response
    │        └─ Frontend: Catch Error
    │           └─ Show to User: Server Error
    │
    └─ Success!
       └─ Response.ok = true
          └─ Parse JSON
             └─ Update State
                └─ Show Real Data
```

---

## Technology Stack

```
┌─ Frontend ────────────────────┐
│ React 18+                      │
│ ├─ useState (State Management) │
│ ├─ useEffect (Lifecycle)       │
│ ├─ useCallback (Memoization)   │
│ └─ fetch API (HTTP Calls)      │
│                                │
│ Styling:                       │
│ ├─ Tailwind CSS                │
│ └─ Custom CSS                  │
└────────────────────────────────┘

┌─ Backend ─────────────────────┐
│ Node.js + Express              │
│ ├─ Routing                     │
│ ├─ Middleware (Auth)           │
│ ├─ Controllers                 │
│ └─ Error Handling              │
│                                │
│ Database:                      │
│ ├─ MongoDB                     │
│ ├─ Mongoose ODM                │
│ └─ Aggregation Pipeline        │
└────────────────────────────────┘

┌─ Authentication ──────────────┐
│ JWT (JSON Web Tokens)          │
│ ├─ localStorage (Token Store)  │
│ ├─ Bearer Token (Headers)      │
│ └─ Verification (Middleware)   │
└────────────────────────────────┘
```

---

**Architecture Documentation - Complete ✅**
