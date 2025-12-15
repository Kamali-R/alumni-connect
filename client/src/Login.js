 import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './index.css';

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // eslint-disable-next-line no-unused-vars
const [showPwd, setShowPwd] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (location.state?.error) {
      setMessage(location.state.error);
    }
    
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error === 'google_auth_failed') {
      setMessage('Google authentication failed. Please try again or use a different method.');
    } else if (error === 'authentication_failed') {
      setMessage('Authentication failed. Please try again.');
    } else if (error === 'auth_failed') {
      setMessage('Authentication failed. Please try again.');
    }
  }, [location]);
  
 // In login.js - update the handleLogin function
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage('');
  // Local default admin shortcut: bypass server and sign in locally
  if (email === 'admin@ac.com' && password === 'admin') {
    try {
      // Make a real API call to create a proper admin session
      const response = await axios.post('http://localhost:5000/login', {
        email: 'admin@ac.com',
        password: 'admin',
      });
      
      if (response.data.token) {
        // Use real token from server
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userRole', response.data.user.role);
        localStorage.setItem('profileCompleted', 'true');
        setLoading(false);
        navigate('/admin-dashboard');
        return;
      }
    } catch (error) {
      // If server login fails, fall back to local admin
      console.log('⚠️ Server admin login failed, using local admin mode');
      const adminUser = { id: 'admin', name: 'Admin', role: 'admin', profileCompleted: true };
      localStorage.setItem('token', 'admin-local-token');
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('userRole', adminUser.role);
      localStorage.setItem('profileCompleted', 'true');
      setLoading(false);
      navigate('/admin-dashboard');
      return;
    }
  }
  
  try {
    const response = await axios.post('http://localhost:5000/login', {
      email,
      password,
    });
    
    console.log('🔍 LOGIN RESPONSE:', response.data);
    
    // Save token and user data
    const token = response.data.token;
    const user = response.data.user;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('profileCompleted', user.profileCompleted);
    
    setMessage('Login successful! Redirecting...');
    
    // SIMPLE REDIRECT LOGIC
    // If the account is admin (or the fallback default admin credentials), send to admin dashboard
    if (user.role === 'admin' || (email === 'admin@ac.com' && password === 'admin')) {
      navigate('/admin-dashboard');
      return;
    }

    if (user.role === 'student') {
      if (user.profileCompleted) {
        console.log('✅ Student with complete profile -> Dashboard');
        navigate('/student-dashboard');
      } else {
        console.log('❌ Student with incomplete profile -> Profile');
        navigate('/student-profile');
      }
    } else {
      if (user.profileCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/alumni-profile');
      }
    }
      
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.response?.status === 404) {
      setMessage('Account not found. Redirecting to signup...');
      setTimeout(() => {
        navigate('/register', {
          state: { prefillEmail: email }
        });
      }, 1500);
    } else if (error.response) {
      setMessage(error.response.data.message);
    } else if (error.request) {
      setMessage("Network error. Please check your connection.");
    } else {
      setMessage("Something went wrong. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};
  const handleGoogleLogin = () => {
    console.log('Initiating Google login...');
    setMessage('Redirecting to Google...');
    // Redirect to Google OAuth
    window.location.href = 'http://localhost:5000/auth/google';
  };
  
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '400px',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
      }}>
        <div style={{ textAlign:'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', margin: 0 }}>
            Login <span style={{ fontWeight: '500' }}>to get started</span>
          </h2>
        </div>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                opacity: loading ? 0.7 : 1
              }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                opacity: loading ? 0.7 : 1
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px',
            flexWrap: 'nowrap',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
              padding: 0,
              height: '20px',
            }}>
              <input
                type="checkbox"
                id="showPassword"
                checked={showPwd}
                onChange={() => setShowPwd(!showPwd)}
                disabled={loading}
                style={{ margin: 0 }}
              />
              <label htmlFor="showPassword" style={{ fontSize: '14px', color: '#666' }}>
                Show Password
              </label>
            </div>
            
            <a
              href="/forgot-password"
              style={{
                fontSize: '14px',
                color: '#1a3eea',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Forgot Password?
            </a>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#ccc' : '#0024ff',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '6px',
              border: 'none',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          {message && (
            <p style={{
              color: message.toLowerCase().includes('successful') ? 'green' : 'red',
              textAlign: 'center',
              marginTop: '15px',
              fontSize: '14px'
            }}>
              {message}
            </p>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <hr style={{ flex: 1, border: 'none', height: '1px', backgroundColor: '#ccc' }} />
            <span style={{ margin: '0 10px', color: '#888', fontWeight: 'bold' }}>or</span>
            <hr style={{ flex: 1, border: 'none', height: '1px', backgroundColor: '#ccc' }} />
          </div>
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              disabled={loading}
              style={{
                padding: '12px',
                width: '100%',
                backgroundColor: loading ? '#f0f0f0' : '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: loading ? '#888' : '#000',
                fontWeight: '500',
                opacity: loading ? 0.7 : 1
              }}
              onClick={handleGoogleLogin}
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                width="20"
                height="20"
              />
              {loading ? 'Please wait...' : 'Sign in with Google'}
            </button>
          </div>
          
          <p style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '14px'
          }}>
            Don't have an account?{' '}
            <a 
              href="/register" 
              style={{ 
                color: '#1a3eea', 
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Sign Up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;