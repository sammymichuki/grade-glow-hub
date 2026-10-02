import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GradebookView } from '../components/GradebookView';

describe('GradebookView Component', () => {
  it('renders student gradebook banner, GPA, and syllabus categories', () => {
    render(<GradebookView />);

    expect(screen.getByText('Student Gradebook & Analytics')).toBeInTheDocument();
    expect(screen.getByText(/Dean's Honor Roll/i)).toBeInTheDocument();
    expect(screen.getByText('Cumulative GPA')).toBeInTheDocument();
    expect(screen.getByText('Mathematics Fundamentals')).toBeInTheDocument();
    expect(screen.getAllByText(/homework/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/quiz/i).length).toBeGreaterThan(0);
  });

  it('renders the interactive What-If Grade Simulator', () => {
    render(<GradebookView />);

    expect(screen.getByText('"What-If" Grade Simulator')).toBeInTheDocument();
    expect(screen.getByText(/Projected Final Grade/i)).toBeInTheDocument();
  });

  it('opens and displays the official report card modal', () => {
    render(<GradebookView />);

    const reportCardBtn = screen.getByRole('button', { name: /View Report Card/i });
    fireEvent.click(reportCardBtn);

    expect(screen.getByText('Official Academic Transcript & Report Card')).toBeInTheDocument();
    expect(screen.getByText('Jane Student')).toBeInTheDocument();
    expect(screen.getByText('STU-8821')).toBeInTheDocument();
    expect(screen.getByText(/Verified Transcript/i)).toBeInTheDocument();
  });
});
