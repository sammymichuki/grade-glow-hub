
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const StudyReminders = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Reminders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
          <div>
            <p className="font-medium">Algebra Quiz</p>
            <p className="text-sm text-gray-500">Tomorrow, 3:00 PM</p>
          </div>
          <Button variant="ghost" size="sm">Edit</Button>
        </div>
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
          <div>
            <p className="font-medium">Biology Lesson</p>
            <p className="text-sm text-gray-500">Friday, 4:30 PM</p>
          </div>
          <Button variant="ghost" size="sm">Edit</Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">Add Reminder</Button>
      </CardFooter>
    </Card>
  );
};

export default StudyReminders;
