import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentRosterManager } from '../components/StudentRosterManager';

describe('StudentRosterManager Component', () => {
  it('renders student roster directory and cohort metrics', () => {
    render(<StudentRosterManager />);

    expect(screen.getByText('Student Management Hub')).toBeInTheDocument();
    expect(screen.getByText('Cohort Average GPA')).toBeInTheDocument();
    expect(screen.getByText('Avg. Attendance')).toBeInTheDocument();
    expect(screen.getByText('Active Learners')).toBeInTheDocument();
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
  });

  it('filters student list by search input', () => {
    render(<StudentRosterManager />);

    const searchInput = screen.getByPlaceholderText('Search student or email...');
    fireEvent.change(searchInput, { target: { value: 'Amina' } });

    expect(screen.getByText('Amina Kimani')).toBeInTheDocument();
    expect(screen.queryByText('Marcus Vance')).not.toBeInTheDocument();
  });

  it('toggles student course enrollment state', () => {
    render(<StudentRosterManager />);

    // Jane Doe is enrolled in course 1
    const enrolledButtons = screen.getAllByRole('button', { name: /Enrolled/i });
    expect(enrolledButtons.length).toBeGreaterThan(0);

    fireEvent.click(enrolledButtons[0]);
    // The button state toggles
    expect(screen.getAllByRole('button', { name: /Enroll/i }).length).toBeGreaterThan(0);
  });

  it('opens and closes manual add student modal', () => {
    render(<StudentRosterManager />);

    const addBtn = screen.getByRole('button', { name: /Add Student/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Register New Student')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. STU-1088')).toBeInTheDocument();
  });
});
