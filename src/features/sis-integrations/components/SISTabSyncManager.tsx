import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Plug,
  Unplug,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
} from 'lucide-react';
import {
  SisConnector,
  SisConnectorId,
  SisConnectionStatus,
  SyncHistoryEntry,
  OneRosterClassRow,
  OneRosterUserRow,
} from '../types/sis';
import {
  applySyncPlan,
  computeSyncPlan,
  serializeOneRosterCsv,
} from '../services/oneRosterService';
import { SAMPLE_ONEROSTER_LOCAL, SAMPLE_ONEROSTER_REMOTE } from '../data/sampleSisData';

const SYNC_LATENCY_MS = 350;

const createInitialConnectors = (): SisConnector[] => [
  {
    id: 'onerooster',
    name: 'OneRoster 1.2',
    vendor: '1EdTech / IMS Global',
    description: 'REST + CSV roster sync with delta bundles keyed by dateLastModified.',
    status: 'connected',
    lastSyncAt: '2026-10-04T08:30:00.000Z',
    credentialFields: [
      { key: 'baseUrl', label: 'REST base URL', placeholder: 'https://demo.oneroster.org/1p2/api' },
      { key: 'orgSourcedId', label: 'District org sourcedId', placeholder: 'org-000' },
      { key: 'apiKey', label: 'API key', placeholder: 'Enter API key', secret: true },
    ],
    credentials: {
      baseUrl: 'https://demo.oneroster.org/1p2/api',
      orgSourcedId: 'org-000',
      apiKey: 'demo-key-9f2a',
    },
  },
  {
    id: 'google-classroom',
    name: 'Google Classroom',
    vendor: 'Google Workspace for Education',
    description: 'Course, section, and teacher roster import for Classroom-backed classes.',
    status: 'needs-auth',
    lastSyncAt: null,
    credentialFields: [
      { key: 'clientId', label: 'OAuth client ID', placeholder: 'xxxx.apps.googleusercontent.com' },
      { key: 'clientSecret', label: 'OAuth client secret', placeholder: 'GOCSPX-…', secret: true },
    ],
    credentials: { clientId: '', clientSecret: '' },
  },
  {
    id: 'microsoft-sds',
    name: 'Microsoft School Data Sync',
    vendor: 'Microsoft Education',
    description: 'SDS CSV v2 grade/section import and roster export pipelines.',
    status: 'needs-auth',
    lastSyncAt: null,
    credentialFields: [
      { key: 'tenantId', label: 'Entra tenant ID', placeholder: '00000000-0000-0000-0000-000000000000' },
      { key: 'clientSecret', label: 'App client secret', placeholder: 'Enter secret', secret: true },
      { key: 'profileName', label: 'SDS profile', placeholder: 'GradeGlow-Schools' },
    ],
    credentials: { tenantId: '', clientSecret: '', profileName: 'GradeGlow-Schools' },
  },
  {
    id: 'clever-classlink',
    name: 'Clever / ClassLink',
    vendor: 'Clever & ClassLink Roster Server',
    description: 'District SSO plus nightly OneRoster provisioning bundles.',
    status: 'connected',
    lastSyncAt: '2026-10-03T17:45:00.000Z',
    credentialFields: [
      { key: 'districtId', label: 'District ID', placeholder: 'ke-highlands-01' },
      { key: 'apiKey', label: 'API key', placeholder: 'Enter API key', secret: true },
    ],
    credentials: { districtId: 'ke-highlands-01', apiKey: 'clv_7c1e4b' },
  },
  {
    id: 'lti13',
    name: 'LTI 1.3 Advantage',
    vendor: 'Canvas / Moodle / Blackboard',
    description: 'OIDC launches, Deep Linking, and AGS line-item grade passback.',
    status: 'error',
    statusMessage: 'Platform JWKS endpoint unreachable — verify the issuer URL.',
    lastSyncAt: '2026-10-02T12:10:00.000Z',
    credentialFields: [
      { key: 'issuer', label: 'Platform issuer URL', placeholder: 'https://canvas.instructure.com' },
      { key: 'clientId', label: 'Client ID', placeholder: '10000000000123' },
      { key: 'deploymentId', label: 'Deployment ID', placeholder: '4581:91f3' },
    ],
    credentials: {
      issuer: 'https://canvas.instructure.com',
      clientId: '10000000000123',
      deploymentId: '4581:91f3',
    },
  },
];

const STATUS_STYLES: Record<SisConnectionStatus, string> = {
  connected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'needs-auth': 'bg-amber-50 text-amber-800 border-amber-200',
  error: 'bg-rose-50 text-rose-700 border-rose-200',
  syncing: 'bg-sky-50 text-sky-700 border-sky-200',
};

