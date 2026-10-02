import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiscussionForumView } from '../components/DiscussionForumView';

describe('DiscussionForumView Component', () => {
  it('renders forum banner, categories, and initial questions', () => {
    render(<DiscussionForumView />);

    expect(screen.getByText('Discussion Forums & Inquiries')).toBeInTheDocument();
    expect(screen.getByText('Start Discussion')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search topics, questions/i)).toBeInTheDocument();
    expect(screen.getAllByText(/negative signs precede brackets/i).length).toBeGreaterThan(0);
  });

  it('filters questions by category button', () => {
    render(<DiscussionForumView />);

    const announcementBtn = screen.getByRole('button', { name: /^announcement$/i });
    fireEvent.click(announcementBtn);

    expect(screen.getAllByText(/Osmosis Egg Experiment/i).length).toBeGreaterThan(0);
  });

  it('selects a thread and displays detailed view with replies', () => {
    render(<DiscussionForumView />);

    const threadTitle = screen.getByText(/How do you determine the order of operations/i);
    fireEvent.click(threadTitle);

    expect(screen.getAllByText(/PEMDAS \/ BODMAS hierarchy/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Accepted Solution/i).length).toBeGreaterThan(0);
  });

  it('allows opening the start discussion modal', () => {
    render(<DiscussionForumView />);

    const startBtn = screen.getByRole('button', { name: /Start Discussion/i });
    fireEvent.click(startBtn);

    expect(screen.getByText('Create New Discussion Thread')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. How does factoring polynomials/i)).toBeInTheDocument();
  });
});
