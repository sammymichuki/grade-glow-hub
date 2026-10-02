import { describe, it, expect, beforeEach } from 'vitest';
import { forumService } from '../services/forumService';
import { AuthorRef } from '@/shared/types/collaboration';

describe('forumService', () => {
  beforeEach(() => {
    forumService.resetToDefaults();
  });

  const testAuthor: AuthorRef = {
    id: 'test-user-1',
    name: 'Test Student',
    role: 'student',
  };

  it('fetches all initial default threads', () => {
    const threads = forumService.getThreads();
    expect(threads.length).toBeGreaterThan(0);
    expect(threads[0]).toHaveProperty('title');
    expect(threads[0]).toHaveProperty('category');
  });

  it('filters threads by category', () => {
    const questions = forumService.getThreads({ category: 'question' });
    expect(questions.every((t) => t.category === 'question')).toBe(true);

    const announcements = forumService.getThreads({ category: 'announcement' });
    expect(announcements.every((t) => t.category === 'announcement')).toBe(true);
  });

  it('filters threads by tag', () => {
    const algebraThreads = forumService.getThreads({ tag: 'algebra' });
    expect(algebraThreads.length).toBeGreaterThan(0);
    expect(
      algebraThreads.every((t) =>
        t.tags.some((tag) => tag.toLowerCase() === 'algebra')
      )
    ).toBe(true);
  });

  it('searches threads by query text', () => {
    const results = forumService.searchThreads('quadratic');
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some((t) => t.title.toLowerCase().includes('quadratic'))
    ).toBe(true);
  });

  it('creates a new thread successfully', () => {
    const newThread = forumService.createThread({
      title: 'How do chemical bonds form in covalent molecules?',
      content: 'We need to understand valence electron sharing for the chemistry quiz.',
      category: 'question',
      tags: ['chemistry', 'bonds', 'valence'],
      author: testAuthor,
      courseId: 2,
    });

    expect(newThread.id).toBeDefined();
    expect(newThread.title).toBe('How do chemical bonds form in covalent molecules?');
    expect(newThread.repliesCount).toBe(0);
    expect(newThread.upvotes).toBe(0);

    const fetched = forumService.getThreadById(newThread.id);
    expect(fetched).toBeDefined();
    expect(fetched?.title).toBe(newThread.title);
  });

  it('throws an error when creating thread with blank title or content', () => {
    expect(() =>
      forumService.createThread({
        title: '',
        content: 'content',
        category: 'discussion',
        tags: [],
        author: testAuthor,
      })
    ).toThrow();

    expect(() =>
      forumService.createThread({
        title: 'valid',
        content: '   ',
        category: 'discussion',
        tags: [],
        author: testAuthor,
      })
    ).toThrow();
  });

  it('creates replies and increments repliesCount on parent thread', () => {
    const thread = forumService.getThreads()[0];
    const initialCount = thread.repliesCount;

    const reply = forumService.createReply({
      threadId: thread.id,
      author: testAuthor,
      content: 'Here is a helpful clarification regarding the step!',
    });

    expect(reply.id).toBeDefined();
    expect(reply.content).toContain('clarification');

    const updatedThread = forumService.getThreadById(thread.id);
    expect(updatedThread?.repliesCount).toBe(initialCount + 1);

    const replies = forumService.getRepliesForThread(thread.id);
    expect(replies.some((r) => r.id === reply.id)).toBe(true);
  });

  it('toggles thread upvotes accurately', () => {
    const thread = forumService.getThreads()[0];
    const initialVotes = thread.upvotes;

    const firstVote = forumService.upvoteThread(thread.id, 'user-unique-99');
    expect(firstVote.userUpvoted).toBe(true);
    expect(firstVote.upvotes).toBe(initialVotes + 1);

    // Toggle off
    const secondVote = forumService.upvoteThread(thread.id, 'user-unique-99');
    expect(secondVote.userUpvoted).toBe(false);
    expect(secondVote.upvotes).toBe(initialVotes);
  });

  it('marks a reply as an accepted instructor solution', () => {
    const thread = forumService.getThreads()[1]; // un-solved thread
    const reply = forumService.createReply({
      threadId: thread.id,
      author: { id: 'teacher-1', name: 'Instructor', role: 'teacher' },
      content: 'Here is the canonical solution algorithm.',
    });

    const updated = forumService.markReplyAsSolution(thread.id, reply.id);
    expect(updated.isSolved).toBe(true);
    expect(updated.solvedReplyId).toBe(reply.id);

    const replies = forumService.getRepliesForThread(thread.id);
    const solutionReply = replies.find((r) => r.id === reply.id);
    expect(solutionReply?.isAcceptedSolution).toBe(true);
  });

  it('calculates popular tags aggregated across all threads', () => {
    const popularTags = forumService.getPopularTags();
    expect(popularTags.length).toBeGreaterThan(0);
    expect(popularTags[0]).toHaveProperty('tag');
    expect(popularTags[0]).toHaveProperty('count');
    expect(popularTags[0].count).toBeGreaterThanOrEqual(
      popularTags[popularTags.length - 1].count
    );
  });
});
