import {
  ForumThread,
  ForumReply,
  ForumCategory,
  AuthorRef,
} from '@/shared/types/collaboration';
import {
  SAMPLE_FORUM_THREADS,
  SAMPLE_FORUM_REPLIES,
} from '../data/sampleCommunityData';

class ForumService {
  private threads: ForumThread[] = [...SAMPLE_FORUM_THREADS];
  private replies: Record<string, ForumReply[]> = JSON.parse(
    JSON.stringify(SAMPLE_FORUM_REPLIES)
  );

  public getThreads(options?: {
    courseId?: number;
    category?: ForumCategory;
    tag?: string;
    search?: string;
    sortBy?: 'recent' | 'upvotes' | 'unanswered';
  }): ForumThread[] {
    let result = [...this.threads];

    if (options?.courseId !== undefined) {
      result = result.filter((t) => t.courseId === options.courseId);
    }

    if (options?.category && options.category !== 'all') {
      result = result.filter((t) => t.category === options.category);
    }

    if (options?.tag) {
      const normalizedTag = options.tag.toLowerCase();
      result = result.filter((t) =>
        t.tags.some((tag) => tag.toLowerCase() === normalizedTag)
      );
    }

    if (options?.search && options.search.trim().length > 0) {
      result = this.searchThreads(options.search, result);
    }

    if (options?.sortBy === 'upvotes') {
      result.sort((a, b) => b.upvotes - a.upvotes);
    } else if (options?.sortBy === 'unanswered') {
      result = result
        .filter((t) => t.repliesCount === 0)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // default: pinned first, then newest
      result.sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return result;
  }

  public getThreadById(threadId: string): ForumThread | undefined {
    return this.threads.find((t) => t.id === threadId);
  }

  public getRepliesForThread(threadId: string): ForumReply[] {
    const list = this.replies[threadId] || [];
    return [...list].sort((a, b) => {
      // Accepted solution always first
      if (a.isAcceptedSolution !== b.isAcceptedSolution) {
        return a.isAcceptedSolution ? -1 : 1;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  public createThread(params: {
    title: string;
    content: string;
    category: ForumCategory;
    tags: string[];
    author: AuthorRef;
    courseId?: number;
    courseName?: string;
  }): ForumThread {
    if (!params.title.trim() || !params.content.trim()) {
      throw new Error('Thread title and content cannot be blank.');
    }

    const newThread: ForumThread = {
      id: `thread-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      courseId: params.courseId,
      courseName: params.courseName,
      title: params.title.trim(),
      content: params.content.trim(),
      author: params.author,
      category: params.category,
      tags: params.tags.map((t) => t.trim().toLowerCase()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      upvotes: 0,
      upvotedUserIds: [],
      repliesCount: 0,
      viewsCount: 1,
      isPinned: false,
      isSolved: false,
    };

    this.threads.unshift(newThread);
    this.replies[newThread.id] = [];
    return newThread;
  }

  public createReply(params: {
    threadId: string;
    author: AuthorRef;
    content: string;
    parentReplyId?: string;
  }): ForumReply {
    const thread = this.getThreadById(params.threadId);
    if (!thread) {
      throw new Error(`Thread ${params.threadId} not found.`);
    }

    if (!params.content.trim()) {
      throw new Error('Reply content cannot be blank.');
    }

    const newReply: ForumReply = {
      id: `reply-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      threadId: params.threadId,
      author: params.author,
      content: params.content.trim(),
      createdAt: new Date().toISOString(),
      upvotes: 0,
      upvotedUserIds: [],
      isAcceptedSolution: false,
      parentReplyId: params.parentReplyId,
    };

    if (!this.replies[params.threadId]) {
      this.replies[params.threadId] = [];
    }

    this.replies[params.threadId].push(newReply);
    thread.repliesCount += 1;
    thread.updatedAt = new Date().toISOString();

    return newReply;
  }

  public upvoteThread(threadId: string, userId: string): { upvotes: number; userUpvoted: boolean } {
    const thread = this.getThreadById(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found.`);
    }

    const index = thread.upvotedUserIds.indexOf(userId);
    let userUpvoted = false;

    if (index > -1) {
      thread.upvotedUserIds.splice(index, 1);
      thread.upvotes = Math.max(0, thread.upvotes - 1);
      userUpvoted = false;
    } else {
      thread.upvotedUserIds.push(userId);
      thread.upvotes += 1;
      userUpvoted = true;
    }

    return { upvotes: thread.upvotes, userUpvoted };
  }

  public upvoteReply(
    threadId: string,
    replyId: string,
    userId: string
  ): { upvotes: number; userUpvoted: boolean } {
    const threadReplies = this.replies[threadId] || [];
    const reply = threadReplies.find((r) => r.id === replyId);
    if (!reply) {
      throw new Error(`Reply ${replyId} not found in thread ${threadId}.`);
    }

    const index = reply.upvotedUserIds.indexOf(userId);
    let userUpvoted = false;

    if (index > -1) {
      reply.upvotedUserIds.splice(index, 1);
      reply.upvotes = Math.max(0, reply.upvotes - 1);
      userUpvoted = false;
    } else {
      reply.upvotedUserIds.push(userId);
      reply.upvotes += 1;
      userUpvoted = true;
    }

    return { upvotes: reply.upvotes, userUpvoted };
  }

  public markReplyAsSolution(threadId: string, replyId: string): ForumThread {
    const thread = this.getThreadById(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found.`);
    }

    const threadReplies = this.replies[threadId] || [];
    const reply = threadReplies.find((r) => r.id === replyId);
    if (!reply) {
      throw new Error(`Reply ${replyId} not found in thread ${threadId}.`);
    }

    // Toggle off existing solutions if any
    threadReplies.forEach((r) => {
      r.isAcceptedSolution = false;
    });

    reply.isAcceptedSolution = true;
    thread.isSolved = true;
    thread.solvedReplyId = replyId;
    thread.updatedAt = new Date().toISOString();

    return thread;
  }

  public incrementViews(threadId: string): void {
    const thread = this.getThreadById(threadId);
    if (thread) {
      thread.viewsCount += 1;
    }
  }

  public searchThreads(query: string, sourceThreads?: ForumThread[]): ForumThread[] {
    const pool = sourceThreads || this.threads;
    const lower = query.trim().toLowerCase();
    if (!lower) return pool;

    return pool.filter(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        t.content.toLowerCase().includes(lower) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lower)) ||
        t.author.name.toLowerCase().includes(lower)
    );
  }

  public getPopularTags(sourceThreads?: ForumThread[]): Array<{ tag: string; count: number }> {
    const pool = sourceThreads || this.threads;
    const countMap: Record<string, number> = {};

    pool.forEach((t) => {
      t.tags.forEach((tag) => {
        const norm = tag.toLowerCase();
        countMap[norm] = (countMap[norm] || 0) + 1;
      });
    });

    return Object.entries(countMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  public resetToDefaults(): void {
    this.threads = [...SAMPLE_FORUM_THREADS];
    this.replies = JSON.parse(JSON.stringify(SAMPLE_FORUM_REPLIES));
  }
}

export const forumService = new ForumService();
