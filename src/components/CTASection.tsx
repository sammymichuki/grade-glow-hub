import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="bg-gradient-to-r from-education-primary via-education-secondary to-education-accent rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-grid-white/10 opacity-20"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              <span className="text-white/90 font-medium">Start Learning Today</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Boost Your Academic Performance?
            </h2>
            <p className="text-white/90 text-lg mb-8">
              Join thousands of students who are achieving their academic goals with GradeGlow
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-white text-education-primary hover:bg-blue-50 group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/courses">
                <Button size="lg" variant="outline" className="border-white/90 text-white bg-white/10 hover:bg-white hover:text-education-primary">
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
