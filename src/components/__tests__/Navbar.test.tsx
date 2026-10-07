import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/shared/i18n/config';

const renderNavbar = () => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Navbar Component with Dropdown Architecture', () => {
  it('renders brand identity and primary quick links', () => {
    renderNavbar();

    expect(screen.getByText('GradeGlow')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders dropdown triggers for Academics, Arena, AI Studio and Management', () => {
    const { container } = renderNavbar();

    expect(container.querySelector('button[data-nav-dropdown="academics"]')).toBeInTheDocument();
    expect(container.querySelector('button[data-nav-dropdown="arena"]')).toBeInTheDocument();
    expect(container.querySelector('button[data-nav-dropdown="aiHub"]')).toBeInTheDocument();
    expect(container.querySelector('button[data-nav-dropdown="management"]')).toBeInTheDocument();
  });

  it('opens Academics dropdown on click and displays Courses, Gradebook, Mastery', () => {
    const { container } = renderNavbar();

    const academicsTrigger = container.querySelector('button[data-nav-dropdown="academics"]') as HTMLElement;
    fireEvent.click(academicsTrigger);

    expect(screen.getAllByText('Courses').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gradebook').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mastery').length).toBeGreaterThan(0);
  });

  it('opens Arena & Community dropdown on click and displays GlowArena and Community', () => {
    const { container } = renderNavbar();

    const arenaTrigger = container.querySelector('button[data-nav-dropdown="arena"]') as HTMLElement;
    fireEvent.click(arenaTrigger);

    expect(screen.getAllByText('GlowArena').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Community').length).toBeGreaterThan(0);
  });

  it('opens AI Studio dropdown on click and displays GlowBot, Question Ingest and Essay Lab', () => {
    const { container } = renderNavbar();

    const aiTrigger = container.querySelector('button[data-nav-dropdown="aiHub"]') as HTMLElement;
    fireEvent.click(aiTrigger);

    expect(screen.getByText(/GlowBot AI Tutor/i)).toBeInTheDocument();
    expect(screen.getByText('Curriculum Question Ingest')).toBeInTheDocument();
    expect(screen.getByText('AI Essay Rubric Lab')).toBeInTheDocument();
  });

  it('opens Management dropdown on click and displays Instructor Studio and Admin Control', () => {
    const { container } = renderNavbar();

    const mgmtTrigger = container.querySelector('button[data-nav-dropdown="management"]') as HTMLElement;
    fireEvent.click(mgmtTrigger);

    expect(screen.getAllByText('Instructor Studio').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Admin Control').length).toBeGreaterThan(0);
  });

  it('toggles mobile drawer navigation when hamburger button is clicked', () => {
    renderNavbar();

    const hamburger = screen.getByLabelText(/Toggle navigation menu/i);
    expect(hamburger).toBeInTheDocument();

    fireEvent.click(hamburger);

    // Mobile drawer should be open and display quick link for Home
    expect(screen.getAllByText('Home').length).toBeGreaterThan(1);
    expect(screen.getAllByText('About').length).toBeGreaterThan(1);
  });
});
