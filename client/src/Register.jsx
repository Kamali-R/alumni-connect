import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const Register = ({setUserData}) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation(); 
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const from = params.get('from');
    const name = params.get('name');
    const email = params.get('email');
    if (error === 'not_found') {
      setMessage({
        text: 'No account found for this Google email. Please complete your signup.',
        type: 'error',
      });
    }
    // Prefill name/email if provided (e.g., from Google)
    setForm(prev => ({
      ...prev,
      name: name || prev.name,
      email: email || prev.email,
    }));
    
    // Check if role is passed in location state (from homepage buttons)
    if (location.state?.role) {
      setForm(prev => ({ ...prev, role: location.state.role }));
    }
  }, [location.search, location.state]);
  
  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!form.role) newErrors.role = 'Please select a role';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // REMOVED the checkUserExists function - let backend handle this

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setMessage({ text: '', type: '' });

      // Send OTP directly without checking user existence first
      // The backend will handle the duplicate check
      const response = await axios.post('http://localhost:5000/send-otp', {
        ...form,
        purpose: 'register'
      });

      setMessage({
        text: response.data.message || 'OTP sent successfully!',
        type: 'success',
      });

      // Store user data for profile completion
      setUserData(form);

      setTimeout(() => {
        navigate('/VerifyOtp', {
          state: {
            userData: form,
            email: form.email,
          },
        });
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to send OTP. Please try again.';
      
      setMessage({
        text: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Register to Alumni Connect</h2>
          <p className="text-gray-600">Enter your details to continue</p>
        </div>
        
        {message.text && (
          <div
            className={`mb-6 p-3 rounded-lg ${
              message.type === 'error'
                ? 'bg-red-100 text-red-700 border-l-4 border-red-500'
                : 'bg-green-100 text-green-700 border-l-4 border-green-500'
            }`}
          >
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="name"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          
          <div>
            <input
              name="email"
              type="email"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
          
          <div>
            <input
              name="password"
              type="password"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>
          
          <div>
            <select
              name="role"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.role ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white`}
              value={form.role}
              onChange={handleChange}
            >
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="alumni">Alumni</option>
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending OTP...
              </span>
            ) : (
              'Send OTP'
            )}
          </button>
          
          <div className="text-center mt-4">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/Login" className="text-blue-600 hover:text-blue-800 font-medium">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;