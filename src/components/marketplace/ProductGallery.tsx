import React, { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, title }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  const fallbackImg =
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-4">
      {/* Large Featured Main Image */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs group">
        <img
          src={images[activeIdx] || fallbackImg}
          alt={`${title} - view ${activeIdx + 1}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImg;
          }}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
        />

        {/* Counter Badge */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
          {activeIdx + 1} / {images.length}
        </div>
      </div>

      {/* Row of Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border-2 transition-all cursor-pointer ${
                activeIdx === idx
                  ? 'border-teal-500 ring-2 ring-teal-500/30 shadow-sm'
                  : 'border-transparent hover:border-slate-300 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
