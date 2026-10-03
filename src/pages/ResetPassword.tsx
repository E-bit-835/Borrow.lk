import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthCard } from '../components/auth/AuthCard';
import { InputField } from '../components/auth/InputField';
import { PasswordField } from '../components/auth/PasswordField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { PasswordRequirement } from '../components/auth/PasswordRequirement';
import { authService } from '../services/auth';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationEmail = (location.state as { email?: string } | null)?.email;

  const [email, setEmail] = useState(
    locationEmail || sessionStorage.getItem('borrowlk_reset_email') || ''
  );
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | undefined>();

  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const allRequirementsMet = hasMinLength && hasUppercase && hasNumberOrSpecial;

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!otp.trim()) {
      newErrors.otp = 'Reset code is required';
    } else if (otp.trim().length < 4) {
      newErrors.otp = 'Enter the 6-digit code from your email';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!allRequirementsMet) {
      newErrors.newPassword = 'Please satisfy all password security requirements';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(undefined);
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      sessionStorage.removeItem('borrowlk_reset_email');
      setIsSuccess(true);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to reset password. Check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout topLeftLogo={true}>
      <AuthCard
        showBackLink={false}
        showLogo={false}
        title="Create a new password"
        subtitle="Enter the email code we sent and choose a strong password."
        maxWidth="max-w-[430px]"
      >
        {isSuccess ? (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-5 text-center space-y-4 animate-fadeIn">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-900">
                Password Reset Successfully!
              </h3>
              <p className="text-xs text-emerald-700 mt-1">
                Your Borrow.lk account password has been updated. You can now log in with your new password.
              </p>
            </div>
            <PrimaryButton
              variant="primary"
              onClick={() => navigate('/login')}
              className="w-full text-sm font-semibold"
            >
              Go to Login
            </PrimaryButton>
          </div>
        ) : (
          <form onSubmit={handleReset} noValidate className="space-y-2 text-left">
            {generalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5 mb-2">
                {generalError}
              </div>
            )}

            <InputField
              id="reset-email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="you@example.com"
              error={errors.email}
              autoComplete="email"
            />

            <InputField
              id="reset-otp"
              label="Reset Code"
              type="text"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (errors.otp) setErrors((prev) => ({ ...prev, otp: undefined }));
              }}
              placeholder="6-digit code"
              error={errors.otp}
              autoComplete="one-time-code"
            />

            <PasswordField
              id="reset-new-password"
              label="New Password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
              }}
              placeholder="Enter new password"
              error={errors.newPassword}
              showLeftIcon={true}
              autoComplete="new-password"
            />

            <div className="py-1 px-0.5 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Password must contain:
              </p>
              <div className="space-y-1.5 pt-0.5 pl-0.5">
                <PasswordRequirement label="At least 8 characters" met={hasMinLength} />
                <PasswordRequirement label="One uppercase letter" met={hasUppercase} />
                <PasswordRequirement label="One number or special character" met={hasNumberOrSpecial} />
              </div>
            </div>

            <div className="pt-2">
              <PasswordField
                id="reset-confirm-password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                placeholder="Confirm new password"
                error={errors.confirmPassword}
                showLeftIcon={true}
                autoComplete="new-password"
              />
            </div>

            <div className="pt-3">
              <PrimaryButton type="submit" loading={loading}>
                Reset Password
              </PrimaryButton>
            </div>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
};
