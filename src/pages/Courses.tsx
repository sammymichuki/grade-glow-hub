
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CourseCard, { CourseProps } from '../components/CourseCard';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Sample courses data
const allCourses: CourseProps[] = [
  {
    id: 1,
    title: 'Mathematics Fundamentals',
    subject: 'Mathematics',
    description: 'Master the foundations of all Mathematics formulars from finding area to solving linear inequalities and all the other mathematical problems.',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 15
  },
  {
    id: 2,
    title: 'Biology,Physics and Chemistry Basics',
    subject: 'Intergrated Science',
    description: 'Explore the fascinating world of cells, organisms, and biological systems.',
    image: 'https://images.unsplash.com/photo-1579154341088-3e03c82fced8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 15
  },
  {
    id: 3,
    title: 'Essay Writing Skills',
    subject: 'English',
    description: 'Develop strong writing skills and learn to craft compelling essays.',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'All Levels',
    lessonCount: 10
  },
  {
    id: 4,
    title: 'Distinction Social Studies',
    subject: 'Social Studies',
    description: 'Explore the fascinating world of the Ancient History, Community Service and the Natural Environments in Africa',
    image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 14
  },
  {
    id: 5,
    title: 'Agriculture and Nutrition Fundamentals',
    subject: 'Agrinutrition',
    description: 'Learn the Basics of Agriculture and Nutrition.Gain Knowledge on how to stay and eat healthy foods.Master Planting,weeding,pruning and harvesting of crops.',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Intermediate',
    lessonCount: 18
  },
  {
    id: 6,
    title: 'Pre-technical Studies and Entreprenuership Skills',
    subject: 'Pre-Technical Studies',
    description: 'Master Entrepreneurial Skills,The foundation of Pre-Technical Studies ,Materials For Production and Many more.',
    image: 'https://images.unsplash.com/photo-1608415295464-f26297ecdac4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Intermediate',
    lessonCount: 16
  },
  {
    id: 7,
    title: 'Introduction to Coding',
    subject: 'Computer Science',
    description: 'Learn the basics of programming with easy-to-follow lessons and exercises.',
    image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 12
  },
  {
    id: 8,
    title: 'Creative Arts and Sports',
    subject: 'Creative Arts',
    description: 'Master the art of Creativity and the various sports we offer. ',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Intermediate',
    lessonCount: 15
  },
  {
    id: 9,
    title: 'Kiswahili Fundamentals',
    subject: 'Kiswahili',
    description: 'Strengthen your Kiswahili skills with comprehensive lessons and exercises.',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    level: 'Beginner',
    lessonCount: 10
  }
];

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredCourses, setFilteredCourses] = useState<CourseProps[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  
  // Form state
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  useEffect(() => {
    // Extract unique subjects and levels
    const subjectSet = new Set(allCourses.map(course => course.subject));
    const levelSet = new Set(allCourses.map(course => course.level));
    
    setSubjects(Array.from(subjectSet));
    setLevels(Array.from(levelSet));
    
    // Apply initial filters from URL
    const subjectParam = searchParams.get('subject')?.toLowerCase();
    if (subjectParam) {
      setSelectedSubject(subjectParam);
    }
    
    filterCourses();
  }, [searchParams]);

  useEffect(() => {
    filterCourses();
  }, [search, selectedSubject, selectedLevel]);

  const filterCourses = () => {
    let filtered = [...allCourses];
    
    // Apply search filter
    if (search) {
      filtered = filtered.filter(
        course => 
          course.title.toLowerCase().includes(search.toLowerCase()) ||
          course.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply subject filter
    if (selectedSubject) {
      filtered = filtered.filter(
        course => course.subject.toLowerCase() === selectedSubject.toLowerCase()
      );
    }
    
    // Apply level filter
    if (selectedLevel) {
      filtered = filtered.filter(
        course => course.level === selectedLevel
      );
    }
    
    setFilteredCourses(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    if (value) {
      searchParams.set('subject', value);
    } else {
      searchParams.delete('subject');
    }
    setSearchParams(searchParams);
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedSubject('');
    setSelectedLevel('');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="bg-education-primary/10 py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Browse Courses</h1>
          <p className="text-gray-600">Explore our comprehensive library of grade 9 courses</p>
        </div>
      </div>
      <main className="flex-grow container-custom py-8">
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <Input 
                placeholder="Search courses..." 
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-subjects">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject.toLowerCase()}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <Select value={selectedLevel} onValueChange={handleLevelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-levels">All Levels</SelectItem>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
          </div>
        </div>
        
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-900">No courses found</h3>
            <p className="mt-2 text-gray-500">Try adjusting your search or filter criteria</p>
            <Button className="mt-4" onClick={handleClearFilters}>Reset Filters</Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Courses;
