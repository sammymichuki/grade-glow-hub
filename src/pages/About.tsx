
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className=" pt-16 min-h-screen flex flex-col">
      <Navbar />
      
      <div className="bg-education-primary/10 py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">About GradeGlow</h1>
          <p className="text-gray-600">Learn more about our education platform</p>
        </div>
      </div>
      
      <main className="flex-grow container-custom py-12">
        <div className="max-w-3xl mx-auto">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              At GradeGlow, our mission is to provide accessible, high-quality education to grade 4-9 students Kenyanwide. 
              We believe that every student deserves access to engaging educational content that helps them succeed in their academic journey.
            </p>
            <p className="text-gray-700">
              Through our interactive platform, we aim to make learning enjoyable, personalized, and effective for all students, 
              regardless of their background or learning style.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Our Approach</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-2 text-education-primary">Interactive Learning</h3>
                <p className="text-gray-700">
                  Our courses feature interactive exercises, quizzes, and multimedia content to keep students engaged and motivated.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-2 text-education-primary">Expert Teachers</h3>
                <p className="text-gray-700">
                  All our course materials are developed by experienced educators who understand the needs of grade 4-9 students.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-2 text-education-primary">Progress Tracking</h3>
                <p className="text-gray-700">
                  Students can track their progress, identify strengths and weaknesses, and focus their study time effectively.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-2 text-education-primary">Curriculum Aligned</h3>
                <p className="text-gray-700">
                  Our courses are aligned with standard grade 4-9 curriculum requirements to ensure academic success.
                </p>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-6">
              Have questions about our platform or courses? We'd love to hear from you!
            </p>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="mb-2"><span className="font-semibold">Email:</span> info@gradeglowapp.com</p>
              <p className="mb-2"><span className="font-semibold">Phone:</span> (+254) 7810 62694</p>
              <p><span className="font-semibold">Address:</span> 123 Learning Lane, Education City, EC 12345</p>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
