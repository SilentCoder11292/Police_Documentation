import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
      // Wait 1.5s for user to read success message, then transition
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
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  // Handle backspace in OTP boxes
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current is empty, clear and focus previous
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs[index - 1].current.focus();
      } else {
        // Just clear current box
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  // Handle OTP paste action (splits and populates all boxes)
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return; // verify exactly 6 digits

    const digits = pastedData.split('');
    setOtp(digits);
    // Focus last box
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(15,30,54,0.6),rgba(0,0,0,0))] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center justify-center text-center">
          {/* Mock Emblem / Security Shield Badge */}
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-gold-500/30 flex items-center justify-center glow-subtle mb-4">
            <Shield className="w-9 h-9 text-gold-500" />
          </div>
          
          <h2 className="text-xs uppercase tracking-[0.25em] font-medium text-gold-500 mb-1">
            Government of Bihar
          </h2>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white font-serif">
            Digital Record Room Portal
          </h1>
          <p className="mt-2 text-xs text-slate-400 max-w-[280px]">
            Bihar State Police Headquarters &bull; Secure Access Node
          </p>
        </div>

        {/* Security Warning Banner */}
        <div className="bg-slate-900/60 border-l-2 border-red-500 p-3 rounded-r-md flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-normal font-mono">
            <strong>WARNING:</strong> AUTHORIZED ACCESS ONLY. Unauthorized access attempts are monitored, logged, and subject to prosecution under Sec 66 of IT Act.
          </p>
        </div>

        {/* Auth Forms Box */}
        <div className="glass-panel rounded-xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          
          {/* Subtle Accent Stripe at the top of the form box */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600"></div>

          {/* Step 1: Username & Password */}
          {step === 1 && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-white">Administrator Log In</h3>
                <p className="text-xs text-slate-400 mt-1">Please authenticate with your gateway credentials.</p>
              </div>

              {/* Status Notifications */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                    System Username
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 transition-all font-mono"
                      placeholder="e.g., bihar_sp_09"
                      disabled={loading || success}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                    Security Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 transition-all"
                      placeholder="••••••••"
                      disabled={loading || success}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full mt-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-slate-950 font-semibold text-sm py-3 px-4 rounded-lg shadow-lg hover:shadow-gold-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Validating Credentials...' : 'Verify Identity'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Step 2: 2FA / OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-gold-500" />
                  Secondary Security Verification
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  A 6-digit verification code has been sent to your registered mobile number.
                </p>
              </div>

              {/* Status Notifications */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}



              {/* Separated 6-Digit input boxes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-3 text-center">
                  6-Digit OTP Code
                </label>
                <div className="flex justify-between items-center gap-2 max-w-xs mx-auto">
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
                      className="w-10 h-12 text-center bg-slate-950 border border-slate-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 rounded-lg text-lg text-white font-mono font-bold focus:outline-none transition-all"
                      disabled={loading || success}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-slate-950 font-semibold text-sm py-3 px-4 rounded-lg shadow-lg hover:shadow-gold-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? 'Authorizing Access...' : 'Verify Code & Access Portal'}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  disabled={loading || success}
                  className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Return to Primary Login
                </button>
              </div>
            </form>
          )}
          
        </div>

        {/* Footer Disclaimer */}
        <div className="text-center text-[10px] text-slate-500 leading-relaxed max-w-sm mx-auto">
          &copy; 2026 Department of Home Affairs, State Govt.
          <br />
          System: Bihar State Police Digitization Project Node 1.
        </div>

      </div>
    </div>
  );
}
