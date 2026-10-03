import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  MapPin, 
  Download, 
  RotateCcw, 
  Bot, 
  Check, 
  ChevronDown, 
  CheckCircle2,
  X
} from 'lucide-react';
import { MarketplaceHeader } from '../../components/marketplace/MarketplaceHeader';
import { AiSidebar } from '../../components/ai/AiSidebar';
import { RentalCard } from '../../components/ai/RentalCard';
import { SpecModal } from '../../components/ai/SpecModal';
import { RentalGuideModal } from '../../components/ai/RentalGuideModal';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DISTRICTS } from '../../data/categories';
import type { ProductListing } from '../../services/products';
import type { AiConversation, ChatMessage, AiRentalMatch } from '../../data/aiAssistantData';

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** A fresh conversation with the assistant's greeting. */
function newConversation(location: string): AiConversation {
  return {
    id: `conv-${Date.now()}`,
    title: 'New conversation',
    subtitle: 'Ask about rentals or services',
    timeAgo: 'Just now',
    category: 'general',
    location,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        timestamp: now(),
        text: 'Ayubowan! I’m the BorrowLK assistant. Tell me what you want to rent or who you want to hire, where, and your budget, and I’ll find matching listings. You can also ask how BorrowLK works.',
        suggestionChips: ['A camera for a wedding in Colombo', 'A van for a family trip', 'A plumber in Kandy', 'How do I pay?'],
      },
    ],
  };
}

/** A real listing, in the shape the result cards use. */
function toMatch(p: ProductListing): AiRentalMatch {
  return {
    id: p.id,
    title: p.title,
    category: p.subcategory || p.category,
    providerName: p.provider?.name || 'BorrowLK member',
    providerVerified: Boolean(p.provider?.verified),
    rating: Number(p.rating) || 5,
    reviewsCount: p.reviewsCount || 0,
    image: p.images?.[0] || '',
    locationBadge: p.location,
    district: p.district,
    tags: [p.category, p.listingType === 'service' ? 'Service' : 'Rental'],
    pricePerDay: Number(p.pricePerDay) || 0,
    specifications: p.specifications || {},
    includedItems: p.includedItems || [],
  };
}

const SRI_LANKAN_DISTRICTS = DISTRICTS;

