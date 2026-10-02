import React, { useState } from 'react';
import {
  ForumThread,
  ForumReply,
  ForumCategory,
  AuthorRef,
} from '@/shared/types/collaboration';
import { forumService } from '../services/forumService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  Pin,
  Search,
  PlusCircle,
  Tag,
  Eye,
  CornerDownRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface DiscussionForumViewProps {
  currentUserId?: string;
  currentUser?: AuthorRef;
  courseId?: number;
}

const DEFAULT_CURRENT_USER: AuthorRef = {
  id: 'user-stu-1',
  name: 'Jane Doe',
  role: 'student',
  titleBadge: 'Grade 8 Scholar',
};

export const DiscussionForumView: React.FC<DiscussionForumViewProps> = ({
  currentUserId = 'user-stu-1',
  currentUser = DEFAULT_CURRENT_USER,
  courseId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false);

  // New Thread Form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ForumCategory>('question');
  const [newTags, setNewTags] = useState('');

  // Re-fetch helper by querying forumService
  const threads = forumService.getThreads({
    courseId,
    category: selectedCategory,
    tag: selectedTag || undefined,
    search: searchQuery,
  });

  const popularTags = forumService.getPopularTags();

  const activeThread = activeThreadId
    ? forumService.getThreadById(activeThreadId)
    : null;
  const activeReplies = activeThreadId
    ? forumService.getRepliesForThread(activeThreadId)
    : [];

  const handleSelectThread = (threadId: string) => {
    forumService.incrementViews(threadId);
    setActiveThreadId(threadId);
  };

  const handleUpvoteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    forumService.upvoteThread(threadId, currentUserId);
    // Force re-render through dummy state if needed, or simply re-query
    setActiveThreadId((prev) => prev);
  };

  const handleUpvoteReply = (replyId: string) => {
    if (!activeThreadId) return;
    forumService.upvoteReply(activeThreadId, replyId, currentUserId);
    setActiveThreadId((prev) => prev);
  };

  const handleMarkSolution = (replyId: string) => {
    if (!activeThreadId) return;
    forumService.markReplyAsSolution(activeThreadId, replyId);
    setActiveThreadId((prev) => prev);
  };

  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadId || !replyInput.trim()) return;

    forumService.createReply({
      threadId: activeThreadId,
      author: currentUser,
      content: replyInput,
    });

    setReplyInput('');
  };

  const handleCreateThreadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const parsedTags = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const created = forumService.createThread({
      title: newTitle,
      content: newContent,
      category: newCategory,
      tags: parsedTags.length > 0 ? parsedTags : ['general'],
      author: currentUser,
      courseId,
      courseName: courseId ? `Course #${courseId}` : 'General Academic Hub',
    });

    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setIsNewThreadOpen(false);
    setActiveThreadId(created.id);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-education-primary">
              Student & Faculty Community
            </span>
            <Badge variant="outline" className="text-xs border-education-primary/40 text-education-primary">
              Live Q&A
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Discussion Forums & Inquiries</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Engage with peers, ask homework questions, and verify instructor-endorsed solutions
          </p>
        </div>

        <Dialog open={isNewThreadOpen} onOpenChange={setIsNewThreadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-education-primary hover:bg-education-primary/90 text-white gap-2">
              <PlusCircle className="w-4 h-4" /> Start Discussion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-education-primary" />
                Create New Discussion Thread
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateThreadSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Thread Title *
                </label>
                <Input
                  placeholder="e.g. How does factoring polynomials apply to projectile motion?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Category
                  </label>
                  <select
                    className="w-full h-10 px-3 border rounded-md text-sm bg-white"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ForumCategory)}
                  >
                    <option value="question">Question</option>
                    <option value="discussion">Open Discussion</option>
                    <option value="announcement">Announcement</option>
                    <option value="resource">Study Resource</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Tags (comma separated)
                  </label>
                  <Input
                    placeholder="algebra, homework, exam"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Detailed Explanation / Problem Statement *
                </label>
                <Textarea
                  placeholder="Share details, problem steps, or what you have attempted so far..."
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewThreadOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-education-primary text-white"
                >
                  Publish Question
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Forum Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter Sidebar & Thread List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Tabs */}
          <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <Input
                placeholder="Search topics, questions, formulas, or keywords..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {(['all', 'question', 'discussion', 'announcement', 'resource'] as ForumCategory[]).map(
                (cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    className={`h-8 text-xs capitalize ${
                      selectedCategory === cat ? 'bg-education-primary text-white' : ''
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Button>
                )
              )}
            </div>

            {/* Popular Tag Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t text-xs">
              <span className="text-gray-400 flex items-center gap-1 shrink-0">
                <Tag className="w-3.5 h-3.5" /> Tags:
              </span>
              {selectedTag && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer bg-education-primary/10 text-education-primary hover:bg-education-primary/20"
                  onClick={() => setSelectedTag(null)}
                >
                  × Clear ({selectedTag})
                </Badge>
              )}
              {popularTags.slice(0, 6).map(({ tag, count }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                    selectedTag === tag
                      ? 'bg-education-primary text-white font-semibold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  #{tag} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Threads List */}
          <div className="space-y-3">
            {threads.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
                <BookOpen className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-gray-700">No discussions found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try adjusting your search criteria or start a new discussion!
                </p>
              </div>
            ) : (
              threads.map((thread) => {
                const isSelected = activeThreadId === thread.id;
                const userHasUpvoted = thread.upvotedUserIds.includes(currentUserId);

                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer bg-white ${
                      isSelected
                        ? 'border-education-primary ring-2 ring-education-primary/10 shadow-md'
                        : 'hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {thread.isPinned && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-[11px]">
                              <Pin className="w-3 h-3" /> Pinned
                            </Badge>
                          )}
                          {thread.isSolved && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Solved
                            </Badge>
                          )}
                          <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            {thread.category}
                          </span>
                          <span className="text-gray-400">
                            {new Date(thread.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-gray-900 leading-snug line-clamp-2">
                          {thread.title}
                        </h3>

                        <p className="text-xs text-gray-600 line-clamp-2">
                          {thread.content}
                        </p>

                        <div className="flex items-center gap-2 pt-2 flex-wrap">
                          {thread.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right Counters & Upvote */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-2.5 rounded-lg border gap-1.5 text-xs ${
                            userHasUpvoted
                              ? 'bg-education-primary/10 text-education-primary border-education-primary/30 font-semibold'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                          onClick={(e) => handleUpvoteThread(thread.id, e)}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{thread.upvotes}</span>
                        </Button>

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {thread.repliesCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {thread.viewsCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Author Footnote */}
                    <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-education-primary/20 text-education-primary font-bold flex items-center justify-center text-[10px]">
                          {thread.author.name[0]}
                        </div>
                        <span className="font-medium text-gray-700">
                          {thread.author.name}
                        </span>
                        {thread.author.role === 'teacher' && (
                          <Badge className="bg-indigo-600 text-white text-[10px] px-1.5 py-0 h-4">
                            Instructor
                          </Badge>
                        )}
                        {thread.author.titleBadge && (
                          <span className="text-gray-400">• {thread.author.titleBadge}</span>
                        )}
                      </div>
                      {thread.courseName && (
                        <span className="text-[11px] text-gray-400 truncate max-w-[200px]">
                          {thread.courseName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Thread & Nested Discussion Viewer */}
        <div className="lg:col-span-5">
          {activeThread ? (
            <Card className="shadow-sm sticky top-20 border-education-primary/20">
              <CardHeader className="pb-3 border-b space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs uppercase bg-gray-100">
                      {activeThread.category}
                    </Badge>
                    {activeThread.isSolved && (
                      <Badge className="bg-emerald-600 text-white gap-1 text-xs">
                        <CheckCircle2 className="w-3 h-3" /> Solved
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(activeThread.createdAt).toLocaleString()}
                  </span>
                </div>

                <CardTitle className="text-lg leading-tight font-bold text-gray-900">
                  {activeThread.title}
                </CardTitle>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-800">
                    {activeThread.author.name}
                  </span>
                  {activeThread.author.titleBadge && (
                    <span className="text-gray-400">• {activeThread.author.titleBadge}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-5 pt-4">
                {/* Full Question Content */}
                <div className="p-3.5 bg-gray-50 rounded-lg text-sm text-gray-800 leading-relaxed border whitespace-pre-line">
                  {activeThread.content}
                </div>

                {/* Replies Thread */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Replies ({activeReplies.length})
                    </h4>
                  </div>

                  {activeReplies.length === 0 ? (
                    <p className="text-xs text-gray-400 italic p-3 text-center bg-gray-50/50 rounded-lg border">
                      No replies yet. Be the first to share an answer or explanation!
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {activeReplies.map((reply) => {
                        const isSolution = reply.isAcceptedSolution;
                        const userUpvoted = reply.upvotedUserIds.includes(currentUserId);
                        const isInstructor = currentUser.role === 'teacher';

                        return (
                          <div
                            key={reply.id}
                            className={`p-3.5 rounded-lg border text-xs space-y-2 transition-colors ${
                              isSolution
                                ? 'bg-emerald-50/70 border-emerald-300'
                                : reply.parentReplyId
                                ? 'ml-5 bg-gray-50/70 border-gray-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {reply.parentReplyId && (
                                  <CornerDownRight className="w-3 h-3 text-gray-400" />
                                )}
                                <span className="font-semibold text-gray-800">
                                  {reply.author.name}
                                </span>
                                {reply.author.role === 'teacher' && (
                                  <Badge className="bg-indigo-600 text-white text-[9px] px-1 py-0 h-3.5">
                                    Teacher
                                  </Badge>
                                )}
                                {isSolution && (
                                  <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 h-4 gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Accepted Solution
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400">
                                {new Date(reply.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                              {reply.content}
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                              <button
                                type="button"
                                onClick={() => handleUpvoteReply(reply.id)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
                                  userUpvoted
                                    ? 'bg-education-primary/10 text-education-primary font-semibold'
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{reply.upvotes}</span>
                              </button>

                              {isInstructor && !isSolution && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkSolution(reply.id)}
                                  className="text-[11px] text-emerald-700 hover:underline font-medium flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Mark as Solution
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                <form onSubmit={handlePostReply} className="pt-2 border-t space-y-2">
                  <Textarea
                    placeholder="Write a clear, respectful answer or explanation..."
                    rows={3}
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    className="text-xs"
                    required
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-education-primary text-white text-xs h-8"
                    >
                      Post Reply
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white p-8 rounded-xl border text-center text-gray-500 h-[400px] flex flex-col items-center justify-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-semibold text-gray-700">Select a thread</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Click any inquiry from the list to view its full context, teacher verified
                solutions, and community responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
