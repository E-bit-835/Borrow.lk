import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MarketplaceHeader } from '../components/marketplace/MarketplaceHeader';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { CATEGORY_DEFS, getCategory } from '../data/categories';

const HOST_CATEGORIES = CATEGORY_DEFS.filter((c) => c.listingType === 'rental').map((c) => c.name);
const SERVICE_CATEGORIES = getCategory('services')!.subcategories;

const inputClass =
  'w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#001A48]/20 focus:border-[#001A48]';
const labelClass = 'block text-xs font-semibold text-slate-700 mb-1.5';

interface BecomePartnerPageProps {
  kind: 'host' | 'provider';
}

/**
 * "Become a Host" / "Become a Provider": adds a capability to the signed-in account.
 * The user keeps the same login, profile and notifications; no second account is created.
 */
export const BecomePartnerPage: React.FC<BecomePartnerPageProps> = ({ kind }) => {
  const navigate = useNavigate();
  const { user, becomeHost, becomeProvider } = useAuth();
  const isHostFlow = kind === 'host';
  const status = (isHostFlow ? user?.hostStatus : user?.providerStatus) || 'none';
  const title = isHostFlow ? 'Become a Host' : 'Become a Service Provider';
  const workspace = isHostFlow ? '/host' : '/provider';

  // Step 1: basic information (prefilled from the existing account)
  const [phone, setPhone] = useState(user?.phone || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [city, setCity] = useState(user?.city || '');
  // Step 2: host / service information
  const [hostType, setHostType] = useState<'individual' | 'business'>('individual');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [categories, setCategories] = useState<string[]>([]);
  const [about, setAbout] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [description, setDescription] = useState('');
  const [experience, setExperience] = useState('');
  // Step 3: verification, Step 4: terms
  const [nicNumber, setNicNumber] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const toggleCategory = (cat: string) =>
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  const validate = () => {
    const next: Record<string, string> = {};
    if (phone.trim().length < 8) next.phone = 'Enter a valid phone number';
    if (district.trim().length < 2) next.district = 'District is required';
    if (city.trim().length < 2) next.city = 'City is required';
    if (isHostFlow) {
      if (categories.length === 0) next.categories = 'Choose at least one category';
      if (hostType === 'business' && !businessName.trim()) next.businessName = 'Business name is required';
    } else {
      if (!serviceCategory) next.serviceCategory = 'Choose a service category';
      if (description.trim().length < 10) next.description = 'Describe your service (at least 10 characters)';
    }
    if (!acceptTerms) next.acceptTerms = 'You must accept the platform terms to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      const base = {
        phone: phone.trim(),
        district: district.trim(),
        city: city.trim(),
        businessName: businessName.trim() || undefined,
        nicNumber: nicNumber.trim() || undefined,
        acceptTerms: true as const,
      };
      const updated = isHostFlow
        ? await becomeHost({ ...base, hostType, categories, about: about.trim() || undefined })
        : await becomeProvider({
            ...base,
            serviceCategory,
            description: description.trim(),
            experience: experience.trim() || undefined,
          });

      const newStatus = isHostFlow ? updated.hostStatus : updated.providerStatus;
      if (newStatus === 'approved') {
        navigate(workspace, { replace: true });
      }
      // Otherwise the pending state below is shown from the refreshed profile
    } catch (err: any) {
      const fieldErrors: Record<string, string> = {};
      for (const d of err?.details || []) fieldErrors[d.field] = d.message;
      setErrors({ ...fieldErrors, general: err?.message || 'Could not submit your application. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (name: string) =>
    errors[name] ? <p className="mt-1 text-xs text-red-500 font-medium">{errors[name]}</p> : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <MarketplaceHeader />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-left">
          <h1 className="text-2xl font-bold text-[#001A48] tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isHostFlow
              ? 'Rent out your items, property or vehicles.'
              : 'Offer your services to customers on Borrow.lk.'}{' '}
            This is added to your existing account ({user?.email}). You keep the same login and profile.
          </p>

          {status === 'approved' ? (
            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                You are an approved {isHostFlow ? 'host' : 'service provider'}.
              </div>
              <PrimaryButton onClick={() => navigate(workspace)} className="w-full sm:w-auto">
                Open {isHostFlow ? 'Host' : 'Provider'} Dashboard
              </PrimaryButton>
            </div>
          ) : status === 'pending' ? (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <Clock className="w-5 h-5 text-amber-600" />
                Application submitted. Status: Pending review
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Our team is reviewing your details. You can keep renting as usual, and you will be able to
                create {isHostFlow ? 'rental' : 'service'} listings as soon as you are approved.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-7">
              {status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5">
                  Your previous application was not approved. You can update your details and apply again.
                </div>
              )}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5">
                  {errors.general}
                </div>
              )}

              {/* Step 1 */}
              <section className="space-y-3">
                <h2 className="text-sm font-bold text-slate-900">1. Basic information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="bp-phone" className={labelClass}>Phone</label>
                    <input id="bp-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07X XXX XXXX" className={inputClass} autoComplete="tel" />
                    {fieldError('phone')}
                  </div>
                  <div>
                    <label htmlFor="bp-district" className={labelClass}>District</label>
                    <input id="bp-district" type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Colombo" className={inputClass} />
                    {fieldError('district')}
                  </div>
                  <div>
                    <label htmlFor="bp-city" className={labelClass}>City</label>
                    <input id="bp-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Colombo 03" className={inputClass} />
                    {fieldError('city')}
                  </div>
                </div>
              </section>

              {/* Step 2 */}
              {isHostFlow ? (
                <section className="space-y-3">
                  <h2 className="text-sm font-bold text-slate-900">2. Host information</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {(['individual', 'business'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setHostType(t)}
                        aria-pressed={hostType === t}
                        className={`py-2.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                          hostType === t
                            ? 'bg-[#001A48] text-white border-[#001A48]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {t === 'individual' ? 'Individual' : 'Registered Business'}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label htmlFor="bp-business" className={labelClass}>
                      Business / display name {hostType === 'individual' && <span className="text-slate-400 font-normal">(optional)</span>}
                    </label>
                    <input id="bp-business" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
                    {fieldError('businessName')}
                  </div>
                  <div>
                    <span className={labelClass}>What will you rent out?</span>
                    <div className="flex flex-wrap gap-2">
                      {HOST_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          aria-pressed={categories.includes(cat)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                            categories.includes(cat)
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    {fieldError('categories')}
                  </div>
                  <div>
                    <label htmlFor="bp-about" className={labelClass}>About you as a host <span className="text-slate-400 font-normal">(optional)</span></label>
                    <textarea id="bp-about" rows={3} value={about} onChange={(e) => setAbout(e.target.value)} className={inputClass} />
                  </div>
                </section>
              ) : (
                <section className="space-y-3">
                  <h2 className="text-sm font-bold text-slate-900">2. Your service</h2>
                  <div>
                    <label htmlFor="bp-service" className={labelClass}>Service category</label>
                    <select id="bp-service" value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} className={inputClass}>
                      <option value="">Select a category</option>
                      {SERVICE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {fieldError('serviceCategory')}
                  </div>
                  <div>
                    <label htmlFor="bp-description" className={labelClass}>Service description</label>
                    <textarea id="bp-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you offer, and where?" className={inputClass} />
                    {fieldError('description')}
                  </div>
                  <div>
                    <label htmlFor="bp-experience" className={labelClass}>Experience / details <span className="text-slate-400 font-normal">(optional)</span></label>
                    <textarea id="bp-experience" rows={2} value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Years of experience, qualifications, tools..." className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="bp-business" className={labelClass}>Business / display name <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input id="bp-business" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
                  </div>
                </section>
              )}

              {/* Step 3 */}
              <section className="space-y-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  3. Verification <ShieldCheck className="w-4 h-4 text-teal-600" />
                </h2>
                <div>
                  <label htmlFor="bp-nic" className={labelClass}>NIC number <span className="text-slate-400 font-normal">(optional, speeds up review)</span></label>
                  <input id="bp-nic" type="text" value={nicNumber} onChange={(e) => setNicNumber(e.target.value)} className={inputClass} />
                </div>
              </section>

              {/* Step 4 */}
              <section>
                <h2 className="text-sm font-bold text-slate-900 mb-2">4. Platform terms</h2>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 w-4 h-4"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    I agree to the Borrow.lk {isHostFlow ? 'Host' : 'Provider'} Terms, including accurate listings,
                    fair pricing and responding to requests.
                  </span>
                </label>
                {fieldError('acceptTerms')}
              </section>

              {/* Step 5 */}
              <PrimaryButton type="submit" loading={submitting} className="w-full">
                Submit Application
              </PrimaryButton>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
