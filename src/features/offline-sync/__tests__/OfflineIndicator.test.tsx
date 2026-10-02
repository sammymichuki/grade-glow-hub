import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { syncQueueService } from '../services/syncQueueService';
import '@/shared/i18n/config';

describe('OfflineIndicator Component', () => {
  beforeEach(() => {
    syncQueueService.setOnlineStatus(true);
  });

  it('renders online badge when connected', () => {
    render(
      <HashRouter>
        <OfflineIndicator />
      </HashRouter>
    );
    expect(screen.getByTitle(/Cloud Synced/i)).toBeInTheDocument();
  });

  it('renders offline state when disconnected', () => {
    syncQueueService.setOnlineStatus(false);
    render(
      <HashRouter>
        <OfflineIndicator />
      </HashRouter>
    );
    expect(screen.getByTitle(/Offline Mode Active/i)).toBeInTheDocument();
  });

  it('opens offline library dialog when clicked', async () => {
    render(
      <HashRouter>
        <OfflineIndicator />
      </HashRouter>
    );
    const indicatorBtn = screen.getByTitle(/Cloud Synced/i);
    fireEvent.click(indicatorBtn);

    expect(await screen.findByText(/Offline Learning Library/i)).toBeInTheDocument();
  });
});
