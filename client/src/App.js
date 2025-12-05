import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import HomePage from './homepage';
import Register from './Register';
import VerifyOtp from './VerifyOtp';
import PasswordResetFlow from './password';
import Login from './Login';
import AlumniDashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './studentdashboard';
import AlumniConnectProfile from './AlumniProfile';
import StudentProfile from './studentprofile';
import EventsAndReunions from "./EventsAndReunions";
import GoogleAuthHandler from './GoogleAuthHandler';
import './index.css';
import Messages from './Messages';
import AlumniJobDashboard from './AlumniJobDashboard';

// In App.js, ensure the student-profile route is properly defined
function App() {
  const [userData, setUserData] = useState(null);
  
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/job-dashboard" element={<AlumniJobDashboard />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/Login" element={<Login />} />
          <Route
            path="/Register"
            element={
              <Register
                onOtpSent={() => window.location.replace('/VerifyOtp')}
                setUserData={setUserData}
              />
            }
          />
          <Route path="/VerifyOtp" element={<VerifyOtp userData={userData} />} />
          <Route path="/forgot-password" element={<PasswordResetFlow />} />
          <Route path="/alumni-profile" element={<AlumniConnectProfile />} />
          <Route path="/student-profile" element={<StudentProfile />} />
          <Route path="/dashboard" element={<AlumniDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/events" element={<EventsAndReunions />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/auth/google/callback" element={<GoogleAuthHandler />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;