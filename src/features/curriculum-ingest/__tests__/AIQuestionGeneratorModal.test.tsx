import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIQuestionGeneratorModal } from '../components/AIQuestionGeneratorModal';

describe('AIQuestionGeneratorModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AIQuestionGeneratorModal isOpen={false} onClose={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal with curriculum standards and generation inputs when open', () => {
    render(
      <AIQuestionGeneratorModal isOpen={true} onClose={() => {}} />
    );

    expect(screen.getByText('RAG Curriculum Question Generator')).toBeInTheDocument();
    expect(screen.getByText(/Bloom's Taxonomy/i)).toBeInTheDocument();
    expect(screen.getByText(/Kenya KICD CBC/i)).toBeInTheDocument();
  });

  it('generates questions on clicking Generate AI Assessment', async () => {
    render(
      <AIQuestionGeneratorModal isOpen={true} onClose={() => {}} />
    );

    const generateBtn = screen.getByRole('button', { name: /Generate AI Assessment/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Generated Questions/i)).toBeInTheDocument();
      expect(screen.getByText(/Save Questions to Studio/i)).toBeInTheDocument();
    });
  });

  it('invokes onClose when cancel button is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <AIQuestionGeneratorModal isOpen={true} onClose={onCloseMock} />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(onCloseMock).toHaveBeenCalled();
  });
});
