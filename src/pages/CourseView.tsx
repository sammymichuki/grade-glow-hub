import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { CourseService } from '@/features/courses/services/courseService';
import { Course } from '@/shared/types/course';
import { LegacyLesson } from '@/features/courses/data/coursesData';

type CourseLesson = LegacyLesson & { isCompleted: boolean };

const CourseView = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (courseId) {
      const foundCourse = CourseService.getCourseById(courseId);
      setCourse(foundCourse);
      
      if (foundCourse) {
        const courseLessons = CourseService.getLessonsByCourse(foundCourse);
        
        if (isLoggedIn) {
          const completedLessons = courseLessons.map((lesson) => ({
            ...lesson,
            isCompleted: Math.random() > 0.5,
          }));
          setLessons(completedLessons);
          
          const completed = completedLessons.filter((l) => l.isCompleted).length;
          setProgress(CourseService.calculateCompletionRate(completed, courseLessons.length));
        } else {
          setLessons(courseLessons.map((lesson) => ({ ...lesson, isCompleted: false })));
        }
      }
    }
  }, [courseId, isLoggedIn]);

  const handleLessonClick = (lessonId: number) => {
    if (!isLoggedIn) {
      toast.error("Please login to access lessons");
      return;
    }
    
    navigate(`/course/${courseId}/lessons/${lessonId}`);
    
    setLessons((prevLessons) => {
      const updatedLessons = prevLessons.map((lesson) => 
        lesson.id === lessonId ? { ...lesson, isCompleted: true } : lesson
      );
      
      const completed = updatedLessons.filter((l) => l.isCompleted).length;
      setProgress(CourseService.calculateCompletionRate(completed, updatedLessons.length));
      
      return updatedLessons;
    });
  };

  if (!course) {
    return (
      <div className="pt-16 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Course not found</h2>
            <Link to="/courses">
              <Button>Back to Courses</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div 
        className="h-64 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${course.image})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="container-custom h-full flex flex-col justify-end pb-8 relative z-10">
          <div className="flex items-center space-x-2 text-white mb-2">
            <span className="bg-white/20 px-3 py-1 rounded text-sm">{course.subject}</span>
            <span className="bg-white/20 px-3 py-1 rounded text-sm">{course.level}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{course.title}</h1>
        </div>
      </div>
      
      {isLoggedIn && (
        <div className="bg-education-primary/10 py-4">
          <div className="container-custom">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="flex-1 mb-4 sm:mb-0">
                <div className="flex items-center">
                  <div className="w-full max-w-md">
                    <p className="text-sm text-gray-600 mb-1">Your progress</p>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <span className="ml-4 font-medium">{progress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-grow container-custom py-8">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold mb-4">About this course</h2>
              <p className="mb-6 text-gray-700">{course.description}</p>
          
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Course details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Subject</p>
                    <p className="font-medium">{course.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Level</p>
                    <p className="font-medium">{course.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lessons</p>
                    <p className="font-medium">{course.lessonCount} lessons</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Duration</p>
                    <p className="font-medium">Approximately {course.lessonCount * 30} minutes</p>
                  </div>
                </div>
              </div>
              
              <div>
                <Link to={isLoggedIn ? `/course/${courseId}/lessons/1` : "/login"}>
                  <Button size="lg">
                    {isLoggedIn ? 'Start Learning' : 'Sign in to start learning'}
                  </Button>
                </Link>
                {!isLoggedIn && (
                  <p className="mt-2 text-sm text-gray-500">
                    You can preview some content as a guest, but sign in to track your progress.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="lessons" className="mt-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold mb-4">Course Content</h2>
              <p className="mb-6 text-gray-700">{course.lessonCount} lessons • Approximately {course.lessonCount * 30} minutes</p>
              
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <div 
                    key={lesson.id}
                    className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleLessonClick(lesson.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-500 text-sm">Lesson {index + 1}</span>
                        <h3 className="font-medium">{lesson.title}</h3>
                      </div>
                      <div className="flex items-center space-x-3">
                        {isLoggedIn && lesson.isCompleted ? (
                          <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">Completed</span>
                        ) : null}
                        <span className="text-gray-500 text-sm">{lesson.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {!isLoggedIn && (
                <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                  <h3 className="font-semibold mb-2">Track Your Progress</h3>
                  <p className="mb-4 text-gray-600">Sign in to track your progress and continue where you left off.</p>
                  <Link to="/login">
                    <Button>Sign In</Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default CourseView;
