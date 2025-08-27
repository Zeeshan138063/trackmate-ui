import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, FileDigit, LayoutTemplate, FilePenLine } from "lucide-react";

interface ResumeListItem {
  id: string;
  name: string;
  lastModified: string;
  template: string;
  status: "Draft" | "Complete";
}

const recentResumes: ResumeListItem[] = [
  { id: "1", name: "Zeeshan (Python Django FastAPI AI ML Automation)", lastModified: "Edited: 08/19/2025", template: "Professional", status: "Complete" },
  { id: "2", name: "Zeeshan (Python Django FastAPI AI ML Automation) copy", lastModified: "Edited: 07/19/2025", template: "Technical", status: "Draft" },
  { id: "3", name: "Python FastAPI Django copy", lastModified: "Edited: 07/18/2025", template: "Minimal", status: "Draft" }
];

export default function ResumeLanding() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resume Builder</h1>
        <p className="text-muted-foreground mt-2">Create a new resume or continue editing an existing one.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate("/resume/new")}> 
          <CardHeader>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">New Resume</CardTitle>
            <CardDescription>Create from scratch</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md">
          <CardHeader>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <FileDigit className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Start from job description</CardTitle>
            <CardDescription>Paste a JD to tailor content</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate("/resume/new?from=template")}> 
          <CardHeader>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <LayoutTemplate className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Start from template</CardTitle>
            <CardDescription>Pick a preset layout</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md">
          <CardHeader>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <FilePenLine className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">New Cover Letter</CardTitle>
            <CardDescription>Create and tailor a cover letter</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Resumes</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Sort</Button>
            <Button variant="ghost" size="sm">Filter</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentResumes.map((resume) => (
            <Card key={resume.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/resume/${resume.id}`)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg line-clamp-2">{resume.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{resume.template}</span>
                        <Badge variant={resume.status === "Complete" ? "default" : "secondary"}>{resume.status}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{resume.lastModified}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


