import { describe, it, expect, beforeEach } from 'vitest';
import { notificationService } from '../services/notificationService';

describe('notificationService', () => {
  beforeEach(() => {
    notificationService.resetToDefaults();
  });

  it('retrieves user notifications and calculates unread count', () => {
    const list = notificationService.getNotifications('current-user');
    expect(list.length).toBeGreaterThan(0);

    const unread = notificationService.getUnreadCount('current-user');
    expect(unread).toBeGreaterThanOrEqual(0);
  });

  it('marks a single notification as read', () => {
    const unreadItem = notificationService
      .getNotifications('current-user')
      .find((n) => !n.isRead);

    if (unreadItem) {
      notificationService.markAsRead(unreadItem.id);
      const updated = notificationService
        .getNotifications('current-user')
        .find((n) => n.id === unreadItem.id);
      expect(updated?.isRead).toBe(true);
    }
  });

  it('marks all notifications as read for a given user', () => {
    notificationService.markAllAsRead('current-user');
    const unreadCount = notificationService.getUnreadCount('current-user');
    expect(unreadCount).toBe(0);
  });

  it('creates and prepends a new notification', () => {
    const created = notificationService.addNotification({
      type: 'announcement',
      title: 'School Assembly on Monday',
      message: 'All students report to auditorium at 9 AM.',
      linkUrl: '/community',
      priority: 'high',
    });

    expect(created.id).toBeDefined();
    expect(created.isRead).toBe(false);

    const list = notificationService.getNotifications('current-user');
    expect(list[0].id).toBe(created.id);
  });

  it('deletes a notification from user list', () => {
    const listBefore = notificationService.getNotifications('current-user');
    const firstId = listBefore[0].id;

    notificationService.deleteNotification(firstId);

    const listAfter = notificationService.getNotifications('current-user');
    expect(listAfter.some((n) => n.id === firstId)).toBe(false);
  });

  it('filters notifications by category (academic, community, unread)', () => {
    const all = notificationService.getNotifications('current-user');
    const academic = notificationService.filterByType(all, 'academic');
    expect(
      academic.every((n) =>
        ['grade_posted', 'peer_review_assigned', 'peer_review_received'].includes(
          n.type
        )
      )
    ).toBe(true);

    const community = notificationService.filterByType(all, 'community');
    expect(
      community.every((n) =>
        ['forum_reply', 'announcement', 'system'].includes(n.type)
      )
    ).toBe(true);
  });

  it('notifies subscribers when notifications change', () => {
    let triggered = false;
    const unsubscribe = notificationService.subscribe(() => {
      triggered = true;
    });

    notificationService.addNotification({
      type: 'system',
      title: 'Maintenance alert',
      message: 'Server upgrade tonight',
      linkUrl: '',
    });

    expect(triggered).toBe(true);
    unsubscribe();
  });
});
