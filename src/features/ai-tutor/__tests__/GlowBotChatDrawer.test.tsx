import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlowBotChatDrawer } from '../components/GlowBotChatDrawer';
import { AiTutorService } from '../services/aiTutorService';

describe('GlowBotChatDrawer Component', () => {
  beforeEach(() => {
    AiTutorService.clearHistory();
    vi.restoreAllMocks();
  });

  it('renders inline chat container with header and context topic', () => {
    render(
      <GlowBotChatDrawer
        inline
        context={{
          subject: 'Science',
          gradeLevel: 7,
          topic: 'Photosynthesis',
        }}
      />
    );

    expect(screen.getByText('GlowBot Socratic Tutor')).toBeInTheDocument();
    expect(screen.getByText(/Science • Photosynthesis/i)).toBeInTheDocument();
    expect(screen.getByText(/Child-Safe/i)).toBeInTheDocument();
  });

  it('renders greeting and prompt buttons', () => {
    render(
      <GlowBotChatDrawer
        inline
        context={{
          subject: 'Mathematics',
          gradeLevel: 8,
          topic: 'Fractions',
        }}
      />
    );

    expect(screen.getByText(/Jambo! I'm/i)).toBeInTheDocument();
    expect(screen.getByText('Give me a conceptual hint')).toBeInTheDocument();
  });

  it('submits a user question and renders user message bubble', async () => {
    render(
      <GlowBotChatDrawer
        inline
        context={{
          subject: 'Mathematics',
          gradeLevel: 7,
          topic: 'Fractions',
        }}
      />
    );

    const input = screen.getByPlaceholderText(/Ask a question about Fractions/i);
    fireEvent.change(input, { target: { value: 'How do I find the common denominator?' } });
    const sendBtn = screen.getByLabelText(/Send message/i);
    fireEvent.click(sendBtn);

    expect(screen.getByText('How do I find the common denominator?')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(/denominators/i).length).toBeGreaterThan(0);
    });
  });

  it('renders floating drawer toggle button and opens modal', () => {
    render(
      <GlowBotChatDrawer
        initiallyOpen={false}
        context={{
          subject: 'Science',
          gradeLevel: 7,
          topic: 'Circuits',
        }}
      />
    );

    const triggerBtn = screen.getByLabelText(/Open GlowBot AI Tutor/i);
    expect(triggerBtn).toBeInTheDocument();

    fireEvent.click(triggerBtn);
    expect(screen.getByText('GlowBot Socratic Tutor')).toBeInTheDocument();
  });
});
