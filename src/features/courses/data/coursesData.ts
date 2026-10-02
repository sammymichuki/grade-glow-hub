import { Course, Lesson } from '@/shared/types/course';

export const COURSES_DATA: Course[] = [
  {
    id: 1,
    title: 'Mathematics Fundamentals',
    subject: 'Mathematics',
    description: 'Master the foundations of all Mathematics formulas from finding area to solving linear inequalities and essential mathematical problems.',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    level: 'Grade-4, Grade-7, Grade-8, Grade-9',
    lessonCount: 18,
    rating: 4.8,
    reviewCount: 124,
    enrolledStudentsCount: 350,
  },
  {
    id: 2,
    title: 'Biology, Physics and Chemistry Basics',
    subject: 'Integrated Science',
    description: 'Explore the fascinating world of cells, organisms, and biological and physical systems.',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=500&q=80',
    level: 'Grade-5, Grade-7, Grade-8, Grade-9',
    lessonCount: 15,
    rating: 4.9,
    reviewCount: 98,
    enrolledStudentsCount: 280,
  },
  {
    id: 3,
    title: 'Essay Writing Skills',
    subject: 'English',
    description: 'Develop strong writing skills and learn to craft compelling persuasive and analytical essays.',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    level: 'Grade-6, Grade-7, Grade-8, Grade-9',
    lessonCount: 10,
    rating: 4.7,
    reviewCount: 82,
    enrolledStudentsCount: 210,
  },
  {
    id: 4,
    title: 'Distinction Social Studies',
    subject: 'Social Studies',
    description: 'Explore the fascinating world of Ancient History, Community Service, and Natural Environments in Africa.',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    level: 'Grade-7, Grade-8, Grade-9',
    lessonCount: 14,
    rating: 4.6,
    reviewCount: 65,
    enrolledStudentsCount: 175,
  },
  {
    id: 5,
    title: 'Agriculture and Nutrition Fundamentals',
    subject: 'Agrinutrition',
    description: 'Learn the Basics of Agriculture and Nutrition. Gain practical knowledge on food security, crop planting, and nutrition.',
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=500&q=80',
    level: 'Grade-5, Grade-8, Grade-9',
    lessonCount: 18,
    rating: 4.8,
    reviewCount: 110,
    enrolledStudentsCount: 230,
  },
  {
    id: 6,
    title: 'Pre-technical Studies and Entrepreneurship Skills',
    subject: 'Pre-Technical Studies',
    description: 'Master Entrepreneurial Skills, the foundations of Pre-Technical Studies, Materials for Production, and Workshop safety.',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=500&q=80',
    level: 'Grade-6, Grade-8, Grade-9',
    lessonCount: 16,
    rating: 4.7,
    reviewCount: 74,
    enrolledStudentsCount: 190,
  },
  {
    id: 7,
    title: 'Introduction to Coding',
    subject: 'Integrated Science',
    description: 'Learn the basics of programming, algorithms, and computational thinking with hands-on exercises.',
    image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    level: 'Grade-7, Grade-8, Grade-9',
    lessonCount: 12,
    rating: 4.9,
    reviewCount: 156,
    enrolledStudentsCount: 420,
  },
  {
    id: 8,
    title: 'Creative Arts and Sports',
    subject: 'Creative Arts & Sports',
    description: 'Master the art of creativity, visual arts, and sports physical performance modules.',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=500&q=80',
    level: 'Grade-4, Grade-5, Grade-6, Grade-9',
    lessonCount: 15,
    rating: 4.5,
    reviewCount: 58,
    enrolledStudentsCount: 140,
  },
  {
    id: 9,
    title: 'Kiswahili Fundamentals',
    subject: 'English',
    description: 'Strengthen your Kiswahili language mastery with comprehensive grammar and comprehension exercises.',
    image: 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?auto=format&fit=crop&w=500&q=80',
    level: 'Grade-7, Grade-8, Grade-9',
    lessonCount: 10,
    rating: 4.8,
    reviewCount: 92,
    enrolledStudentsCount: 260,
  }
];

export interface LegacyLesson {
  id: number;
  title: string;
  duration: string;
  durationMinutes?: number;
  isCompleted?: boolean;
  pdfUrl?: string;
  pdfDescription?: string;
}

