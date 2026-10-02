import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const ProblematicComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Crashing educational component intentionally');
  }
  return <div>Component loaded normally</div>;
};

describe('ErrorBoundary Component', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component loaded normally')).toBeInTheDocument();
  });

  it('renders fallback error UI and diagnostics when error is caught', () => {
    // Suppress console.error in vitest output for intentional crash
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
    expect(screen.getByText(/Return Home/i)).toBeInTheDocument();

    const diagnosticsBtn = screen.getByText(/View Technical Diagnostics/i);
    fireEvent.click(diagnosticsBtn);

    expect(screen.getByText(/Crashing educational component intentionally/i)).toBeInTheDocument();

    spy.mockRestore();
  });
});
