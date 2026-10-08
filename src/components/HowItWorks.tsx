import { UserPlus, BookOpen, Sparkles } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign Up",
    description: "Create your free account in seconds and get started right away."
  },
  {
    icon: BookOpen,
    step: "02",
    title: "Choose Course",
    description: "Browse our CBC-aligned courses and pick what fits your goals."
  },
  {
    icon: Sparkles,
    step: "03",
    title: "Start Learning",
    description: "Dive into interactive lessons and track your progress as you go."
  }
];

const HowItWorks = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">How It Works</h2>
          <p className="text-gray-600">Get started in just 3 simple steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="border-gray-100 hover:shadow-sm transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-education-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-education-primary" />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 tracking-widest">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
