import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { PageHeader, Card, Badge, Button } from '../../components/admin/adminUi';
import { useAuth } from '../../context/AuthContext';
import { DISTRICTS } from '../../data/categories';

const input =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]';
const label = 'block text-xs font-semibold text-slate-700 mb-1.5';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80';

export const CustomerProfilePage: React.FC = () => {
  const { user, updateProfile, isHost, isProvider } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [district, setDistrict] = useState(user?.district || 'Colombo');
  const [city, setCity] = useState(user?.city || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!firstName.trim()) return setError('Enter your first name.');
    if (avatar.trim() && !/^https?:\/\//i.test(avatar.trim())) return setError('The photo must be a link starting with https://.');

    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName} ${lastName}`.trim(),
        phone: phone.trim(),
        dob,
        district,
        city: city.trim(),
        address: address.trim(),
        ...(avatar.trim() ? { avatar: avatar.trim() } : {}),
      });
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const preview = /^https?:\/\//i.test(avatar.trim()) ? avatar.trim() : user?.avatar || DEFAULT_AVATAR;

  return (
    <DashboardLayout>
      <PageHeader title="Profile" description="Your details. Hosts and providers see your name and photo when you send a request." />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-5 sm:p-6">
          <form onSubmit={handleSave} noValidate className="space-y-5">
            <div className="flex items-center gap-4">
              <img src={preview} alt="" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <label htmlFor="cp-avatar" className={label}>Photo link</label>
                <input id="cp-avatar" type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." className={input} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cp-first" className={label}>First name</label>
                <input id="cp-first" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={input} autoComplete="given-name" />
              </div>
              <div>
                <label htmlFor="cp-last" className={label}>Last name</label>
                <input id="cp-last" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={input} autoComplete="family-name" />
              </div>
              <div>
                <label htmlFor="cp-email" className={label}>Email</label>
                <input id="cp-email" type="email" value={user?.email || ''} disabled className={`${input} bg-slate-50 text-slate-500`} />
              </div>
              <div>
                <label htmlFor="cp-phone" className={label}>Phone</label>
                <input id="cp-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} autoComplete="tel" />
              </div>
              <div>
                <label htmlFor="cp-dob" className={label}>Date of birth <span className="font-normal text-slate-400">(optional)</span></label>
                <input id="cp-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={input} />
              </div>
              <div>
                <label htmlFor="cp-district" className={label}>District</label>
                <select id="cp-district" value={district} onChange={(e) => setDistrict(e.target.value)} className={`${input} cursor-pointer`}>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cp-city" className={label}>City / area</label>
                <input id="cp-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className={input} />
              </div>
              <div>
                <label htmlFor="cp-address" className={label}>Address <span className="font-normal text-slate-400">(optional)</span></label>
                <input id="cp-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={input} autoComplete="street-address" />
              </div>
            </div>

            {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
            {saved && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Profile saved.
              </p>
            )}
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </Card>

        <Card className="p-5 self-start space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Your account</h2>
          <div className="flex flex-wrap gap-1.5">
            <Badge>Customer</Badge>
            {isHost && <Badge tone="blue">Host</Badge>}
            {isProvider && <Badge tone="purple">Provider</Badge>}
          </div>
          <p className="flex items-center gap-2 text-sm text-slate-700">
            <ShieldCheck className={`w-4 h-4 ${user?.emailVerified ? 'text-emerald-600' : 'text-slate-300'}`} />
            {user?.emailVerified ? 'Email verified' : 'Email not verified yet'}
          </p>
          {user?.memberSince && <p className="text-xs text-slate-500">Member since {user.memberSince.trim()}</p>}
        </Card>
      </div>
    </DashboardLayout>
  );
};
