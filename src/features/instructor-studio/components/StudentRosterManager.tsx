import React, { useState } from 'react';
import { StudentRosterItem, StudentStatus } from '@/shared/types/instructor';
import { RosteringService } from '../services/rosteringService';
import { SAMPLE_STUDENT_ROSTER } from '../data/sampleRoster';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Award,
  CalendarCheck,
  Download,
  Upload,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

export const StudentRosterManager: React.FC = () => {
  const [students, setStudents] = useState<StudentRosterItem[]>(SAMPLE_STUDENT_ROSTER);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>('');

  // CSV Import Dialog State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState(
`studentId,name,email,gradeLevel,currentGpa,attendancePercentage,status
STU-2001,Lucas Miller,lucas.m@student.edu,8,3.85,99.0,active
STU-2002,Fatima Zahra,fatima.z@student.edu,7,4.00,100.0,active
STU-2003,Kenji Sato,kenji.s@student.edu,8,3.15,92.5,active`
  );
  const [importErrors, setImportErrors] = useState<{ row: number; reason: string }[]>([]);

  // Manual Add Student Dialog State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGrade, setNewGrade] = useState<number>(8);

  // Filter students
  const filteredStudents = RosteringService.filterRoster(students, {
    searchTerm,
    gradeLevel: gradeFilter !== '' ? Number(gradeFilter) : undefined,
    status: statusFilter !== '' ? statusFilter : undefined,
  });

  const metrics = RosteringService.calculateRosterMetrics(students);

  // CSV Export
  const handleExportCSV = () => {
    const csvContent = RosteringService.exportRosterToCSV(students);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `student-roster-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Roster CSV exported successfully.');
  };

  // CSV Import execution
  const handleProcessCSVImport = () => {
    const result = RosteringService.parseRosterCSV(csvRawText);
    setImportErrors(result.errors);

    if (result.validStudents.length > 0) {
      setStudents((prev) => [...prev, ...result.validStudents]);
      toast.success(`Imported ${result.validStudents.length} student(s) successfully!`);
      if (result.errors.length === 0) {
        setIsImportModalOpen(false);
      }
    } else {
      toast.error('Failed to import students. Please check format errors.');
    }
  };

  // Add individual student
  const handleManualAddStudent = () => {
    if (!newStudentId.trim() || !newName.trim() || !newEmail.trim()) {
      toast.error('Please fill in Student ID, Name, and Email.');
      return;
    }

    const newStudent: StudentRosterItem = {
      id: `stu-${Date.now()}`,
      studentId: newStudentId.trim(),
      name: newName.trim(),
      email: newEmail.trim(),
      gradeLevel: newGrade,
      enrolledCourseIds: [1],
      enrollmentDate: new Date().toISOString().split('T')[0],
      attendancePercentage: 100,
      currentGpa: 3.5,
      status: 'active',
    };

    setStudents((prev) => [newStudent, ...prev]);
    setIsAddModalOpen(false);
    setNewStudentId('');
    setNewName('');
    setNewEmail('');
    toast.success(`Student ${newStudent.name} registered.`);
  };

  // Toggle enrollment in course 1
  const handleToggleCourseEnrollment = (studentId: string, courseId: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        if (s.enrolledCourseIds.includes(courseId)) {
          return RosteringService.unenrollStudentFromCourse(s, courseId);
        }
        return RosteringService.enrollStudentInCourse(s, courseId);
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-education-primary">
            Rostering & Enrollment
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Student Management Hub</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage student records, batch CSV import/export, and course section enrollments
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
            <Download className="w-4 h-4" /> Export CSV
          </Button>

          {/* Import CSV Modal */}
          <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Upload className="w-4 h-4" /> Batch CSV Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Import Student Roster from CSV</DialogTitle>
                <DialogDescription>
                  Paste CSV lines or upload data formatted with columns: <br />
                  <code className="text-xs font-mono bg-gray-100 p-1 rounded">
                    studentId,name,email,gradeLevel,currentGpa,attendancePercentage,status
                  </code>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <Textarea
                  rows={8}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  className="font-mono text-xs"
                />

                {importErrors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> CSV Parsing Errors ({importErrors.length}):
                    </p>
                    {importErrors.map((err, i) => (
                      <p key={i}>• Line {err.row}: {err.reason}</p>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleProcessCSVImport} className="gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Validate & Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Student Modal */}
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-education-primary">
                <UserPlus className="w-4 h-4" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Register New Student</DialogTitle>
                <DialogDescription>Add an individual learner to the institutional roster.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Student ID Number</label>
                  <Input
                    placeholder="e.g. STU-1088"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Full Name</label>
                  <Input
                    placeholder="e.g. Alex Johnson"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="e.g. alex.j@student.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Grade Level</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(Number(e.target.value))}
                    aria-label="Student Grade Level"
                    className="w-full border rounded p-2 text-sm bg-white"
                  >
                    <option value={6}>Grade 6</option>
                    <option value={7}>Grade 7</option>
                    <option value={8}>Grade 8</option>
                    <option value={9}>Grade 9</option>
                  </select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button onClick={handleManualAddStudent}>Register Student</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cohort Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Enrolled</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalStudents}</p>
          </div>
        </Card>

        <Card className="p-4 bg-white shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-green-50 text-green-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Cohort Average GPA</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.averageGpa.toFixed(2)}</p>
          </div>
        </Card>

        <Card className="p-4 bg-white shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Avg. Attendance</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.averageAttendance}%</p>
          </div>
        </Card>

        <Card className="p-4 bg-white shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Active Learners</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.activeCount}</p>
          </div>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <CardTitle className="text-lg">Enrolled Roster Directory</CardTitle>
              <CardDescription>Filter by name, grade level, or enrollment status</CardDescription>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
                <Input
                  placeholder="Search student or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value ? Number(e.target.value) : '')}
                aria-label="Filter by Grade"
                className="h-9 text-xs border rounded px-2.5 bg-white text-gray-700"
              >
                <option value="">All Grades</option>
                <option value={6}>Grade 6</option>
                <option value={7}>Grade 7</option>
                <option value={8}>Grade 8</option>
                <option value={9}>Grade 9</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StudentStatus | '')}
                aria-label="Filter by Status"
                className="h-9 text-xs border rounded px-2.5 bg-white text-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Student ID</th>
                  <th className="p-3.5">Name & Email</th>
                  <th className="p-3.5">Grade</th>
                  <th className="p-3.5">Current GPA</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Course Enrollment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => {
                  const isEnrolledInCourse1 = student.enrolledCourseIds.includes(1);

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/70">
                      <td className="p-3.5 font-mono text-gray-700 font-semibold">{student.studentId}</td>
                      <td className="p-3.5">
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-gray-400 text-[11px]">{student.email}</p>
                      </td>
                      <td className="p-3.5 font-medium text-gray-700">Grade {student.gradeLevel}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-gray-900">{student.currentGpa.toFixed(2)}</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`font-semibold ${student.attendancePercentage < 85 ? 'text-red-600' : 'text-green-600'}`}>
                          {student.attendancePercentage}%
                        </span>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={student.status === 'active' ? 'default' : 'secondary'}
                          className={`text-[10px] uppercase font-semibold ${
                            student.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {student.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          variant={isEnrolledInCourse1 ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleToggleCourseEnrollment(student.id, 1)}
                          className={`text-xs h-7 gap-1 ${
                            isEnrolledInCourse1 ? 'text-gray-600' : 'bg-education-primary text-white'
                          }`}
                        >
                          <BookOpen className="w-3 h-3" />
                          {isEnrolledInCourse1 ? 'Enrolled' : 'Enroll'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      No students match the selected search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
