
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CourseProps } from '../components/CourseCard';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// Sample courses data - in a real app this would come from an API
const allCourses: CourseProps[] = [
  {
    id: 1,
    title: 'Algebra Fundamentals',
    subject: 'Mathematics',
    description: 'Master the foundations of algebra with interactive lessons and practice problems. This course covers essential concepts like variables, expressions, equations, and functions. Perfect for students looking to build a strong foundation in algebra.',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 12
  },
  {
    id: 2,
    title: 'Biology: Cells & Systems',
    subject: 'Science',
    description: 'Explore the fascinating world of cells, organisms, and biological systems. From cell structure to organ systems, this comprehensive course provides a solid understanding of key biology concepts for grade 9 students.',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Intermediate',
    lessonCount: 15
  },
  // Adding the rest would be similar
];

// Sample lessons data
const lessonsByCourseName: Record<string, { id: number, title: string, duration: string, isCompleted?: boolean }[]> = {
  'Algebra Fundamentals': [
    { id: 1, title: 'Introduction to Algebra', duration: '15 min' },
    { id: 2, title: 'Working with Variables', duration: '20 min' },
    { id: 3, title: 'Understanding Expressions', duration: '25 min' },
    { id: 4, title: 'Solving Simple Equations', duration: '30 min' },
    { id: 5, title: 'Linear Equations', duration: '35 min' },
    { id: 6, title: 'Working with Inequalities', duration: '25 min' },
    { id: 7, title: 'Graphing Equations', duration: '40 min' },
    { id: 8, title: 'Systems of Equations', duration: '45 min' },
    { id: 9, title: 'Exponents and Powers', duration: '30 min' },
    { id: 10, title: 'Polynomials', duration: '35 min' },
    { id: 11, title: 'Factoring', duration: '40 min' },
    { id: 12, title: 'Quadratic Equations', duration: '45 min' },
  ],
  'Biology: Cells & Systems': [
    { id: 1, title: 'Introduction to Biology', duration: '20 min' },
    { id: 2, title: 'Cell Structure', duration: '30 min' },
    { id: 3, title: 'Cell Functions', duration: '25 min' },
    { id: 4, title: 'Cell Division', duration: '35 min' },
    { id: 5, title: 'DNA and Genetics', duration: '40 min' },
    { id: 6, title: 'Inheritance Patterns', duration: '30 min' },
    { id: 7, title: 'Body Systems Overview', duration: '25 min' },
    { id: 8, title: 'Digestive System', duration: '30 min' },
    { id: 9, title: 'Circulatory System', duration: '30 min' },
    { id: 10, title: 'Respiratory System', duration: '25 min' },
    { id: 11, title: 'Nervous System', duration: '35 min' },
    { id: 12, title: 'Immune System', duration: '30 min' },
    { id: 13, title: 'Endocrine System', duration: '25 min' },
    { id: 14, title: 'Musculoskeletal System', duration: '30 min' },
    { id: 15, title: 'Ecosystems and Environments', duration: '35 min' },
  ],
};

const CourseView = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseProps | null>(null);
  const [lessons, setLessons] = useState<Array<{ id: number, title: string, duration: string, isCompleted: boolean }>>([]);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    // Find course by id
    if (courseId) {
      const foundCourse = allCourses.find(c => c.id === parseInt(courseId, 10));
      setCourse(foundCourse || null);
      
      // If course found, set up lessons
      if (foundCourse) {
        const courseLessons = lessonsByCourseName[foundCourse.title] || [];
        
        // If logged in, simulate some random progress
        if (isLoggedIn) {
          const completedLessons = courseLessons.map(lesson => ({
            ...lesson,
            isCompleted: Math.random() > 0.5
          }));
          setLessons(completedLessons);
          
          // Calculate progress
          const completed = completedLessons.filter(l => l.isCompleted).length;
          setProgress(Math.round((completed / courseLessons.length) * 100));
        } else {
          setLessons(courseLessons.map(lesson => ({ ...lesson, isCompleted: false })));
        }
      }
    }
  }, [courseId, isLoggedIn]);

  const handleLessonClick = (lessonId: number) => {
    if (!isLoggedIn) {
      toast.error("Please login to access lessons");
      return;
    }
    
    // In a real app, this would navigate to the lesson content
    toast.success(`Opening lesson: ${lessons.find(l => l.id === lessonId)?.title}`);
    
    // Mark lesson as completed
    setLessons(prevLessons => {
      const updatedLessons = prevLessons.map(lesson => 
        lesson.id === lessonId ? { ...lesson, isCompleted: true } : lesson
      );
      
      // Update progress
      const completed = updatedLessons.filter(l => l.isCompleted).length;
      setProgress(Math.round((completed / updatedLessons.length) * 100));
      
      return updatedLessons;
    });
  };

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
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
              <Button className="self-start">Continue Learning</Button>
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
              
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">What you'll learn</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <li key={i} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">
                        {course.subject === 'Mathematics' ? 
                          `Understanding ${['variables', 'equations', 'functions', 'graphs', 'problem solving', 'mathematical reasoning'][i-1]}` : 
                          `Learning about ${['cells', 'organisms', 'systems', 'processes', 'structures', 'relationships'][i-1]}`
                        }
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
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
