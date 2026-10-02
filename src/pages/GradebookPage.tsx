import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { GradebookView } from '@/features/grading/components/GradebookView';

const GradebookPage = () => {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-gray-50/50">
      <Navbar />
      <main className="flex-grow container-custom py-8">
        <GradebookView />
      </main>
      <Footer />
    </div>
  );
};

export default GradebookPage;
