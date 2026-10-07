import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Clock, Cloud, Database, RefreshCw, Router, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { EdgeMeshSnapshot, EdgeNodeRecord, EdgeNodeStatus } from '../types/edgeMesh';
import { EdgeNodeService, edgeNodeService, RunSyncResult, SYNC_LINK_BYTES_PER_SECOND } from '../services/edgeNodeService';

export interface EdgeSyncStatusWidgetProps {
  service?: EdgeNodeService;
  node?: EdgeNodeRecord;
  onSyncCompleted?: (result: RunSyncResult) => void;
  className?: string;
}

const STATUS_STYLES: Record<EdgeNodeStatus, { label: string; className: string }> = {
  online: { label: 'Cloud Linked', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  'edge-only': { label: 'Edge-Only (LAN)', className: 'bg-amber-100 text-amber-900 border-amber-200' },
  offline: { label: 'Offline', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  syncing: { label: 'Syncing Delta', className: 'bg-blue-100 text-blue-800 border-blue-200' },
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
};

const Sparkline: React.FC<{ samples: number[] }> = ({ samples }) => {
  if (samples.length === 0) {
    return <span className="text-xs text-gray-400">No samples yet</span>;
  }
  const width = 128;
  const height = 36;
  const max = Math.max(...samples, 1);
  const stepX = samples.length > 1 ? width / (samples.length - 1) : width;
  const points = samples
    .map((sample, index) => `${(index * stepX).toFixed(1)},${(height - (sample / max) * (height - 4) - 2).toFixed(1)}`)
    .join(' ');
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Throughput sparkline"
      className="text-emerald-600"
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
};

export const EdgeSyncStatusWidget: React.FC<EdgeSyncStatusWidgetProps> = ({
  service,
  node: nodeOverride,
  onSyncCompleted,
  className = '',
}) => {
  const activeService = useMemo(() => service ?? edgeNodeService, [service]);
  const [snapshot, setSnapshot] = useState<EdgeMeshSnapshot>(() => activeService.snapshot());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    setSnapshot(activeService.snapshot());
  }, [activeService]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const node = nodeOverride ?? snapshot.node;
  const pendingCount = snapshot.pendingCount;
  const lastSession = snapshot.lastSession;
  const pendingBytes = useMemo(
    () => activeService.getPendingMutations().reduce((sum, mutation) => sum + mutation.byteSize, 0),
    [activeService, snapshot]
  );

  const effectiveStatus: EdgeNodeStatus = !isOnline
    ? 'offline'
    : isSyncing
    ? 'syncing'
    : node?.status ?? 'offline';

  const bytesPerSecond =
    lastSession && lastSession.wireDurationMs > 0
      ? lastSession.planSummary.totalBytes / (lastSession.wireDurationMs / 1000)
      : SYNC_LINK_BYTES_PER_SECOND;

  const throughputKb = bytesPerSecond / 1024;
  const etaMs = pendingBytes > 0 ? Math.ceil((pendingBytes / bytesPerSecond) * 1000) : 0;

  const progressPct = pendingCount === 0 ? 100 : 0;
  const storagePct =
    node && node.storageTotalBytes > 0
      ? Math.min(100, Math.round((node.storageUsedBytes / node.storageTotalBytes) * 100))
      : 0;

  const handleRetry = useCallback(() => {
    setIsSyncing(true);
    try {
      const result = activeService.runSyncSession();
      setSnapshot(activeService.snapshot());
      if (result) onSyncCompleted?.(result);
    } finally {
      setIsSyncing(false);
    }
  }, [activeService, onSyncCompleted]);

  const style = STATUS_STYLES[effectiveStatus];
  const cloudReachable = isOnline && effectiveStatus === 'online';

  return (
    <section
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 ${className}`}
      aria-label="Edge sync status widget"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Router className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {node ? node.label : 'No school mesh box discovered'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {node ? (
                <>
                  LAN <span className="font-mono font-semibold">{node.lanAddress}</span> · uptime{' '}
                  {formatUptime(node.uptimeSeconds)} · fw {node.firmwareVersion}
                </>
              ) : (
                'Discover the edge box on the school LAN to start offline-first syncing'
              )}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${style.className}`}
        >
          {effectiveStatus === 'syncing' ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : effectiveStatus === 'offline' ? (
            <WifiOff className="h-3 w-3" />
          ) : effectiveStatus === 'edge-only' ? (
            <Database className="h-3 w-3" />
          ) : (
            <Cloud className="h-3 w-3" />
          )}
          {style.label}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Last Sync
          </span>
          <p className="text-xs font-semibold text-gray-900 mt-1">
            {snapshot.lastOpportunisticSyncAt
              ? formatDistanceToNow(new Date(snapshot.lastOpportunisticSyncAt), { addSuffix: true })
              : 'Never'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pending Mutations</span>
          <p className="text-xs font-semibold text-gray-900 mt-1" data-testid="pending-mutations">
            {pendingCount} queued ({pendingBytes} B)
          </p>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Throughput</span>
          <p className="text-xs font-semibold text-gray-900 mt-1">
            {throughputKb.toFixed(1)} KB/s ·{' '}
            {pendingCount > 0 ? `ETA ${formatDuration(etaMs)}` : 'delta clear'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Box Storage</span>
          <p className="text-xs font-semibold text-gray-900 mt-1">
            {storagePct}% used · {node ? node.connectedClients : 0} clients
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span className="font-semibold">
            {pendingCount === 0 ? 'All deltas acknowledged' : `${pendingCount} delta(s) awaiting upload`}
          </span>
          <span className="font-bold text-gray-700">{progressPct}%</span>
        </div>
        <div
          className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Delta transfer progress"
        >
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              progressPct === 100 ? 'bg-emerald-500' : 'bg-teal-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Activity className="h-3 w-3" /> Throughput history
            </span>
            <Sparkline samples={snapshot.throughputSamples} />
          </div>
          <div className="text-[11px] text-gray-600 leading-relaxed max-w-[14rem]">
            <span className={`font-bold ${cloudReachable ? 'text-emerald-700' : 'text-amber-700'}`}>
              {cloudReachable ? 'Cloud link reachable' : isOnline ? 'Cloud unreachable — edge cache holds data' : 'No WAN — LAN only'}
            </span>
            <br />
            <span className="text-gray-400">v{snapshot.documentVersion} of the shared document</span>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleRetry}
          disabled={isSyncing || pendingCount === 0}
          className="text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {pendingCount === 0 ? 'Up to Date' : 'Retry Sync'}
        </Button>
      </div>
    </section>
  );
};
