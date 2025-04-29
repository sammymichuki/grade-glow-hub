
import { Card, CardContent } from "@/components/ui/card";

interface ActivityProps {
  id: number;
  type: 'completed' | 'started' | 'enrolled';
  course: string;
  lesson: string;
  date: string;
}

interface RecentActivityProps {
  activities: ActivityProps[];
}

const RecentActivity = ({ activities }: RecentActivityProps) => {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Your Recent Activity</h2>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {activities.map((activity) => (
              <li key={activity.id} className="p-4 flex items-start">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                  activity.type === 'completed' ? 'bg-green-100 text-green-600' :
                  activity.type === 'started' ? 'bg-blue-100 text-blue-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {activity.type === 'completed' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : activity.type === 'started' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">
                      {activity.type === 'completed' && 'Completed lesson'}
                      {activity.type === 'started' && 'Started lesson'}
                      {activity.type === 'enrolled' && 'Enrolled in course'}
                    </p>
                    <span className="text-sm text-gray-500">{activity.date}</span>
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">{activity.course}</span>
                    {activity.lesson && ` - ${activity.lesson}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
};

export default RecentActivity;
