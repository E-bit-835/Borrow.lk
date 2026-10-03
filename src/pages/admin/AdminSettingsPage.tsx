import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PageHeader, Card, Badge, Button, useAdminData, formatDate } from '../../components/admin/adminUi';
import { adminService } from '../../services/admin';
import { useAuth } from '../../context/AuthContext';

const input =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]';
const label = 'block text-xs font-semibold text-slate-700 mb-1.5';

export const AdminSettingsPage: React.FC = () => {
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useAdminData(() => adminService.users({ role: 'admin' }), []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreated(null);
    if (name.trim().length < 2) return setFormError('Enter the administrator’s full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setFormError('Enter a valid email address.');
    if (password.length < 8) return setFormError('The password must be at least 8 characters.');

    setSaving(true);
    try {
      await adminService.createAdmin({ name: name.trim(), email: email.trim(), password });
      setCreated(email.trim());
      setName('');
      setEmail('');
      setPassword('');
      await reload();
    } catch (err: any) {
      setFormError(err.message || 'Could not create the administrator.');
    } finally {
      setSaving(false);
    }
  };

  const admins = data || [];

  return (
    <AdminLayout>
      <PageHeader title="Settings" description="Manage who can access this admin console." />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-3 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80">
            <h2 className="text-sm font-bold text-slate-900">Administrators</h2>
          </div>
          {error ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-slate-600">{error}</p>
              <Button onClick={reload}>Try again</Button>
            </div>
          ) : admins.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">{loading ? 'Loading...' : 'No administrators found.'}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {admins.map((a) => (
                <li key={a.id} className="px-5 py-3.5 flex items-center gap-3">
                  <img src={a.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {a.name} {a.id === me?.id && <span className="text-slate-400 font-normal">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{a.email}</p>
                  </div>
                  {a.suspended ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}
                  <span className="hidden sm:block text-xs text-slate-400 shrink-0">
                    {a.createdAt ? `Added ${formatDate(a.createdAt)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="xl:col-span-2 p-5 self-start">
          <h2 className="text-sm font-bold text-slate-900">Add an administrator</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Administrators can manage every user, listing and request. Only add people you trust.
          </p>

          <form onSubmit={handleCreate} noValidate className="space-y-3.5">
            <div>
              <label htmlFor="admin-name" className={label}>Full name</label>
              <input id="admin-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={input} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="admin-new-email" className={label}>Email</label>
              <input id="admin-new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="admin-new-password" className={label}>Temporary password</label>
              <input
                id="admin-new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={input}
                autoComplete="new-password"
              />
              <p className="text-[11px] text-slate-400 mt-1">At least 8 characters. Share it with them privately.</p>
            </div>

            {formError && <p role="alert" className="text-xs font-semibold text-rose-600">{formError}</p>}
            {created && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Administrator {created} created.
              </p>
            )}

            <Button type="submit" variant="primary" disabled={saving} className="w-full">
              {saving ? 'Creating...' : 'Create administrator'}
            </Button>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};
