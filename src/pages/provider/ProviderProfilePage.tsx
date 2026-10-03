import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { ProviderLayout } from '../../components/provider/ProviderLayout';
import { PageHeader, Card, Badge, Button } from '../../components/admin/adminUi';
import { useAuth } from '../../context/AuthContext';
import { DISTRICTS } from '../../data/categories';

const input =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]';
const label = 'block text-xs font-semibold text-slate-700 mb-1.5';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80';

export const ProviderProfilePage: React.FC = () => {
  const { user, updateProfile, isHost, isProvider } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [district, setDistrict] = useState(user?.district || 'Colombo');
  const [city, setCity] = useState(user?.city || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (name.trim().length < 2) return setError('Enter your name.');
    if (phone.trim().length < 8) return setError('Enter a phone number customers can reach you on.');
    if (avatar.trim() && !/^https?:\/\//i.test(avatar.trim())) return setError('The photo must be a link starting with https://.');

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        businessName: businessName.trim(),
        phone: phone.trim(),
        district,
        city: city.trim(),
        ...(avatar.trim() ? { avatar: avatar.trim() } : {}),
      });
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const previewAvatar = /^https?:\/\//i.test(avatar.trim()) ? avatar.trim() : user?.avatar || DEFAULT_AVATAR;

  return (
    <ProviderLayout>
      <PageHeader title="Profile" description="This is what customers see next to your listings.">
        {user && (
          <Link to={`/providers/${user.id}`} target="_blank">
            <Button>
              <ExternalLink className="w-4 h-4" />
              View public profile
            </Button>
          </Link>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-5 sm:p-6">
          <form onSubmit={handleSave} noValidate className="space-y-5">
            <div className="flex items-center gap-4">
              <img src={previewAvatar} alt="" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <label htmlFor="hp-avatar" className={label}>Photo link</label>
                <input id="hp-avatar" type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." className={input} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="hp-name" className={label}>Your name</label>
                <input id="hp-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={input} autoComplete="name" />
              </div>
              <div>
                <label htmlFor="hp-business" className={label}>
                  Business / display name <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input id="hp-business" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={input} />
              </div>
              <div>
                <label htmlFor="hp-phone" className={label}>Phone</label>
                <input id="hp-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} autoComplete="tel" />
              </div>
              <div>
                <label htmlFor="hp-email" className={label}>Email</label>
                <input id="hp-email" type="email" value={user?.email || ''} disabled className={`${input} bg-slate-50 text-slate-500`} />
              </div>
              <div>
                <label htmlFor="hp-district" className={label}>District</label>
                <select id="hp-district" value={district} onChange={(e) => setDistrict(e.target.value)} className={`${input} cursor-pointer`}>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="hp-city" className={label}>City / area</label>
                <input id="hp-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className={input} />
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
          <h2 className="text-sm font-bold text-slate-900">What you can do</h2>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">Rent out items (Host)</span>
            {isHost ? <Badge tone="green">Approved</Badge> : <Link to="/become-host" className="text-teal-700 font-semibold hover:underline">Apply</Link>}
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">Offer services (Provider)</span>
            {isProvider ? <Badge tone="green">Approved</Badge> : <Link to="/become-provider" className="text-teal-700 font-semibold hover:underline">Apply</Link>}
          </div>
          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            Both use this same account. You never need a second login.
          </p>
        </Card>
      </div>
    </ProviderLayout>
  );
};
