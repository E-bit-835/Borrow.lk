import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthCard } from '../components/auth/AuthCard';
import { PrimaryButton } from '../components/auth/PrimaryButton';

export const VerifyMobile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Pre-fill with registered email if available
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email address is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(undefined);
    setLoading(true);

    try {
      await api.post('/auth/send-otp', { email: trimmedEmail });
      // Store email for OTP verification page
      sessionStorage.setItem('borrowlk_verify_email', trimmedEmail);
      navigate('/verify-otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthLayout>
      <AuthCard
        showBackLink={false}
        showLogo={true}
        title="Verify your email"
        subtitle="We'll send a 6-digit verification code to your email"
        maxWidth="max-w-[420px]"
        className="text-center"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
          <div className="space-y-2">
            {/* Email Input */}
            <div>
              <label htmlFor="verify-email" className="block text-left text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="verify-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(undefined);
                  }}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    error
                      ? 'border-red-300 focus:ring-red-500 bg-red-50/50'
                      : 'border-slate-300 focus:ring-[#001A48] bg-white'
                  }`}
                />
              </div>
              {error && (
                <p className="mt-1 text-xs text-red-500 font-medium text-left">{error}</p>
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 text-left leading-relaxed px-0.5">
              By verifying your email, you agree to our{' '}
              <a href="#terms" className="text-[#001A48] font-medium hover:underline">
                Terms and Conditions
              </a>
              .
            </p>
          </div>

          <div className="pt-2">
            <PrimaryButton type="submit" loading={loading} className="w-full text-sm font-semibold">
              Send verification code
            </PrimaryButton>
          </div>

          <div className="pt-3 text-center text-xs text-slate-500">
            <span>Already have an account? </span>
            <Link
              to="/login"
              className="text-[#001A48] font-semibold hover:underline transition-colors"
            >
              Log in
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};
