import React, { useState } from 'react';
import { AdminUser, UserAccountStatus } from '@/shared/types/admin';
import { UserRole } from '@/shared/types/auth';
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
  Search,
  UserPlus,
  Download,
  Shield,
  Trash2,
  CheckCircle2,
  Users,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserManagementTabProps {
  users: AdminUser[];
  onUsersChange: () => void;
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({
  users,
  onUsersChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserAccountStatus | 'all'>('all');

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newDepartment, setNewDepartment] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState<number>(8);

  // Delete User Dialog State
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  // Filtered users list
  const filteredUsers = AdminService.getUsers({
    searchTerm,
    role: roleFilter,
    status: statusFilter,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Calculate cohort distribution
  const studentCount = users.filter((u) => u.role === 'student').length;
  const instructorCount = users.filter((u) => u.role === 'instructor').length;
  const taCount = users.filter((u) => u.role === 'ta').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    try {
      AdminService.updateUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole.toUpperCase()} successfully.`);
      onUsersChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role.');
    }
  };

  const handleStatusChange = (userId: string, newStatus: UserAccountStatus) => {
    try {
      AdminService.updateUserStatus(userId, newStatus);
      toast.success(`Account status changed to ${newStatus}.`);
      onUsersChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error('Name and Email are required.');
      return;
    }

    try {
      AdminService.addUser({
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        status: 'active',
        department: newDepartment.trim() || 'General Studies',
        gradeLevel: newRole === 'student' ? newGradeLevel : undefined,
        enrolledCourseIds: [1],
      });

      toast.success(`User ${newName} registered successfully!`);
      setIsAddUserOpen(false);
      setNewName('');
      setNewEmail('');
      setNewDepartment('');
      onUsersChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creating user.');
    }
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    try {
      AdminService.deleteUser(userToDelete.id);
      toast.success(`User ${userToDelete.name} has been removed.`);
      setUserToDelete(null);
      onUsersChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user.');
    }
  };

  const handleExportCSV = () => {
    const csv = AdminService.exportUsersCSV(filteredUsers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gradeglow-users-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('User registry exported to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Role Counts Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border shadow-sm flex items-center gap-3">
          <div className="p-2 rounded bg-blue-50 text-blue-600">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Students</p>
            <p className="text-xl font-bold text-gray-900">{studentCount}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border shadow-sm flex items-center gap-3">
          <div className="p-2 rounded bg-purple-50 text-purple-600">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Instructors</p>
            <p className="text-xl font-bold text-gray-900">{instructorCount}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border shadow-sm flex items-center gap-3">
          <div className="p-2 rounded bg-teal-50 text-teal-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Teaching Assistants</p>
            <p className="text-xl font-bold text-gray-900">{taCount}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border shadow-sm flex items-center gap-3">
          <div className="p-2 rounded bg-rose-50 text-rose-600">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">System Admins</p>
            <p className="text-xl font-bold text-gray-900">{adminCount}</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                User Accounts & Access Directory
              </CardTitle>
              <CardDescription className="text-xs">
                Manage accounts, assign RBAC security roles, and control active credentials
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Export Users CSV
              </Button>

              {/* Add User Modal */}
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-xs bg-education-primary">
                    <UserPlus className="w-3.5 h-3.5" /> Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <form onSubmit={handleAddUserSubmit}>
                    <DialogHeader>
                      <DialogTitle>Add New Institutional Account</DialogTitle>
                      <DialogDescription>
                        Create a verified user account with assigned role and access boundaries.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3.5 py-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Full Name</label>
                        <Input
                          placeholder="e.g. Dr. Jordan Bell"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Institutional Email</label>
                        <Input
                          type="email"
                          placeholder="e.g. jordan.bell@institution.edu"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-700">Assigned Role</label>
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as UserRole)}
                            aria-label="New User Role"
                            className="w-full border rounded p-2 text-xs bg-white text-gray-800"
                          >
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="ta">Teaching Assistant (TA)</option>
                            <option value="admin">Administrator</option>
                            <option value="parent">Parent/Guardian</option>
                          </select>
                        </div>

                        {newRole === 'student' ? (
                          <div className="space-y-1">
                            <label className="font-semibold text-gray-700">Grade Level</label>
                            <select
                              value={newGradeLevel}
                              onChange={(e) => setNewGradeLevel(Number(e.target.value))}
                              aria-label="New User Grade Level"
                              className="w-full border rounded p-2 text-xs bg-white text-gray-800"
                            >
                              <option value={6}>Grade 6</option>
                              <option value={7}>Grade 7</option>
                              <option value={8}>Grade 8</option>
                              <option value={9}>Grade 9</option>
                              <option value={10}>Grade 10</option>
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="font-semibold text-gray-700">Department</label>
                            <Input
                              placeholder="e.g. Science"
                              value={newDepartment}
                              onChange={(e) => setNewDepartment(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsAddUserOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="gap-1.5 bg-education-primary">
                        <CheckCircle2 className="w-4 h-4" /> Save User
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
              <Input
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              aria-label="Filter by Role"
              className="h-9 text-xs border rounded px-2.5 bg-white text-gray-700 w-full sm:w-auto"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="instructor">Instructors</option>
              <option value="ta">TAs</option>
              <option value="admin">Administrators</option>
              <option value="parent">Parents</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserAccountStatus | 'all')}
              aria-label="Filter by Status"
              className="h-9 text-xs border rounded px-2.5 bg-white text-gray-700 w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Last Active</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-education-primary/10 text-education-primary font-bold flex items-center justify-center text-xs shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-gray-400 text-[11px] font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-gray-600">
                        {user.department || (user.gradeLevel ? `Grade ${user.gradeLevel}` : 'General')}
                      </td>

                      <td className="p-3.5">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          aria-label={`Change role for ${user.name}`}
                          className="text-xs border rounded px-2 py-1 bg-white font-medium text-gray-700"
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="ta">TA</option>
                          <option value="admin">Admin</option>
                          <option value="parent">Parent</option>
                        </select>
                      </td>

                      <td className="p-3.5">
                        <Badge
                          variant={user.status === 'active' ? 'default' : 'secondary'}
                          className={`text-[10px] uppercase font-semibold cursor-pointer ${
                            user.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : user.status === 'suspended'
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          onClick={() =>
                            handleStatusChange(
                              user.id,
                              user.status === 'active' ? 'suspended' : 'active'
                            )
                          }
                          title="Click to toggle status"
                        >
                          {user.status}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-gray-500 font-mono text-[11px]">
                        {user.lastActive}
                      </td>

                      <td className="p-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToDelete(user)}
                          aria-label={`Delete ${user.name}`}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      No accounts matched the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold text-gray-900">{userToDelete?.name}</span> ({userToDelete?.email})?
              This action cannot be undone and will revoke all course permissions immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
