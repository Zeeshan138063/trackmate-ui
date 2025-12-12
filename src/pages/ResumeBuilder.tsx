import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Download, Eye, Edit, Trash2, FileText } from "lucide-react";

const resumeTemplates = [
  {
    id: 1,
    name: "Professional",
    description: "Clean and modern design perfect for corporate roles",
    thumbnail: "/placeholder-template.jpg"
  },
  {
    id: 2,
    name: "Creative",
    description: "Colorful and unique layout for creative industries",
    thumbnail: "/placeholder-template.jpg"
  },
  {
    id: 3,
    name: "Minimal",
    description: "Simple and elegant design that highlights your content",
    thumbnail: "/placeholder-template.jpg"
  },
  {
    id: 4,
    name: "Technical",
    description: "Perfect for engineering and technical positions",
    thumbnail: "/placeholder-template.jpg"
  }
];

const savedResumes = [
  {
    id: 1,
    name: "Software Engineer Resume",
    template: "Professional",
    lastModified: "2 days ago",
    status: "Complete"
  },
  {
    id: 2,
    name: "Product Manager Resume",
    template: "Minimal",
    lastModified: "1 week ago",
    status: "Draft"
  },
  {
    id: 3,
    name: "Data Scientist Resume",
    template: "Technical",
    lastModified: "3 days ago",
    status: "Complete"
  }
];

export default function ResumeBuilder() {
  const [activeTab, setActiveTab] = useState("resumes");
  const [defaultResumeId, setDefaultResumeId] = useState<number>(1); // Default to the first one for now

  const handleSetDefault = (id: number) => {
    setDefaultResumeId(id);
    // In a real app, you would save this to local storage or backend
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resume Builder</h1>
        <p className="text-muted-foreground mt-2">
          Create professional resumes tailored to your target roles
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumes">My Resumes</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="builder">Resume Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="resumes" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Resumes</h2>
            <Button onClick={() => setActiveTab("templates")}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Resume
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedResumes.map((resume) => (
              <Card key={resume.id} className={`hover:shadow-md transition-shadow ${defaultResumeId === resume.id ? 'border-primary border-2' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{resume.name}</CardTitle>
                          {defaultResumeId === resume.id && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-0 text-xs">Default</Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center space-x-2 mt-1">
                          <span>{resume.template}</span>
                          <Badge variant={resume.status === "Complete" ? "default" : "secondary"}>
                            {resume.status}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Last modified: {resume.lastModified}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {defaultResumeId !== resume.id && (
                      <Button size="sm" variant="ghost" onClick={() => handleSetDefault(resume.id)}>
                        Set Default
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Choose a Template</h2>
            <p className="text-muted-foreground">
              Select a template that matches your industry and personal style
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resumeTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-[3/4] bg-muted rounded-t-lg flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Template Preview</p>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => setActiveTab("builder")}>
                    Use This Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Resume Builder</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">First Name</label>
                      <Input placeholder="John" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Last Name</label>
                      <Input placeholder="Doe" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input type="email" placeholder="john.doe@email.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Phone</label>
                    <Input placeholder="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <Input placeholder="San Francisco, CA" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Professional Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Write a compelling summary of your professional background and key achievements..."
                    rows={4}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Work Experience</CardTitle>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Job Title</label>
                        <Input placeholder="Software Engineer" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Company</label>
                        <Input placeholder="Tech Company Inc." />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Start Date</label>
                        <Input type="date" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">End Date</label>
                        <Input type="date" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea
                        placeholder="Describe your responsibilities and achievements..."
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Skills</CardTitle>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skill
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">React</Badge>
                    <Badge variant="secondary">TypeScript</Badge>
                    <Badge variant="secondary">Node.js</Badge>
                    <Badge variant="secondary">Python</Badge>
                    <Badge variant="secondary">AWS</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:sticky lg:top-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[8.5/11] bg-white border rounded-lg p-6 text-black">
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold">John Doe</h1>
                      <p className="text-gray-600">Software Engineer</p>
                      <p className="text-sm text-gray-500">john.doe@email.com | +1 (555) 123-4567 | San Francisco, CA</p>
                    </div>

                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-2 border-b">Professional Summary</h2>
                      <p className="text-sm text-gray-700">
                        Experienced software engineer with expertise in full-stack development...
                      </p>
                    </div>

                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-2 border-b">Experience</h2>
                      <div className="mb-3">
                        <h3 className="font-medium">Software Engineer</h3>
                        <p className="text-sm text-gray-600">Tech Company Inc. | 2022 - Present</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Developed and maintained web applications using React and Node.js...
                        </p>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold mb-2 border-b">Skills</h2>
                      <p className="text-sm text-gray-700">
                        React, TypeScript, Node.js, Python, AWS
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}