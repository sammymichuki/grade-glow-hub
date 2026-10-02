import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseBuilderStudio } from '../components/CourseBuilderStudio';

describe('CourseBuilderStudio Component', () => {
  it('renders curriculum studio header, modules list, and lesson editor', () => {
    render(<CourseBuilderStudio />);

    expect(screen.getByText('Instructor Studio')).toBeInTheDocument();
    expect(screen.getByText(/Foundations of Algebra/i)).toBeInTheDocument();
    expect(screen.getByText('Curriculum Structure')).toBeInTheDocument();
    expect(screen.getByText('Lesson Editor')).toBeInTheDocument();
    expect(screen.getAllByText(/Understanding Algebraic Variables/i).length).toBeGreaterThan(0);
  });

  it('allows adding a new module to the curriculum', () => {
    render(<CourseBuilderStudio />);

    const moduleInput = screen.getByPlaceholderText('New module title...');
    fireEvent.change(moduleInput, { target: { value: 'Module 3: Quadratic Equations' } });

    const addModuleBtn = screen.getByRole('button', { name: /Add Module/i });
    fireEvent.click(addModuleBtn);

    expect(screen.getAllByText(/Module 3: Quadratic Equations/i).length).toBeGreaterThan(0);
  });

  it('allows selecting a different lesson and displays its content', () => {
    render(<CourseBuilderStudio />);

    const secondLesson = screen.getByText(/Solving Multi-Step Linear Equations/i);
    fireEvent.click(secondLesson);

    expect(screen.getAllByDisplayValue(/Solving Multi-Step Linear Equations/i).length).toBeGreaterThan(0);
  });

  it('attaches a new timestamped keynote to a video lesson', () => {
    render(<CourseBuilderStudio />);

    // First lesson is a video lesson
    const keynoteInput = screen.getByPlaceholderText('Keynote Title...');
    fireEvent.change(keynoteInput, { target: { value: 'Graphing Intersection Points' } });

    const attachBtn = screen.getByRole('button', { name: /Attach Keynote/i });
    fireEvent.click(attachBtn);

    expect(screen.getByText('Graphing Intersection Points')).toBeInTheDocument();
  });
});
