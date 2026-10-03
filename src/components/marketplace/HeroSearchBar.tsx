import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Layers, ArrowRight } from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { CATEGORIES } from '../../data/marketplaceData';
import { DISTRICTS } from '../../data/categories';

export const HeroSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const { setFilters } = useMarketplace();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    setFilters((prev) => ({
      ...prev,
      keyword,
      category,
      location,
    }));

    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (category !== 'all') params.set('category', category);
    if (location !== 'all') params.set('location', location);

    navigate(`/marketplace?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-2 sm:p-3 max-w-4xl mx-auto w-full transition-all"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-center">
        {/* Field 1: Keyword */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors border sm:border-0 border-slate-100">
          <Search className="w-5 h-5 text-teal-600 shrink-0" />
          <div className="text-left w-full">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              What to rent
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cameras, tools, cars..."
              className="w-full text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden bg-transparent"
            />
          </div>
        </div>

        {/* Field 2: Category */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors border sm:border-0 border-slate-100">
          <Layers className="w-5 h-5 text-teal-600 shrink-0" />
          <div className="text-left w-full">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 focus:outline-hidden bg-transparent cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Field 3: Location */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors border sm:border-0 border-slate-100">
          <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
          <div className="text-left w-full">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 focus:outline-hidden bg-transparent cursor-pointer"
            >
              <option value="all">All Sri Lanka</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d.toLowerCase()}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Field 4: Search Action Button */}
        <div className="px-1 py-1">
          <button
            type="submit"
            className="w-full bg-[#001A48] hover:bg-[#002669] active:bg-[#001438] text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Search Rentals</span>
            <ArrowRight className="w-4 h-4 text-teal-300" />
          </button>
        </div>
      </div>
    </form>
  );
};
