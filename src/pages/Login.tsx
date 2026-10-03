import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthCard } from '../components/auth/AuthCard';
import { InputField } from '../components/auth/InputField';
import { PasswordField } from '../components/auth/PasswordField';
import { PrimaryButton } from '../components/auth/PrimaryButton';

import { CaptchaBox } from '../components/auth/CaptchaBox';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const location = useLocation();
  // Set by guards / "Rent Now" / "Post an Ad" when a guest needs to sign in first
  const { from, message } = (location.state as { from?: string; message?: string } | null) || {};

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [loading, setLoading] = useState(false);


  // Errors state
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    captcha?: string;
    general?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isCaptchaVerified) {
      newErrors.captcha = 'Please check the box to confirm you are human';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      const res = await login(email, password);
      // Strictly separate Admin login from User login
      if (res.user.role === 'admin') {
        // Admin was authenticated but must use the Admin Portal — clear auth state
        logout();
        setErrors({ general: 'This page is for Renters & Providers. Please use the Admin Portal to log in.' });
        return;
      }
      // One login for every account: continue where the user was heading, else the customer dashboard
      // (host / provider dashboards are offered from there according to the account's capabilities)
      navigate(from || '/dashboard', { replace: true });
    } catch (err: any) {
      setErrors({ general: err.message || 'Invalid email or password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };



  return (
    <AuthLayout
      topHeaderAction={{
        prompt: "Don't have an account?",
        linkText: 'Create an account',
        href: '/signup',
      }}
    >
      <AuthCard
        showBackLink={true}
        backTo="/"
        backLabel="Back to Home"
        showLogo={true}
        title="Welcome back"
        subtitle="Log in to continue to Borrow.lk"
        maxWidth="max-w-[430px]"
      >
        <form onSubmit={handleLogin} noValidate className="space-y-1">
          {/* Why the visitor was sent here */}
          {message && !errors.general && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2">
              <p className="text-xs text-[#001A48] font-medium">{message}</p>
            </div>
          )}

          {/* General Error Banner */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
              <p className="text-xs text-red-600 font-medium">{errors.general}</p>
            </div>
          )}

          {/* Email Address */}
          <InputField
            id="login-email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="Enter your email"
            error={errors.email}
            autoComplete="email"
          />

          {/* Password */}
          <PasswordField
            id="login-password"
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="Enter your password"
            error={errors.password}
            showLeftIcon={false}
            autoComplete="current-password"
            rightLabelAction={
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </Link>
            }
          />

          {/* reCAPTCHA v2 Widget */}
          <CaptchaBox
            checked={isCaptchaVerified}
            onChange={(checked) => {
              setIsCaptchaVerified(checked);
              if (errors.captcha) setErrors((prev) => ({ ...prev, captcha: undefined }));
            }}
            error={errors.captcha}
          />

          {/* Primary Login Button */}
          <div className="pt-2">
            <PrimaryButton type="submit" loading={loading}>
              Log In
            </PrimaryButton>
          </div>



          {/* Bottom create an account section inside card */}
          <div className="pt-3 text-center">
            <p className="text-xs text-slate-500 mb-2">Don't have an account?</p>
            <PrimaryButton
              variant="outline"
              type="button"
              onClick={() => navigate('/signup', { state: { from } })}
              className="w-full text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Create an account
            </PrimaryButton>
          </div>

          <div className="pt-3 text-center border-t border-slate-100 mt-3">
            <p className="text-[11px] text-slate-500">
              Are you an Administrator?{' '}
              <Link to="/admin/login" className="text-amber-600 font-bold hover:underline">
                Admin Portal Login &rarr;
              </Link>
            </p>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};
