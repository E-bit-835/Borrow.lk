import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { meService } from '../services/me';

export interface SearchFilters {
  keyword: string;
  category: string;
  subcategory: string;
  location: string;
  minPrice?: number;
  maxPrice?: number;
  availableOnly: boolean;
  verifiedOnly: boolean;
  minRating: number;
  /** Category-specific filters, keyed by the field label (e.g. Bedrooms, Fuel Type) */
  specs: Record<string, string>;
  sortBy: 'recommended' | 'price_low' | 'price_high' | 'rating' | 'recent';
}

interface MarketplaceContextType {
  favorites: string[];
  isFavorite: (listingId: string) => boolean;
  /** Saves or removes a listing from the wishlist. Returns false for a guest (the caller should ask them to log in). */
  toggleFavorite: (listingId: string) => boolean;
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: SearchFilters = {
  keyword: '',
  category: 'all',
  subcategory: 'all',
  location: 'all',
  availableOnly: false,
  verifiedOnly: false,
  minRating: 0,
  specs: {},
  sortBy: 'recommended',
};

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  // The wishlist belongs to the account, so it follows sign-in and sign-out
  const accountId = isAuthenticated && user && user.role !== 'admin' ? user.id : null;
  useEffect(() => {
    if (!accountId) {
      setFavorites([]);
      return;
    }
    let cancelled = false;
    meService
      .wishlist()
      .then((items) => !cancelled && setFavorites(items.map((p) => p.id)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accountId]);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

  const toggleFavorite = (id: string) => {
    if (!accountId) return false;
    const saved = favorites.includes(id);
    setFavorites((prev) => (saved ? prev.filter((item) => item !== id) : [...prev, id]));
    // Undo the optimistic change if the server refuses
    (saved ? meService.removeFromWishlist(id) : meService.saveToWishlist(id)).catch(() =>
      setFavorites((prev) => (saved ? [...prev, id] : prev.filter((item) => item !== id)))
    );
    return true;
  };

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <MarketplaceContext.Provider
      value={{
        favorites,
        isFavorite: (id: string) => favorites.includes(id),
        toggleFavorite,
        filters,
        setFilters,
        updateFilter,
        resetFilters,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = (): MarketplaceContextType => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
