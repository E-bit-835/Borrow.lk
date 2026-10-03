import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/admin/adminUi';
import { meService } from '../../services/me';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { PageHeader, Card } from '../../components/admin/adminUi';

const SUPPORT_EMAIL = 'support@borrow.lk';

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'How do I rent something or hire a service?',
    a: 'Open a listing, choose your dates, press "Check Availability", then "Request to Rent" or "Request Service". The host or provider accepts or declines, and you see the answer under Requests and My Bookings.',
  },
  {
    q: 'Do I pay through BorrowLK?',
    a: 'No. BorrowLK does not charge customers and takes no payment. The price on a listing is set by the host or provider, and you pay them directly once your request is accepted.',
  },
  {
    q: 'How do I contact a host or provider?',
    a: 'Use "Contact" on the listing page or "Send a message" on your booking. Your conversations are under Messages. Their phone number is shown on your booking once the request is accepted.',
  },
  {
    q: 'Can I cancel a request or booking?',
    a: 'Yes. Open it under Requests or My Bookings and press Cancel. You can cancel any time before the rental or service starts.',
  },
  {
    q: 'How do I rent out my own items or offer a service?',
    a: 'Choose "Become a Host" (items, property, vehicles) or "Become a Provider" (services) in the menu. It is added to this same account, so you keep one login.',
  },
  {
    q: 'When can I leave a review?',
    a: 'After the host or provider marks your booking as completed, open the booking and post your rating and review. You can review each listing once.',
  },
  {
    q: 'Something looks wrong with a listing. What should I do?',
    a: 'Press "Report" on the listing page and tell us what is wrong. Our team reviews every report.',
  },
];

export const HelpSupportPage: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 5) return setError('Tell us a little more so we can help.');
    setState('sending');
    setError(null);
    try {
      await meService.contactSupport(text.trim());
      setText('');
      setState('sent');
    } catch (err: any) {
      setError(err.message || 'Could not send your message.');
      setState('idle');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Help & Support" description="Answers to common questions." />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {FAQ.map((item, i) => {
              const isOpen = open === i;
              return (
                <li key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-50"
                  >
                    <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{item.a}</p>}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5 self-start space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Still need help?</h2>
          <form onSubmit={send} className="space-y-2">
            <label htmlFor="help-message" className="block text-sm text-slate-600">
              Write to our support team. Include your request number if it is about a booking.
            </label>
            <textarea
              id="help-message"
              rows={4}
              maxLength={2000}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setState('idle');
              }}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A48]/15 focus:border-[#001A48]"
            />
            {error && <p role="alert" className="text-xs font-medium text-rose-600">{error}</p>}
            {state === 'sent' && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Sent. We reply in{' '}
                <Link to="/messages" className="underline">
                  Messages
                </Link>
                .
              </p>
            )}
            <Button type="submit" variant="primary" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending...' : 'Send to support'}
            </Button>
          </form>
          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">Or email us:</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:underline">
            <Mail className="w-4 h-4" />
            {SUPPORT_EMAIL}
          </a>
        </Card>
      </div>
    </DashboardLayout>
  );
};
