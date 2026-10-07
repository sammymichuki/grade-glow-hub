import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SISTabSyncManager } from '../components/SISTabSyncManager';
import { SAMPLE_ONEROSTER_LOCAL } from '../data/sampleSisData';

describe('SISTabSyncManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the hub heading and all five connectors', () => {
    render(<SISTabSyncManager />);

    expect(screen.getByText('SIS & LMS Sync Manager')).toBeInTheDocument();
    expect(screen.getByText('Interoperability Hub')).toBeInTheDocument();
    ['OneRoster 1.2', 'Google Classroom', 'Microsoft School Data Sync', 'Clever / ClassLink', 'LTI 1.3 Advantage'].forEach(
      (name) => expect(screen.getByText(name)).toBeInTheDocument()
    );
    expect(screen.getByTestId('connector-onerooster')).toBeInTheDocument();
    expect(screen.getByTestId('connector-lti13')).toBeInTheDocument();
  });

  it('summarizes connector health in the header badges', () => {
    render(<SISTabSyncManager />);

    expect(screen.getByText('2 connected')).toBeInTheDocument();
    expect(screen.getByText('3 need attention')).toBeInTheDocument();
  });

  it('shows the right status pill and primary action for each connector state', () => {
    render(<SISTabSyncManager />);

    const onerooster = screen.getByTestId('connector-onerooster');
    expect(within(onerooster).getByText('Connected')).toBeInTheDocument();
    expect(within(onerooster).getByRole('button', { name: 'Sync Now' })).toBeInTheDocument();
    expect(within(onerooster).getByRole('button', { name: 'Disconnect' })).toBeInTheDocument();

    const google = screen.getByTestId('connector-google-classroom');
    expect(within(google).getByText('Needs auth')).toBeInTheDocument();
    expect(within(google).getByRole('button', { name: 'Authorize' })).toBeInTheDocument();

    const lti = screen.getByTestId('connector-lti13');
    expect(within(lti).getByText('Error')).toBeInTheDocument();
    expect(within(lti).getByRole('button', { name: 'Retry connection' })).toBeInTheDocument();
  });

  it('exposes credential inputs with connector-scoped labels', () => {
    render(<SISTabSyncManager />);

    expect(screen.getByLabelText('OneRoster 1.2 REST base URL')).toBeInTheDocument();
    expect(screen.getByLabelText('OneRoster 1.2 API key')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Google Classroom OAuth client ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Microsoft School Data Sync Entra tenant ID')).toBeInTheDocument();
    expect(screen.getByLabelText('LTI 1.3 Advantage Deployment ID')).toBeInTheDocument();
  });

  it('reports the LTI platform error and counts missing credentials', () => {
    render(<SISTabSyncManager />);

    const lti = screen.getByTestId('connector-lti13');
    expect(
      within(lti).getByText('Platform JWKS endpoint unreachable — verify the issuer URL.')
    ).toBeInTheDocument();
    expect(within(lti).queryByText(/Awaiting/)).not.toBeInTheDocument();

    expect(screen.getAllByText('Awaiting 2 credentials.')).toHaveLength(2);
  });

  it('starts with an empty sync history log', () => {
    render(<SISTabSyncManager />);

    expect(screen.getByTestId('sync-history-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('sync-history')).not.toBeInTheDocument();
  });

  it('blocks authorization when credentials are empty and logs the failure', () => {
    render(<SISTabSyncManager />);

    const google = screen.getByTestId('connector-google-classroom');
    fireEvent.click(within(google).getByRole('button', { name: 'Authorize' }));

    expect(
      within(screen.getByTestId('connector-google-classroom')).getByText(
        'Missing credentials: OAuth client ID, OAuth client secret.'
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('sync-history')).toHaveTextContent(
      'Authorization blocked — missing OAuth client ID, OAuth client secret.'
    );
    expect(screen.getByText('2 connected')).toBeInTheDocument();
    expect(screen.getByText('3 need attention')).toBeInTheDocument();
  });

  it('authorizes a connector once its credentials are supplied', () => {
    render(<SISTabSyncManager />);

    fireEvent.change(screen.getByLabelText('Google Classroom OAuth client ID'), {
      target: { value: 'client.apps.googleusercontent.com' },
    });
    fireEvent.change(screen.getByLabelText('Google Classroom OAuth client secret'), {
      target: { value: 'GOCSPX-secret' },
    });
    fireEvent.click(within(screen.getByTestId('connector-google-classroom')).getByRole('button', { name: 'Authorize' }));

    const google = screen.getByTestId('connector-google-classroom');
    expect(within(google).getByText('Connected')).toBeInTheDocument();
    expect(within(google).getByText('Credentials validated — connection established.')).toBeInTheDocument();
    expect(within(google).getByText('Last sync: Never synced')).toBeInTheDocument();
    expect(within(google).getByRole('button', { name: 'Sync Now' })).toBeInTheDocument();
    expect(screen.getByText('3 connected')).toBeInTheDocument();
    expect(screen.getByText('2 need attention')).toBeInTheDocument();
  });

  it('disconnects a connected connector and records it in history', () => {
    render(<SISTabSyncManager />);

    const onerooster = screen.getByTestId('connector-onerooster');
    fireEvent.click(within(onerooster).getByRole('button', { name: 'Disconnect' }));

    const updated = screen.getByTestId('connector-onerooster');
    expect(within(updated).getByText('Needs auth')).toBeInTheDocument();
    expect(within(updated).getByText('Disconnected by district operator.')).toBeInTheDocument();
    expect(within(updated).queryByRole('button', { name: 'Disconnect' })).not.toBeInTheDocument();
    expect(screen.getByTestId('sync-history')).toHaveTextContent('Disconnected by district operator.');
    expect(screen.getByText('1 connected')).toBeInTheDocument();
  });

  it('blocks a sync when a required credential was cleared', () => {
    render(<SISTabSyncManager />);

    fireEvent.change(screen.getByLabelText('OneRoster 1.2 API key'), {
      target: { value: '' },
    });
    fireEvent.click(within(screen.getByTestId('connector-onerooster')).getByRole('button', { name: 'Sync Now' }));

    expect(
      within(screen.getByTestId('connector-onerooster')).getByText('Missing credentials: API key.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('sync-history')).toHaveTextContent(
      'Sync blocked — missing API key.'
    );
  });

  it('runs a OneRoster delta sync and reports added/changed/removed counts', async () => {
    render(<SISTabSyncManager />);

    fireEvent.click(within(screen.getByTestId('connector-onerooster')).getByRole('button', { name: 'Sync Now' }));

    const onerooster = screen.getByTestId('connector-onerooster');
    expect(within(onerooster).getByText('Syncing…')).toBeInTheDocument();
    expect(within(onerooster).getByRole('button', { name: 'Authorize' })).toBeDisabled();

    const messages = await screen.findAllByText(/3 added, 6 changed, 2 removed across classes & users/);
    expect(messages.length).toBeGreaterThanOrEqual(2);

    const history = screen.getByTestId('sync-history');
    expect(within(history).getByText('3 added, 6 changed, 2 removed across classes & users')).toBeInTheDocument();
    expect(within(history).getByText('+3')).toBeInTheDocument();
    expect(within(history).getByText('~6')).toBeInTheDocument();
    expect(within(history).getByText('-2')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('connector-onerooster')).getByText(/Last run: 3 added, 6 changed, 2 removed/)
    ).toBeInTheDocument();
    expect(within(screen.getByTestId('connector-onerooster')).getByText('Connected')).toBeInTheDocument();
  });

  it('produces a zero-churn summary when the roster is already in sync', async () => {
    render(<SISTabSyncManager />);

    const onerooster = screen.getByTestId('connector-onerooster');
    fireEvent.click(within(onerooster).getByRole('button', { name: 'Sync Now' }));
    await screen.findAllByText(/3 added, 6 changed, 2 removed across classes & users/);

    fireEvent.click(within(screen.getByTestId('connector-onerooster')).getByRole('button', { name: 'Sync Now' }));
    const second = await screen.findAllByText(/0 added, 0 changed, 0 removed across classes & users/);

    expect(second.length).toBeGreaterThanOrEqual(2);
    const history = screen.getByTestId('sync-history');
    expect(within(history).getByText('0 added, 0 changed, 0 removed across classes & users')).toBeInTheDocument();
    expect(within(history).getByText('+0')).toBeInTheDocument();
    expect(history.querySelectorAll('li')).toHaveLength(2);
  });

  it('exports the local roster through the CSV bridge for non-OneRoster connectors', async () => {
    render(<SISTabSyncManager />);

    const expectedRows = SAMPLE_ONEROSTER_LOCAL.classes.length;
    const clever = screen.getByTestId('connector-clever-classlink');
    fireEvent.click(within(clever).getByRole('button', { name: 'Sync Now' }));

    const message = await screen.findByText(
      `Exported ${expectedRows} class rows via the OneRoster CSV bridge`
    );
    expect(message).toBeInTheDocument();
    expect(screen.getByTestId('sync-history')).toHaveTextContent(
      `Exported ${expectedRows} class rows via the OneRoster CSV bridge`
    );
    expect(
      within(screen.getByTestId('connector-clever-classlink')).getByText(/Last run: Exported/)
    ).toBeInTheDocument();
  });

  it('moves new history entries to the top of the log', async () => {
    render(<SISTabSyncManager />);

    const clever = screen.getByTestId('connector-clever-classlink');
    fireEvent.click(within(clever).getByRole('button', { name: 'Sync Now' }));
    await screen.findAllByText(/Exported \d+ class rows via the OneRoster CSV bridge/);

    fireEvent.click(within(screen.getByTestId('connector-onerooster')).getByRole('button', { name: 'Sync Now' }));
    await screen.findAllByText(/3 added, 6 changed, 2 removed across classes & users/);

    const items = screen.getByTestId('sync-history').querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('OneRoster 1.2');
    expect(items[1]).toHaveTextContent('Clever / ClassLink');
  });
});
