
import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from '../contexts/AuthContext';

// Sample enrolled courses with progress
const enrolledCourses = [
  {
    id: 1,
    title: 'Algebra Fundamentals',
    subject: 'Mathematics',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    progress: 75,
    lastLesson: 'Solving Simple Equations'
  },
  {
    id: 2,
    title: 'Biology: Cells & Systems',
    subject: 'Science',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    progress: 40,
    lastLesson: 'Cell Division'
  },
  {
    id: 3,
    title: 'Essay Writing Skills',
    subject: 'English',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    progress: 20,
    lastLesson: 'Introduction to Essay Structure'
  }
];

// Sample activity data
const recentActivity = [
  { id: 1, type: 'completed', course: 'Algebra Fundamentals', lesson: 'Working with Variables', date: '2 days ago' },
  { id: 2, type: 'started', course: 'Biology: Cells & Systems', lesson: 'Cell Division', date: '3 days ago' },
  { id: 3, type: 'enrolled', course: 'Essay Writing Skills', lesson: '', date: '1 week ago' },
  { id: 4, type: 'completed', course: 'Algebra Fundamentals', lesson: 'Introduction to Algebra', date: '1 week ago' }
];

const Dashboard = () => {
  const { isLoggedIn, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('progress');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow container-custom py-8 flex items-center justify-center">
          <div>Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="bg-education-primary/10 py-8">
        <div className="container-custom">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your learning progress and continue your studies</p>
        </div>
      </div>
      
      <main className="flex-grow container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area - 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="progress" value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList>
                <TabsTrigger value="progress">My Progress</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="progress" className="mt-4">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Courses in Progress</h2>
                  
                  {enrolledCourses.map(course => (
                    <Card key={course.id}>
                      <div className="sm:flex">
                        <div className="sm:w-1/4">
                          <img 
                            src={course.image} 
                            alt={course.title} 
                            className="h-32 w-full object-cover sm:h-full rounded-t-md sm:rounded-l-md sm:rounded-tr-none"
                          />
                        </div>
                        <div className="sm:w-3/4 p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-medium text-education-primary">{course.subject}</span>
                              <h3 className="text-lg font-semibold mt-1">{course.title}</h3>
                            </div>
                            <span className="bg-education-primary/10 text-education-primary text-sm px-3 py-1 rounded-full">
                              {course.progress}% Complete
                            </span>
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              Last lesson: <span className="font-medium">{course.lastLesson}</span>
                            </div>
                            <Link to={`/course/${course.id}`}>
                              <Button variant="outline" size="sm">Resume</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Recommended Courses</h2>
                    <Link to="/courses" className="text-education-primary hover:underline">View All</Link>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 4, title: 'Chemistry Basics', subject: 'Science', image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80' },
                      { id: 5, title: 'World Geography', subject: 'Geography', image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80' }
                    ].map(course => (
                      <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <img 
                          src={course.image} 
                          alt={course.title} 
                          className="h-32 w-full object-cover"
                        />
                        <CardContent className="p-4">
                          <span className="text-sm text-education-primary">{course.subject}</span>
                          <h3 className="font-semibold">{course.title}</h3>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                          <Link to={`/course/${course.id}`} className="w-full">
                            <Button variant="outline" className="w-full">View Course</Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="mt-4">
                <h2 className="text-xl font-semibold mb-4">Your Recent Activity</h2>
                <Card>
                  <CardContent className="p-0">
                    <ul className="divide-y">
                      {recentActivity.map((activity) => (
                        <li key={activity.id} className="p-4 flex items-start">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                            activity.type === 'completed' ? 'bg-green-100 text-green-600' :
                            activity.type === 'started' ? 'bg-blue-100 text-blue-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {activity.type === 'completed' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : activity.type === 'started' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="font-medium">
                                {activity.type === 'completed' && 'Completed lesson'}
                                {activity.type === 'started' && 'Started lesson'}
                                {activity.type === 'enrolled' && 'Enrolled in course'}
                              </p>
                              <span className="text-sm text-gray-500">{activity.date}</span>
                            </div>
                            <p className="text-gray-700">
                              <span className="font-medium">{activity.course}</span>
                              {activity.lesson && ` - ${activity.lesson}`}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar - 1/3 width on large screens */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Stats</CardTitle>
                <CardDescription>Your learning achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-md text-center">
                    <p className="text-3xl font-bold text-education-primary">3</p>
                    <p className="text-sm text-gray-600">Courses in progress</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-md text-center">
                    <p className="text-3xl font-bold text-green-600">42%</p>
                    <p className="text-sm text-gray-600">Avg. completion</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-md text-center">
                    <p className="text-3xl font-bold text-amber-600">8</p>
                    <p className="text-sm text-gray-600">Lessons completed</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-md text-center">
                    <p className="text-3xl font-bold text-purple-600">4h</p>
                    <p className="text-sm text-gray-600">Study time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Study Goals</CardTitle>
                <CardDescription>Track your learning goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Weekly study target</span>
                    <span>2h / 5h</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Monthly courses</span>
                    <span>1 / 2</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Update Goals</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Study Reminders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div>
                    <p className="font-medium">Algebra Quiz</p>
                    <p className="text-sm text-gray-500">Tomorrow, 3:00 PM</p>
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div>
                    <p className="font-medium">Biology Lesson</p>
                    <p className="text-sm text-gray-500">Friday, 4:30 PM</p>
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Add Reminder</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
