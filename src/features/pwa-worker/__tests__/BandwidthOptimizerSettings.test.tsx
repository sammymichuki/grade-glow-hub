import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BandwidthOptimizerSettings } from '../components/BandwidthOptimizerSettings';
import { BANDWIDTH_STORAGE_KEY, DEFAULT_BANDWIDTH_PREFERENCES } from '../services/bandwidthOptimizer';
import { MemoryStorage } from './memoryStorage';

describe('BandwidthOptimizerSettings', () => {
  it('defaults to rich media mode and projects the monthly usage', () => {
    render(<BandwidthOptimizerSettings storage={new MemoryStorage()} />);
    expect(screen.getByRole('button', { name: /Rich Media Mode/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('monthly-usage')).toHaveTextContent('804.0 MB');
  });

  it('switches to data-saver mode, updates usage and persists the choice', () => {
    const storage = new MemoryStorage();
    render(<BandwidthOptimizerSettings storage={storage} />);
    fireEvent.click(screen.getByRole('button', { name: /Data-Saver Audio & Text/i }));

    expect(screen.getByRole('button', { name: /Data-Saver Audio & Text/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('monthly-usage')).toHaveTextContent('19.9 MB');
    expect(screen.getByTestId('monthly-usage')).toHaveTextContent('98% below rich mode');
    expect(JSON.parse(storage.getItem(BANDWIDTH_STORAGE_KEY) as string)).toMatchObject({ mode: 'data-saver' });
  });

  it('notifies the parent and persists when a content switch is toggled', () => {
    const storage = new MemoryStorage();
    const onChange = vi.fn();
    render(<BandwidthOptimizerSettings storage={storage} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Auto-play lesson video'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ videoAutoplay: false }));
    expect(JSON.parse(storage.getItem(BANDWIDTH_STORAGE_KEY) as string)).toMatchObject({ videoAutoplay: false });
  });

  it('exposes the mode-specific per-lesson projections', () => {
    render(<BandwidthOptimizerSettings storage={new MemoryStorage()} />);
    expect(screen.getByText(/Rich: 19\.1 MB\/lesson/i)).toBeInTheDocument();
    expect(screen.getByText(/Data-saver: 484 KB\/lesson/i)).toBeInTheDocument();
  });

  it('respects a custom lessons-per-month initial value', () => {
    render(<BandwidthOptimizerSettings storage={new MemoryStorage()} initialLessonsPerMonth={10} />);
    expect(screen.getByTestId('monthly-usage')).toHaveTextContent('201.0 MB');
  });

  it('recomputes the projection when the lesson count changes', () => {
    render(<BandwidthOptimizerSettings storage={new MemoryStorage()} />);
    fireEvent.change(screen.getByLabelText('Lessons / month'), { target: { value: '20' } });
    expect(screen.getByTestId('monthly-usage')).toHaveTextContent('402.0 MB');
  });

  it('hydrates persisted preferences on first render', () => {
    const storage = new MemoryStorage();
    storage.setItem(BANDWIDTH_STORAGE_KEY, JSON.stringify({ ...DEFAULT_BANDWIDTH_PREFERENCES, mode: 'data-saver' }));
    render(<BandwidthOptimizerSettings storage={storage} />);
    expect(screen.getByRole('button', { name: /Data-Saver Audio & Text/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not show the metered banner when no network information exists', () => {
    render(<BandwidthOptimizerSettings storage={new MemoryStorage()} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText(/Unavailable — the rule stays dormant here\./i)).toBeInTheDocument();
  });
});