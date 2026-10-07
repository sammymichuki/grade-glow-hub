import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ParentTeacherChatModal } from '../components/ParentTeacherChatModal';
import { ParentService } from '../services/parentService';
import { ParentTeacherChatService } from '@/features/messaging/services/parentTeacherChatService';
import { daysAheadISO } from '../services/portalDates';

const setup = () => render(<ParentTeacherChatModal isOpen onClose={vi.fn()} />);

describe('ParentTeacherChatModal Component', () => {
  beforeEach(() => {
    ParentService.resetToDefaults();
    ParentTeacherChatService.resetToDefaults();
  });

  it('renders the seeded conversation header, safety badges and instructor message', () => {
    setup();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Ms. Wanjiru Njoroge · Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Re: Kevin Kamau — monitored safety channel')).toBeInTheDocument();
    expect(screen.getByText('Verified parent · consent on file')).toBeInTheDocument();
    expect(screen.getByText(/Profanity & PII filter active/)).toBeInTheDocument();
    expect(screen.getByText(/Jambo Mrs\. Kamau!/)).toBeInTheDocument();
  });

  it('keeps Send disabled until a message is typed', () => {
    setup();

    const sendButton = screen.getByRole('button', { name: /Send/ });
    expect(sendButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Message composer'), { target: { value: 'Hello there' } });
    expect(sendButton).toBeEnabled();
  });

  it('sends a parent message into the thread and clears the draft', () => {
    setup();

    fireEvent.change(screen.getByLabelText('Message composer'), {
      target: { value: 'Thank you, we revised algebra at home this evening.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send/ }));

    expect(screen.getByText('Thank you, we revised algebra at home this evening.')).toBeInTheDocument();
    expect(screen.getByLabelText('Message composer')).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    const thread = ParentTeacherChatService.getThread('thread-kevin-wanjiru');
    expect(thread?.messages).toHaveLength(2);
    expect(thread?.messages[1].senderName).toBe('Esther Kamau');
  });

  it('blocks phone numbers with the safety advisory instead of sending', () => {
    setup();

    fireEvent.change(screen.getByLabelText('Message composer'), {
      target: { value: 'Please call me on 0712345678 about the trip' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send/ }));

    expect(screen.getByRole('alert')).toHaveTextContent(/Personal details were detected/);
    expect(screen.getByLabelText('Message composer')).toHaveValue('Please call me on 0712345678 about the trip');
    expect(ParentTeacherChatService.getThread('thread-kevin-wanjiru')?.messages).toHaveLength(1);
  });

  it('requires a conference date before scheduling', () => {
    setup();

    fireEvent.click(screen.getByRole('button', { name: 'Request Conference Slot' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a valid conference date.');
  });

  it('rejects agenda topics that are too short', () => {
    setup();

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: daysAheadISO(2) } });
    fireEvent.change(screen.getByLabelText('Agenda'), { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request Conference Slot' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Add a short agenda topic (at least 5 characters).');
  });

  it('schedules a conference slot, surfaces success and lists the pending appointment', () => {
    setup();

    const date = daysAheadISO(2);
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: date } });
    fireEvent.click(screen.getByRole('button', { name: '14:00' }));
    fireEvent.change(screen.getByLabelText('Agenda'), { target: { value: "Kevin's algebra revision plan" } });
    fireEvent.click(screen.getByRole('button', { name: 'Request Conference Slot' }));

    expect(screen.getByRole('status')).toHaveTextContent(`Conference requested for ${date} at 14:00.`);
    const list = screen.getByRole('list');
    expect(within(list).getByText(/at 14:00 — Kevin's algebra revision plan/)).toBeInTheDocument();
    expect(within(list).getByText('pending')).toBeInTheDocument();

    const thread = ParentTeacherChatService.getThread('thread-kevin-wanjiru');
    expect(thread?.appointments).toHaveLength(1);
    expect(thread?.appointments[0]).toMatchObject({ date, time: '14:00', status: 'pending' });
  });

  it('marks the time slot selection with aria-pressed', () => {
    setup();

    expect(screen.getByRole('button', { name: '10:00' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '11:00' }));
    expect(screen.getByRole('button', { name: '11:00' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '10:00' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('warns and disables sending once no verified child is linked', () => {
    for (const link of ParentService.getLinks()) {
      ParentService.unlinkChild(link.id);
    }
    setup();

    expect(screen.getByText('Link a child first to unlock messaging')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Message composer'), { target: { value: 'Hello' } });
    expect(screen.getByRole('button', { name: /Send/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Request Conference Slot' })).toBeDisabled();
  });
});
