import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { Target, TrendingUp, Users, Calendar } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome to Your Job Tracker
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your job applications, track your progress, and land your dream job.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-primary mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-foreground">5</h3>
                <p className="text-sm text-muted-foreground">Active Applications</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-success mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-foreground">1</h3>
                <p className="text-sm text-muted-foreground">Interviews This Week</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-info mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-foreground">3</h3>
                <p className="text-sm text-muted-foreground">Companies</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-warning mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-foreground">2</h3>
                <p className="text-sm text-muted-foreground">Follow-ups Due</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <NavLink to="/trackers">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <Target className="h-5 w-5 mr-2" />
              Go to Job Tracker
            </Button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Index;
