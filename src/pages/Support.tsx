import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageCircle, BookOpen, Video, Mail, Phone, Clock } from "lucide-react";

const faqItems = [
  {
    question: "How do I track my job applications?",
    answer: "You can track your job applications by navigating to the Trackers section. Add new jobs using the 'Add a New Job' button and update their status as you progress through the application process."
  },
  {
    question: "Can I export my resume to different formats?",
    answer: "Yes! Our Resume Builder supports exporting to PDF, Word, and other popular formats. You can also create multiple resume versions for different types of positions."
  },
  {
    question: "How does the Work Style assessment work?",
    answer: "The Work Style assessment analyzes your preferences and working patterns to provide personalized job recommendations and career insights. It takes about 10 minutes to complete."
  },
  {
    question: "Is my data secure and private?",
    answer: "Absolutely. We use industry-standard encryption and security measures to protect your personal information. Your data is never shared with third parties without your explicit consent."
  },
  {
    question: "How can I get better interview preparation?",
    answer: "Use our Interview Practice section to rehearse common questions, get AI-powered feedback, and track your improvement over time. We offer both behavioral and technical interview preparation."
  }
];

export default function Support() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Support Center</h1>
        <p className="text-muted-foreground mt-2">
          Get help with your job search and career development journey
        </p>
      </div>

      {/* Quick Help Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Live Chat</CardTitle>
                <CardDescription>Get instant help from our support team</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
              <Clock className="h-4 w-4" />
              <span>Available 9 AM - 6 PM PST</span>
            </div>
            <Button className="w-full">Start Chat</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Help Center</CardTitle>
                <CardDescription>Browse articles and guides</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
              <span>200+ helpful articles</span>
            </div>
            <Button variant="outline" className="w-full">Browse Articles</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Video className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Video Tutorials</CardTitle>
                <CardDescription>Watch step-by-step guides</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
              <span>50+ video tutorials</span>
            </div>
            <Button variant="outline" className="w-full">Watch Videos</Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Find quick answers to common questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>
            Can't find what you're looking for? Send us a message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input placeholder="Your full name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input type="email" placeholder="your@email.com" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Input placeholder="What can we help you with?" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea placeholder="Describe your issue or question..." rows={4} />
          </div>
          <Button className="w-full">Send Message</Button>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Other Ways to Reach Us</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-muted-foreground">support@tealhq.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Phone Support</p>
                <p className="text-muted-foreground">1-800-TEAL-HQ</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}