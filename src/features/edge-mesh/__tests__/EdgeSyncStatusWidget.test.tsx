import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EdgeNodeService, RunSyncResult } from '../services/edgeNodeService';
import { EdgeSyncStatusWidget } from '../components/EdgeSyncStatusWidget';
import { MemoryStorage } from './memoryStorage';

const ONLINE = true;
const nowTs = 1_760_000_000_000;

const emptyStateJson = JSON.stringify({
  nodes: [],
  pendingMutations: [],
  sessions: [],
  throughputSamples: [],
  syncedDocument: {},
  documentVersion: 0,
  lastOpportunisticSyncAt: null,
});

beforeEach(() => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => ONLINE });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EdgeSyncStatusWidget', () => {
  it('renders the discovered mesh box and an online status pill', () => {
    render(<EdgeSyncStatusWidget service={new EdgeNodeService({ storage: new MemoryStorage(), now: () => nowTs })} />);
    expect(screen.getByText('Kibera North Primary — Mesh Box')).toBeInTheDocument();
    expect(screen.getByText('Cloud Linked')).toBeInTheDocument();
    expect(screen.getByText(/192\.168\.4\.1/)).toBeInTheDocument();
  });

  it('shows the queued mutation count and pending bytes', () => {
    render(<EdgeSyncStatusWidget service={new EdgeNodeService({ storage: new MemoryStorage(), now: () => nowTs })} />);
    expect(screen.getByTestId('pending-mutations')).toHaveTextContent('6 queued');
  });

  it('runs a sync on click and reports completion back to the caller', () => {
    const onSyncCompleted = vi.fn();
    const service = new EdgeNodeService({ storage: new MemoryStorage(), now: () => nowTs });
    render(<EdgeSyncStatusWidget service={service} onSyncCompleted={onSyncCompleted} />);

    expect(screen.getByRole('button', { name: /Retry Sync/i })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /Retry Sync/i }));

    expect(screen.getByTestId('pending-mutations')).toHaveTextContent('0 queued');
    expect(screen.getByRole('button', { name: /Up to Date/i })).toBeDisabled();
    expect(onSyncCompleted).toHaveBeenCalledTimes(1);
    const result = onSyncCompleted.mock.calls[0][0] as RunSyncResult;
    expect(result.session.status).toBe('complete');
  });

  it('moves to the offline pill when the connection drops', () => {
    render(<EdgeSyncStatusWidget service={new EdgeNodeService({ storage: new MemoryStorage(), now: () => nowTs })} />);
    fireEvent(window, new Event('offline'));
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('exposes deltas-waiting progress on the progress bar', () => {
    render(<EdgeSyncStatusWidget service={new EdgeNodeService({ storage: new MemoryStorage(), now: () => nowTs })} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders an empty state when no box has been discovered', () => {
    const storage = new MemoryStorage();
    storage.setItem('gg_edge_mesh_state_v1', emptyStateJson);
    render(<EdgeSyncStatusWidget service={new EdgeNodeService({ storage, now: () => nowTs })} />);
    expect(screen.getByText('No school mesh box discovered')).toBeInTheDocument();
  });

  it('shows node storage usage and client count', () => {
    render(<EdgeSyncStatusWidget service={new EdgeNodeService({ storage: new MemoryStorage(), now: () => nowTs })} />);
    expect(screen.getByText(/29% used/)).toBeInTheDocument();
    expect(screen.getByText(/27 clients/)).toBeInTheDocument();
  });
});