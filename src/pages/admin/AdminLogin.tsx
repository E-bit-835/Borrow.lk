import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/auth/PrimaryButton';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter your admin credentials.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res.user.role !== 'admin') {
        // Do not leave a non-admin signed in from the admin console
        logout();
        setError('Access Denied: Your account does not have Administrator privileges.');
        return;
      }
      sessionStorage.setItem('borrowlk_admin_access', 'true');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid administrator email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000E26] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Marketplace
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-[#001A48] px-6 py-5 text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Admin Console</h1>
              <p className="text-xs text-slate-300">Sign in with an administrator account</p>
            </div>
          </div>

          <form onSubmit={handleAdminAuth} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@borrow.lk"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <PrimaryButton type="submit" loading={loading} className="w-full">
              <span className="inline-flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Sign in to Admin
              </span>
            </PrimaryButton>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              New admin accounts can only be created by an existing administrator from Admin Settings.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
