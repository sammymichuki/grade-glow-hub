
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface CourseProps {
  id: number;
  title: string;
  subject: string;
  description: string;
  image: string;
  level: string;
  lessonCount: number;
  isFeatured?: boolean;
}

const CourseCard = ({ course }: { course: CourseProps }) => {
  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
      <div className="relative">
        <img 
          src={course.image} 
          alt={course.title} 
          className="w-full h-48 object-cover"
        />
        <Badge 
          className="absolute top-3 left-3" 
          variant={course.isFeatured ? "default" : "secondary"}
        >
          {course.subject}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <h3 className="text-xl font-bold">{course.title}</h3>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-gray-600 line-clamp-3">{course.description}</p>
        <div className="flex items-center mt-4 text-sm text-gray-500">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            {course.level}
          </span>
          <span className="mx-3">•</span>
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {course.lessonCount} lessons
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Link to={`/course/${course.id}`} className="w-full">
          <Button className="w-full" variant="outline">View Course</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
