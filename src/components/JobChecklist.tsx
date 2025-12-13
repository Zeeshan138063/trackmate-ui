
import { useState, useMemo } from "react";
import { ChecklistSection, JobChecklist as JobChecklistType } from "@/types/job";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";

interface JobChecklistProps {
    checklist: JobChecklistType;
    onToggle: (id: string, checked: boolean) => void;
}

const CHECKLIST_SECTIONS: ChecklistSection[] = [
    {
        id: "bookmarked",
        title: "Bookmarked",
        items: [
            { id: "aligns_interests", label: "Check if the job description aligns with your interests and values" },
            { id: "review_skills", label: "Review the highlighted skills to see if the role is a good fit" },
            { id: "research_excitement", label: "Research the company or role and mark your excitement level" },
        ],
    },
    {
        id: "applying",
        title: "Applying",
        items: [
            { id: "research_contact", label: "Find and research someone who works at the company and add as a contact" },
            { id: "info_interview", label: "Set up an informational interview to learn more about the role / company" },
            { id: "identify_referrals", label: "Identify potential referrals to help get your application on the top of the pile" },
            { id: "customize_achievements", label: "Customize your work achievements using the job description keywords" },
            { id: "submit_application", label: "Submit your application on the company website if possible" },
        ],
    },
    {
        id: "applied",
        title: "Applied",
        items: [
            { id: "reach_out_recruiter", label: "Reach out to the hiring manager or recruiter" },
            { id: "follow_up_weekly", label: "Follow up on your application via email weekly" },
            { id: "save_similar_jobs", label: "Continue identifying and saving similar job opportunities" },
            { id: "networking_calls", label: "Set up weekly networking calls to explore similar companies / roles" },
        ],
    },
    {
        id: "interviewing",
        title: "Interviewing",
        items: [
            { id: "prepare_blurb", label: "Prepare your blurb or “tell me about yourself” response" },
            { id: "practice_behavioral", label: "Practice answering behavioral interview questions" },
            { id: "research_interviewers", label: "Research the company and your interviewers" },
            { id: "setup_virtual_space", label: "Set up your virtual interview space and test your tech" },
            { id: "send_thank_you", label: "Send thank you emails within 24 hours" },
        ],
    },
    {
        id: "negotiating",
        title: "Negotiating",
        items: [
            { id: "research_market_value", label: "Research your market value and know your numbers" },
            { id: "prepare_negotiation", label: "Prepare your negotiation scripts" },
            { id: "evaluate_offer", label: "Evaluate your offer and decline or accept" },
        ],
    },
    {
        id: "accepted",
        title: "Accepted",
        items: [
            { id: "plan_resignation", label: "Plan your resignation if applicable" },
            { id: "relax_recharge", label: "Take some time to relax and recharge" },
            { id: "prepare_onboarding", label: "Prepare for your first day of onboarding" },
        ],
    },
];

export function JobChecklist({ checklist, onToggle }: JobChecklistProps) {
    // Calculate overall progress
    const totalItems = CHECKLIST_SECTIONS.reduce((acc, section) => acc + section.items.length, 0);
    const checkedItems = Object.values(checklist).filter(Boolean).length;
    const overallProgress = Math.round((checkedItems / totalItems) * 100);

    // Helper to calculate section progress
    const getSectionProgress = (section: ChecklistSection) => {
        const total = section.items.length;
        const checked = section.items.filter(item => checklist[item.id]).length;
        return { total, checked, percentage: Math.round((checked / total) * 100) };
    };

    return (
        <div className="space-y-6">
            {/* Guidance Header */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-sm">Overall Progress</h3>
                    </div>
                    <span className="text-sm font-bold text-primary">{overallProgress}% Complete</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
            </div>

            <Accordion type="multiple" defaultValue={["bookmarked"]} className="w-full space-y-4">
                {CHECKLIST_SECTIONS.map((section) => {
                    const { checked, total, percentage } = getSectionProgress(section);
                    const isComplete = checked === total;

                    return (
                        <AccordionItem
                            key={section.id}
                            value={section.id}
                            className="border rounded-lg px-4 bg-card shadow-sm data-[state=open]:ring-1 data-[state=open]:ring-primary/20 transition-all"
                        >
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-4 w-full pr-4">
                                    <div className={cn(
                                        "flex flex-col items-start text-left flex-1"
                                    )}>
                                        <span className="font-semibold text-lg uppercase tracking-wide text-foreground/80">
                                            {section.title}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-normal mt-0.5">
                                            {checked} of {total} completed
                                        </span>
                                    </div>

                                    {/* Progress Indicator */}
                                    <div className="flex items-center gap-3">
                                        <div className="hidden sm:block w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full transition-all duration-500 will-change-[width]", isComplete ? "bg-green-500" : "bg-primary")}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        {isComplete ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                                        )}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 pt-1">
                                <div className="space-y-3 pl-1">
                                    {section.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "flex items-start gap-3 p-2 rounded-md transition-colors",
                                                checklist[item.id] ? "bg-primary/5" : "hover:bg-muted/50"
                                            )}
                                        >
                                            <Checkbox
                                                id={item.id}
                                                checked={!!checklist[item.id]}
                                                onCheckedChange={(checked) => onToggle(item.id, checked as boolean)}
                                                className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                            <label
                                                htmlFor={item.id}
                                                className={cn(
                                                    "text-sm leading-tight cursor-pointer select-none",
                                                    checklist[item.id] ? "text-muted-foreground line-through" : "text-foreground"
                                                )}
                                            >
                                                {item.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    );
}
