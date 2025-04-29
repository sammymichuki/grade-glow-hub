
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const StudyGoals = () => {
  return (
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
  );
};

export default StudyGoals;
