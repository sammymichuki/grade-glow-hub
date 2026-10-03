import React, { useState } from 'react';
import { AdminCourse, AdminCourseStatus } from '@/shared/types/admin';
import { AdminService } from '../services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BookOpen,
  PlusCircle,
  Search,
  Download,
  Trash2,
  Star,
  Users,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface CourseOversightTabProps {
  courses: AdminCourse[];
  onCoursesChange: () => void;
}

export const CourseOversightTab: React.FC<CourseOversightTabProps> = ({
  courses,
  onCoursesChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<AdminCourseStatus | 'all'>('all');

  // Create Course Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newLevel, setNewLevel] = useState('Grade 6, Grade 7, Grade 8');
  const [newInstructorName, setNewInstructorName] = useState('Dr. Evelyn Reed');
  const [newInstructorEmail, setNewInstructorEmail] = useState('evelyn.reed@faculty.edu');
  const [newStatus, setNewStatus] = useState<AdminCourseStatus>('published');

  // Delete Course State
  const [courseToDelete, setCourseToDelete] = useState<AdminCourse | null>(null);

  // Filter courses
  const filteredCourses = AdminService.getCourses({
    searchTerm,
    subject: subjectFilter,
    status: statusFilter,
    sortBy: 'title',
    sortOrder: 'asc',
  });

  const subjects = ['Mathematics', 'Science', 'English', 'Geography', 'Technology'];

  const handleStatusChange = (courseId: number, status: AdminCourseStatus) => {
    try {
      AdminService.updateCourseStatus(courseId, status);
      toast.success(`Course status set to ${status}.`);
      onCoursesChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update course status.');
    }
  };

  const handleCreateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSubject.trim()) {
      toast.error('Title and Subject are required.');
      return;
    }

    try {
      AdminService.createCourse({
        title: newTitle.trim(),
        subject: newSubject.trim(),
        level: newLevel.trim(),
        instructorName: newInstructorName.trim(),
        instructorEmail: newInstructorEmail.trim(),
        status: newStatus,
        lessonCount: 4,
      });

      toast.success(`Course "${newTitle}" created successfully!`);
      setIsCreateOpen(false);
      setNewTitle('');
      onCoursesChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creating course.');
    }
  };

  const handleDeleteCourse = () => {
    if (!courseToDelete) return;
    try {
      AdminService.deleteCourse(courseToDelete.id);
      toast.success(`Course "${courseToDelete.title}" has been deleted.`);
      setCourseToDelete(null);
      onCoursesChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete course.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Course ID', 'Title', 'Subject', 'Level', 'Instructor', 'Instructor Email', 'Enrolled Count', 'Lessons', 'Rating', 'Status'];
    const rows = filteredCourses.map((c) => [
      c.id,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.subject.replace(/"/g, '""')}"`,
      `"${c.level.replace(/"/g, '""')}"`,
      `"${c.instructorName.replace(/"/g, '""')}"`,
      `"${c.instructorEmail.replace(/"/g, '""')}"`,
      c.enrolledCount,
      c.lessonCount,
      c.rating,
      c.status,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gradeglow-courses-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Course inventory exported to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Course Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border shadow-sm flex items-center gap-3">
          <div className="p-2 rounded bg-purple-50 text-purple-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Total Courses</p>
            <p className="text-xl font-bold text-gray-900">{courses.length}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border shadow-sm flex items-center gap-3">
          <div className="p-2 rounded bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Published</p>
            <p className="text-xl font-bold text-gray-900">
              {courses.filter((c) => c.status === 'published').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border shadow-sm flex items-center gap-3">
          <div className="p-2 rounded bg-amber-50 text-amber-600">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Draft / Pending</p>
            <p className="text-xl font-bold text-gray-900">
              {courses.filter((c) => c.status === 'draft').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border shadow-sm flex items-center gap-3">
          <div className="p-2 rounded bg-blue-50 text-blue-600">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Active Enrollees</p>
            <p className="text-xl font-bold text-gray-900">
              {courses.reduce((a, b) => a + b.enrolledCount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Course Table */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                Curriculum Catalog & Course Oversight
              </CardTitle>
              <CardDescription className="text-xs">
                Audit syllabi, monitor faculty assignments, and control institutional course publishing
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Export Catalog CSV
              </Button>

              {/* Create Course Modal */}
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-xs bg-education-primary">
                    <PlusCircle className="w-3.5 h-3.5" /> Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <form onSubmit={handleCreateCourseSubmit}>
                    <DialogHeader>
                      <DialogTitle>Add New Institutional Course</DialogTitle>
                      <DialogDescription>
                        Create an academic course section and assign a lead instructor.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3.5 py-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Course Title</label>
                        <Input
                          placeholder="e.g. Environmental Science & Ecology"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-700">Subject Category</label>
                          <select
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            aria-label="New Course Subject"
                            className="w-full border rounded p-2 text-xs bg-white text-gray-800"
                          >
                            {subjects.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-gray-700">Publication Status</label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as AdminCourseStatus)}
                            aria-label="New Course Status"
                            className="w-full border rounded p-2 text-xs bg-white text-gray-800"
                          >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Target Grade Levels</label>
                        <Input
                          placeholder="e.g. Grade 7, Grade 8, Grade 9"
                          value={newLevel}
                          onChange={(e) => setNewLevel(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Lead Instructor Name</label>
                        <Input
                          placeholder="e.g. Dr. Evelyn Reed"
                          value={newInstructorName}
                          onChange={(e) => setNewInstructorName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Instructor Email</label>
                        <Input
                          type="email"
                          placeholder="e.g. evelyn.reed@faculty.edu"
                          value={newInstructorEmail}
                          onChange={(e) => setNewInstructorEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="gap-1.5 bg-education-primary">
                        <CheckCircle2 className="w-4 h-4" /> Save Course
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
              <Input
                placeholder="Search course title, subject, or instructor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Filter by Subject"
              className="h-9 text-xs border rounded px-2.5 bg-white text-gray-700 w-full sm:w-auto"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AdminCourseStatus | 'all')}
              aria-label="Filter by Course Status"
              className="h-9 text-xs border rounded px-2.5 bg-white text-gray-700 w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Course</th>
                  <th className="p-3.5">Lead Instructor</th>
                  <th className="p-3.5">Level</th>
                  <th className="p-3.5">Enrollment</th>
                  <th className="p-3.5">Rating</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCourses.map((course) => {
                  return (
                    <tr key={course.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3.5">
                        <p className="font-semibold text-gray-900">{course.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                            {course.subject}
                          </Badge>
                          <span className="text-gray-400 text-[11px] font-mono">#{course.id}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <p className="font-medium text-gray-800">{course.instructorName}</p>
                        <p className="text-gray-400 text-[11px] font-mono">{course.instructorEmail}</p>
                      </td>

                      <td className="p-3.5 text-gray-600 text-[11px]">
                        {course.level}
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-gray-900">{course.enrolledCount}</span>
                        <span className="text-gray-400 text-[11px]"> ({course.lessonCount} lessons)</span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1 font-semibold text-gray-800">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{course.rating.toFixed(1)}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <select
                          value={course.status}
                          onChange={(e) => handleStatusChange(course.id, e.target.value as AdminCourseStatus)}
                          aria-label={`Change status for ${course.title}`}
                          className={`text-xs border rounded px-2 py-1 font-semibold ${
                            course.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : course.status === 'draft'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>

                      <td className="p-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCourseToDelete(course)}
                          aria-label={`Delete ${course.title}`}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {filteredCourses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      No courses match the current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Course Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course Section?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently remove <span className="font-semibold text-gray-900">{courseToDelete?.title}</span>?
              This will remove student enrollments and associated progress records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
