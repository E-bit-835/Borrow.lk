import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Home, Car, Camera, Armchair, Laptop, Shirt, Wrench, BookOpen, Layers, Upload, X, ArrowLeft, CheckCircle2,
} from 'lucide-react';
import { ProviderLayout } from '../../components/provider/ProviderLayout';
import { PageHeader, Card, Button } from '../../components/admin/adminUi';
import { hostService, type HostListing } from '../../services/host';
import { useAuth } from '../../context/AuthContext';
import {
  CATEGORY_DEFS, DISTRICTS, PRICE_UNIT_OPTIONS, getCategory, provinceOf, type PriceUnit,
} from '../../data/categories';

const ICONS: Record<string, typeof Home> = {
  property: Home, vehicle: Car, electronics: Camera, furniture: Armchair, computers: Laptop,
  fashion: Shirt, services: Wrench, books: BookOpen, other: Layers,
};
const input =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]';
const label = 'block text-xs font-semibold text-slate-700 mb-1.5';
const toLines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const MAX_PHOTOS = 8;

const Section: React.FC<{ step: number; title: string; hint?: string; children: React.ReactNode }> = ({ step, title, hint, children }) => (
  <Card className="p-5 sm:p-6">
    <div className="flex items-start gap-3 mb-4">
      <span className="w-7 h-7 rounded-full bg-[#001A48] text-white text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
    </div>
    {children}
  </Card>
);

