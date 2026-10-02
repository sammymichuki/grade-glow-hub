import { AppNotification, NotificationType } from '@/shared/types/collaboration';
import { SAMPLE_NOTIFICATIONS } from '../data/sampleCommunityData';

class NotificationService {
  private notifications: AppNotification[] = [...SAMPLE_NOTIFICATIONS];
  private listeners: Array<(notifications: AppNotification[]) => void> = [];

  public getNotifications(userId: string = 'current-user'): AppNotification[] {
    return this.notifications
      .filter((n) => n.userId === userId || n.userId === 'all')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getUnreadCount(userId: string = 'current-user'): number {
    return this.getNotifications(userId).filter((n) => !n.isRead).length;
  }

  public markAsRead(notificationId: string): void {
    const item = this.notifications.find((n) => n.id === notificationId);
    if (item && !item.isRead) {
      item.isRead = true;
      this.notifyListeners();
    }
  }

  public markAllAsRead(userId: string = 'current-user'): void {
    this.notifications.forEach((n) => {
      if (n.userId === userId || n.userId === 'all') {
        n.isRead = true;
      }
    });
    this.notifyListeners();
  }

  public addNotification(notification: {
    userId?: string;
    type: NotificationType;
    title: string;
    message: string;
    linkUrl: string;
    priority?: 'low' | 'normal' | 'high';
  }): AppNotification {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: notification.userId || 'current-user',
      type: notification.type,
      title: notification.title,
      message: notification.message,
      linkUrl: notification.linkUrl,
      isRead: false,
      createdAt: new Date().toISOString(),
      priority: notification.priority || 'normal',
    };

    this.notifications.unshift(newNotif);
    this.notifyListeners();
    return newNotif;
  }

  public deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== notificationId);
    this.notifyListeners();
  }

  public filterByType(
    notifications: AppNotification[],
    filter: 'all' | 'unread' | 'academic' | 'community'
  ): AppNotification[] {
    switch (filter) {
      case 'unread':
        return notifications.filter((n) => !n.isRead);
      case 'academic':
        return notifications.filter((n) =>
          ['grade_posted', 'peer_review_assigned', 'peer_review_received'].includes(n.type)
        );
      case 'community':
        return notifications.filter((n) =>
          ['forum_reply', 'announcement', 'system'].includes(n.type)
        );
      case 'all':
      default:
        return notifications;
    }
  }

  public subscribe(listener: (notifications: AppNotification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const list = [...this.notifications];
    this.listeners.forEach((l) => l(list));
  }

  public resetToDefaults(): void {
    this.notifications = [...SAMPLE_NOTIFICATIONS];
    this.notifyListeners();
  }
}

export const notificationService = new NotificationService();
