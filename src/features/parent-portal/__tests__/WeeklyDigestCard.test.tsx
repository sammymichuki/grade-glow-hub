import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WeeklyDigestCard } from '../components/WeeklyDigestCard';
import { ParentService } from '../services/parentService';
import { KEVIN_ID } from '../data/sampleParentData';

describe('WeeklyDigestCard Component', () => {
  beforeEach(() => {
    ParentService.resetToDefaults();
  });

  it('renders the digest header, reporting window and four stat tiles', () => {
    const digest = ParentService.buildWeeklyDigest(KEVIN_ID);
    render(<WeeklyDigestCard digest={digest} />);

    expect(screen.getByText('Weekly Digest · Kevin')).toBeInTheDocument();
    expect(screen.getByText(/Week-over-week score change/)).toBeInTheDocument();
    expect(screen.getByText('Modules Completed')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('Average Score')).toBeInTheDocument();
    expect(screen.getByText('77%')).toBeInTheDocument();
    expect(screen.getByText('Attendance')).toBeInTheDocument();
    expect(screen.getByText('Homework Done')).toBeInTheDocument();
    expect(screen.getByText('76% → 77%')).toBeInTheDocument();
  });

  it('shows strengths, weaknesses and teacher notes from the digest payload', () => {
    const digest = ParentService.buildWeeklyDigest(KEVIN_ID);
    render(<WeeklyDigestCard digest={digest} />);

    const strengths = screen.getByTestId('digest-strengths');
    expect(within(strengths).getByText('Mathematics — 88% (+6)')).toBeInTheDocument();
    expect(within(strengths).getByText('English — 80% (+1)')).toBeInTheDocument();

    const weaknesses = screen.getByTestId('digest-weaknesses');
    expect(within(weaknesses).getByText('Kiswahili — 64% (-5)')).toBeInTheDocument();

    const notes = screen.getByTestId('teacher-notes');
    expect(within(notes).getByText(/excellent improvement in algebraic expressions/)).toBeInTheDocument();
    expect(within(notes).getByText(/Ms\. Wanjiru Njoroge · Mathematics/)).toBeInTheDocument();
    expect(within(notes).getByText(/photosynthesis recap/)).toBeInTheDocument();
  });

  it('previews the English dispatch message by default', () => {
    const digest = ParentService.buildWeeklyDigest(KEVIN_ID);
    render(<WeeklyDigestCard digest={digest} />);

    const preview = screen.getByTestId('digest-message-preview');
    expect(within(preview).getByText('Dispatch Preview (EN)')).toBeInTheDocument();
    expect(within(preview).getByText(/Hello Mrs\. Kamau, Kevin completed 4 math modules/)).toBeInTheDocument();
    expect(within(preview).getByText(/Next Integrated Science quiz is this/)).toBeInTheDocument();
  });

  it('switches the dispatch preview to Swahili and back', () => {
    const digest = ParentService.buildWeeklyDigest(KEVIN_ID);
    render(<WeeklyDigestCard digest={digest} />);

    const swButton = screen.getByRole('button', { name: 'SW' });
    expect(swButton).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(swButton);

    const preview = screen.getByTestId('digest-message-preview');
    expect(within(preview).getByText('Ujumbe wa Mwendesha (SW)')).toBeInTheDocument();
    expect(within(preview).getByText(/Habari Bibi Kamau, Kevin amekamilisha moduli 4 za hisaba/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SW' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(within(screen.getByTestId('digest-message-preview')).getByText('Dispatch Preview (EN)')).toBeInTheDocument();
  });

  it('renders the delta badge with the week-over-week score trend', () => {
    const digest = ParentService.buildWeeklyDigest(KEVIN_ID);
    render(<WeeklyDigestCard digest={digest} />);

    expect(screen.getByText('+1 vs last week')).toBeInTheDocument();
  });
});
