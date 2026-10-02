import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, RefreshCw, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { OfflineLibraryModal } from './OfflineLibraryModal';

export const OfflineIndicator: React.FC = () => {
  const { t } = useTranslation();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className={`h-8 px-2.5 text-xs font-semibold rounded-full border transition-all flex items-center gap-1.5 ${
            !isOnline
              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-sm'
              : pendingCount > 0
              ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          }`}
          title={isOnline ? 'Cloud Synced - Click to manage offline storage' : 'Offline Mode Active'}
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
          ) : !isOnline ? (
            <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          ) : (
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          )}

          <span className="hidden sm:inline">
            {!isOnline
              ? t('offline.offlineMode')
              : isSyncing
              ? t('offline.syncing')
              : pendingCount > 0
              ? `${pendingCount} ${t('offline.pendingSync')}`
              : t('nav.onlineBadge')}
          </span>

          <span className="sm:hidden">
            {!isOnline ? 'Offline' : pendingCount > 0 ? `${pendingCount}` : 'Online'}
          </span>

          <HardDrive className="w-3 h-3 opacity-60 ml-0.5" />
        </Button>
      </div>

      <OfflineLibraryModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};
