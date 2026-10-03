import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthCard } from '../components/auth/AuthCard';
import { InputField } from '../components/auth/InputField';
import { PasswordField } from '../components/auth/PasswordField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { CaptchaBox } from '../components/auth/CaptchaBox';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
    captcha?: string;
    general?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!isCaptchaVerified) {
      newErrors.captcha = 'Please check the box to confirm you are human';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      await register({
        name: fullName,
        email,
        password,
      });
      // Return to where the visitor was heading (e.g. the listing they wanted to rent)
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setErrors({ general: err.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      topHeaderAction={{
        prompt: 'Already have an account?',
        linkText: 'Log In',
        href: '/login',
      }}
    >
      <AuthCard
        showBackLink={true}
        backTo="/"
        backLabel="Back to Home"
        showLogo={true}
        title="Create your account"
        subtitle="Join Borrow.lk and find what you need in one place."
        maxWidth="max-w-[430px]"
      >
        <form onSubmit={handleSignUp} noValidate className="space-y-1">
          {/* General Error Banner */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
              <p className="text-xs text-red-600 font-medium">{errors.general}</p>
            </div>
          )}

          {/* Full Name */}
          <InputField
            id="signup-name"
            label="Full Name"
            type="text"
            icon={<User className="w-4 h-4" />}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
            }}
            placeholder="John Doe"
            error={errors.fullName}
            autoComplete="name"
          />

          {/* Email */}
          <InputField
            id="signup-email"
            label="Email"
            type="email"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="you@example.com"
            error={errors.email}
            autoComplete="email"
          />

          {/* Password */}
          <PasswordField
            id="signup-password"
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="••••••••••"
            error={errors.password}
            helperText={!errors.password ? 'Must be at least 8 characters long.' : undefined}
            showLeftIcon={true}
            autoComplete="new-password"
          />

          {/* Confirm Password */}
          <PasswordField
            id="signup-confirm-password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            placeholder="••••••••••"
            error={errors.confirmPassword}
            showLeftIcon={true}
            autoComplete="new-password"
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

          {/* Terms and Privacy Policy Checkbox */}
          <div className="pt-1 pb-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-left select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: undefined }));
                }}
                className="mt-0.5 rounded border-slate-300 text-[#001A48] focus:ring-[#001A48] w-4 h-4"
              />
              <span className="text-[12px] text-slate-600 leading-snug">
                I agree to the{' '}
                <a href="#terms" className="text-[#001A48] font-semibold hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#privacy" className="text-[#001A48] font-semibold hover:underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.agreeTerms}</p>
            )}
          </div>

          {/* Primary Create Account Button */}
          <div className="pt-1">
            <PrimaryButton type="submit" loading={loading}>
              Create Account
            </PrimaryButton>
          </div>


        </form>
      </AuthCard>
    </AuthLayout>
  );
};
