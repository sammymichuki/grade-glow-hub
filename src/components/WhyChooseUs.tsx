
import { CheckCircle } from 'lucide-react';

const WhyChooseUs = () => {
  const features = [
    {
      title: "Self-paced Learning",
      description: "Learn at your own pace with flexible course schedules and on-demand lessons."
    },
    {
      title: "Grade 4-9 Curriculum Aligned",
      description: "All courses are designed to align with standard grade 4-9 educational requirements."
    },
    {
      title: "Track Your Progress",
      description: "Monitor your learning journey with detailed progress tracking and analytics."
    },
    {
      title: "Interactive Lessons",
      description: "Engage with interactive content, quizzes, and exercises designed to enhance learning."
    },
    
    {
      title: "Learn Anywhere",
      description: "Access your courses on any device, anywhere with our responsive platform."
    },
     {
      title: "Learn Anytime",
      description: "Learn Anytime you want to,Add Reminders.Make your precious time count!."
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose GradeGlow?</h2>
          <p className="text-gray-600">
            We're dedicated to making your grade  4-9 learning experience engaging, effective, and enjoyable.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col"
            >
              <div className="mb-4 text-education-primary">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