/** Create or edit a rental / service listing. One page, top to bottom, saved to the server. */
export const ProviderCreateListingPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isHost, isProvider } = useAuth();

  // Hosts publish the rental categories, providers publish Services
  const categories = CATEGORY_DEFS.filter((c) => (c.listingType === 'service' ? isProvider : isHost));
  const initial =
    (searchParams.get('type') === 'service' && categories.find((c) => c.listingType === 'service')) || categories[0] || CATEGORY_DEFS[0];

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [category, setCategory] = useState(initial.name);
  const [subcategory, setSubcategory] = useState(initial.subcategories[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState<Record<string, string>>({});
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [priceUnit, setPriceUnit] = useState<PriceUnit>(initial.priceUnits[0]);
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [city, setCity] = useState('');
  const [included, setIncluded] = useState('');
  const [terms, setTerms] = useState('');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const def = getCategory(category) || initial;
  const isService = def.listingType === 'service';

  // Edit: load the listing (the server only returns it to its owner)
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    hostService
      .listing(id)
      .then((l: HostListing) => {
        if (cancelled) return;
        setCategory(l.category);
        setSubcategory(l.subcategory || (getCategory(l.category)?.subcategories[0] ?? ''));
        setTitle(l.title);
        setDescription(l.description);
        setDetails(l.specifications || {});
        setImages(l.images);
        setPriceUnit(l.priceUnit);
        setPrice(String(l.pricePerDay));
        setDeposit(l.deposit ? String(l.deposit) : '');
        setDistrict(l.district);
        setCity(l.location);
        setIncluded(l.includedItems.join('\n'));
        setTerms(l.rentalTerms.join('\n'));
      })
      .catch((err) => !cancelled && setLoadError(err.message || 'Could not load this listing.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const selectCategory = (name: string) => {
    const next = getCategory(name);
    if (!next || next.name === category) return;
    setCategory(next.name);
    setSubcategory(next.subcategories[0]);
    setPriceUnit(next.priceUnits[0]);
    setDetails({});
  };

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!/^https?:\/\//i.test(url)) return setErrors((e) => ({ ...e, images: 'Paste a full image link starting with https://.' }));
    if (images.length >= MAX_PHOTOS) return;
    setImages((prev) => [...prev, url]);
    setImageUrl('');
    setErrors((e) => ({ ...e, images: '' }));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setErrors((e) => ({ ...e, images: '' }));
    try {
      for (const file of Array.from(files).slice(0, MAX_PHOTOS - images.length)) {
        const url = await hostService.uploadImage(file);
        setImages((prev) => [...prev, url]);
      }
    } catch (err: any) {
      setErrors((e) => ({ ...e, images: err.message || 'Could not upload this photo.' }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 5) next.title = 'Give your listing a clear title (at least 5 characters).';
    if (description.trim().length < 20) next.description = 'Describe it in at least 20 characters.';
    if (images.length === 0) next.images = 'Add at least one photo.';
    if (priceUnit !== 'quote' && !(Number(price) > 0)) next.price = 'Enter a price greater than zero.';
    if (deposit && Number(deposit) < 0) next.deposit = 'The deposit cannot be negative.';
    if (!city.trim()) next.city = 'Enter the city or area.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload = {
      title: title.trim(),
      subcategory,
      images,
      // A quoted service still needs a stored number; the unit tells customers it is a custom quote
      pricePerDay: priceUnit === 'quote' ? Number(price) || 1 : Number(price),
      priceUnit,
      deposit: isService ? 0 : Number(deposit) || 0,
      location: city.trim(),
      district,
      province: provinceOf(district),
      description: description.trim(),
      specifications: Object.fromEntries(Object.entries(details).filter(([, v]) => String(v).trim() !== '')),
      includedItems: toLines(included),
      rentalTerms: toLines(terms),
    };

    setSaving(true);
    setErrors({});
    try {
      if (isEdit) await hostService.updateListing(id!, payload);
      else await hostService.createListing({ ...payload, category: def.name });
      navigate('/provider/listings');
    } catch (err: any) {
      const fieldErrors: Record<string, string> = {};
      for (const d of err?.details || []) fieldErrors[d.field] = d.message;
      setErrors({ ...fieldErrors, general: err.message || 'Could not save the listing. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (name: string) => (errors[name] ? <p className="mt-1 text-xs font-medium text-rose-600">{errors[name]}</p> : null);

  if (loading || loadError) {
    return (
      <ProviderLayout>
        <Card className="p-12 text-center space-y-3">
          <p className="text-sm text-slate-600">{loadError || 'Loading listing...'}</p>
          {loadError && <Button onClick={() => navigate('/provider/listings')}>Back to My Listings</Button>}
        </Card>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <PageHeader
        title={isEdit ? 'Edit listing' : 'Add a listing'}
        description={isEdit ? 'Update the details customers see.' : 'Fill in the sections below, then publish. It takes a few minutes.'}
      >
        <Button onClick={() => navigate('/provider/listings')}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} noValidate className="space-y-5 max-w-3xl">
        {errors.general && (
          <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl px-4 py-3">
            {errors.general}
          </div>
        )}

        <Section step={1} title="Category" hint={isEdit ? 'The category cannot be changed after a listing is created.' : 'What are you listing?'}>
          {isEdit ? (
            <p className="text-sm font-semibold text-slate-800">{def.name}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {categories.map((c) => {
                const Icon = ICONS[c.slug];
                const selected = c.name === category;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => selectCategory(c.name)}
                    aria-pressed={selected}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      selected ? 'border-[#001A48] bg-[#001A48]/[0.04] ring-1 ring-[#001A48]' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`p-2 rounded-lg ${selected ? 'bg-[#001A48] text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                    {selected && <CheckCircle2 className="w-4 h-4 text-[#001A48] ml-auto" />}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-4 max-w-xs">
            <label htmlFor="lf-sub" className={label}>{isService ? 'Service type' : 'Subcategory'}</label>
            <select id="lf-sub" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className={`${input} cursor-pointer`}>
              {def.subcategories.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </Section>

        <Section step={2} title="Details" hint="A clear title and honest description get more requests.">
          <div className="space-y-4">
            <div>
              <label htmlFor="lf-title" className={label}>Title</label>
              <input
                id="lf-title"
                type="text"
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isService ? 'e.g. Professional Driver for Tours and Airport Transfers' : 'e.g. 2 Bedroom Furnished Apartment in Havelock Town'}
                className={input}
              />
              {fieldError('title')}
            </div>
            <div>
              <label htmlFor="lf-description" className={label}>Description</label>
              <textarea id="lf-description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
              {fieldError('description')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {def.fields.map((f) => (
                <div key={f.label}>
                  <label htmlFor={`lf-${f.label}`} className={label}>
                    {f.label} <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  {f.type === 'select' ? (
                    <select
                      id={`lf-${f.label}`}
                      value={details[f.label] || ''}
                      onChange={(e) => setDetails((p) => ({ ...p, [f.label]: e.target.value }))}
                      className={`${input} cursor-pointer`}
                    >
                      <option value="">Select</option>
                      {f.options!.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`lf-${f.label}`}
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={details[f.label] || ''}
                      onChange={(e) => setDetails((p) => ({ ...p, [f.label]: e.target.value }))}
                      placeholder={f.placeholder || ''}
                      className={input}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section step={3} title="Photos" hint={`Add up to ${MAX_PHOTOS}. The first photo is the cover.`}>
          {images.length > 0 && (
            <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
              {images.map((src, i) => (
                <li key={`${src}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-[#001A48] text-white text-[10px] font-bold">Cover</span>}
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label={`Remove photo ${i + 1}`}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-slate-700 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {images.length < MAX_PHOTOS && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
              <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload photos'}
              </Button>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                placeholder="or paste an image link"
                aria-label="Image link"
                className={`${input} flex-1`}
              />
              <Button onClick={addImageUrl} disabled={!imageUrl.trim()}>Add link</Button>
            </div>
          )}
          {fieldError('images')}
        </Section>

        <Section step={4} title="Price" hint="Customers do not pay through BorrowLK. You agree payment with them directly.">
          <div className="space-y-4">
            <div>
              <span className={label}>{isService ? 'How do you charge?' : 'Rental period'}</span>
              <div className="flex flex-wrap gap-2">
                {def.priceUnits.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setPriceUnit(u)}
                    aria-pressed={priceUnit === u}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                      priceUnit === u ? 'bg-[#001A48] text-white border-[#001A48]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {PRICE_UNIT_OPTIONS[u]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {priceUnit !== 'quote' && (
                <div>
                  <label htmlFor="lf-price" className={label}>Price (Rs.)</label>
                  <input id="lf-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={input} />
                  {fieldError('price')}
                  {fieldError('pricePerDay')}
                </div>
              )}
              {!isService && (
                <div>
                  <label htmlFor="lf-deposit" className={label}>
                    Refundable deposit (Rs.) <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input id="lf-deposit" type="number" min={0} value={deposit} onChange={(e) => setDeposit(e.target.value)} className={input} />
                  {fieldError('deposit')}
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section step={5} title="Location" hint={isService ? 'Where you are based.' : 'Where the item is.'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lf-district" className={label}>District</label>
              <select id="lf-district" value={district} onChange={(e) => setDistrict(e.target.value)} className={`${input} cursor-pointer`}>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lf-city" className={label}>City / area</label>
              <input id="lf-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Colombo 05" className={input} />
              {fieldError('city')}
              {fieldError('location')}
            </div>
          </div>
        </Section>

        <Section step={6} title="Extras" hint="Optional. Write one item per line.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lf-included" className={label}>
                {isService ? 'What the service covers' : def.slug === 'property' ? 'Amenities' : 'What is included'}
              </label>
              <textarea id="lf-included" rows={4} value={included} onChange={(e) => setIncluded(e.target.value)} placeholder={'Wi-Fi\nParking'} className={input} />
            </div>
            <div>
              <label htmlFor="lf-terms" className={label}>
                {isService ? 'Service terms' : def.slug === 'property' ? 'House rules' : 'Rental terms'}
              </label>
              <textarea id="lf-terms" rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder={'No smoking\nReturn clean'} className={input} />
            </div>
          </div>
        </Section>

        <div className="flex items-center justify-end gap-2 pb-4">
          <Button onClick={() => navigate('/provider/listings')}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || uploading}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Publish listing'}
          </Button>
        </div>
      </form>
    </ProviderLayout>
  );
};