const STATUS_LABELS: Record<SisConnectionStatus, string> = {
  connected: 'Connected',
  'needs-auth': 'Needs auth',
  error: 'Error',
  syncing: 'Syncing…',
};

const formatTimestamp = (iso: string | null): string => {
  if (!iso) return 'Never synced';
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleString();
};

export const SISTabSyncManager: React.FC = () => {
  const [connectors, setConnectors] = useState<SisConnector[]>(createInitialConnectors);
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [classBaseline, setClassBaseline] = useState<OneRosterClassRow[]>([
    ...SAMPLE_ONEROSTER_LOCAL.classes,
  ]);
  const [userBaseline, setUserBaseline] = useState<OneRosterUserRow[]>([
    ...SAMPLE_ONEROSTER_LOCAL.users,
  ]);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const historyId = useRef(0);
  const pushHistory = (entry: Omit<SyncHistoryEntry, 'id' | 'timestamp'>): void => {
    historyId.current += 1;
    setHistory((current) =>
      [
        {
          ...entry,
          id: `sync-${historyId.current}`,
          timestamp: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 12)
    );
  };

  const updateConnector = (id: SisConnectorId, patch: Partial<SisConnector>): void => {
    setConnectors((current) =>
      current.map((connector) => (connector.id === id ? { ...connector, ...patch } : connector))
    );
  };

  const setCredential = (id: SisConnectorId, key: string, value: string): void => {
    setConnectors((current) =>
      current.map((connector) =>
        connector.id === id
          ? { ...connector, credentials: { ...connector.credentials, [key]: value } }
          : connector
      )
    );
  };

  const missingCredentialKeys = (connector: SisConnector): string[] =>
    connector.credentialFields
      .filter((field) => (connector.credentials[field.key] ?? '').trim().length === 0)
      .map((field) => field.label);

  const authorize = (connector: SisConnector): void => {
    const missing = missingCredentialKeys(connector);
    if (missing.length > 0) {
      updateConnector(connector.id, {
        status: 'error',
        statusMessage: `Missing credentials: ${missing.join(', ')}.`,
      });
      pushHistory({
        connectorId: connector.id,
        connectorName: connector.name,
        message: `Authorization blocked — missing ${missing.join(', ')}.`,
      });
      return;
    }
    updateConnector(connector.id, {
      status: 'connected',
      statusMessage: 'Credentials validated — connection established.',
      lastSyncAt: null,
    });
    pushHistory({
      connectorId: connector.id,
      connectorName: connector.name,
      message: 'Credentials validated — connection established.',
    });
  };

  const disconnect = (connector: SisConnector): void => {
    updateConnector(connector.id, {
      status: 'needs-auth',
      statusMessage: 'Disconnected by district operator.',
    });
    pushHistory({
      connectorId: connector.id,
      connectorName: connector.name,
      message: 'Disconnected by district operator.',
    });
  };

  const executeSync = (connector: SisConnector): void => {
    if (connector.id === 'onerooster') {
      const classPlan = computeSyncPlan('classes', classBaseline, SAMPLE_ONEROSTER_REMOTE.classes);
      const userPlan = computeSyncPlan('users', userBaseline, SAMPLE_ONEROSTER_REMOTE.users);
      const added = classPlan.added.length + userPlan.added.length;
      const changed = classPlan.changed.length + userPlan.changed.length;
      const removed = classPlan.removed.length + userPlan.removed.length;

      setClassBaseline((current) => applySyncPlan(current, classPlan));
      setUserBaseline((current) => applySyncPlan(current, userPlan));

      const message = `${added} added, ${changed} changed, ${removed} removed across classes & users`;
      updateConnector(connector.id, {
        status: 'connected',
        statusMessage: `Last run: ${message}`,
        lastSyncAt: new Date().toISOString(),
      });
      pushHistory({
        connectorId: connector.id,
        connectorName: connector.name,
        message,
        added,
        changed,
        removed,
      });
      return;
    }

    const csv = serializeOneRosterCsv('classes', classBaseline);
    const rowCount = Math.max(csv.split('\r\n').length - 1, 0);
    const message = `Exported ${rowCount} class rows via the OneRoster CSV bridge`;
    updateConnector(connector.id, {
      status: 'connected',
      statusMessage: `Last run: ${message}`,
      lastSyncAt: new Date().toISOString(),
    });
    pushHistory({
      connectorId: connector.id,
      connectorName: connector.name,
      message,
    });
  };

  const runSync = (connector: SisConnector): void => {
    const missing = missingCredentialKeys(connector);
    if (missing.length > 0) {
      updateConnector(connector.id, {
        status: 'error',
        statusMessage: `Missing credentials: ${missing.join(', ')}.`,
      });
      pushHistory({
        connectorId: connector.id,
        connectorName: connector.name,
        message: `Sync blocked — missing ${missing.join(', ')}.`,
      });
      return;
    }

    updateConnector(connector.id, { status: 'syncing', statusMessage: undefined });
    const timer = window.setTimeout(() => {
      executeSync(connector);
    }, SYNC_LATENCY_MS);
    timersRef.current.push(timer);
  };

  const handlePrimaryAction = (connector: SisConnector): void => {
    if (connector.status === 'connected') runSync(connector);
    else authorize(connector);
  };

  const totals = useMemo(
    () => ({
      connected: connectors.filter((c) => c.status === 'connected').length,
      attention: connectors.filter((c) => c.status !== 'connected').length,
    }),
    [connectors]
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4 px-2 sm:px-0" data-testid="sis-sync-manager">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-education-primary">
            Interoperability Hub
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">SIS & LMS Sync Manager</h2>
          <p className="text-sm text-gray-500">
            OneRoster 1.2, Google Classroom, Microsoft SDS, Clever/ClassLink, and LTI 1.3 connectors.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> {totals.connected} connected
          </Badge>
          <Badge variant="outline" className="text-[11px] bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> {totals.attention} need attention
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {connectors.map((connector) => {
          const missing = missingCredentialKeys(connector);
          return (
            <div
              key={connector.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4"
              data-testid={`connector-${connector.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-gray-900">{connector.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                        STATUS_STYLES[connector.status]
                      }`}
                    >
                      {connector.status === 'connected' && <CheckCircle2 className="w-3 h-3" />}
                      {connector.status === 'error' && <AlertTriangle className="w-3 h-3" />}
                      {connector.status === 'syncing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {connector.status === 'needs-auth' && <Clock className="w-3 h-3" />}
                      {STATUS_LABELS[connector.status]}
                    </span>
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                    {connector.vendor}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">{connector.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {connector.credentialFields.map((field) => (
                  <label key={field.key} className="space-y-1">
                    <span className="text-[11px] font-semibold text-gray-600">{field.label}</span>
                    <input
                      type={field.secret ? 'password' : 'text'}
                      value={connector.credentials[field.key] ?? ''}
                      onChange={(event) => setCredential(connector.id, field.key, event.target.value)}
                      placeholder={field.placeholder}
                      aria-label={`${connector.name} ${field.label}`}
                      className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
                <div className="text-[11px] text-gray-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Last sync: {formatTimestamp(connector.lastSyncAt)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handlePrimaryAction(connector)}
                    disabled={connector.status === 'syncing'}
                    className={`text-[11px] font-semibold gap-1 ${
                      connector.status === 'connected'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    {connector.status === 'connected' ? (
                      <>
                        <RefreshCw className="w-3 h-3" /> Sync Now
                      </>
                    ) : (
                      <>
                        <Plug className="w-3 h-3" />{' '}
                        {connector.status === 'error' ? 'Retry connection' : 'Authorize'}
                      </>
                    )}
                  </Button>
                  {connector.status === 'connected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => disconnect(connector)}
                      className="text-[11px] font-semibold gap-1"
                    >
                      <Unplug className="w-3 h-3" /> Disconnect
                    </Button>
                  )}
                </div>
              </div>

              {connector.statusMessage && (
                <p
                  className={`text-[11px] font-semibold rounded-lg px-2.5 py-1.5 ${
                    connector.status === 'error'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}
                  role="status"
                >
                  {connector.statusMessage}
                </p>
              )}
              {connector.status === 'needs-auth' && missing.length > 0 && (
                <p className="text-[11px] text-amber-700 font-semibold">
                  Awaiting {missing.length} credential{missing.length > 1 ? 's' : ''}.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <History className="w-4 h-4 text-indigo-600" /> Sync History
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center" data-testid="sync-history-empty">
            No sync runs recorded yet — run a connector to populate the log.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100" data-testid="sync-history">
            {history.map((entry) => (
              <li key={entry.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-[11px] font-mono text-gray-400 sm:w-44 shrink-0">
                  {formatTimestamp(entry.timestamp)}
                </span>
                <span className="text-xs font-bold text-gray-800 sm:w-48 shrink-0">
                  {entry.connectorName}
                </span>
                <span className="text-xs text-gray-600 flex-1">{entry.message}</span>
                {entry.added !== undefined && entry.changed !== undefined && entry.removed !== undefined && (
                  <span className="flex gap-1 shrink-0">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      +{entry.added}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                      ~{entry.changed}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">
                      -{entry.removed}
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
