import { Brain, Trophy, Users, Smartphone, BarChart3, Award } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Personalized study paths that adapt to your pace and learning style."
    },
    {
      icon: Trophy,
      title: "Gamified Experience",
      description: "Earn badges, compete in arenas, and level up as you master new concepts."
    },
    {
      icon: BarChart3,
      title: "Real-Time Progress",
      description: "Track your achievements with detailed analytics and performance insights."
    },
    {
      icon: Users,
      title: "Collaborative Learning",
      description: "Connect with peers, join study groups, and grow together."
    },
    {
      icon: Smartphone,
      title: "Learn Anywhere",
      description: "Access your lessons seamlessly across all devices, even offline."
    },
    {
      icon: Award,
      title: "Exam Preparation",
      description: "Practice with mock exams and quizzes aligned to your curriculum."
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need to Succeed</h2>
          <p className="text-gray-600">
            A comprehensive learning platform designed for modern students
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-gray-100">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-education-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-education-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
