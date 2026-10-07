import {
  AppointmentErrorCode,
  AppointmentRequest,
  AppointmentResult,
  ChatMessage,
  ParentTeacherThread,
  SendMessageResult,
  ThreadStore,
  ThreadStoreSchema,
} from '../types/messaging';
import { moderateMessage } from './messageModerationService';
import { PARENT_ID, KEVIN_ID } from '@/features/parent-portal/data/sampleParentData';

const THREADS_KEY = 'gradeglow_parent_teacher_threads_v1';
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const seedStore = (): ThreadStore => {
  const now = Date.now();
  return {
    threads: [
      {
        id: 'thread-kevin-wanjiru',
        parentId: PARENT_ID,
        childId: KEVIN_ID,
        childName: 'Kevin Kamau',
        instructorName: 'Ms. Wanjiru Njoroge',
        subject: 'Mathematics',
        updatedAt: now,
        messages: [
          {
            id: 'msg-seed-1',
            threadId: 'thread-kevin-wanjiru',
            senderRole: 'instructor',
            senderName: 'Ms. Wanjiru Njoroge',
            content:
              'Jambo Mrs. Kamau! Kevin is doing well in algebra. Feel free to message me here before scheduling a conference.',
            timestamp: now - 60000,
            safetyFlagged: false,
          },
        ],
        appointments: [],
      },
    ],
  };
};

export class ParentTeacherChatService {
  private static saveStore(store: ThreadStore): void {
    try {
      localStorage.setItem(THREADS_KEY, JSON.stringify(store));
    } catch {
      // Storage may be unavailable; subsequent reads re-seed cleanly.
    }
  }

  private static loadStore(): ThreadStore {
    try {
      const raw = localStorage.getItem(THREADS_KEY);
      if (raw) {
        const parsed = ThreadStoreSchema.safeParse(JSON.parse(raw));
        if (parsed.success) return parsed.data as ThreadStore;
      }
    } catch {
      // Corrupt payload falls through to a clean re-seed.
    }
    const seeded = seedStore();
    ParentTeacherChatService.saveStore(seeded);
    return seeded;
  }

  public static resetToDefaults(): void {
    ParentTeacherChatService.saveStore(seedStore());
  }

  public static getThreads(): ParentTeacherThread[] {
    return JSON.parse(JSON.stringify(ParentTeacherChatService.loadStore().threads));
  }

  public static getThread(threadId: string): ParentTeacherThread | null {
    const thread = ParentTeacherChatService.loadStore().threads.find(entry => entry.id === threadId);
    return thread ? JSON.parse(JSON.stringify(thread)) : null;
  }

  public static sendMessage(threadId: string, senderRole: 'parent' | 'instructor', senderName: string, rawContent: string): SendMessageResult {
    const moderation = moderateMessage(rawContent);
    if (!moderation.isAllowed) {
      return { sent: false, category: moderation.category, advisory: moderation.advisory };
    }

    const store = ParentTeacherChatService.loadStore();
    const thread = store.threads.find(entry => entry.id === threadId);
    if (!thread) {
      return { sent: false, advisory: 'Conversation not found.' };
    }

    const message: ChatMessage = {
      id: `msg-${Date.now()}-${thread.messages.length}`,
      threadId,
      senderRole,
      senderName,
      content: moderation.sanitized,
      timestamp: Date.now(),
      safetyFlagged: false,
    };
    thread.messages.push(message);
    thread.updatedAt = Date.now();
    ParentTeacherChatService.saveStore(store);

    return { sent: true, message };
  }

  public static scheduleAppointment(
    threadId: string,
    input: { date: string; time: string; topic: string }
  ): AppointmentResult {
    const fail = (error: AppointmentErrorCode, message: string): AppointmentResult => ({ success: false, error, message });

    if (!DATE_PATTERN.test(input.date) || Number.isNaN(new Date(`${input.date}T00:00:00`).getTime())) {
      return fail('invalid_date', 'Pick a valid conference date.');
    }
    const today = new Date();
    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (input.date < todayISO) {
      return fail('date_past', 'Conference dates cannot be in the past.');
    }
    if (!TIME_PATTERN.test(input.time)) {
      return fail('invalid_time', 'Pick a valid 24-hour time such as 14:00.');
    }
    if (input.topic.trim().length < 5) {
      return fail('topic_required', 'Add a short agenda topic (at least 5 characters).');
    }

    const store = ParentTeacherChatService.loadStore();
    const thread = store.threads.find(entry => entry.id === threadId);
    if (!thread) {
      return { success: false, message: 'Conversation not found.' };
    }

    const appointment: AppointmentRequest = {
      id: `appt-${Date.now()}-${thread.appointments.length}`,
      threadId,
      date: input.date,
      time: input.time,
      topic: input.topic.trim(),
      status: 'pending',
      createdAt: Date.now(),
    };
    thread.appointments.push(appointment);
    thread.updatedAt = Date.now();
    ParentTeacherChatService.saveStore(store);

    return { success: true, appointment, message: `Conference requested for ${input.date} at ${input.time}.` };
  }

  public static cancelAppointment(threadId: string, appointmentId: string): { success: boolean; message: string } {
    const store = ParentTeacherChatService.loadStore();
    const thread = store.threads.find(entry => entry.id === threadId);
    const appointment = thread?.appointments.find(entry => entry.id === appointmentId);
    if (!thread || !appointment) return { success: false, message: 'Appointment not found.' };

    appointment.status = 'cancelled';
    thread.updatedAt = Date.now();
    ParentTeacherChatService.saveStore(store);
    return { success: true, message: 'Appointment cancelled.' };
  }
}
