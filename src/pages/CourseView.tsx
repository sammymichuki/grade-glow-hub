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
    title: 'Mathematics Fundamentals',
    subject: 'Mathematics',
    description: 'Master the foundations of all Mathematics formulars from finding area to solving linear inequalities and all the other mathematical problems',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Grade-4,Grade-7,Grade-8,Grade-9',
    lessonCount: 18
  },
  {
    id: 2,
    title: 'Biology,Physics and Chemistry Basics',
    subject: ' Intergrated Science',
    description: 'Explore the fascinating world of cells, organisms, and biological systems.',
    image: 'https://images.unsplash.com/photo-1617088778378-3e6f7a064ec9?auto=format&fit=crop&w=500&q=80',
    level: 'Grade-5,Grade-7,Grade-8,Grade-9',
    lessonCount: 15
  },
  {
    id: 3,
    title: 'Essay Writing Skills',
    subject: 'English',
    description: 'Develop strong writing skills and learn to craft compelling essays.',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Grade-6,Grade-7,Grade-8,Grade-9 ',
    lessonCount: 10
  },
  {
   id: 4,
    title: 'Distinction Social Studies',
    subject: 'Social Studies',
    description: 'Explore the fascinating world of the Ancient History, Community Service and the Natural Environments in Africa',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Grade-7,Grade-8,Grade-9',
    lessonCount: 14
  },
  {
    id: 5,
    title: 'Agriculture and Nutrition Fundamentals',
    subject: 'Agrinutrition',
    description: 'Learn the Basics of Agriculture and Nutrition.Gain Knowledge on how to stay and eat healthy foods.Master Planting,weeding,pruning and harvesting of crops',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Grade-5,Grade-8,Grade-9',
    lessonCount: 18

  },
  {
    id: 6,
    title: 'Pre-technical Studies and Entreprenuership Skills',
    subject: 'Pre-Technical Studies',
    description: 'Master Entrepreneurial Skills,The foundation of Pre-Technical Studies ,Materials For Production and Many more.',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Grade-6,Grade-8,Grade-9',
    lessonCount: 16
  },

  {
  id: 7,
    title: 'Introduction to Coding',
    subject: 'Computer Science',
    description: 'Learn the basics of programming with easy-to-follow lessons and exercises.',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: '<Grade-7,Grade-8,Grade-9',
    lessonCount: 12
  },

  {
  id: 8,
    title: 'Creative Arts and Sports',
    subject: 'Creative Arts',
    description: 'Master the art of Creativity and the various sports we offer. ',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Grade-4,Grade-5,Grade-6,Grade-9',
    lessonCount: 15
  },

  {
    id: 9,
    title: 'Kiswahili Fundamentals',
    subject: 'Kiswahili',
    description: 'Strengthen your Kiswahili skills with comprehensive lessons and exercises.',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Grade-7,Grade-8,Grade-9',
    lessonCount: 10
  },
  
];

// Updated lesson type definition
type Lesson = {
  id: number;
  title: string;
  duration: string;
  isCompleted?: boolean;
  pdfUrl?: string; // URL to the PDF document
  pdfDescription?: string; // Optional description of the PDF content
};

// Sample lessons data
const lessonsByCourseName: Record<string, Lesson[]> = {
  'Mathematics Fundamentals': [
    { id: 1, title: 'finding Area', duration: '15 min', pdfUrl: '/Area-9.pdf', pdfDescription: 'Complete guide to area calculation formulas for different shapes' },
    { id: 2, title: 'Solving linear inequalities', duration: '20 min', pdfUrl: '/linear-inequalities-9.pdf', pdfDescription: 'Step-by-step approach to solving linear inequalities'},
    { id: 3, title: 'Finding Mass', duration: '25 min',pdfUrl:'/mass-09.pdf',pdfDescription:'Finding the mass for various solids' },
    { id: 4, title: 'Finding Volume', duration: '30 min',pdfUrl:'/volume-09.pdf',pdfDescription:'Finding the volume for different solids' },
    { id: 5, title: 'Indices Questions', duration: '35 min',pdfUrl:'/Indices-questions.pdf',pdfDescription:'Questions regarding indices' },
    { id: 6, title: 'Equations on a straight line', duration: '25 min',pdfUrl:'/equations-on-a-straight-line-9.pdf',pdfDescription:'Solving Equations on a straight line' },
    { id: 7, title: 'Working with time', duration: '40 min',pdfUrl:'/Time.pdf',pdfDescription:'Learn all about time' },
    { id: 8, title: 'Money', duration: '45 min',pdfUrl:'/money.pdf',pdfDescription:'Working with Money' },
    { id: 9, title: 'Matrix', duration: '30 min',pdfUrl:'/matrix-9.pdf',pdfDescription:'Learn about matrix and solving matrix questions' },
    { id: 10, title: 'Cube and cube roots', duration: '35 min',pdfUrl:'/cube-and-cube-roots.pdf',pdfDescription:'Working with cubes and finding cube roots' },
    { id: 11, title: 'jss maths intro formulars', duration: '40 min',pdfUrl:'/jss-maths-grade-9-intro-formulas.pdf',pdfDescription:'Simplified Introduction Formulars' },
    { id: 12, title: 'Integer questions', duration: '45 min',pdfUrl:'/integer-questions.pdf',pdfDescription:'Working with integers' },
    { id: 13, title: 'Approximation and error', duration: '40 min',pdfUrl:'/Approximation-and-error.pdf',pdfDescription:'Learn solving approximation and error questions' },
    { id: 14, title: 'Compound proportions and rates of work', duration: '30 min',pdfUrl:'/compound-proportions-and-rates-of-work.pdf',pdfDescription:'solving questions regarding rates of work and compound proportions' },
    { id: 15, title: 'working with logarithms', duration: '30 min',pdfUrl:'/logarithms-9.pdf',pdfDescription:'learn how to solve logarithms problems' },
    { id: 16, title: 'Finding bearing',duration:'20 min',pdfUrl:'/bearing.pdf',pdfDescription:'Learn how to find the bearing of a place or point'},
    { id: 17, title: 'Grouped data ',duration:'25 min',pdfUrl:'/grouped-data.pdf',pdfDescription:'Work with grouped data and learn all the formulars involved'},
    { id: 18, title: 'Integer questions',duration:'10 min',pdfUrl:'/integers-questions.pdf',pdfDescription:'Solve this questions!'}
  ],
  'Biology,Physics and Chemistry Basics': [
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
  const [lessons, setLessons] = useState<Array<Lesson & { isCompleted: boolean }>>([]);
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

  const continueLearning= () =>{
      window.location.href = `#`
  };

  const handleLessonClick = (lessonId: number) => {
    if (!isLoggedIn) {
      toast.error("Please login to access lessons");
      return;
    }
    
    // Navigate to the lesson view
    window.location.href = `/course/${courseId}/lessons/${lessonId}`;
    
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
      <div className=" pt-16 min-h-screen flex flex-col">
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
              <Button className="self-start" >Continue Learning</Button>
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
