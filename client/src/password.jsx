import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PasswordResetFlow = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const verificationInputs = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // DeepSeek color palette
  const colors = {
    primary: '#1768AC',
    primaryLight: '#1E88E5',
    primaryDark: '#0D47A1',
    backgroundLight: '#E3F2FD',
    background: '#FFFFFF',
    success: '#4CAF50',
    error: '#F44336',
    text: '#333333',
    textLight: '#666666'
  };

  // Password strength checks
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    number: false,
    uppercase: false,
    special: false
  });

  const [passwordStrength, setPasswordStrength] = useState({
    width: '25%',
    color: colors.error,
    text: 'Weak',
    textColor: colors.error
  });

  const [passwordMatch, setPasswordMatch] = useState({
    match: false,
    message: '',
    visible: false
  });

  // Handle step navigation
  const goToStep = (step) => {
    setCurrentStep(step);
    setError('');
  };

  // Handle form submissions
  const handleResetRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        goToStep(2);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };
const handleVerificationSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');
  
  // Validate OTP format
  const otp = verificationCode.join('');
  if (!/^\d{6}$/.test(otp)) {
    setError('Please enter a valid 6-digit code');
    setIsLoading(false);
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/verify-reset-otp', { // Changed endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: email.trim(), 
        otp 
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    // On success, move to password reset step
    goToStep(3);
  } catch (error) {
    console.error('Verification error:', error);
    setError(error.message || 'Failed to verify OTP. Please try again.');
    // Clear OTP fields on error
    setVerificationCode(['', '', '', '', '', '']);
    if (verificationInputs.current[0]) {
      verificationInputs.current[0].focus();
    }
  } finally {
    setIsLoading(false);
  }
};
const handleNewPasswordSubmit = async (e) => {
  e.preventDefault();
  
  if (password !== confirmPassword) {
    setPasswordMatch({
      match: false,
      message: "Passwords don't match",
      visible: true
    });
    return;
  }

  setIsLoading(true);
  setError('');
  
  try {
    console.log('Submitting password reset for:', email); // Debug log
    const response = await fetch('http://localhost:5000/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: email.trim(),
        newPassword: password,
        confirmPassword 
      }),
    });

    const data = await response.json();
    console.log('Reset response:', data); // Debug log
    
    if (!response.ok) {
      throw new Error(data.message || 'Password reset failed');
    }

    // On success, move to completion step
    goToStep(4);
  } catch (error) {
    console.error('Password reset error:', error);
    setError(error.message || 'Failed to reset password. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
  // Handle verification code input
  const handleVerificationInput = (e, index) => {
    const newCode = [...verificationCode];
    newCode[index] = e.target.value;
    setVerificationCode(newCode);

    if (e.target.value && index < 5) {
      verificationInputs.current[index + 1].focus();
    }
  };

  const handleVerificationKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      verificationInputs.current[index - 1].focus();
    }
  };

  // Handle password visibility toggle
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Check password strength
  useEffect(() => {
    const hasLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    setPasswordChecks({
      length: hasLength,
      number: hasNumber,
      uppercase: hasUppercase,
      special: hasSpecial
    });

    // Calculate strength
    let strength = 0;
    if (hasLength) strength += 25;
    if (hasNumber) strength += 25;
    if (hasUppercase) strength += 25;
    if (hasSpecial) strength += 25;

    // Update strength meter
    if (strength <= 25) {
      setPasswordStrength({
        width: `${strength}%`,
        color: colors.error,
        text: 'Weak',
        textColor: colors.error
      });
    } else if (strength <= 50) {
      setPasswordStrength({
        width: `${strength}%`,
        color: '#FF9800',
        text: 'Fair',
        textColor: '#FF9800'
      });
    } else if (strength <= 75) {
      setPasswordStrength({
        width: `${strength}%`,
        color: '#FFC107',
        text: 'Good',
        textColor: '#FFC107'
      });
    } else {
      setPasswordStrength({
        width: `${strength}%`,
        color: colors.success,
        text: 'Strong',
        textColor: colors.success
      });
    }
  }, [password]);

  // Check password match
  useEffect(() => {
    if (confirmPassword) {
      if (password === confirmPassword) {
        setPasswordMatch({
          match: true,
          message: 'Passwords match',
          visible: true
        });
      } else {
        setPasswordMatch({
          match: false,
          message: "Passwords don't match",
          visible: true
        });
      }
    } else {
      setPasswordMatch({
        match: false,
        message: '',
        visible: false
      });
    }
  }, [password, confirmPassword]);

  // Resend verification code
  const handleResendCode = async () => {
    setVerificationCode(['', '', '', '', '', '']);
    verificationInputs.current[0].focus();
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to resend OTP');
    }
  };

  // Helper function to update checkmark
  const updateCheck = (isValid) => {
    return {
      backgroundColor: isValid ? colors.success : 'transparent',
      borderColor: isValid ? colors.success : '#D1D5DB'
    };
  };

  return (
    <div 
      className="flex items-center justify-center min-h-screen p-4"
      style={{ 
        background: `linear-gradient(135deg, ${colors.background}, ${colors.backgroundLight})`,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      <div className="max-w-md w-full">
        {/* Progress Bar */}
        <div className="bg-gray-100 rounded-full mb-6 overflow-hidden">
          <div 
            className="h-1.5 transition-all duration-500 ease-in-out" 
            style={{ 
              width: `${currentStep * 25}%`,
              backgroundColor: colors.primary
            }}
          />
        </div>
        
        {/* Step Indicator */}
        <div className="flex justify-between mb-6 text-sm" style={{ color: colors.primary }}>
          <div className={currentStep >= 1 ? "font-semibold" : "opacity-50"}>Request Reset</div>
          <div className={currentStep >= 2 ? "font-semibold" : "opacity-50"}>Verification</div>
          <div className={currentStep >= 3 ? "font-semibold" : "opacity-50"}>New Password</div>
          <div className={currentStep >= 4 ? "font-semibold" : "opacity-50"}>Complete</div>
        </div>
        
        {/* Card Container */}
        <div 
          className="bg-white rounded-xl p-8 shadow-lg transition-all duration-300 ease-in-out"
          style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)' }}
        >
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 rounded-lg text-center" style={{ backgroundColor: '#FFEBEE', color: colors.error }}>
              {error}
            </div>
          )}

          {/* Logo Placeholder */}
          <div className="flex justify-center mb-6">
            <svg className="w-12 h-12" fill={colors.primary} viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm-1-5a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm0-3a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" clipRule="evenodd"></path>
            </svg>
          </div>
          
          {/* Step 1: Request Password Reset */}
          {currentStep === 1 && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-center mb-2" style={{ color: colors.text }}>Forgot Password?</h2>
              <p className="text-center mb-6" style={{ color: colors.textLight }}>
                Enter your email address and we'll send you a verification code to reset your password.
              </p>
              
              <form onSubmit={handleResetRequest}>
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="your@email.com" 
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="w-full text-white py-3 rounded-lg font-medium transition-all duration-300 ease-in-out hover:translate-y-[-2px] hover:shadow-lg flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryLight})`,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <a 
                  href="/login" 
                  className="text-sm hover:underline"
                  style={{ color: colors.primary }}
                >
                  Back to Login
                </a>
              </div>
            </div>
          )}
          
          {/* Step 2: Verification Code */}
          {currentStep === 2 && (
  <div className="animate-fadeIn">
    <h2 className="text-2xl font-bold text-center mb-2" style={{ color: colors.text }}>Check Your Email</h2>
    <p className="text-center mb-6" style={{ color: colors.textLight }}>
      We've sent a verification code to <span className="font-medium">{email}</span>
    </p>
    
    <form onSubmit={handleVerificationSubmit}>
      <div className="mb-6">
        <label htmlFor="verification-code" className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
          Verification Code
        </label>
        <div className="flex justify-between gap-2">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input 
              key={index}
              type="text" 
              maxLength="1"
              value={verificationCode[index]}
              onChange={(e) => handleVerificationInput(e, index)}
              onKeyDown={(e) => handleVerificationKeyDown(e, index)}
              ref={(el) => (verificationInputs.current[index] = el)}
              className="w-full px-0 py-3 text-center text-xl rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required
              disabled={isLoading}
            />
          ))}
        </div>
      </div>
      
      <button 
        type="submit" 
        className="w-full text-white py-3 rounded-lg font-medium transition-all duration-300 ease-in-out hover:translate-y-[-2px] hover:shadow-lg flex items-center justify-center"
        style={{ 
          background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryLight})`,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying...
          </>
        ) : (
          'Verify Code'
        )}
      </button>
    </form>
    
    <div className="mt-6 text-center">
      <p className="text-sm mb-2" style={{ color: colors.textLight }}>Didn't receive the code?</p>
      <button 
        onClick={handleResendCode}
        className="text-sm hover:underline"
        style={{ color: colors.primary }}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Resend Code'}
      </button>
    </div>
  </div>
)}
          {/* Step 3: Create New Password */}
          {currentStep === 3 && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-center mb-2" style={{ color: colors.text }}>Create New Password</h2>
              <p className="text-center mb-6" style={{ color: colors.textLight }}>
                Your password must be at least 8 characters and include a mix of letters, numbers, and symbols.
              </p>
              
              <form onSubmit={handleNewPasswordSubmit}>
                <div className="mb-4">
                  <label htmlFor="new-password" className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    New Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      id="new-password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required
                    />
                    <button 
                      type="button" 
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-3 text-gray-400"
                    >
                      {showPassword ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Password Strength Indicator */}
                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: colors.textLight }}>Password Strength</span>
                    <span className="text-xs font-medium" style={{ color: passwordStrength.textColor }}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full transition-all duration-300 ease-in-out" 
                      style={{ 
                        width: passwordStrength.width,
                        backgroundColor: passwordStrength.color
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full border mr-2"
                        style={updateCheck(passwordChecks.length)}
                      />
                      <span className="text-xs" style={{ color: colors.textLight }}>8+ characters</span>
                    </div>
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full border mr-2"
                        style={updateCheck(passwordChecks.number)}
                      />
                      <span className="text-xs" style={{ color: colors.textLight }}>Numbers</span>
                    </div>
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full border mr-2"
                        style={updateCheck(passwordChecks.uppercase)}
                      />
                      <span className="text-xs" style={{ color: colors.textLight }}>Uppercase</span>
                    </div>
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full border mr-2"
                        style={updateCheck(passwordChecks.special)}
                      />
                      <span className="text-xs" style={{ color: colors.textLight }}>Special character</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="confirm-password" className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    Confirm Password
                  </label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="confirm-password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required
                  />
                  {passwordMatch.visible && (
                    <p 
                      className="mt-1 text-xs"
                      style={{ 
                        color: passwordMatch.match ? colors.success : colors.error
                      }}
                    >
                      {passwordMatch.message}
                    </p>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="w-full text-white py-3 rounded-lg font-medium transition-all duration-300 ease-in-out hover:translate-y-[-2px] hover:shadow-lg flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryLight})`,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </div>
          )}
          
          {/* Step 4: Success */}
          {currentStep === 4 && (
            <div className="animate-fadeIn text-center">
              <div className="flex justify-center mb-6">
                <div 
                  className="rounded-full p-3"
                  style={{ backgroundColor: `${colors.success}20` }}
                >
                  <svg className="w-12 h-12" fill="none" stroke={colors.success} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>Password Reset Complete!</h2>
              <p className="mb-6" style={{ color: colors.textLight }}>
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              
              <button 
                onClick={() => navigate('/login')}
                className="w-full text-white py-3 rounded-lg font-medium transition-all duration-300 ease-in-out hover:translate-y-[-2px] hover:shadow-lg"
                style={{ 
                  background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryLight})`,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordResetFlow;