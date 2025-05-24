
import { CourseProps } from './CourseCard';
import CourseCard from './CourseCard';

// Sample featured courses data
const featuredCourses: CourseProps[] = [
  {
    id: 1,
    title: 'Mathematics Fundamentals',
    subject: 'Mathematics',
    description: 'Master the foundations of Mathematics with interactive lessons and practice problems.',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 15,
    isFeatured: true
  },
  {
    id: 2,
    title: 'Biology,Physics and Chemistry Basics',
    subject: 'Intergrated Science',
    description: 'Explore the fascinating world of cells, organisms, and biological systems.',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 15,
    isFeatured: true
  },
  {
    id: 3,
    title: 'Essay Writing Skills',
    subject: 'English',
    description: 'Develop strong writing skills and learn to craft compelling essays.',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'All Levels',
    lessonCount: 10,
    isFeatured: true
  },
   {
    id: 4,
    title: 'Distinction Social Studies',
    subject: 'Social Studies',
    description: 'Explore the fascinating world of the Ancient History, Community Service and the Natural Environments in Africa',
    image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 14,
    isFeatured: true
  },
  {
    id: 5,
    title: 'Agriculture and Nutrition Fundamentals',
    subject: 'Agrinutrition',
    description: 'Learn the Basics of Agriculture and Nutrition.Gain Knowledge on how to stay and eat healthy foods.Master Planting,weeding,pruning and harvesting of crops.',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Intermediate',
    lessonCount: 18,
    isFeatured: true
  },
   {
    id: 7,
    title: 'Introduction to Coding',
    subject: 'Computer Science',
    description: 'Learn the basics of programming with easy-to-follow lessons and exercises.',
    image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 12,
    isFeatured: true
  }
];

const FeaturedCourses = () => {
  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Featured Courses</h2>
          <a href="/courses" className="text-education-primary hover:underline font-medium">
            View All Courses
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;
