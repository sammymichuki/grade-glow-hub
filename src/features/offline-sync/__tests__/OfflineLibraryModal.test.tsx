import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfflineLibraryModal } from '../components/OfflineLibraryModal';
import { HashRouter } from 'react-router-dom';
import '@/shared/i18n/config';

describe('OfflineLibraryModal Component', () => {
  it('renders modal when open is true', () => {
    const onOpenChange = vi.fn();
    render(
      <HashRouter>
        <OfflineLibraryModal open={true} onOpenChange={onOpenChange} />
      </HashRouter>
    );

    expect(screen.getByText(/Offline Learning Library/i)).toBeInTheDocument();
    expect(screen.getByText(/Simulate Offline/i)).toBeInTheDocument();
  });

  it('switches between Cached Lessons and Sync Queue tabs', async () => {
    const onOpenChange = vi.fn();
    render(
      <HashRouter>
        <OfflineLibraryModal open={true} onOpenChange={onOpenChange} />
      </HashRouter>
    );

    const queueTab = screen.getByRole('button', { name: /Sync Queue/i });
    fireEvent.click(queueTab);

    expect(await screen.findByText(/No pending synchronization tasks/i)).toBeInTheDocument();
  });
});
