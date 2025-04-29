
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const LearningStats = () => {
  return (
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
  );
};

export default LearningStats;
