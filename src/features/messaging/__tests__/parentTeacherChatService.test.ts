import { describe, it, expect, beforeEach } from 'vitest';
import { moderateMessage } from '../services/messageModerationService';
import { ParentTeacherChatService } from '../services/parentTeacherChatService';
import { daysAheadISO } from '@/features/parent-portal/services/portalDates';

describe('moderateMessage safety filter', () => {
  it('allows ordinary academic messages', () => {
    const result = moderateMessage('Jambo! Kevin should revise fractions before Friday.');
    expect(result.isAllowed).toBe(true);
    expect(result.category).toBe('clean');
    expect(result.sanitized).toBe('Jambo! Kevin should revise fractions before Friday.');
  });

  it('rejects empty messages', () => {
    const result = moderateMessage('   ');
    expect(result.isAllowed).toBe(false);
    expect(result.advisory).toBe('Message cannot be empty.');
  });

  it('blocks Kenyan and international phone numbers', () => {
    expect(moderateMessage('Call me on 0712345678 tonight').category).toBe('pii_leak');
    expect(moderateMessage('WhatsApp +254712345678 works too').isAllowed).toBe(false);
  });

  it('blocks email addresses and postal addresses as PII', () => {
    expect(moderateMessage('Write to esther@example.com').category).toBe('pii_leak');
    expect(moderateMessage('Meet me at P.O. Box 34567 Nairobi').category).toBe('pii_leak');
  });

  it('does not flag plain dates as phone numbers', () => {
    const result = moderateMessage('The quiz is scheduled for 2026-10-14 and 2026-11-02.');
    expect(result.isAllowed).toBe(true);
  });

  it('blocks threats and profanity with distinct advisories', () => {
    const threat = moderateMessage('I will kill whoever graded this');
    expect(threat.category).toBe('threat');
    expect(threat.advisory).toContain('blocked by the safety filter');

    const profanity = moderateMessage('what an idiot of a teacher');
    expect(profanity.category).toBe('profanity');
    expect(profanity.advisory).toContain('respectful and academic');
    expect(profanity.sanitized).toBe('what an *** of a teacher');
  });
});

describe('ParentTeacherChatService', () => {
  beforeEach(() => {
    ParentTeacherChatService.resetToDefaults();
  });

  it('seeds one mathematics thread with an instructor greeting', () => {
    const threads = ParentTeacherChatService.getThreads();
    expect(threads).toHaveLength(1);
    expect(threads[0]).toMatchObject({
      id: 'thread-kevin-wanjiru',
      instructorName: 'Ms. Wanjiru Njoroge',
      subject: 'Mathematics',
      childName: 'Kevin Kamau',
    });
    expect(threads[0].messages).toHaveLength(1);
    expect(threads[0].messages[0].senderRole).toBe('instructor');
    expect(ParentTeacherChatService.getThread('thread-kevin-wanjiru')).not.toBeNull();
    expect(ParentTeacherChatService.getThread('missing-thread')).toBeNull();
  });

  it('appends a parent message and persists it across reads', () => {
    const result = ParentTeacherChatService.sendMessage(
      'thread-kevin-wanjiru',
      'parent',
      'Esther Kamau',
      'Asante sana for the feedback!'
    );

    expect(result.sent).toBe(true);
    expect(result.message?.content).toBe('Asante sana for the feedback!');

    const thread = ParentTeacherChatService.getThread('thread-kevin-wanjiru');
    expect(thread?.messages).toHaveLength(2);
    expect(thread?.messages[1]).toMatchObject({ senderRole: 'parent', senderName: 'Esther Kamau', safetyFlagged: false });
  });

  it('refuses unsafe messages and unknown threads without mutating state', () => {
    const blocked = ParentTeacherChatService.sendMessage('thread-kevin-wanjiru', 'parent', 'Esther', 'call 0712345678');
    expect(blocked.sent).toBe(false);
    expect(blocked.category).toBe('pii_leak');
    expect(blocked.advisory).toContain('Personal details were detected');

    const unknown = ParentTeacherChatService.sendMessage('nope', 'parent', 'Esther', 'Hello?');
    expect(unknown.sent).toBe(false);
    expect(unknown.advisory).toBe('Conversation not found.');

    expect(ParentTeacherChatService.getThread('thread-kevin-wanjiru')?.messages).toHaveLength(1);
  });

  it('validates appointment input before persisting anything', () => {
    expect(ParentTeacherChatService.scheduleAppointment('thread-kevin-wanjiru', {
      date: 'not-a-date',
      time: '10:00',
      topic: 'Revision plan',
    })).toMatchObject({ success: false, error: 'invalid_date' });

    expect(ParentTeacherChatService.scheduleAppointment('thread-kevin-wanjiru', {
      date: '2020-01-01',
      time: '10:00',
      topic: 'Revision plan',
    })).toMatchObject({ success: false, error: 'date_past' });

    expect(ParentTeacherChatService.scheduleAppointment('thread-kevin-wanjiru', {
      date: daysAheadISO(2),
      time: '25:99',
      topic: 'Revision plan',
    })).toMatchObject({ success: false, error: 'invalid_time' });

    expect(ParentTeacherChatService.scheduleAppointment('thread-kevin-wanjiru', {
      date: daysAheadISO(2),
      time: '10:00',
      topic: 'ok',
    })).toMatchObject({ success: false, error: 'topic_required' });

    expect(ParentTeacherChatService.getThread('thread-kevin-wanjiru')?.appointments).toHaveLength(0);
  });

  it('schedules, lists and cancels a conference appointment', () => {
    const date = daysAheadISO(3);
    const created = ParentTeacherChatService.scheduleAppointment('thread-kevin-wanjiru', {
      date,
      time: '14:00',
      topic: 'Algebra revision plan',
    });

    expect(created.success).toBe(true);
    expect(created.message).toBe(`Conference requested for ${date} at 14:00.`);
    expect(created.appointment).toMatchObject({ status: 'pending', topic: 'Algebra revision plan' });

    const cancelled = ParentTeacherChatService.cancelAppointment('thread-kevin-wanjiru', created.appointment?.id ?? '');
    expect(cancelled).toEqual({ success: true, message: 'Appointment cancelled.' });
    expect(ParentTeacherChatService.getThread('thread-kevin-wanjiru')?.appointments[0].status).toBe('cancelled');

    expect(ParentTeacherChatService.cancelAppointment('thread-kevin-wanjiru', 'missing')).toMatchObject({ success: false });
    expect(ParentTeacherChatService.cancelAppointment('nope', 'missing').success).toBe(false);
  });

  it('rejects scheduling on unknown conversations', () => {
    const result = ParentTeacherChatService.scheduleAppointment('nope', {
      date: daysAheadISO(1),
      time: '09:00',
      topic: 'Talk about homework',
    });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Conversation not found.');
  });
});
