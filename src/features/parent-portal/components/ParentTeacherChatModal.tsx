import React, { useEffect, useRef, useState } from 'react';
import { CalendarClock, Send, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ParentService } from '../services/parentService';
import { daysAheadISO, shortDate } from '../services/portalDates';
import { ParentTeacherChatService } from '@/features/messaging/services/parentTeacherChatService';
import { ParentTeacherThread } from '@/features/messaging/types/messaging';

interface ParentTeacherChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId?: string;
}

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

export const ParentTeacherChatModal: React.FC<ParentTeacherChatModalProps> = ({ isOpen, onClose, threadId }) => {
  const [threads, setThreads] = useState<ParentTeacherThread[]>([]);
  const [draft, setDraft] = useState('');
  const [advisory, setAdvisory] = useState<string | null>(null);
  const [conferenceDate, setConferenceDate] = useState('');
  const [conferenceTime, setConferenceTime] = useState('10:00');
  const [conferenceTopic, setConferenceTopic] = useState('');
  const [appointmentNote, setAppointmentNote] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const threadListRef = useRef<HTMLDivElement | null>(null);

  const activeThreadId = threadId ?? threads[0]?.id;
  const thread = threads.find(entry => entry.id === activeThreadId) ?? null;
  const isVerified = ParentService.hasVerifiedChild();

  useEffect(() => {
    if (isOpen) {
      setThreads(ParentTeacherChatService.getThreads());
      setDraft('');
      setAdvisory(null);
      setAppointmentNote(null);
      setConferenceDate('');
      setConferenceTopic('');
    }
  }, [isOpen, threadId]);

  useEffect(() => {
    if (threadListRef.current) {
      threadListRef.current.scrollTop = threadListRef.current.scrollHeight;
    }
  }, [thread?.messages.length, isOpen]);

  const refreshThreads = () => setThreads(ParentTeacherChatService.getThreads());

  const handleSend = () => {
    const content = draft.trim();
    if (!content || !activeThreadId) return;
    const profile = ParentService.getProfile();
    const result = ParentTeacherChatService.sendMessage(activeThreadId, 'parent', profile.fullName, content);
    if (result.sent) {
      refreshThreads();
      setDraft('');
      setAdvisory(null);
    } else {
      setAdvisory(result.advisory ?? 'This message was blocked by the safety filter.');
    }
  };

  const handleSchedule = () => {
    if (!activeThreadId) return;
    const result = ParentTeacherChatService.scheduleAppointment(activeThreadId, {
      date: conferenceDate,
      time: conferenceTime,
      topic: conferenceTopic,
    });
    if (result.success) {
      refreshThreads();
      setAppointmentNote({ tone: 'success', text: result.message });
      setConferenceDate('');
      setConferenceTopic('');
    } else {
      setAppointmentNote({ tone: 'error', text: result.message });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0">
        <DialogHeader className="bg-gradient-to-r from-education-primary to-teal-700 text-white px-5 py-4 text-left">
          <DialogTitle className="text-base sm:text-lg font-bold text-white pr-8">
            {thread ? `${thread.instructorName} · ${thread.subject}` : 'Parent–Teacher Messages'}
          </DialogTitle>
          <DialogDescription className="text-xs text-emerald-100">
            {thread ? `Re: ${thread.childName} — monitored safety channel` : 'No conversation selected'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-bold">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified parent · consent on file
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[11px] font-bold">
              <TriangleAlert className="h-3.5 w-3.5" /> Link a child first to unlock messaging
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-600 px-2.5 py-1 text-[11px] font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" /> Profanity &amp; PII filter active
          </span>
        </div>

        <div
          ref={threadListRef}
          data-testid="chat-thread"
          className="max-h-[45vh] overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/70"
        >
          {!thread && <p className="text-xs text-gray-500 text-center py-6">No messages yet.</p>}
          {thread?.messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.senderRole === 'parent' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  message.senderRole === 'parent'
                    ? 'bg-education-primary text-white rounded-br-md'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-1">{message.senderName}</p>
                <p>{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {advisory && (
          <div role="alert" className="mx-5 mb-1 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-semibold text-red-700">
            {advisory}
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-100 space-y-2">
          <Textarea
            value={draft}
            onChange={event => {
              setDraft(event.target.value);
              if (advisory) setAdvisory(null);
            }}
            placeholder="Write a message to the instructor…"
            aria-label="Message composer"
            rows={2}
            className="text-sm resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSend}
              disabled={!isVerified || draft.trim().length === 0}
              className="bg-education-primary hover:bg-education-primary/90 text-white text-xs font-semibold"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" /> Send
            </Button>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-white space-y-3 rounded-b-lg">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4 text-education-primary" /> Schedule a Parent–Teacher Conference
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="conference-date" className="text-[11px] font-bold text-gray-600">
                Date
              </label>
              <Input
                id="conference-date"
                type="date"
                value={conferenceDate}
                min={daysAheadISO(0)}
                onChange={event => {
                  setConferenceDate(event.target.value);
                  setAppointmentNote(null);
                }}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-600">Time</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Conference time slots">
                {TIME_SLOTS.map(slot => {
                  const selected = conferenceTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setConferenceTime(slot);
                        setAppointmentNote(null);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                        selected ? 'bg-education-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="conference-topic" className="text-[11px] font-bold text-gray-600">
              Agenda
            </label>
            <Input
              id="conference-topic"
              value={conferenceTopic}
              onChange={event => {
                setConferenceTopic(event.target.value);
                setAppointmentNote(null);
              }}
              placeholder="e.g. Kevin's algebra revision plan"
              className="text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleSchedule}
              disabled={!isVerified}
              variant="outline"
              className="text-xs font-semibold border-education-primary text-education-primary hover:bg-education-primary/10"
            >
              Request Conference Slot
            </Button>
            {appointmentNote && (
              <span
                role={appointmentNote.tone === 'success' ? 'status' : 'alert'}
                className={`text-xs font-semibold ${appointmentNote.tone === 'success' ? 'text-emerald-700' : 'text-red-600'}`}
              >
                {appointmentNote.text}
              </span>
            )}
          </div>

          {thread && thread.appointments.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {thread.appointments.map(appointment => (
                <li
                  key={appointment.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-gray-800 truncate">
                    {shortDate(appointment.date)} at {appointment.time} — {appointment.topic}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase shrink-0 ${
                      appointment.status === 'cancelled' ? 'text-red-500' : 'text-education-primary'
                    }`}
                  >
                    {appointment.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
