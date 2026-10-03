import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, LogOut } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { PageHeader, Card, Button } from '../../components/admin/adminUi';
import { useAuth } from '../../context/AuthContext';
import { meService } from '../../services/me';

const input =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]';
const label = 'block text-xs font-semibold text-slate-700 mb-1.5';

export const CustomerSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setChanged(false);
    if (!current) return setError('Enter your current password.');
    if (next.length < 8) return setError('The new password must be at least 8 characters.');
    if (next !== confirm) return setError('The new passwords do not match.');

    setSaving(true);
    try {
      await meService.changePassword(current, next);
      setChanged(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: any) {
      setError(err.message || 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <DashboardLayout>
      <PageHeader title="Settings" description="Password and sign-in." />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-5 sm:p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Change password</h2>
          <form onSubmit={handleChange} noValidate className="space-y-4 max-w-md">
            <div>
              <label htmlFor="st-current" className={label}>Current password</label>
              <input id="st-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={input} autoComplete="current-password" />
            </div>
            <div>
              <label htmlFor="st-new" className={label}>New password</label>
              <input id="st-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} className={input} autoComplete="new-password" />
              <p className="text-[11px] text-slate-400 mt-1">At least 8 characters.</p>
            </div>
            <div>
              <label htmlFor="st-confirm" className={label}>Confirm new password</label>
              <input id="st-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} autoComplete="new-password" />
            </div>

            {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
            {changed && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Password changed.
              </p>
            )}
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Change password'}
            </Button>
          </form>
        </Card>

        <Card className="p-5 self-start space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Signed in as</h2>
          <div>
            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500 break-all">{user?.email}</p>
          </div>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
};
