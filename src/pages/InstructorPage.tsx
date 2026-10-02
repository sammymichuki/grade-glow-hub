import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { InstructorStudioDashboard } from '@/features/instructor-studio/components/InstructorStudioDashboard';

const InstructorPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-gray-50/50">
      <Navbar />
      <main className="flex-grow container-custom py-8">
        <InstructorStudioDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default InstructorPage;
