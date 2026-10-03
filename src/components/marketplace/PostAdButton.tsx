import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Package, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PostAdButtonProps {
  className?: string;
}

/**
 * "Post an Ad" that respects the account state:
 * guest -> sign in, renter -> choose how to list (become host / provider),
 * host or provider -> straight to creation, both -> choose rental or service.
 */
export const PostAdButton: React.FC<PostAdButtonProps> = ({ className }) => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isHost, isProvider } = useAuth();
  const [open, setOpen] = useState(false);

  const rentalPath = isHost ? '/host/listings/create' : '/become-host';
  const servicePath = isProvider ? '/provider/services/create' : '/become-provider';
  const isUpgrade = !isHost && !isProvider;

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: '/become-host', message: 'Create an account to become a Host or Provider.' },
      });
      return;
    }
    if (isAdmin) {
      navigate('/admin/listings');
      return;
    }
    if (isHost && !isProvider) return navigate(rentalPath);
    if (isProvider && !isHost) return navigate(servicePath);
    setOpen(true);
  };

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          'hidden md:flex items-center gap-1.5 px-4 py-2 bg-[#001A48] hover:bg-[#002669] text-white rounded-lg transition-colors text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer'
        }
      >
        <Plus className="w-3.5 h-3.5" />
        Post an Ad
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Post an Ad"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#001A48]">
                  {isUpgrade ? 'How would you like to list?' : 'What would you like to create?'}
                </h2>
                {isUpgrade && (
                  <p className="text-xs text-slate-500 mt-1">
                    Listing uses your existing account. No second sign-up needed.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => go(rentalPath)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-colors text-left cursor-pointer"
              >
                <span className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">
                    {isHost ? 'Create Rental Listing' : 'List an Item, Property or Vehicle for Rent'}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {isHost ? 'Add a new item to your host listings' : 'Become a Host'}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => go(servicePath)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-colors text-left cursor-pointer"
              >
                <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">
                    {isProvider ? 'Create Service Listing' : 'Offer a Service'}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {isProvider ? 'Add a new service to your provider profile' : 'Become a Provider'}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
