import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CourseCard from '../components/CourseCard';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseService } from '@/features/courses/services/courseService';
import { Course } from '@/shared/types/course';

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  
  // Form state
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  useEffect(() => {
    setSubjects(CourseService.getUniqueSubjects());
    setLevels(CourseService.getUniqueLevels());
    
    // Apply initial filters from URL
    const subjectParam = searchParams.get('subject')?.toLowerCase();
    if (subjectParam) {
      setSelectedSubject(subjectParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const results = CourseService.getCourses({
      searchQuery: search,
      subject: selectedSubject && selectedSubject !== 'all-subjects' ? selectedSubject : undefined,
      level: selectedLevel && selectedLevel !== 'all-levels' ? selectedLevel : undefined,
    });
    setFilteredCourses(results);
  }, [search, selectedSubject, selectedLevel]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    if (value && value !== 'all-subjects') {
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
    <div className="pt-16 min-h-screen flex flex-col">
      <Navbar />
      <div className="bg-education-primary/10 py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Browse Courses</h1>
          <p className="text-gray-600">Explore our comprehensive library of grade 4-9 courses</p>
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
                  <SelectValue placeholder="Grade 4-9" />
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
