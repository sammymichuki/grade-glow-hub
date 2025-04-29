
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CourseProps {
  id: number;
  title: string;
  subject: string;
  image: string;
  progress: number;
  lastLesson: string;
}

interface EnrolledCoursesProps {
  courses: CourseProps[];
}

const EnrolledCourses = ({ courses }: EnrolledCoursesProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Courses in Progress</h2>
      
      {courses.map(course => (
        <Card key={course.id}>
          <div className="sm:flex">
            <div className="sm:w-1/4">
              <img 
                src={course.image} 
                alt={course.title} 
                className="h-32 w-full object-cover sm:h-full rounded-t-md sm:rounded-l-md sm:rounded-tr-none"
              />
            </div>
            <div className="sm:w-3/4 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-medium text-education-primary">{course.subject}</span>
                  <h3 className="text-lg font-semibold mt-1">{course.title}</h3>
                </div>
                <span className="bg-education-primary/10 text-education-primary text-sm px-3 py-1 rounded-full">
                  {course.progress}% Complete
                </span>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Last lesson: <span className="font-medium">{course.lastLesson}</span>
                </div>
                <Link to={`/course/${course.id}`}>
                  <Button variant="outline" size="sm">Resume</Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default EnrolledCourses;