export const AiAssistantPage: React.FC = () => {
  // Conversation state
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<AiConversation[]>(() => [newConversation('Colombo')]);
  const [activeConvId, setActiveConvId] = useState<string>(() => conversations[0].id);
  
  // Input & location state
  const [inputMessage, setInputMessage] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('Colombo');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState<boolean>(false);
  
  // UI & Thinking states
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [inspectMatch, setInspectMatch] = useState<AiRentalMatch | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Inner chat container ref (scrolls only inside the chat, never the window)
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const activeConversation = conversations.find(c => c.id === activeConvId) || conversations[0];

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [activeConversation?.messages, isThinking]);

  // Show auto-dismissing toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Switch conversation
  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    setIsSidebarMobileOpen(false);
  };

  // New conversation
  const handleNewConversation = () => {
    const conv = newConversation(selectedLocation);
    setConversations([conv, ...conversations]);
    setActiveConvId(conv.id);
    setInputMessage('');
    setIsSidebarMobileOpen(false);
  };

  // Clear history
  const handleClearHistory = () => {
    const conv = newConversation(selectedLocation);
    setConversations([conv]);
    setActiveConvId(conv.id);
    showToast('Conversation history cleared');
  };

  // Reset current conversation
  const handleResetCurrent = () => {
    const conv = newConversation(selectedLocation);
    setConversations((prev) => prev.map((c) => (c.id === activeConvId ? conv : c)));
    setActiveConvId(conv.id);
    setInputMessage('');
  };

  // Export conversation transcript
  const handleExport = () => {
    const transcript = activeConversation.messages.map(m => {
      if (m.sender === 'user') {
        return `[User - ${m.timestamp} - ${m.metaLocation || ''}]\n${m.text}`;
      } else {
        const matchesSummary = m.matches ? `\nMatches Found: ${m.matches.map(i => `${i.title} (${i.providerName} - LKR ${i.pricePerDay}/day)`).join('; ')}` : '';
        return `[BorrowLK AI - ${m.timestamp}]\n${m.text || m.matchesDescription || ''}${matchesSummary}`;
      }
    }).join('\n\n---\n\n');

    navigator.clipboard.writeText(transcript);
    showToast('Full conversation transcript copied to clipboard!');
  };

  // Send a message to the assistant
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isThinking) return;

    // The assistant needs an account (it protects a metered AI service)
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/ai-assistant', message: 'Please log in or create an account to use the assistant.' } });
      return;
    }

    const convId = activeConvId;
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: now(),
      metaLocation: selectedLocation,
      userName: user?.name || 'You',
      userAvatar: (user?.name || 'You').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
    };
    const addMessage = (m: ChatMessage, title?: string) =>
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, m], ...(title ? { title, subtitle: selectedLocation } : {}) } : c))
      );

    // The first question names the conversation in the sidebar
    const isFirst = !activeConversation.messages.some((m) => m.sender === 'user');
    addMessage(userMsg, isFirst ? query.slice(0, 40) : undefined);
    setInputMessage('');
    setIsThinking(true);

    // What the assistant has seen so far, oldest first
    const history = [...activeConversation.messages, userMsg]
      .filter((m) => m.text)
      .slice(-10)
      .map((m) => ({ role: m.sender === 'user' ? ('user' as const) : ('assistant' as const), content: m.text! }));
    // The greeting is ours, not part of the conversation the model should continue
    while (history.length && history[0].role === 'assistant') history.shift();

    try {
      const res = await api.post<{ reply: string; listings: ProductListing[] }>('/ai/chat', { messages: history, location: selectedLocation });
      addMessage({
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: now(),
        text: res.reply,
        ...(res.listings.length > 0
          ? { matchesHeading: `${res.listings.length} LISTING${res.listings.length === 1 ? '' : 'S'} FOUND`, matches: res.listings.map(toMatch) }
          : {}),
      });
    } catch (err: any) {
      addMessage({
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: now(),
        text: err?.message || 'Sorry, the assistant is unavailable right now. Please try again in a moment.',
      });
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#F5F6FC] flex flex-col text-slate-800 font-sans antialiased">
      {/* 1. Global Header */}
      {/* Same navigation bar as the rest of the site: it follows the signed-in account (guest, renter, host / provider, admin) */}
      <MarketplaceHeader onToggleSidebar={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)} />

      {/* Main Workspace: Sidebar + Chat Area */}
      <div className="flex-1 flex overflow-hidden relative w-full">
        {/* 2. Left AI Assistant Sidebar (Desktop) */}
        <div className="hidden md:block h-full">
          <AiSidebar
            conversations={conversations}
            activeConversationId={activeConvId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onClearHistory={handleClearHistory}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {isSidebarMobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs"
              onClick={() => setIsSidebarMobileOpen(false)}
            />
            <div className="relative w-64 bg-white h-full shadow-2xl z-10">
              <AiSidebar
                conversations={conversations}
                activeConversationId={activeConvId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                onClearHistory={handleClearHistory}
                onOpenGuide={() => {
                  setIsSidebarMobileOpen(false);
                  setIsGuideOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* 3. Main Chat Container */}
        <main className="flex-1 flex flex-col h-full bg-[#F5F6FC] min-w-0 overflow-hidden">
          {/* Chat Header Bar */}
          <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              {/* Bot Icon Avatar */}
              <div className="w-9 h-9 rounded-xl bg-[#001A48] flex items-center justify-center text-teal-400 shrink-0 shadow-2xs">
                <Bot className="w-5 h-5 text-teal-300" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-xs sm:text-sm text-[#001A48] truncate tracking-tight">
                    BorrowLK AI Assistant
                  </h1>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Agent
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                  Verified peer-to-peer and commercial rental facilitator &bull; Sri Lanka
                </p>
              </div>
            </div>

            {/* Header Right Actions: Export & Reset */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Export Conversation"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                type="button"
                onClick={handleResetCurrent}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Reset Conversation"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Chat Message Scrollable View */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {activeConversation.messages.map((message) => {
              if (message.sender === 'user') {
                return (
                  /* 5. User Message */
                  <div key={message.id} className="flex flex-col items-end space-y-1">
                    <div className="flex items-end gap-2.5 max-w-2xl">
                      <div className="bg-[#001A48] text-white rounded-2xl rounded-br-xs p-3.5 sm:p-4 text-xs sm:text-[13px] leading-relaxed shadow-sm font-normal">
                        {message.text}
                      </div>

                      {/* User Avatar */}
                      <div className="w-8 h-8 rounded-full bg-teal-400 text-teal-950 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-300 shadow-2xs">
                        {message.userAvatar || 'KP'}
                      </div>
                    </div>

                    {message.metaLocation && (
                      <span className="text-[10px] text-slate-400 font-medium pr-10">
                        {message.metaLocation}
                      </span>
                    )}
                  </div>
                );
              }

              /* AI Message Bubble */
              return (
                <div key={message.id} className="flex items-start gap-3 max-w-4xl">
                  {/* AI Circular Avatar */}
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#001A48] flex items-center justify-center text-teal-300 shrink-0 shadow-2xs mt-1">
                    <Bot className="w-4 h-4 text-teal-300" />
                  </div>

                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Welcome message text */}
                    {message.text && (
                      <div className="bg-white rounded-2xl rounded-tl-xs p-4 sm:p-4.5 text-xs sm:text-[13px] text-slate-800 leading-relaxed border border-slate-200/80 shadow-2xs">
                        {message.text}
                      </div>
                    )}

                    {/* 4. Suggestion Chips */}
                    {message.suggestionChips && message.suggestionChips.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
                        {message.suggestionChips.map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(chip.replace(/^[^\w\s]+/, '').trim())}
                            className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 6. AI Verified Matches Section */}
                    {message.matches && message.matches.length > 0 && (
                      <div className="bg-white rounded-2xl rounded-tl-xs p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
                        {message.matchesHeading && (
                          <div className="flex items-center gap-2 text-teal-800 font-extrabold text-xs tracking-tight uppercase">
                            <span className="w-2 h-2 rounded-full bg-teal-600" />
                            <span>{message.matchesHeading}</span>
                          </div>
                        )}

                        {message.matchesDescription && (
                          <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                            {message.matchesDescription}
                          </p>
                        )}

                        {/* 7. Rental Result Cards */}
                        <div className="space-y-3 pt-1">
                          {message.matches.map((match) => (
                            <RentalCard
                              key={match.id}
                              match={match}
                              onInspectSpec={(m) => setInspectMatch(m)}
                              onInstantReserve={(m) => navigate(`/product/${m.id}`)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Thinking Animation */}
            {isThinking && (
              <div className="flex items-center gap-3 max-w-md animate-in fade-in">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#001A48] flex items-center justify-center text-teal-300 shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4 text-teal-300 animate-spin" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-xs py-3 px-4 border border-slate-200/80 shadow-2xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    Searching verified hosts across {selectedLocation}...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 8. Sticky Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-slate-200/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="max-w-4xl mx-auto bg-slate-50 rounded-2xl border border-slate-300/80 p-1.5 sm:p-2 flex items-center gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white transition-all"
            >
              {/* Left Attachment Icon */}
              <button
                type="button"
                onClick={() => showToast('Attachment upload simulated for requirement sheets & IDs')}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors shrink-0 cursor-pointer"
                title="Attach requirements / document"
                aria-label="Attach document"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Main Input Field */}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask BorrowLK AI about camera gear, vehicles, generators, laptops..."
                className="flex-1 bg-transparent border-none text-xs sm:text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none px-1"
              />

              {/* Right Location Chip with Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                  className="hidden sm:inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-teal-600" />
                  <span>{selectedLocation}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isLocationDropdownOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-xs font-semibold text-slate-700 animate-in fade-in slide-in-from-bottom-1">
                    <div className="px-3 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100">
                      Select District / Hub
                    </div>
                    {SRI_LANKAN_DISTRICTS.map((district) => (
                      <button
                        key={district}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(district);
                          setIsLocationDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                          selectedLocation === district ? 'text-teal-700 font-bold bg-teal-50/50' : ''
                        }`}
                      >
                        <span>{district}</span>
                        {selectedLocation === district && <Check className="w-3 h-3 text-teal-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() || isThinking}
                className="w-9 h-9 rounded-xl bg-[#001A48] hover:bg-[#002669] disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                title="Send Message"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 text-white -rotate-12" />
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#001A48] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modals */}
      <SpecModal
        isOpen={!!inspectMatch}
        match={inspectMatch}
        onClose={() => setInspectMatch(null)}
        onReserve={(m) => navigate(`/product/${m.id}`)}
      />

      <RentalGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
