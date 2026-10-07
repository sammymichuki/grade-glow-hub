import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIEssayFeedbackViewer } from '../components/AIEssayFeedbackViewer';

describe('AIEssayFeedbackViewer Component', () => {
  it('renders essay analysis dashboard with sample presets', () => {
    render(<AIEssayFeedbackViewer />);

    expect(screen.getByText('AI Essay & Open-Response Evaluator')).toBeInTheDocument();
    expect(screen.getByText(/Integrated Science/i)).toBeInTheDocument();
    expect(screen.getByText(/English Language Arts/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyze with AI Rubric/i)).toBeInTheDocument();
  });

  it('renders overall score and rubric breakdown cards', () => {
    render(<AIEssayFeedbackViewer />);

    expect(screen.getByText(/Automated Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/CBC Rubric Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Thesis & Purpose/i)).toBeInTheDocument();
    expect(screen.getByText(/Evidence & Reasoning/i)).toBeInTheDocument();
    expect(screen.getByText(/Structure & Coherence/i)).toBeInTheDocument();
  });

  it('switches between sample essay presets', () => {
    render(<AIEssayFeedbackViewer />);

    const englishPreset = screen.getByText(/English Language Arts/i);
    fireEvent.click(englishPreset);

    expect(screen.getByDisplayValue(/Four-Day Instructional Week/i)).toBeInTheDocument();
  });

  it('filters annotations by category', () => {
    render(<AIEssayFeedbackViewer />);

    const grammarFilter = screen.getByRole('button', { name: /^grammar$/i });
    fireEvent.click(grammarFilter);

    expect(screen.getByText(/Inline Socratic Markup/i)).toBeInTheDocument();
  });
});
