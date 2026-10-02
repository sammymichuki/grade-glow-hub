import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  HardDrive,
  Trash2,
  BookOpen,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { lessonRepository } from '../repositories/lessonRepository';
import { syncQueueService } from '../services/syncQueueService';
import { db } from '../db/appDatabase';
import { CachedLesson, StorageQuotaInfo, SyncQueueItem } from '@/shared/types/offline';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface OfflineLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OfflineLibraryModal: React.FC<OfflineLibraryModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOnline, pendingCount, isSyncing, syncNow, toggleSimulatedOffline } = useOfflineSync();

  const [cachedLessons, setCachedLessons] = useState<CachedLesson[]>([]);
  const [quota, setQuota] = useState<StorageQuotaInfo | null>(null);
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [activeTab, setActiveTab] = useState<'lessons' | 'queue'>('lessons');

  const loadData = async () => {
    try {
      const lessons = await lessonRepository.getAllCachedLessons();
      setCachedLessons(lessons);
      const quotaInfo = await db.getStorageQuota();
      setQuota(quotaInfo);
      const items = await syncQueueService.getAllQueueItems();
      setQueueItems(items);
    } catch (err) {
      console.error('Failed to load offline data:', err);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, pendingCount, isSyncing]);

  const handleDeleteLesson = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await lessonRepository.removeCachedLesson(id);
    await loadData();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to purge all cached offline lessons and queue data?')) {
      await db.clearAllOfflineData();
      await loadData();
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleOpenLesson = (lesson: CachedLesson) => {
    onOpenChange(false);
    navigate(`/course/${lesson.courseId}/lessons/${lesson.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white p-6 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-education-primary rounded-lg">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {t('offline.libraryTitle')}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  {t('offline.libraryDescription')}
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleSimulatedOffline}
              className={`text-xs gap-1.5 h-8 font-medium ${
                isOnline ? 'border-emerald-200 text-emerald-700 bg-emerald-50/50' : 'border-amber-300 text-amber-700 bg-amber-50'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'Simulate Offline' : 'Restore Online'}
            </Button>
          </div>
        </DialogHeader>

        {/* Quota & Storage Bar */}
        {quota && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 mt-4">
            <div className="flex justify-between text-xs font-medium text-gray-600">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-gray-500" />
                {t('offline.storageUsed')}: {formatBytes(quota.usedBytes)} of {formatBytes(quota.quotaBytes)}
              </span>
              <span>{quota.percentageUsed}%</span>
            </div>
            <Progress value={Math.max(2, quota.percentageUsed)} className="h-2" />
            <div className="flex justify-between items-center text-[11px] text-gray-500 pt-1">
              <span>{cachedLessons.length} lessons saved offline</span>
              <span>{pendingCount} actions awaiting sync</span>
            </div>
          </div>
        )}

        {/* Action Tabs */}
        <div className="flex items-center justify-between border-b pb-2 pt-2">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'lessons' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('lessons')}
              className="text-xs h-8"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              Cached Lessons ({cachedLessons.length})
            </Button>
            <Button
              variant={activeTab === 'queue' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('queue')}
              className="text-xs h-8"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              Sync Queue ({queueItems.length})
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {isOnline && (
              <Button
                variant="outline"
                size="sm"
                onClick={syncNow}
                disabled={isSyncing}
                className="text-xs h-8 gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? t('offline.syncing') : t('common.syncNow')}
              </Button>
            )}
            {cachedLessons.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {t('offline.clearCache')}
              </Button>
            )}
          </div>
        </div>

        {/* Tab 1: Lessons List */}
        {activeTab === 'lessons' && (
          <div className="space-y-3 py-2">
            {cachedLessons.length === 0 ? (
              <div className="text-center py-8 px-4 bg-gray-50/50 rounded-xl border border-dashed text-gray-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-gray-400" />
                <p className="text-sm font-medium">{t('offline.noOfflineLessons')}</p>
              </div>
            ) : (
              cachedLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => handleOpenLesson(lesson)}
                  className="p-3.5 bg-white border border-gray-200 rounded-xl hover:border-education-primary transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-education-primary">
                      {lesson.courseTitle}
                    </div>
                    <div className="text-sm font-bold text-gray-900 group-hover:text-education-primary transition-colors">
                      {lesson.title}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Saved {new Date(lesson.cachedAt).toLocaleDateString()} • {formatBytes(lesson.sizeBytes)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteLesson(lesson.id, e)}
                      className="text-gray-400 hover:text-rose-600 h-8 w-8 p-0"
                      aria-label="Delete cached lesson"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Sync Queue */}
        {activeTab === 'queue' && (
          <div className="space-y-3 py-2">
            {queueItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No pending synchronization tasks. Everything is in sync with the cloud.
              </div>
            ) : (
              queueItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white border rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-800">{item.type}</div>
                    <div className="text-[11px] text-gray-400">
                      Created: {new Date(item.createdAt).toLocaleTimeString()} • Retries: {item.retryCount}
                    </div>
                    {item.errorMessage && (
                      <div className="text-rose-500 text-[10px] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {item.errorMessage}
                      </div>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      item.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'syncing'
                        ? 'bg-blue-100 text-blue-800'
                        : item.status === 'failed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
