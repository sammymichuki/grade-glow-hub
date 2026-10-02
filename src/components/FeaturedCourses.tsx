import { Link } from 'react-router-dom';
import CourseCard from './CourseCard';
import { CourseService } from '@/features/courses/services/courseService';

const FeaturedCourses = () => {
  // Retrieve curated courses for the featured showcase
  const featuredCourses = CourseService.getCourses({ sortBy: 'popular' }).slice(0, 6);

  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Featured Courses</h2>
          <Link to="/courses" className="text-education-primary hover:underline font-medium">
            View All Courses
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={{ ...course, isFeatured: true }} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;
