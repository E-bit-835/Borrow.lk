import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Car,
  Wrench,
  Laptop,
  Shirt,
  BookOpen,
  Building2,
  Sofa,
  MoreHorizontal,
  Package,
} from 'lucide-react';
import type { Category } from '../../data/marketplaceData';

interface CategoryCardProps {
  category: Category;
  /** Live number of listings in this category, when known */
  count?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, count }) => {
  const renderIcon = (name: string) => {
    switch (name) {
      case 'Building2':
        return <Building2 className="w-6 h-6 text-[#001A48]" />;
      case 'Car':
        return <Car className="w-6 h-6 text-[#001A48]" />;
      case 'Camera':
        return <Camera className="w-6 h-6 text-[#001A48]" />;
      case 'Sofa':
        return <Sofa className="w-6 h-6 text-[#001A48]" />;
      case 'Laptop':
        return <Laptop className="w-6 h-6 text-[#001A48]" />;
      case 'Shirt':
        return <Shirt className="w-6 h-6 text-[#001A48]" />;
      case 'Wrench':
        return <Wrench className="w-6 h-6 text-[#001A48]" />;
      case 'BookOpen':
        return <BookOpen className="w-6 h-6 text-[#001A48]" />;
      case 'MoreHorizontal':
        return <MoreHorizontal className="w-6 h-6 text-[#001A48]" />;
      default:
        return <Package className="w-6 h-6 text-[#001A48]" />;
    }
  };

  return (
    <Link
      to={`/marketplace?category=${category.slug}`}
      className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-500/80 hover:shadow-md transition-all duration-200 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-teal-50/70 border border-slate-100 group-hover:border-teal-200 flex items-center justify-center transition-colors mb-3">
        {renderIcon(category.iconName)}
      </div>
      <h3 className="text-xs sm:text-sm font-bold text-[#001A48] group-hover:text-teal-700 transition-colors">
        {category.name}
      </h3>
      {count !== undefined && (
        <p className="text-[11px] font-medium text-slate-400 mt-1">
          {count} listing{count === 1 ? '' : 's'}
        </p>
      )}
    </Link>
  );
};
