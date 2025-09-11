import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';  // ✅ You forgot to import useState
import HomePage from './homepage';
import Register from './Register';
import VerifyOtp from './VerifyOtp';
import PasswordResetFlow from './password';
import Login from './Login';
import './index.css';

function App() {
  const [userData, setUserData] = useState(null); // For passing data from Register to VerifyOtp

  return (
    <Router>c
      <div className="App">
        <Routes>
          {/* Default Home */}
         <Route path="/" element={<HomePage />} />


          {/* Login */}
          <Route path="/Login" element={<Login />} />

          {/* Register */}
          <Route
            path="/Register"
            element={
              <Register
                onOtpSent={() => window.location.replace('/VerifyOtp')}
                setUserData={setUserData}
              />
            }
          />
 {/* Verify OTP - now handles both registration and password reset */}
          <Route 
            path="/VerifyOtp" 
            element={<VerifyOtp userData={userData} />} 
          />
          {/* Add this new route */}
          <Route 
            path="/forgot-password" 
            element={<PasswordResetFlow />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
