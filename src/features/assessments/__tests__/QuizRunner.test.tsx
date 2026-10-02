import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizRunner } from '../components/QuizRunner';
import { Quiz } from '@/shared/types/assessment';

const mockQuiz: Quiz = {
  id: 'test-quiz-1',
  courseId: 1,
  title: 'Mathematics Unit Test',
  description: 'Test algebra concepts',
  timeLimitMinutes: 10,
  passingScorePercent: 70,
  allowedAttempts: 3,
  questions: [
    {
      id: 'q1',
      prompt: 'What is 3 + 4?',
      type: 'single_choice',
      points: 50,
      options: [
        { id: 'opt1', text: '7', isCorrect: true },
        { id: 'opt2', text: '8', isCorrect: false },
      ],
      explanation: '3 + 4 = 7',
    },
    {
      id: 'q2',
      prompt: 'Is 9 an odd number?',
      type: 'true_false',
      points: 50,
      options: [
        { id: 't1', text: 'True', isCorrect: true },
        { id: 't2', text: 'False', isCorrect: false },
      ],
      explanation: '9 cannot be divided evenly by 2, so it is odd.',
    },
  ],
};

describe('QuizRunner Component', () => {
  it('renders the quiz title, first question, and timer badge', () => {
    render(<QuizRunner quiz={mockQuiz} />);

    expect(screen.getByText('Mathematics Unit Test')).toBeInTheDocument();
    expect(screen.getByText('What is 3 + 4?')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('allows user to select an option and navigate to next question', () => {
    render(<QuizRunner quiz={mockQuiz} />);

    const option7 = screen.getByText('7');
    fireEvent.click(option7);

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText('Is 9 an odd number?')).toBeInTheDocument();
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
  });

  it('completes quiz and displays results summary screen with score and explanation', () => {
    const onComplete = vi.fn();
    render(<QuizRunner quiz={mockQuiz} onComplete={onComplete} />);

    // Answer Q1 correctly
    fireEvent.click(screen.getByText('7'));

    // Go to Q2
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Answer Q2 correctly
    fireEvent.click(screen.getByText('True'));

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitBtn);

    // Verify celebration and score
    expect(screen.getByText(/Quiz Passed! Congratulations/i)).toBeInTheDocument();
    expect(screen.getByText(/Score: 100 \/ 100 \(100%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/3 \+ 4 = 7/i)).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledWith(100, true);
  });

  it('allows flagging and unflagging questions for review', () => {
    render(<QuizRunner quiz={mockQuiz} />);

    const flagBtn = screen.getByRole('button', { name: /Flag/i });
    expect(flagBtn).toHaveTextContent('Flag');

    fireEvent.click(flagBtn);
    expect(screen.getByRole('button', { name: /Flagged/i })).toBeInTheDocument();
    expect(screen.getByText(/1 flagged/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Flagged/i }));
    expect(screen.queryByText(/1 flagged/i)).not.toBeInTheDocument();
  });
});
