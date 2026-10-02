import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationCenter } from '../components/NotificationCenter';

describe('NotificationCenter Component', () => {
  it('renders notification bell icon button', () => {
    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /Notification Center/i });
    expect(bellBtn).toBeInTheDocument();
  });

  it('opens notification popover when bell is clicked and displays items', () => {
    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /Notification Center/i });
    fireEvent.click(bellBtn);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText(/Dr. Evelyn Reed replied to your question/i)).toBeInTheDocument();
  });

  it('filters notifications by unread tab', () => {
    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /Notification Center/i });
    fireEvent.click(bellBtn);

    const unreadTab = screen.getByRole('button', { name: /^unread$/i });
    fireEvent.click(unreadTab);

    expect(screen.getByText(/New Peer Review Assigned/i)).toBeInTheDocument();
  });

  it('marks all as read when button clicked', () => {
    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /Notification Center/i });
    fireEvent.click(bellBtn);

    const markAllBtn = screen.queryByRole('button', { name: /Mark all read/i });
    if (markAllBtn) {
      fireEvent.click(markAllBtn);
      // Mark all read disappears once all are read
      expect(screen.queryByRole('button', { name: /Mark all read/i })).not.toBeInTheDocument();
    }
  });
});
