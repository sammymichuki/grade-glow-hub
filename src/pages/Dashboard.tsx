
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '../contexts/AuthContext';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import EnrolledCourses from '../components/dashboard/EnrolledCourses';
import RecommendedCourses from '../components/dashboard/RecommendedCourses';
import RecentActivity from '../components/dashboard/RecentActivity';
import LearningStats from '../components/dashboard/LearningStats';
import StudyGoals from '../components/dashboard/StudyGoals';
import StudyReminders from '../components/dashboard/StudyReminders';

// Sample enrolled courses with progress
const enrolledCourses = [
  {
    id: 1,
    title: 'Algebra Fundamentals',
    subject: 'Mathematics',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    progress: 75,
    lastLesson: 'Solving Simple Equations'
  },
  {
    id: 2,
    title: 'Biology: Cells & Systems',
    subject: 'Science',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    progress: 40,
    lastLesson: 'Cell Division'
  },
  {
    id: 3,
    title: 'Essay Writing Skills',
    subject: 'English',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    progress: 20,
    lastLesson: 'Introduction to Essay Structure'
  }
];

// Sample recommended courses
const recommendedCourses = [
  { 
    id: 4, 
    title: 'Chemistry Basics', 
    subject: 'Science', 
    image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80' 
  },
  { 
    id: 5, 
    title: 'World Geography', 
    subject: 'Geography', 
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80' 
  }
];

// Sample activity data - fixing the type property to use the correct union type
const recentActivity = [
  { id: 1, type: 'completed' as const, course: 'Algebra Fundamentals', lesson: 'Working with Variables', date: '2 days ago' },
  { id: 2, type: 'started' as const, course: 'Biology: Cells & Systems', lesson: 'Cell Division', date: '3 days ago' },
  { id: 3, type: 'enrolled' as const, course: 'Essay Writing Skills', lesson: '', date: '1 week ago' },
  { id: 4, type: 'completed' as const, course: 'Algebra Fundamentals', lesson: 'Introduction to Algebra', date: '1 week ago' }
];

const Dashboard = () => {
  const { isLoggedIn, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('progress');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow container-custom py-8 flex items-center justify-center">
          <div>Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <DashboardHeader />
      
      <main className="flex-grow container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area - 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="progress" value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList>
                <TabsTrigger value="progress">My Progress</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="progress" className="mt-4">
                <div className="space-y-6">
                  <EnrolledCourses courses={enrolledCourses} />
                  <RecommendedCourses courses={recommendedCourses} />
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="mt-4">
                <RecentActivity activities={recentActivity} />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar - 1/3 width on large screens */}
          <div className="space-y-6">
            <LearningStats />
            <StudyGoals />
            <StudyReminders />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
