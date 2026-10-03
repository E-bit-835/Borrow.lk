import React from 'react';
import { Sparkles, Plus, BookOpen, Clock, ChevronRight } from 'lucide-react';
import type { AiConversation } from '../../data/aiAssistantData';

interface AiSidebarProps {
  conversations: AiConversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onClearHistory: () => void;
  onOpenGuide: () => void;
}

export const AiSidebar: React.FC<AiSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onClearHistory,
  onOpenGuide
}) => {
  return (
    <aside className="w-[180px] shrink-0 bg-white border-r border-slate-200/90 flex flex-col h-full select-none">
      {/* Top Header & New Conversation */}
      <div className="p-3 border-b border-slate-100 space-y-2.5">
        <div className="flex items-center gap-1.5 px-0.5">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span className="font-extrabold text-[13px] tracking-tight text-[#001A48]">
            BorrowLK AI
          </span>
        </div>

        <button
          type="button"
          onClick={onNewConversation}
          className="w-full bg-[#001A48] hover:bg-[#002669] text-white text-xs font-semibold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Recent Inquiries Section */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="flex items-center justify-between px-1.5 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Recent Inquiries
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Active live feed" />
        </div>

        <div className="space-y-1">
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-2 rounded-lg transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-[#EBF7F5] text-slate-900 border-l-[3px] border-[#007F73] shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[11px] truncate leading-snug ${isActive ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                    {conv.title}
                  </span>
                  <span className={`text-[9px] shrink-0 font-medium ${isActive ? 'text-[#007F73] font-bold' : 'text-slate-400'}`}>
                    {conv.timeAgo}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-tight">
                  {conv.subtitle}
                </p>
              </button>
            );
          })}

          {conversations.length === 0 && (
            <div className="p-3 text-center text-xs text-slate-400">
              No recent inquiries
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 space-y-1.5 text-xs shrink-0">
        <button
          type="button"
          onClick={onClearHistory}
          className="w-full flex items-center justify-between px-2 py-1 rounded text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Clear History</span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </button>

        <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-200/60">
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-teal-700 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3 h-3 text-teal-600" />
            <span>AI Rental Guide</span>
          </button>
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
            LKR v2.4
          </span>
        </div>
      </div>
    </aside>
  );
};
