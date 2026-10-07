import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { QuizRunner } from '@/features/assessments/components/QuizRunner';
import { AssessmentService } from '@/features/assessments/services/assessmentService';
import { useAuth } from '../contexts/AuthContext';

import { GlowBotChatDrawer } from '@/features/ai-tutor/components/GlowBotChatDrawer';

const QuizPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const quiz = quizId ? AssessmentService.getQuizById(quizId) : null;

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col pt-16">
        <Navbar />
        <main className="flex-grow container-custom py-12 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Quiz Not Found</h2>
            <p className="text-gray-600">The requested assessment does not exist or has expired.</p>
            <Link to="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-gray-50/50">
      <Navbar />
      <main className="flex-grow container-custom py-8">
        <QuizRunner
          quiz={quiz}
          studentId={user?.uid || 'guest-student'}
          onExit={() => navigate(`/course/${quiz.courseId}`)}
        />
      </main>
      <GlowBotChatDrawer
        context={{
          subject: 'Academic Assessment',
          gradeLevel: 7,
          topic: quiz.title,
        }}
      />
      <Footer />
    </div>
  );
};

export default QuizPage;
