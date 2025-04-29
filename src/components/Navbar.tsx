
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, BookOpen } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container-custom flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-education-primary" />
          <span className="text-xl font-bold text-education-primary">GradeGlow</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <div className="flex space-x-6">
            <Link to="/" className="text-gray-700 hover:text-education-primary transition-colors">
              Home
            </Link>
            <Link to="/courses" className="text-gray-700 hover:text-education-primary transition-colors">
              Courses
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-education-primary transition-colors">
              About
            </Link>
          </div>
          
          <div className="flex space-x-2">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
                <Button onClick={handleLogout}>Logout</Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden" onClick={toggleMenu}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg absolute z-50 w-full">
          <div className="flex flex-col px-4 pt-2 pb-6 space-y-4">
            <Link 
              to="/" 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link 
              to="/courses"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={toggleMenu}
            >
              Courses
            </Link>
            <Link 
              to="/about"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={toggleMenu}
            >
              About
            </Link>
            
            <div className="border-t border-gray-200 pt-4 flex flex-col space-y-2">
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard" onClick={toggleMenu}>
                    <Button className="w-full" variant="outline">Dashboard</Button>
                  </Link>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={toggleMenu}>
                    <Button className="w-full" variant="outline">Login</Button>
                  </Link>
                  <Link to="/register" onClick={toggleMenu}>
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
