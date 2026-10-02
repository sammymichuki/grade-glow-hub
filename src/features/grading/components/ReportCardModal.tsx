import React from 'react';
import { StudentReportCard } from '@/shared/types/grading';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, Award } from 'lucide-react';

interface ReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportCard: StudentReportCard;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  isOpen,
  onClose,
  reportCard,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl print:p-0 print:border-none">
        <DialogHeader className="border-b pb-4 text-center sm:text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-8 h-8 text-education-primary" />
              <div>
                <DialogTitle className="text-2xl font-bold">Grade Glow Hub</DialogTitle>
                <DialogDescription>Official Academic Transcript & Report Card</DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              Verified Transcript
            </Badge>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Student metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-gray-50 border text-sm">
            <div>
              <p className="text-gray-500 text-xs">Student Name</p>
              <p className="font-semibold text-gray-900">{reportCard.studentName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Student ID</p>
              <p className="font-semibold text-gray-900">{reportCard.studentId}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Academic Term</p>
              <p className="font-semibold text-gray-900">{reportCard.term} ({reportCard.academicYear})</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Cumulative GPA</p>
              <p className="font-bold text-education-primary text-base">{reportCard.cumulativeGpa} / 4.0</p>
            </div>
          </div>

          {/* Grades Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3">Course</th>
                  <th className="p-3 text-center">Score</th>
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3 text-center">GPA Point</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportCard.courseGrades.map((cg, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">Course #{cg.courseId}</td>
                    <td className="p-3 text-center">{cg.numericGrade}%</td>
                    <td className="p-3 text-center font-bold text-education-primary">{cg.letterGrade}</td>
                    <td className="p-3 text-center font-mono">{cg.gpaPoint.toFixed(1)}</td>
                    <td className="p-3 text-center">
                      <Badge variant={cg.passed ? 'default' : 'destructive'} className="text-xs">
                        {cg.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
            <span>Total Credits Earned: {reportCard.totalCredits}</span>
            <span>Issued: {new Date(reportCard.generatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <DialogFooter className="print:hidden border-t pt-4 flex sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
