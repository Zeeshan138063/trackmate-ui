import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lightbulb, Target, TrendingUp, Users } from "lucide-react";

const strategies = [
    {
        title: "Phase 1: Self-Audit & Targeting",
        description: "Define your precise role, target companies, and unique value proposition.",
        steps: [
            "Select 3-5 target job titles.",
            "List 20 'Dream Companies' in your niche.",
            "Update your LinkedIn 'About' section with keywords.",
        ],
        icon: Target,
        color: "text-blue-500",
    },
    {
        title: "Phase 2: Networking Mastery",
        description: "80% of roles are filled through the 'Hidden Job Market'.",
        steps: [
            "Connect with 5 people at your Dream Companies.",
            "Ask for 2 informational interviews per week.",
            "Engage with target company social posts.",
        ],
        icon: Users,
        color: "text-purple-500",
    },
    {
        title: "Phase 3: Application Optimization",
        description: "Quality over quantity. Use AI to tailor every application.",
        steps: [
            "Use CareerPilot AI Copilot for resume tailoring.",
            "Write unique cover letters for Top 10 roles.",
            "Submit applications within 48 hours of posting.",
        ],
        icon: TrendingUp,
        color: "text-green-500",
    },
    {
        title: "Phase 4: Interview Domination",
        description: "Practice makes perfect. Review your feedback loops.",
        steps: [
            "Record mock interviews for tricky questions.",
            "Review past interview feedback in CareerPilot AI.",
            "Prepare 3 STAR-method stories per role.",
        ],
        icon: CheckCircle2,
        color: "text-orange-500",
    },
];

const StrategyGuide = () => {
    return (
        <div className="space-y-8 animate-fade-in p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Job Search Strategy Guide</h1>
                <p className="text-muted-foreground text-lg">
                    Follow this blueprint to accelerate your job search and land higher-quality offers.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {strategies.map((strategy, index) => (
                    <Card key={index} className="border-none bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg bg-background/50 ${strategy.color}`}>
                                    <strategy.icon size={24} />
                                </div>
                                <Badge variant="outline" className="ml-auto">Phase {index + 1}</Badge>
                            </div>
                            <CardTitle>{strategy.title}</CardTitle>
                            <CardDescription>{strategy.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {strategy.steps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                        <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-500 shrink-0" />
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="text-indigo-500" />
                        Pro Tip: The Power of Consistency
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        A job search is a marathon, not a sprint. Setting a daily goal of 2 high-quality applications
                        and 3 networking messages is significantly more effective than applying to 50 jobs once a week.
                        Use the **Trackers** section to keep your pipeline moving!
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default StrategyGuide;
