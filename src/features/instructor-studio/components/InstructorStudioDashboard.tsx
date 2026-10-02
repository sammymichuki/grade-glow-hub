import React, { useState } from 'react';
import { CourseBuilderStudio } from './CourseBuilderStudio';
import { RubricReviewerDrawer } from './RubricReviewerDrawer';
import { StudentRosterManager } from './StudentRosterManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, FileCheck, Users } from 'lucide-react';

export const InstructorStudioDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('curriculum');

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-between items-center border-b pb-3">
          <TabsList className="bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="curriculum" className="gap-2 text-xs md:text-sm">
              <Layers className="w-4 h-4" /> Curriculum Studio
            </TabsTrigger>
            <TabsTrigger value="rubrics" className="gap-2 text-xs md:text-sm">
              <FileCheck className="w-4 h-4" /> Grading & Rubrics
            </TabsTrigger>
            <TabsTrigger value="roster" className="gap-2 text-xs md:text-sm">
              <Users className="w-4 h-4" /> Student Rostering
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="curriculum" className="mt-0 focus-visible:outline-none">
          <CourseBuilderStudio />
        </TabsContent>

        <TabsContent value="rubrics" className="mt-0 focus-visible:outline-none">
          <RubricReviewerDrawer />
        </TabsContent>

        <TabsContent value="roster" className="mt-0 focus-visible:outline-none">
          <StudentRosterManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
