import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreakCounterWidget } from '../components/StreakCounterWidget';
import { gamificationService } from '../services/gamificationService';

describe('StreakCounterWidget Component', () => {
  beforeEach(() => {
    gamificationService.resetToDefaults();
  });

  it('renders streak days, flame status, and coin badge', () => {
    render(<StreakCounterWidget />);

    expect(screen.getByText(/Day Streak/i)).toBeInTheDocument();
    expect(screen.getByText(/Study daily to protect your flame/i)).toBeInTheDocument();
    expect(screen.getByText(/380 Coins/i)).toBeInTheDocument();
    expect(screen.getByText(/Record Study Session/i)).toBeInTheDocument();
  });

  it('records study session and triggers feedback message', () => {
    render(<StreakCounterWidget />);

    const recordBtn = screen.getByRole('button', { name: /Record Study Session/i });
    fireEvent.click(recordBtn);

    expect(screen.getByText(/Daily streak continued/i)).toBeInTheDocument();
  });

  it('allows purchasing streak freeze if available', () => {
    render(<StreakCounterWidget />);

    const buyBtn = screen.getByRole('button', { name: /\+ Buy \(100 coins\)/i });
    fireEvent.click(buyBtn);

    expect(screen.getByText(/Streak freeze acquired successfully/i)).toBeInTheDocument();
  });
});
