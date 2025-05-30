import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from "@/components/ui/button";
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import PDFViewer from '../pages/PdfViewer';
import { CourseProps } from '../components/CourseCard';


//new lines added here
const allCourses: CourseProps[] = [
  {
    id: 1,
    title: 'Mathematics Fundamentals',
    subject: 'Mathematics',
    description: 'Master the foundations of all Mathematics formulars from finding area to solving linear inequalities and all the other mathematical problems.',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 15
  },
  {
    id: 2,
    title: 'Biology,Physics and Chemistry Basics',
    subject: 'Intergrated Science',
    description: 'Explore the fascinating world of cells, organisms, and biological systems.',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 15
  },
  {
    id: 3,
    title: 'Essay Writing Skills',
    subject: 'English',
    description: 'Develop strong writing skills and learn to craft compelling essays.',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'All Levels',
    lessonCount: 10
  },
  {
    id: 4,
    title: 'Distinction Social Studies',
    subject: 'Social Studies',
    description: 'Explore the fascinating world of the Ancient History, Community Service and the Natural Environments in Africa',
    image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 14
  },
  {
    id: 5,
    title: 'Agriculture and Nutrition Fundamentals',
    subject: 'Agrinutrition',
    description: 'Learn the Basics of Agriculture and Nutrition.Gain Knowledge on how to stay and eat healthy foods.Master Planting,weeding,pruning and harvesting of crops.',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Intermediate',
    lessonCount: 18
  },
  {
    id: 6,
    title: 'Pre-technical Studies and Entreprenuership Skills',
    subject: 'Pre-Technical Studies',
    description: 'Master Entrepreneurial Skills,The foundation of Pre-Technical Studies ,Materials For Production and Many more.',
    image: 'https://images.unsplash.com/photo-1608415295464-f26297ecdac4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Intermediate',
    lessonCount: 16
  },
  {
    id: 7,
    title: 'Introduction to Coding',
    subject: 'Computer Science',
    description: 'Learn the basics of programming with easy-to-follow lessons and exercises.',
    image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 12
  },
  {
    id: 8,
    title: 'Creative Arts and Sports',
    subject: 'Creative Arts',
    description: 'Master the art of Creativity and the various sports we offer. ',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Intermediate',
    lessonCount: 15
  },
  {
    id: 9,
    title: 'Kiswahili Fundamentals',
    subject: 'Kiswahili',
    description: 'Strengthen your Kiswahili skills with comprehensive lessons and exercises.',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 10
  }
  // Adding the rest would be similar
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
    { id: 1, title: 'finding Area', duration: '15 min', pdfUrl: '/pdfs/mathematics/Area-9.pdf', pdfDescription: 'Complete guide to area calculation formulas for different shapes' },
    { id: 2, title: 'Solving linear inequalities', duration: '20 min', pdfUrl: '/pdfs/mathematics/linear-inequalities-9.pdf', pdfDescription: 'Step-by-step approach to solving linear inequalities'},
    { id: 3, title: 'Finding Mass', duration: '25 min' },
    { id: 4, title: 'Finding Volume', duration: '30 min' },
    { id: 5, title: 'Indices Questions', duration: '35 min' },
    { id: 6, title: 'Equations on a straight line', duration: '25 min' },
    { id: 7, title: 'Working with time', duration: '40 min' },
    { id: 8, title: 'Money', duration: '45 min' },
    { id: 9, title: 'Matrix', duration: '30 min' },
    { id: 10, title: 'Cube and cube roots', duration: '35 min' },
    { id: 11, title: 'jss maths intro formulars', duration: '40 min' },
    { id: 12, title: 'Integer questions', duration: '45 min' },
    { id: 13, title: 'Approximation and error', duration: '40 min' },
    { id: 14, title: 'Compound proportions and rates of work', duration: '30 min' },
    { id: 15, title: 'working with logarithms', duration: '30 min' },
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
//the rest of the subjects





const LessonView = () => {
  const { courseId, lessonId } = useParams<{ courseId: string, lessonId: string }>();
  const [course, setCourse] = useState<CourseProps | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [prevLesson, setPrevLesson] = useState<Lesson | null>(null);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    // Find course by id
    if (courseId) {
      const foundCourse = allCourses.find(c => c.id === parseInt(courseId, 10));
      setCourse(foundCourse || null);
      
      // If course found, find the lesson
      if (foundCourse && lessonId) {
        const courseLessons = lessonsByCourseName[foundCourse.title] || [];
        const currentLessonIndex = courseLessons.findIndex(l => l.id === parseInt(lessonId, 10));
        
        if (currentLessonIndex !== -1) {
          setLesson(courseLessons[currentLessonIndex]);
          
          // Set previous lesson
          if (currentLessonIndex > 0) {
            setPrevLesson(courseLessons[currentLessonIndex - 1]);
          } else {
            setPrevLesson(null);
          }
          
          // Set next lesson
          if (currentLessonIndex < courseLessons.length - 1) {
            setNextLesson(courseLessons[currentLessonIndex + 1]);
          } else {
            setNextLesson(null);
          }
        } else {
          setLesson(null);
          setNextLesson(null);
          setPrevLesson(null);
        }
      }
    }
  }, [courseId, lessonId]);

  const markLessonComplete = () => {
    if (!isLoggedIn) {
      toast.error("Please login to track progress");
      return;
    }
    
    // In a real app, this would call an API to update the user's progress
    toast.success(`Lesson marked as complete!`);
    
    // If there's a next lesson, navigate to it
    if (nextLesson) {
      window.location.href = `/course/${courseId}/lessons/${nextLesson.id}`;
    } else {
      // If this was the last lesson, go back to course view
      window.location.href = `/course/${courseId}`;
      toast.success("Course completed! 🎉");
    }
  };

  if (!course || !lesson) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Lesson not found</h2>
            <Link to={`/course/${courseId}`}>
              <Button>Back to Course</Button>
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
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to={`/course/${courseId}`} className="text-blue-500 hover:underline flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to course
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
          <div className="flex items-center text-gray-500">
            <span>{course.title}</span>
            <span className="mx-2">•</span>
            <span>Lesson {lessonId} of {course.lessonCount}</span>
            <span className="mx-2">•</span>
            <span>{lesson.duration}</span>
          </div>
        </div>
        
        {/* PDF Viewer Component */}
        {lesson.pdfUrl ? (
          <PDFViewer 
            pdfUrl={lesson.pdfUrl} 
            title={lesson.title} 
            description={lesson.pdfDescription} 
          />
        ) : (
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <p>This lesson doesn't have a PDF document yet. Please check back later.</p>
          </div>
        )}
        
        {/* Navigation and action buttons */}
        <div className="mt-8 flex flex-wrap justify-between gap-4">
          <div>
            {prevLesson ? (
              <Link to={`/course/${courseId}/lessons/${prevLesson.id}`}>
                <Button variant="outline" className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  Previous Lesson
                </Button>
              </Link>
            ) : (
              <Link to={`/course/${courseId}`}>
                <Button variant="outline">Back to course</Button>
              </Link>
            )}
          </div>
          
          <div className="flex space-x-4">
            {isLoggedIn && (
              <Button onClick={markLessonComplete} className="bg-green-600 hover:bg-green-700">
                {nextLesson ? 'Complete & Continue' : 'Mark as Completed'}
              </Button>
            )}
            
            {nextLesson && (
              <Link to={`/course/${courseId}/lessons/${nextLesson.id}`}>
                <Button className="flex items-center">
                  Next Lesson
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Button>
              </Link>
            )}
          </div>
        </div>
     </main>
    </div>
  );
};
export default LessonView;


        
      