
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <div className="pt-20  bg-gradient-to-r from-education-primary to-education-secondary text-white">
      <div className="container-custom py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your Path to Grade 9 Success Starts Here
            </h1>
            <p className="text-lg md:text-xl mb-8 text-blue-100">
              Interactive lessons, practice exercises, and progress tracking designed specifically for grade 4-9 students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/courses">
                <Button size="lg" className="bg-white text-education-primary hover:bg-blue-50">
                  Explore Courses
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-white text-black hover:bg-white/10">
                  Sign Up For Free 
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute -top-16 -left-16 w-32 h-32 bg-education-accent rounded-full opacity-20"></div>
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-yellow-400 rounded-full opacity-20"></div>
              <div className="bg-white p-4 rounded-lg shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=750&q=80" 
                  alt="Students learning" 
                  className="rounded-md" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-16 bg-gradient-to-b from-education-secondary/80 to-transparent"></div>
    </div>
  );
};

export default HeroSection;
