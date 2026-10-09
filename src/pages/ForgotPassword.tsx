import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await forgotPassword(email);
      setIsSubmitted(true);
      toast.success("Password reset email sent! Check your inbox.");
    }catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        let errorMessage = "Failed to send password reset email. Please try again.";

      if (message.includes('user-not-found')) {
        errorMessage = "No account found with this email address.";
      } else if (message.includes('invalid-email')) {
        errorMessage = "Invalid email address.";
      } else if (message.includes('too-many-requests')) {
        errorMessage = "Too many requests. Please try again later.";
      } else if (message.includes('api-key-not-valid') ||message.includes('invalid-api-key') ||message.includes('API key')) {
        errorMessage = "Firebase credentials not configured. Please waiiiiiiiitt your developer to fix this issue.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className=" pt-16 min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <BookOpen className="h-12 w-12 text-education-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
              <CardDescription className="text-center">
                We've sent a password reset link to {email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-gray-600">
                If an account exists with this email, you'll receive a password reset link shortly.
                Please check your spam folder if you don't see it.
              </p>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
              <Button 
                className="w-full" 
                variant="ghost"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
              >
                Try another email
              </Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className=" pt-16 min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <BookOpen className="h-12 w-12 text-education-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Reset your password</CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email" 
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                className="w-full" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <div className="text-center text-sm">
                Remember your password?{" "}
                <Link to="/login" className="text-education-primary hover:underline font-medium">
                  Back to login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
