import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import "@/shared/i18n/config";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Courses from "./pages/Courses";
import CourseView from "./pages/CourseView";
import LessonView from './pages/LessonView';
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import QuizPage from "./pages/QuizPage";
import GradebookPage from "./pages/GradebookPage";
import InstructorPage from "./pages/InstructorPage";
import CommunityPage from "./pages/CommunityPage";
import AdminPage from "./pages/AdminPage";
import MasteryPage from "./pages/MasteryPage";
import ArenaPage from "./pages/ArenaPage";
import AITutorPage from "./pages/AITutorPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/course/:courseId" element={<CourseView />} />
              <Route path="/course/:courseId/lessons/:lessonId" element={<LessonView />} />
              <Route path="/quiz/:quizId" element={<QuizPage />} />
              <Route path="/grades" element={<GradebookPage />} />
              <Route path="/gradebook" element={<GradebookPage />} />
              <Route path="/instructor" element={<InstructorPage />} />
              <Route path="/studio" element={<InstructorPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/forums" element={<CommunityPage />} />
              <Route path="/peer-review" element={<CommunityPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/administration" element={<AdminPage />} />
              <Route path="/mastery" element={<MasteryPage />} />
              <Route path="/arena" element={<ArenaPage />} />
              <Route path="/ai-tutor" element={<AITutorPage />} />
              <Route path="/glowbot" element={<AITutorPage />} />
              <Route path="/curriculum-ai" element={<AITutorPage />} />
              <Route path="/essay-evaluator" element={<AITutorPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;