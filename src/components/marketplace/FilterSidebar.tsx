import React from 'react';
import { RotateCcw, Filter } from 'lucide-react';
import { CATEGORY_DEFS, DISTRICTS, getCategory } from '../../data/categories';
import { useMarketplace } from '../../context/MarketplaceContext';

const heading = 'text-xs font-bold uppercase tracking-wider text-slate-500';
const control =
  'w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-teal-500';

export const FilterSidebar: React.FC = () => {
  const { filters, setFilters, updateFilter, resetFilters } = useMarketplace();
  const category = getCategory(filters.category);
  const isService = category?.listingType === 'service';

  // Category-specific filters only make sense inside their category, so changing it clears them
  const selectCategory = (slug: string) =>
    setFilters((prev) => ({ ...prev, category: slug, subcategory: 'all', specs: {} }));

  const setSpec = (label: string, value: string) =>
    setFilters((prev) => {
      const specs = { ...prev.specs };
      if (value) specs[label] = value;
      else delete specs[label];
      return { ...prev, specs };
    });

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-slate-200/90 p-5 space-y-5 text-left shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#001A48]" />
          <h3 className="text-sm font-extrabold text-[#001A48]">Filters</h3>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Category */}
      <div className="space-y-2.5">
        <h4 className={heading}>Category</h4>
        <div className="space-y-1.5">
          {[{ slug: 'all', name: 'All Categories' }, ...CATEGORY_DEFS].map((cat) => (
            <label key={cat.slug} className="flex items-center gap-2 text-xs text-slate-700 hover:text-[#001A48] cursor-pointer">
              <input
                type="radio"
                name="category_filter"
                checked={filters.category === cat.slug}
                onChange={() => selectCategory(cat.slug)}
                className="text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <span className={filters.category === cat.slug ? 'font-bold text-[#001A48]' : ''}>{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Subcategory */}
      {category && (
        <div className="space-y-2.5 pt-4 border-t border-slate-100">
          <h4 className={heading}>{isService ? 'Service Type' : 'Subcategory'}</h4>
          <select
            value={filters.subcategory}
            onChange={(e) => updateFilter('subcategory', e.target.value)}
            className={`${control} cursor-pointer`}
            aria-label="Subcategory"
          >
            <option value="all">All {category.name}</option>
            {category.subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Location */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100">
        <h4 className={heading}>{isService ? 'Service Location' : 'Location'}</h4>
        <select
          value={filters.location}
          onChange={(e) => updateFilter('location', e.target.value)}
          className={`${control} cursor-pointer`}
          aria-label="District"
        >
          <option value="all">All Sri Lanka</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d.toLowerCase()}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Price */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100">
        <h4 className={heading}>Max Price (Rs.)</h4>
        <input
          type="number"
          min={0}
          step={500}
          value={filters.maxPrice ?? ''}
          onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
          placeholder="Any"
          className={control}
          aria-label="Maximum price"
        />
      </div>

      {/* Category-specific filters */}
      {category &&
        category.fields
          .filter((f) => f.filter)
          .map((field) => (
            <div key={field.label} className="space-y-2.5 pt-4 border-t border-slate-100">
              <h4 className={heading}>{field.label}</h4>
              {field.type === 'select' ? (
                <select
                  value={filters.specs[field.label] || ''}
                  onChange={(e) => setSpec(field.label, e.target.value)}
                  className={`${control} cursor-pointer`}
                  aria-label={field.label}
                >
                  <option value="">Any</option>
                  {field.options!.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={filters.specs[field.label] || ''}
                  onChange={(e) => setSpec(field.label, e.target.value)}
                  placeholder="Any"
                  className={control}
                  aria-label={field.label}
                />
              )}
            </div>
          ))}

      {/* Rating */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100">
        <h4 className={heading}>Rating</h4>
        <select
          value={filters.minRating}
          onChange={(e) => updateFilter('minRating', Number(e.target.value))}
          className={`${control} cursor-pointer`}
          aria-label="Minimum rating"
        >
          <option value={0}>Any rating</option>
          <option value={4}>4.0 and above</option>
          <option value={4.5}>4.5 and above</option>
        </select>
      </div>

      {/* Availability & verification */}
      <div className="space-y-2 pt-4 border-t border-slate-100">
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.availableOnly}
            onChange={(e) => updateFilter('availableOnly', e.target.checked)}
            className="rounded-sm text-teal-600 focus:ring-teal-500 cursor-pointer"
          />
          <span>Available now</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => updateFilter('verifiedOnly', e.target.checked)}
            className="rounded-sm text-teal-600 focus:ring-teal-500 cursor-pointer"
          />
          <span>{isService ? 'Verified providers only' : 'Verified hosts only'}</span>
        </label>
      </div>
    </aside>
  );
};
