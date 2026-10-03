import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthCard } from '../components/auth/AuthCard';
import { OtpInput } from '../components/auth/OtpInput';
import { PrimaryButton } from '../components/auth/PrimaryButton';

export const VerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const verifyEmail = sessionStorage.getItem('borrowlk_verify_email') || '';

  // Mask the email for display: jo***@gmail.com
  const maskedEmail = verifyEmail
    ? verifyEmail.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [countdown, setCountdown] = useState(30);
  const [resendActive, setResendActive] = useState(false);
  const [resendNotification, setResendNotification] = useState(false);

  // Live countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendActive(true);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!resendActive || !verifyEmail) return;
    setResendActive(false);
    setCountdown(30);

    try {
      await api.post('/auth/send-otp', { email: verifyEmail });
      setResendNotification(true);
      setTimeout(() => setResendNotification(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (!verifyEmail) {
      setError('Email not found. Please go back and enter your email.');
      return;
    }

    setError(undefined);
    setLoading(true);

    try {
      await api.post('/auth/verify-otp', { email: verifyEmail, otp });
      // Refresh user profile to get updated email_verified status
      await refreshUser();
      // Clean up
      sessionStorage.removeItem('borrowlk_verify_email');
      sessionStorage.setItem('borrowlk_email_verified', 'true');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthLayout>
      <AuthCard
        showBackLink={false}
        showLogo={true}
        title="Enter verification code"
        subtitle={`We sent a 6-digit verification code to\n${maskedEmail}`}
        maxWidth="max-w-[420px]"
        className="text-center"
      >
        <form onSubmit={handleVerify} noValidate className="space-y-4 pt-1">
          {/* OTP Input Boxes */}
          <div className="space-y-2">
            <OtpInput
              value={otp}
              onChange={(val) => {
                setOtp(val);
                if (error) setError(undefined);
              }}
              length={6}
              error={!!error}
            />

            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}

            {resendNotification && (
              <p className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>A new code has been sent!</span>
              </p>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <PrimaryButton
              type="submit"
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              className="w-full text-sm font-semibold"
            >
              Verify email
            </PrimaryButton>
          </div>

          {/* Countdown & Resend Option */}
          <div className="pt-3 space-y-1.5 text-xs text-slate-500 text-center">
            <p>
              Didn't receive the code?{' '}
              {resendActive ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-[#001A48] font-bold hover:underline cursor-pointer"
                >
                  Resend code
                </button>
              ) : (
                <span>
                  Resend code in{' '}
                  <span className="font-semibold text-slate-700">
                    00:{countdown < 10 ? `0${countdown}` : countdown}
                  </span>
                </span>
              )}
            </p>

            <p>
              Wrong email?{' '}
              <Link
                to="/verify-mobile"
                className="text-[#001A48] font-semibold hover:underline"
              >
                Change email
              </Link>
            </p>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};
