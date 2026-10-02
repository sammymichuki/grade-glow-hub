import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from "@/components/ui/button";
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import PDFViewer from '../pages/PdfViewer';
import { CourseService } from '@/features/courses/services/courseService';
import { AssessmentService } from '@/features/assessments/services/assessmentService';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/shared/types/course';
import { LegacyLesson } from '@/features/courses/data/coursesData';
import { lessonRepository } from '@/features/offline-sync/repositories/lessonRepository';
import { DownloadCloud, Check, Trash2 } from 'lucide-react';

const LessonView = () => {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<LegacyLesson | null>(null);
  const [nextLesson, setNextLesson] = useState<LegacyLesson | null>(null);
  const [prevLesson, setPrevLesson] = useState<LegacyLesson | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const { isLoggedIn } = useAuth();

  const checkpointQuiz = courseId && lessonId ? AssessmentService.getQuizByLesson(courseId, lessonId) : null;

  useEffect(() => {
    if (courseId && lessonId) {
      const navData = CourseService.getLessonWithNavigation(courseId, lessonId);
      setCourse(navData.course);
      setLesson(navData.lesson);
      setPrevLesson(navData.prevLesson);
      setNextLesson(navData.nextLesson);

      lessonRepository.isLessonCached(lessonId).then(setIsCached);
    }
  }, [courseId, lessonId]);

  const handleToggleOffline = async () => {
    if (!lesson || !course || !courseId || !lessonId) return;

    if (isCached) {
      await lessonRepository.removeCachedLesson(lessonId);
      setIsCached(false);
      toast.info("Lesson removed from offline storage");
    } else {
      await lessonRepository.cacheLesson({
        id: lessonId,
        courseId,
        courseTitle: course.title,
        title: lesson.title,
        description: lesson.pdfDescription || '',
        content: lesson.pdfDescription || `Lesson ${lesson.title} content`,
        pdfUrl: lesson.pdfUrl,
        order: Number(lesson.id) || 1,
        isOfflineAvailable: true,
      });
      setIsCached(true);
      toast.success("Lesson saved for offline study! 📲");
    }
  };

  const markLessonComplete = () => {
    if (!isLoggedIn) {
      toast.error("Please login to track progress");
      return;
    }
    
    toast.success("Lesson marked as complete!");
    
    if (nextLesson) {
      navigate(`/course/${courseId}/lessons/${nextLesson.id}`);
    } else {
      navigate(`/course/${courseId}`);
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
            <Link to={courseId ? `/course/${courseId}` : '/courses'}>
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
        
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
            <div className="flex items-center text-gray-500">
              <span>{course.title}</span>
              <span className="mx-2">•</span>
              <span>Lesson {lessonId} of {course.lessonCount}</span>
              <span className="mx-2">•</span>
              <span>{lesson.duration}</span>
            </div>
          </div>

          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleOffline}
              className={`gap-2 text-xs font-semibold ${
                isCached
                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : 'border-gray-300 text-gray-700 hover:text-education-primary hover:bg-gray-50'
              }`}
            >
              {isCached ? <Check className="w-4 h-4 text-emerald-600" /> : <DownloadCloud className="w-4 h-4" />}
              {isCached ? 'Available Offline' : 'Save for Offline'}
            </Button>
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
        
        {/* Checkpoint Quiz Callout */}
        {checkpointQuiz && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Badge className="bg-education-primary mb-2">Lesson Assessment</Badge>
              <h3 className="text-lg font-bold text-gray-900">{checkpointQuiz.title}</h3>
              <p className="text-sm text-gray-600">{checkpointQuiz.description}</p>
            </div>
            <Link to={`/quiz/${checkpointQuiz.id}`}>
              <Button className="shrink-0 bg-education-primary hover:bg-education-primary/90">Take Checkpoint Quiz</Button>
            </Link>
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
      <Footer />
    </div>
  );
};

export default LessonView;