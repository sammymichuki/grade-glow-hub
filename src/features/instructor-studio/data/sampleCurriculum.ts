import { CourseBuilderDraft } from '@/shared/types/instructor';
import { RubricService } from '../services/rubricService';

export const SAMPLE_CURRICULUM_DRAFT: CourseBuilderDraft = {
  courseId: 1,
  title: 'Mathematics: Foundations of Algebra & Geometry',
  description: 'A comprehensive curriculum covering algebraic equations, graphing, and plane geometry.',
  category: 'Mathematics',
  gradeLevel: 'Grade 7-8',
  updatedAt: new Date().toISOString(),
  rubrics: RubricService.getPresetRubrics(),
  modules: [
    {
      id: 'mod-algebra-1',
      courseId: 1,
      title: 'Module 1: Expressions, Equations & Inequalities',
      description: 'Master variables, distributive properties, and solving one-step and multi-step equations.',
      order: 1,
      lessons: [
        {
          id: 'les-alg-101',
          moduleId: 'mod-algebra-1',
          title: 'Understanding Algebraic Variables & Like Terms',
          order: 1,
          type: 'video',
          durationMinutes: 18,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          contentMarkdown: `
# Algebraic Variables & Expressions

In algebra, a **variable** is a symbol (usually a letter like $x$, $y$, or $z$) used to represent an unknown quantity or a value that can change.

### Key Concepts:
1. **Coefficient**: The numerical factor of a term with variables ($4$ in $4x$).
2. **Constant**: A term with no variable (e.g., $7$ in $4x + 7$).
3. **Combining Like Terms**:
   $$3x + 5x = (3 + 5)x = 8x$$
   $$2x^2 + 5x - x^2 + 3 = x^2 + 5x + 3$$

### Practice Problem:
Simplify the expression:
$$5(2x - 3) + 4x$$
- Step 1: Distribute: $10x - 15 + 4x$
- Step 2: Group like terms: $(10x + 4x) - 15$
- Step 3: Result: $14x - 15$
          `.trim(),
          videoKeynotes: [
            {
              id: 'kn-1',
              timestampSeconds: 65,
              title: 'Definition of Variables',
              note: 'Explains real-world examples of variables in physics and accounting.',
            },
            {
              id: 'kn-2',
              timestampSeconds: 210,
              title: 'The Distributive Law Demonstration',
              note: 'Visual area model showing why a(b + c) = ab + ac.',
            },
            {
              id: 'kn-3',
              timestampSeconds: 430,
              title: 'Combining Like Terms',
              note: 'Common pitfall: never combine terms with differing exponents.',
            },
          ],
        },
        {
          id: 'les-alg-102',
          moduleId: 'mod-algebra-1',
          title: 'Solving Multi-Step Linear Equations',
          order: 2,
          type: 'article',
          durationMinutes: 25,
          contentMarkdown: `
# Solving Multi-Step Linear Equations

To solve a linear equation for $x$, use the **Golden Rule of Algebra**:
> Whatever operation you perform on one side of an equation, you must perform identically on the other side.

### Standard 4-Step Solution Algorithm:
1. **Clear Parentheses**: Apply distributive law if needed:
   $$2(x - 4) = 14 \\implies 2x - 8 = 14$$
2. **Combine Like Terms**: Consolidate terms on each side independently.
3. **Isolate the Variable Term**: Add or subtract constants from both sides:
   $$2x - 8 + 8 = 14 + 8 \\implies 2x = 22$$
4. **Isolate the Variable**: Multiply or divide by the coefficient:
   $$\\frac{2x}{2} = \\frac{22}{2} \\implies x = 11$$

### Check Your Solution:
Substitute $x = 11$ back into original equation:
$$2(11 - 4) = 2(7) = 14 \\quad \\checkmark$$
          `.trim(),
        },
        {
          id: 'les-alg-103',
          moduleId: 'mod-algebra-1',
          title: 'Unit 1 Applied Problem Set Assignment',
          order: 3,
          type: 'assignment',
          durationMinutes: 45,
          contentMarkdown: `
# Unit 1 Problem Set: Real-World Modeling

Submit your handwritten or typed calculations for the 3 modeling scenarios below:

1. **Cell Phone Plan Modeling**:
   Carrier A charges $30/month plus $0.05 per text message. Carrier B charges $20/month plus $0.10 per text message. Write an equation to determine how many text messages make the plans cost the same.

2. **Perimeter Optimization**:
   The perimeter of a rectangular garden is 64 meters. The length is 4 meters longer than twice the width. Formulate and solve the linear equation to determine the dimensions.
          `.trim(),
        },
      ],
    },
    {
      id: 'mod-linear-2',
      courseId: 1,
      title: 'Module 2: Graphing Linear Equations & Slope',
      description: 'Explore coordinate geometry, Cartesian planes, slope-intercept form (y = mx + b), and point-slope equations.',
      order: 2,
      lessons: [
        {
          id: 'les-lin-201',
          moduleId: 'mod-linear-2',
          title: 'The Cartesian Coordinate Plane & Slope Formula',
          order: 1,
          type: 'video',
          durationMinutes: 22,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          contentMarkdown: `
# Slope & The Coordinate Plane

The slope ($m$) of a line measures its steepness and direction:
$$m = \\frac{\\text{Rise}}{\\text{Run}} = \\frac{y_2 - y_1}{x_2 - x_1}$$

- **Positive Slope**: Line rises from left to right.
- **Negative Slope**: Line falls from left to right.
- **Zero Slope**: Horizontal line ($y = c$).
- **Undefined Slope**: Vertical line ($x = c$).
          `.trim(),
          videoKeynotes: [
            {
              id: 'kn-lin-1',
              timestampSeconds: 45,
              title: 'Cartesian Axes Setup',
              note: 'Identifying quadrants I, II, III, and IV.',
            },
            {
              id: 'kn-lin-2',
              timestampSeconds: 310,
              title: 'Rise Over Run Derivation',
              note: 'Geometric proof with right triangles on a grid.',
            },
          ],
        },
        {
          id: 'les-lin-202',
          moduleId: 'mod-linear-2',
          title: 'Slope-Intercept Form: y = mx + b',
          order: 2,
          type: 'article',
          durationMinutes: 20,
          contentMarkdown: `
# Slope-Intercept Form

Any non-vertical line can be expressed in the form:
$$y = mx + b$$

Where:
- $m$ = slope of the line
- $b$ = $y$-intercept (the point $(0, b)$ where the line crosses the vertical axis)
          `.trim(),
        },
      ],
    },
  ],
};
