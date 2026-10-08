
import HeroSection from '../components/HeroSection';
import Stats from '../components/Stats';
import TrustStrip from '../components/TrustStrip';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import SubjectsList from '../components/SubjectsList';
import FeaturedCourses from '../components/FeaturedCourses';
import WhyChooseUs from '../components/WhyChooseUs';
import Testimonials from '../components/Testimonials';
import FAQSection from '../components/FAQSection';
import Newsletter from '../components/Newsletter';
import CTASection from '../components/CTASection';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <TrustStrip />
        <HowItWorks />
        <Stats />
        <Features />
        <SubjectsList />
        <FeaturedCourses />
        <WhyChooseUs />
        <Testimonials />
        <FAQSection />
        <Newsletter />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
