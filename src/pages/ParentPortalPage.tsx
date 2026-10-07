import React, { useState } from 'react';
import {
  Bell,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ParentDashboard } from '@/features/parent-portal/components/ParentDashboard';
import { WeeklyDigestCard } from '@/features/parent-portal/components/WeeklyDigestCard';
import { NotificationPreferencesPanel } from '@/features/parent-portal/components/NotificationPreferencesPanel';
import { ParentTeacherChatModal } from '@/features/parent-portal/components/ParentTeacherChatModal';
import { ParentService } from '@/features/parent-portal/services/parentService';
import { shortDate } from '@/features/parent-portal/services/portalDates';
import { ParentTeacherChatService } from '@/features/messaging/services/parentTeacherChatService';

type FamilyTab = 'dashboard' | 'digest' | 'messages' | 'preferences';

const TABS: Array<{ id: FamilyTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'digest', label: 'Weekly Digest', icon: FileText },
  { id: 'messages', label: 'Messages', icon: MessageSquareText },
  { id: 'preferences', label: 'Notification Preferences', icon: Bell },
];

export const ParentPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FamilyTab>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(undefined);
  const [digestChildId, setDigestChildId] = useState<string>(() => ParentService.getActiveLinks()[0]?.childId ?? '');

  const profile = ParentService.getProfile();
  const links = ParentService.getActiveLinks();
  const activeDigestLink = links.find(link => link.childId === digestChildId) ?? links[0];
  const digest = activeDigestLink ? ParentService.buildWeeklyDigest(activeDigestLink.childId) : null;
  const threads = ParentTeacherChatService.getThreads();

  const openChat = (threadId?: string) => {
    setActiveThreadId(threadId);
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 container-custom py-8 space-y-6">
        {/* Page Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-education-primary rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> GradeGlow Family
              </span>
              <span className="text-xs font-semibold bg-emerald-400 text-emerald-950 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified Consent &amp; Safety Filtered
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {profile.salutation}
            </h1>

            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              Your parent companion for {links.length === 0 ? 'your family' : links.map(link => link.childName).join(' & ')}:
              attendance, homework completion, subject grades, screen-time limits and bilingual SMS / WhatsApp progress
              digests — all in one place.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-education-primary text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && <ParentDashboard onMessageTeacher={() => openChat(undefined)} />}

        {/* Weekly Digest */}
        {activeTab === 'digest' && (
          <div className="space-y-4">
            {links.length > 1 && (
              <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Select child for digest">
                {links.map(link => {
                  const isActive = link.childId === activeDigestLink?.childId;
                  return (
                    <button
                      key={link.childId}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setDigestChildId(link.childId)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-education-primary text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {link.childName}
                    </button>
                  );
                })}
              </div>
            )}

            {digest ? (
              <WeeklyDigestCard digest={digest} />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-600">
                Link a child to generate the weekly digest.
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Instructor Conversations</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Every message runs through the profanity &amp; PII safety filter before it is delivered.
                </p>
              </div>

              <div className="space-y-3">
                {threads.map(thread => {
                  const lastMessage = thread.messages[thread.messages.length - 1];
                  return (
                    <div key={thread.id} className="rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900">
                          {thread.instructorName} <span className="text-gray-400 font-medium">· {thread.subject}</span>
                        </p>
                        <p className="text-xs text-gray-600 truncate mt-0.5">
                          {lastMessage ? `${lastMessage.senderName}: ${lastMessage.content}` : 'No messages yet'}
                        </p>
                        {thread.appointments.length > 0 && (
                          <p className="text-[11px] font-semibold text-education-primary mt-1">
                            {thread.appointments.length} conference request
                            {thread.appointments.length > 1 ? 's' : ''} · {shortDate(thread.appointments[0].date)} at{' '}
                            {thread.appointments[0].time}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openChat(thread.id)}
                        className="shrink-0 rounded-xl bg-education-primary px-4 py-2 text-xs font-semibold text-white hover:bg-education-primary/90 transition-colors"
                      >
                        Open Conversation
                      </button>
                    </div>
                  );
                })}
                {threads.length === 0 && (
                  <p className="text-xs text-gray-500">No instructor conversations available yet.</p>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-education-primary/10 to-teal-50 rounded-2xl border border-education-primary/20 p-5 space-y-3 h-fit">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Safe Messaging Rules
              </h3>
              <ul className="text-xs text-gray-700 space-y-2 leading-relaxed">
                <li>· Only verified parents with consent on file can start conversations.</li>
                <li>· Phone numbers, emails and addresses are automatically blocked.</li>
                <li>· Profanity and threatening language are filtered before delivery.</li>
                <li>· Conference slots are requested in-app — no personal contact sharing needed.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Preferences */}
        {activeTab === 'preferences' && <NotificationPreferencesPanel onChildLinked={() => setActiveTab('dashboard')} />}
      </main>

      <ParentTeacherChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} threadId={activeThreadId} />

      <Footer />
    </div>
  );
};

export default ParentPortalPage;
