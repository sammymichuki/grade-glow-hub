
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface RecommendedCourseProps {
  id: number;
  title: string;
  subject: string;
  image: string;
}

interface RecommendedCoursesProps {
  courses: RecommendedCourseProps[];
}

const RecommendedCourses = ({ courses }: RecommendedCoursesProps) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recommended Courses</h2>
        <Link to="/courses" className="text-education-primary hover:underline">View All</Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {courses.map(course => (
          <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <img 
              src={course.image} 
              alt={course.title} 
              className="h-32 w-full object-cover"
            />
            <CardContent className="p-4">
              <span className="text-sm text-education-primary">{course.subject}</span>
              <h3 className="font-semibold">{course.title}</h3>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Link to={`/course/${course.id}`} className="w-full">
                <Button variant="outline" className="w-full">View Course</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
};

export default RecommendedCourses;
