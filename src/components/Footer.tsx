
import { Link } from 'react-router-dom';
import { BookOpen } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-200">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">GradeGlow</span>
            </Link>
            <p className="mt-4 text-gray-400">
              Your comprehensive learning platform designed specifically for grade 9 students.
            </p>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Subjects</h3>
            <ul className="space-y-2">
              <li><Link to="/courses?subject=mathematics" className="text-gray-400 hover:text-white transition-colors">Mathematics</Link></li>
              <li><Link to="/courses?subject=science" className="text-gray-400 hover:text-white transition-colors">Science</Link></li>
              <li><Link to="/courses?subject=english" className="text-gray-400 hover:text-white transition-colors">English</Link></li>
              <li><Link to="/courses?subject=history" className="text-gray-400 hover:text-white transition-colors">History</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/courses" className="text-gray-400 hover:text-white transition-colors">All Courses</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Account</h3>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/profile" className="text-gray-400 hover:text-white transition-colors">My Profile</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} GradeGlow. All rights reserved. 
          </p>
          <p className="text-gray-500 text-sm">
              @ Smartech Solutions 
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
