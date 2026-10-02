import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import '@/shared/i18n/config';

describe('LanguageSwitcher Component', () => {
  it('renders language toggle button', () => {
    render(<LanguageSwitcher />);
    const trigger = screen.getByLabelText(/Change language/i);
    expect(trigger).toBeInTheDocument();
  });

  it('opens dropdown menu on click', async () => {
    render(<LanguageSwitcher />);
    const trigger = screen.getByLabelText(/Change language/i);
    fireEvent.pointerDown(trigger);

    expect(await screen.findByText('English')).toBeInTheDocument();
    expect(await screen.findByText('Kiswahili')).toBeInTheDocument();
  });
});