export const LESSONS_BY_COURSE_NAME: Record<string, LegacyLesson[]> = {
  'Mathematics Fundamentals': [
    { id: 1, title: 'finding Area', duration: '15 min', durationMinutes: 15, pdfUrl: '/Area-9.pdf', pdfDescription: 'Complete guide to area calculation formulas for different shapes' },
    { id: 2, title: 'Solving linear inequalities', duration: '20 min', durationMinutes: 20, pdfUrl: '/linear-inequalities-9.pdf', pdfDescription: 'Step-by-step approach to solving linear inequalities' },
    { id: 3, title: 'Finding Mass', duration: '25 min', durationMinutes: 25, pdfUrl: '/mass-09.pdf', pdfDescription: 'Finding the mass for various solids' },
    { id: 4, title: 'Finding Volume', duration: '30 min', durationMinutes: 30, pdfUrl: '/volume-09.pdf', pdfDescription: 'Finding the volume for different solids' },
    { id: 5, title: 'Indices Questions', duration: '35 min', durationMinutes: 35, pdfUrl: '/Indices-questions.pdf', pdfDescription: 'Questions regarding indices' },
    { id: 6, title: 'Equations on a straight line', duration: '25 min', durationMinutes: 25, pdfUrl: '/equations-on-a-straight-line-9.pdf', pdfDescription: 'Solving Equations on a straight line' },
    { id: 7, title: 'Working with time', duration: '40 min', durationMinutes: 40, pdfUrl: '/Time.pdf', pdfDescription: 'Learn all about time' },
    { id: 8, title: 'Money', duration: '45 min', durationMinutes: 45, pdfUrl: '/money.pdf', pdfDescription: 'Working with Money' },
    { id: 9, title: 'Matrix', duration: '30 min', durationMinutes: 30, pdfUrl: '/matrix-9.pdf', pdfDescription: 'Learn about matrix and solving matrix questions' },
    { id: 10, title: 'Cube and cube roots', duration: '35 min', durationMinutes: 35, pdfUrl: '/cube-and-cube-roots.pdf', pdfDescription: 'Working with cubes and finding cube roots' },
    { id: 11, title: 'jss maths intro formulars', duration: '40 min', durationMinutes: 40, pdfUrl: '/jss-maths-grade-9-intro-formulas.pdf', pdfDescription: 'Simplified Introduction Formulas' },
    { id: 12, title: 'Integer questions', duration: '45 min', durationMinutes: 45, pdfUrl: '/integer-questions.pdf', pdfDescription: 'Working with integers' },
    { id: 13, title: 'Approximation and error', duration: '40 min', durationMinutes: 40, pdfUrl: '/Approximation-and-error.pdf', pdfDescription: 'Learn solving approximation and error questions' },
    { id: 14, title: 'Compound proportions and rates of work', duration: '30 min', durationMinutes: 30, pdfUrl: '/compound-proportions-and-rates-of-work.pdf', pdfDescription: 'Solving questions regarding rates of work and compound proportions' },
    { id: 15, title: 'working with logarithms', duration: '30 min', durationMinutes: 30, pdfUrl: '/logarithms-9.pdf', pdfDescription: 'Learn how to solve logarithms problems' },
    { id: 16, title: 'Finding bearing', duration: '20 min', durationMinutes: 20, pdfUrl: '/bearing.pdf', pdfDescription: 'Learn how to find the bearing of a place or point' },
    { id: 17, title: 'Grouped data ', duration: '25 min', durationMinutes: 25, pdfUrl: '/grouped-data.pdf', pdfDescription: 'Work with grouped data and learn all the formulas involved' },
    { id: 18, title: 'Integer questions', duration: '10 min', durationMinutes: 10, pdfUrl: '/integers-questions.pdf', pdfDescription: 'Solve these questions!' }
  ],
  'Biology, Physics and Chemistry Basics': [
    { id: 1, title: 'Introduction to Biology', duration: '20 min', durationMinutes: 20 },
    { id: 2, title: 'Cell Structure', duration: '30 min', durationMinutes: 30 },
    { id: 3, title: 'Cell Functions', duration: '25 min', durationMinutes: 25 },
    { id: 4, title: 'Cell Division', duration: '35 min', durationMinutes: 35 },
    { id: 5, title: 'DNA and Genetics', duration: '40 min', durationMinutes: 40 },
    { id: 6, title: 'Inheritance Patterns', duration: '30 min', durationMinutes: 30 },
    { id: 7, title: 'Body Systems Overview', duration: '25 min', durationMinutes: 25 },
    { id: 8, title: 'Digestive System', duration: '30 min', durationMinutes: 30 },
    { id: 9, title: 'Circulatory System', duration: '30 min', durationMinutes: 30 },
    { id: 10, title: 'Respiratory System', duration: '25 min', durationMinutes: 25 },
    { id: 11, title: 'Nervous System', duration: '35 min', durationMinutes: 35 },
    { id: 12, title: 'Immune System', duration: '30 min', durationMinutes: 30 },
    { id: 13, title: 'Endocrine System', duration: '25 min', durationMinutes: 25 },
    { id: 14, title: 'Musculoskeletal System', duration: '30 min', durationMinutes: 30 },
    { id: 15, title: 'Ecosystems and Environments', duration: '35 min', durationMinutes: 35 }
  ],
  'Essay Writing Skills': [
    { id: 1, title: 'Elements of an Essay', duration: '20 min', durationMinutes: 20 },
    { id: 2, title: 'Crafting Thesis Statements', duration: '25 min', durationMinutes: 25 },
    { id: 3, title: 'Paragraph Transitions', duration: '30 min', durationMinutes: 30 },
    { id: 4, title: 'Editing and Proofreading', duration: '25 min', durationMinutes: 25 }
  ]
};
