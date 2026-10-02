import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PeerReviewView } from '../components/PeerReviewView';

describe('PeerReviewView Component', () => {
  it('renders peer review banner and assigned submissions queue', () => {
    render(<PeerReviewView />);

    expect(screen.getByText('Anonymous Peer Review Studio')).toBeInTheDocument();
    expect(screen.getByText('Assigned Peer Works')).toBeInTheDocument();
    expect(screen.getAllByText(/Author Orion #49/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Solar Panel Energy Generation Model').length).toBeGreaterThan(0);
  });

  it('displays the peer scoring rubric criteria and level options', () => {
    render(<PeerReviewView />);

    expect(screen.getByText('Peer Scoring Rubric & Feedback Matrix')).toBeInTheDocument();
    expect(screen.getByText('Model Formulation & Variables')).toBeInTheDocument();
    expect(screen.getByText('Slope & Y-Intercept Interpretation')).toBeInTheDocument();

    // Score level buttons exist
    const exemplaryButtons = screen.getAllByText('Exemplary');
    expect(exemplaryButtons.length).toBeGreaterThan(0);
  });

  it('updates total score when clicking rubric level options', () => {
    render(<PeerReviewView />);

    const exemplaryButtons = screen.getAllByText('Exemplary');
    fireEvent.click(exemplaryButtons[0]);

    // Points display should reflect selection
    expect(screen.getAllByText(/5 \/ 20|pts/i).length).toBeGreaterThan(0);
  });

  it('switches between assigned reviews and received reviews tabs', () => {
    render(<PeerReviewView />);

    const feedbackTab = screen.getByRole('button', { name: /My Feedback Report/i });
    fireEvent.click(feedbackTab);

    expect(
      screen.getByText('Peer Review Synthesis on Your Submission')
    ).toBeInTheDocument();
  });
});
