import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, Clock, Star, TrendingUp } from "lucide-react";

export default function InterviewPractice() {
  const practiceCategories = [
    {
      title: "Behavioral Questions",
      description: "Common behavioral interview questions",
      progress: 75,
      questionsCompleted: 15,
      totalQuestions: 20,
      difficulty: "Medium"
    },
    {
      title: "Technical Coding",
      description: "Programming and technical challenges",
      progress: 40,
      questionsCompleted: 8,
      totalQuestions: 20,
      difficulty: "Hard"
    },
    {
      title: "System Design",
      description: "Architecture and system design problems",
      progress: 20,
      questionsCompleted: 2,
      totalQuestions: 10,
      difficulty: "Hard"
    },
    {
      title: "Case Studies",
      description: "Business case analysis and problem solving",
      progress: 60,
      questionsCompleted: 6,
      totalQuestions: 10,
      difficulty: "Medium"
    }
  ];

  const recentSessions = [
    {
      title: "Tell me about yourself",
      category: "Behavioral",
      duration: "3:42",
      score: 85,
      date: "2 days ago"
    },
    {
      title: "Two Sum Problem",
      category: "Technical",
      duration: "12:15",
      score: 92,
      date: "1 week ago"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Interview Practice</h1>
        <p className="text-muted-foreground mt-2">
          Practice and improve your interview skills with AI-powered feedback
        </p>
      </div>

      {/* Practice Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {practiceCategories.map((category, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{category.title}</CardTitle>
                <Badge variant={category.difficulty === "Hard" ? "destructive" : "secondary"}>
                  {category.difficulty}
                </Badge>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{category.questionsCompleted}/{category.totalQuestions} completed</span>
                </div>
                <Progress value={category.progress} className="h-2" />
              </div>
              <Button className="w-full">
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Practice
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Recent Practice Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSessions.map((session, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{session.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Badge variant="outline" className="mr-2">{session.category}</Badge>
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {session.duration}
                    </span>
                    <span>{session.date}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-warning mr-1" />
                    <span className="font-medium">{session.score}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}