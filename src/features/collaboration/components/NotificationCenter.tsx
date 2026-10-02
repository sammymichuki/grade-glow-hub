import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNotification } from '@/shared/types/collaboration';
import { notificationService } from '../services/notificationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  BookCheck,
  Award,
  Info,
  Trash2,
} from 'lucide-react';

interface NotificationCenterProps {
  userId?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId = 'current-user',
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'academic' | 'community'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    notificationService.getNotifications(userId)
  );

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((list) => {
      setNotifications(
        list.filter((n) => n.userId === userId || n.userId === 'all')
      );
    });
    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredList = notificationService.filterByType(notifications, filter);

  const handleItemClick = (notif: AppNotification) => {
    notificationService.markAsRead(notif.id);
    if (notif.linkUrl) {
      setIsOpen(false);
      navigate(notif.linkUrl);
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(userId);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    notificationService.deleteNotification(id);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'forum_reply':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'peer_review_assigned':
      case 'peer_review_received':
        return <BookCheck className="w-4 h-4 text-amber-500" />;
      case 'grade_posted':
        return <Award className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notification Center"
          className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors focus:outline-none"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 md:w-96 p-0 shadow-lg rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-red-50 text-red-700">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-education-primary hover:text-education-primary/80 gap-1 px-2"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-2 bg-gray-50 border-b text-xs">
          {(['all', 'unread', 'academic', 'community'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                filter === cat
                  ? 'bg-white font-semibold shadow-xs text-gray-900'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List items */}
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No notifications in this filter</p>
            </div>
          ) : (
            filteredList.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors text-xs ${
                  notif.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50/70'
                }`}
              >
                <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-gray-100">
                  {getIconForType(notif.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-semibold text-gray-900 truncate ${
                        !notif.isRead ? 'font-bold' : ''
                      }`}
                    >
                      {notif.title}
                    </span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-gray-600 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-gray-400 block pt-0.5">
                    {new Date(notif.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(notif.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  {!notif.isRead && (
                    <button
                      type="button"
                      aria-label="Mark read"
                      onClick={(e) => {
                        e.stopPropagation();
                        notificationService.markAsRead(notif.id);
                      }}
                      className="p-1 text-gray-400 hover:text-emerald-600 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="p-1 text-gray-300 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
