import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AdminDashboard } from '@/features/admin/components/AdminDashboard';

const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-gray-50/50">
      <Navbar />
      <main className="flex-grow container-custom py-8">
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
