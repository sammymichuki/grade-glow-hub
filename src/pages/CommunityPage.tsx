import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CommunityDashboard } from '@/features/collaboration/components/CommunityDashboard';

const CommunityPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-gray-50/50">
      <Navbar />
      <main className="flex-grow container-custom py-8">
        <CommunityDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default CommunityPage;
