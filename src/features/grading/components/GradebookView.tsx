import React, { useState } from 'react';
import { GradingEngine } from '../lib/gradingEngine';
import { AssignmentScore, CategoryWeight, FinalGradeResult } from '@/shared/types/grading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { ReportCardModal } from './ReportCardModal';
import { Award, Calculator, FileText, TrendingUp } from 'lucide-react';

const INITIAL_ASSIGNMENTS: AssignmentScore[] = [
  { id: '1', title: 'Unit 1 Homework', category: 'homework', pointsEarned: 95, pointsPossible: 100 },
  { id: '2', title: 'Unit 2 Homework', category: 'homework', pointsEarned: 90, pointsPossible: 100 },
  { id: '3', title: 'Linear Equations Quiz', category: 'quiz', pointsEarned: 85, pointsPossible: 100 },
  { id: '4', title: 'Inequalities Checkpoint Quiz', category: 'quiz', pointsEarned: 88, pointsPossible: 100 },
  { id: '5', title: 'Midterm Examination', category: 'midterm', pointsEarned: 84, pointsPossible: 100 },
];

const WEIGHTS: CategoryWeight[] = [
  { category: 'homework', weightPercentage: 20 },
  { category: 'quiz', weightPercentage: 30 },
  { category: 'midterm', weightPercentage: 20 },
  { category: 'final_exam', weightPercentage: 30 },
];

export const GradebookView: React.FC = () => {
  const [hypotheticalFinalScore, setHypotheticalFinalScore] = useState<number>(90);
  const [isReportCardOpen, setIsReportCardOpen] = useState<boolean>(false);

  // Current grade without final exam
  const currentGradeResult: FinalGradeResult = GradingEngine.calculateWeightedFinalGrade(
    INITIAL_ASSIGNMENTS,
    WEIGHTS.filter((w) => w.category !== 'final_exam')
  );

  // Projected grade with What-If slider score for final exam
  const projectedAssignments: AssignmentScore[] = [
    ...INITIAL_ASSIGNMENTS,
    {
      id: 'hypothetical-final',
      title: 'Projected Final Exam',
      category: 'final_exam',
      pointsEarned: hypotheticalFinalScore,
      pointsPossible: 100,
    },
  ];

  const projectedGradeResult: FinalGradeResult = GradingEngine.calculateWeightedFinalGrade(
    projectedAssignments,
    WEIGHTS
  );

  // Multi-course grades for the report card
  const sampleReportCard = GradingEngine.generateReportCard(
    'STU-8821',
    'Jane Student',
    [
      projectedGradeResult,
      GradingEngine.calculateWeightedFinalGrade(
        [{ id: 'sci-1', title: 'Science Lab', category: 'midterm', pointsEarned: 92, pointsPossible: 100 }],
        [{ category: 'midterm', weightPercentage: 100 }],
        'STU-8821',
        2
      ),
      GradingEngine.calculateWeightedFinalGrade(
        [{ id: 'eng-1', title: 'Essay Portfolio', category: 'homework', pointsEarned: 88, pointsPossible: 100 }],
        [{ category: 'homework', weightPercentage: 100 }],
        'STU-8821',
        3
      ),
    ]
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      {/* GPA & Honors Banner */}
      <div className="bg-gradient-to-r from-education-primary to-blue-700 text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-6 h-6 text-yellow-300" />
            <span className="text-sm uppercase tracking-wider font-semibold opacity-90">
              Academic Standing: Dean's Honor Roll
            </span>
          </div>
          <h1 className="text-3xl font-bold">Student Gradebook & Analytics</h1>
          <p className="opacity-80 text-sm mt-1">Real-time GPA tracking, category weighting, and grade forecasting</p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
          <div>
            <p className="text-xs opacity-75">Cumulative GPA</p>
            <p className="text-3xl font-extrabold">{sampleReportCard.cumulativeGpa}</p>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsReportCardOpen(true)}
            className="gap-2 bg-white text-gray-900 hover:bg-gray-100"
          >
            <FileText className="w-4 h-4" /> View Report Card
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Grade Breakdown (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Mathematics Fundamentals</CardTitle>
                  <CardDescription>Syllabus Category Breakdown</CardDescription>
                </div>
                <div className="text-right">
                  <Badge className="text-base px-3 py-1 bg-education-primary">
                    {projectedGradeResult.letterGrade} ({projectedGradeResult.numericGrade}%)
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">GPA Point: {projectedGradeResult.gpaPoint.toFixed(1)}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-5">
              {WEIGHTS.map((weight) => {
                const catScore = projectedGradeResult.categoryScores[weight.category];
                const pct = catScore ? catScore.percentage : 0;
                const earned = catScore ? catScore.earned : 0;
                const possible = catScore ? catScore.possible : 0;

                return (
                  <div key={weight.category} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize text-gray-700">
                        {weight.category.replace('_', ' ')}{' '}
                        <span className="text-xs text-gray-400">({weight.weightPercentage}% of final grade)</span>
                      </span>
                      <span className="font-semibold text-gray-900">
                        {earned} / {possible} ({pct}%)
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Graded Assignments Table */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Recent Graded Assessments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 text-sm">
                {INITIAL_ASSIGNMENTS.map((assignment) => (
                  <div key={assignment.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{assignment.title}</p>
                      <span className="text-xs uppercase tracking-wider text-gray-500 font-mono">
                        {assignment.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {assignment.pointsEarned} / {assignment.pointsPossible}
                      </p>
                      <span className="text-xs text-green-600 font-semibold">
                        {Math.round((assignment.pointsEarned / assignment.pointsPossible) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Interactive "What-If" Calculator (1 col) */}
        <div className="space-y-6">
          <Card className="border-education-primary/30 shadow-md">
            <CardHeader className="bg-education-primary/5 border-b pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-education-primary" />
                <CardTitle className="text-lg">"What-If" Grade Simulator</CardTitle>
              </div>
              <CardDescription>
                Simulate your upcoming Final Exam score (30% weight) to see its impact on your final letter grade.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="hypothetical-final-slider" className="text-sm font-medium text-gray-700">Expected Final Exam Score</label>
                  <span className="font-bold text-lg text-education-primary font-mono">
                    {hypotheticalFinalScore}%
                  </span>
                </div>
                <Slider
                  id="hypothetical-final-slider"
                  value={[hypotheticalFinalScore]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val) => setHypotheticalFinalScore(val[0])}
                  className="py-2"
                />
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Standing:</span>
                  <span className="font-semibold text-gray-800">
                    {currentGradeResult.numericGrade}% ({currentGradeResult.letterGrade})
                  </span>
                </div>

                <div className="flex justify-between items-center border-t pt-2">
                  <div className="flex items-center gap-1.5 text-education-primary font-semibold text-sm">
                    <TrendingUp className="w-4 h-4" /> Projected Final Grade:
                  </div>
                  <span className="text-xl font-extrabold text-education-primary">
                    {projectedGradeResult.numericGrade}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Projected Letter Grade:</span>
                  <Badge variant="default" className="font-bold text-sm">
                    {projectedGradeResult.letterGrade} ({projectedGradeResult.gpaPoint.toFixed(1)} GPA)
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Official Report Card Modal */}
      <ReportCardModal
        isOpen={isReportCardOpen}
        onClose={() => setIsReportCardOpen(false)}
        reportCard={sampleReportCard}
      />
    </div>
  );
};
