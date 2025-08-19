
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Briefcase, Users, FileText, MessageSquare } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Welcome to Job Tracker
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Organize your job search, track applications, and land your dream job with our comprehensive job tracking platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/trackers")}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Job Tracker
              </CardTitle>
              <CardDescription>
                Keep track of all your job applications in one organized place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Job Applications</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/resume")}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Resume Builder
              </CardTitle>
              <CardDescription>
                Create professional resumes tailored to your target positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">Build Resume</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/interview")}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Interview Practice
              </CardTitle>
              <CardDescription>
                Prepare for interviews with practice questions and tips
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">Practice Interviews</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/work-styles")}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Work Styles
              </CardTitle>
              <CardDescription>
                Discover your work style and find matching opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">Assess Work Style</Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" onClick={() => navigate("/trackers")}>
            Get Started with Job Tracking
          </Button>
        </div>
      </div>
    </div>
  );
}
