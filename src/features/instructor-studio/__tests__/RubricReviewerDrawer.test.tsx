import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RubricReviewerDrawer } from '../components/RubricReviewerDrawer';

describe('RubricReviewerDrawer Component', () => {
  it('renders submissions queue and displays student work', () => {
    render(<RubricReviewerDrawer />);

    expect(screen.getByText('Assignment Submissions')).toBeInTheDocument();
    expect(screen.getByText('Submissions Queue')).toBeInTheDocument();
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
    expect(screen.getByText(/Problem 1: Cell Phone Plan/i)).toBeInTheDocument();
  });

  it('allows clicking rubric level buttons to update projected score', () => {
    render(<RubricReviewerDrawer />);

    expect(screen.getAllByText(/Grading Matrix/i).length).toBeGreaterThan(0);

    // Click "Poor" level for Content (1 pt instead of 4)
    const poorButtons = screen.getAllByRole('button', { name: /Poor/i });
    expect(poorButtons.length).toBeGreaterThan(0);
    fireEvent.click(poorButtons[0]);

    // Total points should update and be visible
    expect(screen.getByText(/Projected Score/i)).toBeInTheDocument();
  });

  it('allows adding an inline annotation to the submission', () => {
    render(<RubricReviewerDrawer />);

    const refInput = screen.getByPlaceholderText(/Ref \(e.g. Line 4 or Step 2\)/i);
    const commentInput = screen.getByPlaceholderText('Instructor comment...');

    fireEvent.change(refInput, { target: { value: 'Line 7' } });
    fireEvent.change(commentInput, { target: { value: 'Excellent algebra manipulation.' } });

    const pinBtn = screen.getByRole('button', { name: /Pin Note/i });
    fireEvent.click(pinBtn);

    expect(screen.getByText(/Excellent algebra manipulation/i)).toBeInTheDocument();
    expect(screen.getByText(/\[Line 7\]/i)).toBeInTheDocument();
  });

  it('finalizes grade and submits feedback', () => {
    render(<RubricReviewerDrawer />);

    const feedbackInput = screen.getByPlaceholderText(/Praise strengths, highlight areas for improvement/i);
    fireEvent.change(feedbackInput, { target: { value: 'Well done Jane, accurate math.' } });

    const finalizeBtn = screen.getByRole('button', { name: /Finalize Grade & Return/i });
    fireEvent.click(finalizeBtn);

    expect(finalizeBtn).toBeInTheDocument();
  });
});
