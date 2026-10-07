import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MasteryTreeView } from '../components/MasteryTreeView';
import { gamificationService } from '../services/gamificationService';

describe('MasteryTreeView Component', () => {
  beforeEach(() => {
    gamificationService.resetToDefaults();
  });

  it('renders subject tabs, domain header, and syllabus nodes', () => {
    render(<MasteryTreeView />);

    expect(screen.getAllByText('Mathematics')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Integrated Science/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/English & Composition/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Number Foundations & Prime Factorization/i)[0]).toBeInTheDocument();
  });

  it('allows switching between curriculum subjects', () => {
    render(<MasteryTreeView />);

    const scienceTab = screen.getAllByText(/Integrated Science/i)[0];
    const button = scienceTab.closest('button') || scienceTab;
    fireEvent.click(button);

    expect(screen.getByText(/Integrated Science Mastery Tree/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Cellular Biology & Organelles/i)[0]).toBeInTheDocument();
  });

  it('selects an unlocked node and enables interactive practice assessment', () => {
    render(<MasteryTreeView />);

    // Click on Fractions node (first element found)
    const fractionsNode = screen.getAllByText(/Fractions, Decimals & Percentages/i)[0];
    fireEvent.click(fractionsNode);

    expect(screen.getByText(/Interactive Mastery Assessment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Practice Score & Earn XP/i })).toBeInTheDocument();

    // Submit practice score
    const submitBtn = screen.getByRole('button', { name: /Submit Practice Score & Earn XP/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/(Score saved|Skill score updated)/i)).toBeInTheDocument();
  });
});
