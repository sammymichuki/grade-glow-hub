import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ParentDashboard } from '../components/ParentDashboard';
import { ParentService } from '../services/parentService';
import { BRIAN_ID, KEVIN_ID } from '../data/sampleParentData';

describe('ParentDashboard Component', () => {
  beforeEach(() => {
    ParentService.resetToDefaults();
  });

  it('renders both linked children as selectable tabs with Kevin active by default', () => {
    render(<ParentDashboard />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveTextContent('Kevin Kamau');
    expect(tabs[0]).toHaveTextContent('Grade 7');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveTextContent('Brian Kamau');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('shows the four KPI cards with exact rolling-window values for Kevin', () => {
    render(<ParentDashboard />);

    const grid = screen.getByTestId('kpi-grid');
    expect(within(grid).getByText('86%')).toBeInTheDocument();
    expect(within(grid).getByText('75%')).toBeInTheDocument();
    expect(within(grid).getByText('77%')).toBeInTheDocument();
    expect(within(grid).getByText('4h 45m')).toBeInTheDocument();
    expect(within(grid).getByText('83% last period')).toBeInTheDocument();
    expect(within(grid).getByText('+3')).toBeInTheDocument();
    expect(within(grid).getByText('-25')).toBeInTheDocument();
    expect(within(grid).getByText('Screen Time This Week')).toBeInTheDocument();
  });

  it('renders subject breakdown, chart container, strengths, focus and upcoming tasks', () => {
    render(<ParentDashboard />);

    const breakdown = screen.getByTestId('subject-breakdown');
    expect(within(breakdown).getByText('Mathematics')).toBeInTheDocument();
    expect(within(breakdown).getByText('English')).toBeInTheDocument();
    expect(within(breakdown).getByText('Kiswahili')).toBeInTheDocument();
    expect(within(breakdown).getByText('Integrated Science')).toBeInTheDocument();
    expect(within(breakdown).getByText('88%')).toBeInTheDocument();
    expect(screen.getByTestId('subject-chart')).toBeInTheDocument();

    expect(within(screen.getByTestId('strong-subjects')).getByText('English')).toBeInTheDocument();
    expect(within(screen.getByTestId('strong-subjects')).getByText('Mathematics')).toBeInTheDocument();
    expect(within(screen.getByTestId('focus-subjects')).getByText('Kiswahili')).toBeInTheDocument();

    const tasks = screen.getByTestId('upcoming-tasks');
    expect(within(tasks).getByText('Integrated Science Quiz')).toBeInTheDocument();
    expect(within(tasks).getByText('Mathematics Mid-Term Exam')).toBeInTheDocument();
    expect(within(tasks).getByText(/quiz/)).toBeInTheDocument();
  });

  it('switches the dashboard when another child tab is clicked', () => {
    render(<ParentDashboard />);

    fireEvent.click(screen.getByRole('tab', { name: /Brian Kamau/ }));

    const grid = screen.getByTestId('kpi-grid');
    expect(within(grid).getByText('100%')).toBeInTheDocument();
    expect(within(grid).getByText('50%')).toBeInTheDocument();
    expect(within(grid).getByText('3h 25m')).toBeInTheDocument();
    expect(within(screen.getByTestId('strong-subjects')).getByText('Agriculture')).toBeInTheDocument();
    expect(within(screen.getByTestId('focus-subjects')).getByText('Mathematics')).toBeInTheDocument();
    expect(within(screen.getByTestId('upcoming-tasks')).getByText('Agriculture Practical Assignment')).toBeInTheDocument();
  });

  it('invokes the message teacher callback from the instructor button', () => {
    const onMessageTeacher = vi.fn();
    render(<ParentDashboard onMessageTeacher={onMessageTeacher} />);

    fireEvent.click(screen.getByRole('button', { name: /Message Instructor/ }));
    expect(onMessageTeacher).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when every child has been unlinked', () => {
    for (const link of ParentService.getLinks()) {
      ParentService.unlinkChild(link.id);
    }
    render(<ParentDashboard />);

    expect(screen.getByText('No children linked yet')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-grid')).not.toBeInTheDocument();
  });

  it('keeps the summary in sync with persisted consent state', () => {
    render(<ParentDashboard />);
    const brianLink = ParentService.getLinks().find(link => link.childId === BRIAN_ID);
    ParentService.unlinkChild(brianLink?.id ?? '');

    expect(ParentService.getActiveLinks()).toHaveLength(1);
    expect(ParentService.getConsentStatus(BRIAN_ID).verified).toBe(false);
    expect(ParentService.getConsentStatus(KEVIN_ID).verified).toBe(true);
  });
});
