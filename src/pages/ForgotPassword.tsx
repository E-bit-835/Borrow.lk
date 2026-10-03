import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, KeyRound, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { BrandLogo } from '../components/auth/BrandLogo';
import { InputField } from '../components/auth/InputField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { authService } from '../services/auth';
import heroImage from '../assets/images/camera-hero.jpg';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(undefined);
    setLoading(true);

    try {
      await authService.forgotPassword(email.trim());
      setIsSubmitted(true);
      sessionStorage.setItem('borrowlk_reset_email', email.trim().toLowerCase());
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-100/90 borrow-card-shadow overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[480px]">
        <div className="relative min-h-[220px] md:min-h-full flex flex-col justify-between p-6 sm:p-8 text-white overflow-hidden bg-slate-900">
          <img
            src={heroImage}
            alt="Borrow.lk rentals"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25"></div>
          <div className="relative z-10">
            <BrandLogo variant="unified" textColor="white" size="md" />
          </div>
          <div className="relative z-10 space-y-2 mt-auto pt-12">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              Secure &amp; Simple Rentals
            </h2>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed font-normal">
              Join Sri Lanka's most trusted peer-to-peer marketplace. Over 10,000+ verified items available today.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-6 text-left">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </Link>
            </div>

            <div className="mb-4">
              <div className="w-11 h-11 rounded-full bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#001A48]">
                <KeyRound className="w-5 h-5" />
              </div>
            </div>

            <div className="text-left mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#001A48] tracking-tight">
                Forgot your password?
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Enter your email and we'll send a one-time code to reset your password.
              </p>
            </div>

            {isSubmitted ? (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 sm:p-5 text-left space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2.5 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Reset code sent</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  If an account exists for <strong className="font-semibold text-emerald-900">{email}</strong>, a 6-digit code has been emailed. Enter it on the next screen with your new password.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <PrimaryButton
                    variant="primary"
                    onClick={() => navigate('/reset-password', { state: { email } })}
                    className="w-full text-xs sm:text-sm"
                  >
                    Proceed to Reset Password &rarr;
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5">
                    {error}
                  </div>
                )}
                <InputField
                  id="forgot-email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(undefined);
                  }}
                  placeholder="you@example.com"
                  error={error && !email ? error : undefined}
                  icon={<Mail className="w-4 h-4" />}
                  autoComplete="email"
                />
                <PrimaryButton type="submit" loading={loading} className="w-full">
                  <span className="inline-flex items-center gap-2">
                    Send Reset Code
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </PrimaryButton>
              </form>
            )}
          </div>

          <div className="pt-6 text-center text-xs text-slate-500">
            <span>Remember your password? </span>
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};
