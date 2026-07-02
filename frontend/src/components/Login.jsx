/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
/* Hallmark · component: Login · genre: modern-minimal · theme: custom
 * contrast: pass (40-41) · slop: pass (42-45)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { Shield, Lock, User, KeyRound, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const { loginStep1, verify2FA } = useAuth();
  
  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [tempSessionId, setTempSessionId] = useState('');
  
  // UI & flow states
  const [step, setStep] = useState(1); // 1 = credentials, 2 = 2FA OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Refs for OTP inputs auto-focusing
  const otpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Auto-focus first OTP input when transitioning to step 2
  useEffect(() => {
    if (step === 2 && otpRefs[0].current) {
      otpRefs[0].current.focus();
    }
  }, [step]);

  // Handle credentials form submit (Step 1)
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await loginStep1(username, password);
      setSuccess(data.message);
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle single character change in OTP boxes
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  // Handle backspace in OTP boxes
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs[index - 1].current.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  // Handle OTP paste action
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split('');
    setOtp(digits);
    otpRefs[5].current.focus();
  };

  // Handle 2FA verification submit (Step 2)
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await verify2FA(username, fullOtp);
      setSuccess('Access verified successfully. Directing to your terminal...');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset back to credentials check (Step 1)
  const handleBackToLogin = () => {
    setStep(1);
    setOtp(['', '', '', '', '', '']);
    setTempSessionId('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black text-black dark:text-white px-4 sm:px-6 lg:px-8 relative transition-colors duration-200">
      
      {/* Theme Toggler Segmented Control */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-6">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-lg bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow-sm mb-4 transition-colors">
            <Shield className="w-9 h-9 text-black dark:text-white" />
          </div>
          
          <h2 className="text-xs uppercase tracking-[0.25em] font-extrabold text-gray-600 dark:text-gray-400 mb-1.5 font-sans">
            Government of Bihar
          </h2>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black dark:text-white font-display">
            Digital Record Room
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
            State Police Headquarters &bull; Secure Access Node
          </p>
        </div>

        {/* Security Warning Banner */}
        <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 p-4 rounded-lg flex items-start gap-3 transition-colors">
          <AlertTriangle className="w-5 h-5 text-black dark:text-white shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-mono">
            <strong>WARNING:</strong> AUTHORIZED ACCESS ONLY. Unauthorized access attempts are monitored, logged, and subject to prosecution under Sec 66 of IT Act.
          </p>
        </div>

        {/* Auth Forms Box */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 sm:p-8 relative overflow-hidden transition-all duration-200">
          
          {/* Step 1: Username & Password */}
          {step === 1 && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white font-serif">Administrator Log In</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Please authenticate with your gateway credentials.</p>
              </div>

              {/* Status Notifications */}
              {error && (
                <div className="bg-white dark:bg-black border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-3.5 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-white dark:bg-black border border-green-200 dark:border-green-900 text-green-705 dark:text-green-400 p-3.5 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="username" className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    System Username
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                      <User className="w-4.5 h-4.5" />
                    </span>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-11 pr-4 py-2.5 bg-transparent border border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white rounded-lg text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-all font-mono"
                      placeholder="e.g., bihar_sp_09"
                      disabled={loading || success}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Security Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-2.5 bg-transparent border border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white rounded-lg text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-all"
                      placeholder="••••••••"
                      disabled={loading || success}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full mt-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-bold text-sm py-3 px-4 rounded-lg shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Validating Credentials...' : 'Verify Identity'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Step 2: 2FA / OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2 font-serif">
                  <KeyRound className="w-5 h-5 text-black dark:text-white" />
                  Secondary Verification Gate
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                  A 6-digit verification code has been sent to your registered mobile number.
                </p>
              </div>

              {/* Status Notifications */}
              {error && (
                <div className="bg-white dark:bg-black border border-red-200 dark:border-red-900 text-red-705 dark:text-red-400 p-3.5 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-white dark:bg-black border border-green-200 dark:border-green-900 text-green-705 dark:text-green-400 p-3.5 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Separated 6-Digit input boxes */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4 text-center">
                  6-Digit OTP Code
                </label>
                <div className="flex justify-between items-center gap-3 max-w-xs mx-auto">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={otpRefs[index]}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="w-11 h-14 text-center bg-transparent border border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white rounded-lg text-xl text-black dark:text-white font-mono font-bold focus:outline-none transition-all"
                      disabled={loading || success}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 space-y-4">
                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-bold text-sm py-3 px-4 rounded-lg shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? 'Authorizing Access...' : 'Verify Code & Access Portal'}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  disabled={loading || success}
                  className="w-full text-center text-sm font-semibold text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  Return to Primary Login
                </button>
              </div>
            </form>
          )}
          
        </div>

        {/* Footer Disclaimer */}
        <div className="text-center text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
          &copy; 2026 Department of Home Affairs, State Govt.
          <br />
          System Node: Bihar State Police Digitization Project.
        </div>

      </div>
    </div>
  );
}
