 import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, email } = location.state || {};
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const inputsRef = useRef([]);
  
  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };
  
  // In VerifyOtp component, update the handleVerify function
// In VerifyOtp component, update the navigation logic
const handleVerify = async (e) => {
  e.preventDefault();
  const fullOtp = otp.join('');
  
  try {
    setLoading(true);
    const response = await axios.post('http://localhost:5000/verify-otp', {
      ...userData,
      otp: fullOtp,
      purpose: 'register'
    });
    
    setMessage({ 
      text: response.data.message || 'Verification successful!', 
      type: 'success' 
    });
    setShowResend(false);
    
    // Store token and user data
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userRole', response.data.user.role);
      localStorage.setItem('profileCompleted', response.data.user.profileCompleted ? 'true' : 'false');
    }
    
    // Store verification status
    localStorage.setItem('otpVerified', 'true');
    localStorage.setItem('userEmail', userData.email);
    
    setTimeout(() => {
      const userRole = userData?.role || response.data.user?.role;
      
      // Check if profile needs to be completed
      if (response.data.user && response.data.user.profileCompleted) {
        // Profile already completed, go to dashboard
        if (userRole === 'student') {
          navigate('/student-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        // Navigate to appropriate profile completion page based on role
        if (userRole === 'student') {
          navigate('/student-profile', { 
            state: { 
              userData: userData || response.data.user, 
              verified: true,
              role: userRole 
            } 
          });
        } else {
          navigate('/alumni-profile', { 
            state: { 
              userData: userData || response.data.user, 
              verified: true,
              role: userRole 
            } 
          });
        }
      }
    }, 2000);
    
  } catch (error) {
    setMessage({ 
      text: error.response?.data?.message || 'OTP verification failed.', 
      type: 'error' 
    });
    setShowResend(true);
  } finally {
    setLoading(false);
  }
};
  
  const handleResend = async () => {
    try {
      setLoading(true);
      await axios.post('http://localhost:5000/send-otp', {
        ...userData,
        purpose: 'register'
      });
      setOtp(['', '', '', '', '', '']);
      inputsRef.current[0].focus();
      setMessage({ 
        text: 'OTP resent successfully!', 
        type: 'success' 
      });
      setShowResend(false);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Failed to resend OTP.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify Your Account</h2>
          <p className="text-gray-600">
            We emailed the 6-digit code to <strong className="text-blue-600">{email}</strong>
          </p>
          <p className="text-gray-600 mt-1">Enter the code below to confirm your email</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-3 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700 border-l-4 border-red-500' : 'bg-green-100 text-green-700 border-l-4 border-green-500'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-between space-x-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                ref={(el) => (inputsRef.current[index] = el)}
                className={`w-12 h-12 text-center text-2xl font-semibold rounded-lg border ${
                  message.type === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                disabled={loading}
              />
            ))}
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'VERIFY'}
          </button>
        </form>

        {showResend && (
          <div className="mt-4 text-center text-gray-600">
            Didn't receive a code?{' '}
            <button
              onClick={handleResend}
              className="text-blue-600 font-medium hover:text-blue-800 focus:outline-none"
              disabled={loading}
            >
              RESEND
            </button>
          </div>
        )}

        {message.type === 'success' && (
          <div className="mt-6 p-3 bg-blue-50 text-blue-700 rounded-lg text-center">
            Redirecting...
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyOtp