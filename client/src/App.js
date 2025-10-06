import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import HomePage from './homepage';
import Register from './Register';
import VerifyOtp from './VerifyOtp';
import PasswordResetFlow from './password';
import Login from './Login';
import AlumniDashboard from './Dashboard';
import AlumniConnectProfile from './AlumniProfile';
import EventsAndReunions from "./EventsAndReunions";
import GoogleAuthHandler from './GoogleAuthHandler';
import './index.css';
import AlumniJobDashboard from './AlumniJobDashboard';

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
          <Route path="/dashboard" element={<AlumniDashboard />} />
          {/* Add this route for Events */}
          <Route path="/events" element={<EventsAndReunions />} />
          <Route path="/auth/google/callback" element={<GoogleAuthHandler />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;