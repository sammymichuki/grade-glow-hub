import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarCustomizerModal } from '../components/AvatarCustomizerModal';
import { gamificationService } from '../services/gamificationService';

describe('AvatarCustomizerModal Component', () => {
  beforeEach(() => {
    gamificationService.resetToDefaults();
  });

  it('renders avatar modal, student profile info, and wardrobe tabs when open', () => {
    render(<AvatarCustomizerModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText(/Student Avatar Studio & Wardrobe/i)).toBeInTheDocument();
    expect(screen.getByText(/Alex Johnson/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hats/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /outfits/i })).toBeInTheDocument();
  });

  it('switches wardrobe category and displays item unlock statuses', () => {
    render(<AvatarCustomizerModal isOpen={true} onClose={() => {}} />);

    const outfitBtn = screen.getByRole('button', { name: /outfits/i });
    fireEvent.click(outfitBtn);

    expect(screen.getByText(/Academy Blazer/i)).toBeInTheDocument();
    expect(screen.getByText(/Junior Chemist Lab Coat/i)).toBeInTheDocument();
  });

  it('equips already unlocked item', () => {
    render(<AvatarCustomizerModal isOpen={true} onClose={() => {}} />);

    // Scholar Mortarboard is unlocked
    const equipBtn = screen.getByRole('button', { name: /Equip/i });
    fireEvent.click(equipBtn);

    expect(screen.getAllByText(/Equipped/i).length).toBeGreaterThan(0);
  });
});
