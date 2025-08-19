import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Brain, Users, Target, Zap } from "lucide-react";

const workStyleQuestions = [
  {
    id: 1,
    question: "I prefer to work:",
    options: [
      "Independently with minimal supervision",
      "In close collaboration with team members",
      "With some guidance but room for autonomy",
      "In structured environments with clear direction"
    ]
  },
  {
    id: 2,
    question: "When facing a complex problem, I:",
    options: [
      "Break it down into smaller, manageable parts",
      "Brainstorm with colleagues for diverse perspectives",
      "Research extensively before taking action",
      "Jump in and learn through trial and error"
    ]
  },
  {
    id: 3,
    question: "My ideal work environment is:",
    options: [
      "Quiet and focused",
      "Dynamic and collaborative",
      "Flexible and adaptable",
      "Structured and organized"
    ]
  }
];

export default function WorkStyles() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [workStyleQuestions[currentQuestion].id]: value
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < workStyleQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const resetAssessment = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const workStyleResults = [
    {
      name: "Analytical Thinker",
      description: "You approach problems systematically and prefer data-driven decisions",
      icon: Brain,
      percentage: 85,
      color: "primary"
    },
    {
      name: "Collaborative Leader",
      description: "You excel in team environments and value diverse perspectives",
      icon: Users,
      percentage: 70,
      color: "secondary"
    },
    {
      name: "Goal-Oriented",
      description: "You are focused on achieving objectives and delivering results",
      icon: Target,
      percentage: 75,
      color: "accent"
    },
    {
      name: "Adaptable",
      description: "You thrive in changing environments and embrace new challenges",
      icon: Zap,
      percentage: 60,
      color: "muted"
    }
  ];

  if (showResults) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Work Style Results</h1>
          <p className="text-muted-foreground mt-2">
            Based on your responses, here's your personalized work style profile
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workStyleResults.map((style, index) => {
            const IconComponent = style.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{style.name}</CardTitle>
                      <CardDescription>{style.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Match Percentage</span>
                      <span className="font-medium">{style.percentage}%</span>
                    </div>
                    <Progress value={style.percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Based on your work style, here are some career suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Ideal Roles</h4>
                <div className="space-y-1">
                  <Badge variant="secondary">Data Analyst</Badge>
                  <Badge variant="secondary">Project Manager</Badge>
                  <Badge variant="secondary">Research Scientist</Badge>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Work Environment</h4>
                <div className="space-y-1">
                  <Badge variant="outline">Hybrid/Remote</Badge>
                  <Badge variant="outline">Collaborative Teams</Badge>
                  <Badge variant="outline">Data-Driven Culture</Badge>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Company Size</h4>
                <div className="space-y-1">
                  <Badge variant="outline">Medium (100-1000)</Badge>
                  <Badge variant="outline">Large (1000+)</Badge>
                </div>
              </div>
            </div>
            <Button onClick={resetAssessment} variant="outline" className="w-full">
              Retake Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Work Style Assessment</h1>
        <p className="text-muted-foreground mt-2">
          Discover your unique work style to find roles and environments where you'll thrive
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Question {currentQuestion + 1} of {workStyleQuestions.length}</CardTitle>
            <Progress 
              value={((currentQuestion + 1) / workStyleQuestions.length) * 100} 
              className="w-32 h-2" 
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <h3 className="text-xl font-medium">
            {workStyleQuestions[currentQuestion].question}
          </h3>
          
          <RadioGroup 
            value={answers[workStyleQuestions[currentQuestion].id] || ""} 
            onValueChange={handleAnswer}
          >
            {workStyleQuestions[currentQuestion].options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Button 
            onClick={nextQuestion} 
            disabled={!answers[workStyleQuestions[currentQuestion].id]}
            className="w-full"
          >
            {currentQuestion === workStyleQuestions.length - 1 ? "View Results" : "Next Question"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}