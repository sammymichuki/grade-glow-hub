
import HeroSection from '../components/HeroSection';
import SubjectsList from '../components/SubjectsList';
import FeaturedCourses from '../components/FeaturedCourses';
import WhyChooseUs from '../components/WhyChooseUs';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <SubjectsList />
        <FeaturedCourses />
        <WhyChooseUs />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
