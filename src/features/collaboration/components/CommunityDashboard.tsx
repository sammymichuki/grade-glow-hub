import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DiscussionForumView } from './DiscussionForumView';
import { PeerReviewView } from './PeerReviewView';
import { forumService } from '../services/forumService';
import { peerReviewService } from '../services/peerReviewService';
import { Button } from '@/components/ui/button';
import { MessageSquare, BookCheck, Sparkles, CheckCircle2, Users } from 'lucide-react';

export const CommunityDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'peer-review' ? 'peer-review' : 'forums';
  const [activeTab, setActiveTab] = useState<'forums' | 'peer-review'>(initialTab);

  const threads = forumService.getThreads();
  const solvedCount = threads.filter((t) => t.isSolved).length;
  const peerAssignments = peerReviewService.getAssignments();

  const handleTabChange = (tab: 'forums' | 'peer-review') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6">
      {/* Top Level Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{threads.length}</div>
            <div className="text-xs text-gray-500 font-medium">Discussions Active</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{solvedCount}</div>
            <div className="text-xs text-gray-500 font-medium">Verified Solutions</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <BookCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{peerAssignments.length}</div>
            <div className="text-xs text-gray-500 font-medium">Peer Review Quests</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">100%</div>
            <div className="text-xs text-gray-500 font-medium">Double-Blind Redacted</div>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b pb-1">
        <Button
          variant={activeTab === 'forums' ? 'default' : 'ghost'}
          onClick={() => handleTabChange('forums')}
          className={`gap-2 h-9 ${
            activeTab === 'forums'
              ? 'bg-education-primary text-white font-semibold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Discussion Q&A Threads
        </Button>
        <Button
          variant={activeTab === 'peer-review' ? 'default' : 'ghost'}
          onClick={() => handleTabChange('peer-review')}
          className={`gap-2 h-9 ${
            activeTab === 'peer-review'
              ? 'bg-education-primary text-white font-semibold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookCheck className="w-4 h-4" /> Peer Review Studio
        </Button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'forums' ? (
        <DiscussionForumView />
      ) : (
        <PeerReviewView />
      )}
    </div>
  );
};
