
import { useAuth } from "@/contexts/AuthContext";

const DashboardHeader = () => {
  const { user } = useAuth();

  return (
    <div className="bg-education-primary/10 py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name || 'Student'}!</p>
      </div>
    </div>
  );
};

export default DashboardHeader;
