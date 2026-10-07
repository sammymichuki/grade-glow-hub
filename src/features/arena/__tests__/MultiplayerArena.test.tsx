import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiplayerArena } from '../components/MultiplayerArena';
import { arenaService } from '../services/arenaService';
import { gamificationService } from '@/features/gamification/services/gamificationService';

describe('MultiplayerArena Component', () => {
  beforeEach(() => {
    gamificationService.resetToDefaults();
    arenaService.resetRoom('arena-stem-7');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders arena lobby, room title, and participants', () => {
    render(<MultiplayerArena />);

    expect(screen.getByText(/GlowArena Multiplayer Championship/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Grade 7 STEM Championship Showdown/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Enter Arena & Start Tournament/i)).toBeInTheDocument();
  });

  it('starts match and displays active question with options', () => {
    render(<MultiplayerArena />);

    const startBtn = screen.getByRole('button', { name: /Enter Arena & Start Tournament/i });
    fireEvent.click(startBtn);

    expect(screen.getByText(/Question 1 of 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Which organelle is responsible for generating ATP/i)).toBeInTheDocument();
    expect(screen.getByText('Mitochondria')).toBeInTheDocument();
  });

  it('handles question answer selection, transitions to round review, and reveals explanation', () => {
    render(<MultiplayerArena />);

    const startBtn = screen.getByRole('button', { name: /Enter Arena & Start Tournament/i });
    fireEvent.click(startBtn);

    const mitoOption = screen.getByText('Mitochondria');
    fireEvent.click(mitoOption);

    expect(screen.getByText(/Explanation & Solution/i)).toBeInTheDocument();
    expect(screen.getByText(/powerhouses of eukaryotic cells/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next Round/i })).toBeInTheDocument();
  });
});
