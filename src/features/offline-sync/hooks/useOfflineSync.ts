import { useState, useEffect, useCallback } from 'react';
import { syncQueueService } from '../services/syncQueueService';

export interface UseOfflineSyncResult {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncNow: () => Promise<{ processed: number; succeeded: number; failed: number }>;
  toggleSimulatedOffline: () => void;
}

export const useOfflineSync = (): UseOfflineSyncResult => {
  const [syncState, setSyncState] = useState({
    isOnline: syncQueueService.getOnlineStatus(),
    pendingCount: 0,
    isSyncing: false,
    lastSyncTime: null as number | null,
  });

  useEffect(() => {
    const unsubscribe = syncQueueService.subscribe((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  const syncNow = useCallback(async () => {
    return await syncQueueService.processQueue();
  }, []);

  const toggleSimulatedOffline = useCallback(() => {
    syncQueueService.setOnlineStatus(!syncQueueService.getOnlineStatus());
  }, []);

  return {
    isOnline: syncState.isOnline,
    pendingCount: syncState.pendingCount,
    isSyncing: syncState.isSyncing,
    lastSyncTime: syncState.lastSyncTime,
    syncNow,
    toggleSimulatedOffline,
  };
};
