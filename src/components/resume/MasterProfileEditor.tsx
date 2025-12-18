import { useState, useEffect, useCallback } from "react";
import { MasterProfile } from "@/types/resume";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Plus, Trash2, User, Briefcase, FileText, GraduationCap,
    Code2, Award, Trophy, HeartHandshake, BookOpen,
    FolderGit2, Layers, CheckCircle2, Save, Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import _ from 'lodash';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { ResumeImporter } from "./ResumeImporter";

interface MasterProfileEditorProps {
    profile: MasterProfile;
    resumeId: string | null;
    onSave: (profile: MasterProfile) => void;
    onLiveUpdate?: (profile: MasterProfile) => void;
    isSaving: boolean;
}

export function MasterProfileEditor({ profile, resumeId, onSave, onLiveUpdate, isSaving }: MasterProfileEditorProps) {
    const [formData, setFormData] = useState<MasterProfile>(profile);

    // Only set form data if it's the FIRST load of a non-empty profile (or we were ensuring initial state)
    // OR if the ID changes (switching resumes). 
    // We track the loaded ID to prevent overwriting local edits with stale server data.
    const [loadedId, setLoadedId] = useState<string | null>(null);

    useEffect(() => {
        // If the resume ID changes (user switched resumes), we MUST load the new data.
        if (resumeId && resumeId !== loadedId) {
            setFormData(profile);
            setLoadedId(resumeId);
        }
        // Initial load case: we have no loadedId, and profile exists.
        else if (!loadedId && resumeId) {
            setFormData(profile);
            setLoadedId(resumeId);
        }
    }, [resumeId, loadedId, profile]);

    const debouncedSave = useCallback(_.debounce((data: MasterProfile) => {
        onSave(data);
    }, 1000), [onSave]);

    const updateState = (newData: MasterProfile) => {
        setFormData(newData);
        if (onLiveUpdate) {
            onLiveUpdate(newData);
        }
        debouncedSave(newData);
    }

    const handleChange = (section: keyof MasterProfile, value: any) => {
        const newData = { ...formData, [section]: value };
        updateState(newData);
    };

    const handleNestedChange = (section: keyof MasterProfile, field: string, value: string) => {
        const newData = {
            ...formData,
            [section]: {
                ...(formData[section] as any),
                [field]: value
            }
        };
        updateState(newData);
    };

    return (
        <div className="grid gap-6" onBlur={() => debouncedSave.flush()}>
            <Accordion type="multiple" defaultValue={["contact", "summary"]} className="w-full space-y-4">

                {/* 1. Contact Information */}
                <AccordionItem value="contact" className="border rounded-lg bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Contact Information</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input value={formData.contact.firstName} onChange={(e) => handleNestedChange('contact', 'firstName', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input value={formData.contact.lastName} onChange={(e) => handleNestedChange('contact', 'lastName', e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={formData.contact.email} onChange={(e) => handleNestedChange('contact', 'email', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input value={formData.contact.phone} onChange={(e) => handleNestedChange('contact', 'phone', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input value={formData.contact.location} onChange={(e) => handleNestedChange('contact', 'location', e.target.value)} placeholder="City, State" />
                        </div>
                        <div className="grid grid-cols-3 gap-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">LinkedIn URL</Label>
                                <Input value={formData.contact.linkedin || ''} onChange={(e) => handleNestedChange('contact', 'linkedin', e.target.value)} placeholder="linkedin.com/in/..." className="h-8 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">GitHub URL</Label>
                                <Input value={formData.contact.github || ''} onChange={(e) => handleNestedChange('contact', 'github', e.target.value)} placeholder="github.com/..." className="h-8 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Portfolio URL</Label>
                                <Input value={formData.contact.portfolio || ''} onChange={(e) => handleNestedChange('contact', 'portfolio', e.target.value)} placeholder="your-site.com" className="h-8 text-sm" />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 2. Target Title */}
                <AccordionItem value="title" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <Briefcase className="h-4 w-4 text-primary/70" />
                            <span className="font-semibold">Target Job Title</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6">
                        <div className="space-y-2">
                            <Label>Target Role</Label>
                            <Input value={formData.targetTitle} onChange={(e) => handleChange('targetTitle', e.target.value)} placeholder="e.g. Senior Software Engineer" className="bg-muted/30 text-lg" />
                            <p className="text-[0.8rem] text-muted-foreground">This helps AI tailor your summary to the role you want.</p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 3. Professional Summary */}
                <AccordionItem value="summary" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-primary/70" />
                            <span className="font-semibold">Professional Summary</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6">
                        <div className="space-y-2">
                            <Textarea
                                value={formData.summary}
                                onChange={(e) => handleChange('summary', e.target.value)}
                                placeholder="Experienced software engineer with a focus on..."
                                className="min-h-[150px] bg-muted/30 leading-relaxed resize-none"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">Your default summary. The AI will rewrite this to match specific job descriptions.</p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 4. Experience */}
                <AccordionItem value="experience" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <Briefcase className="h-4 w-4 text-primary/70" />
                            <span className="font-semibold">Work Experience</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4">
                        {formData.experience.map((exp, index) => (
                            <div key={exp.id || index} className="group relative border rounded-lg p-5 bg-card hover:border-primary/50 transition-colors space-y-4 shadow-sm">
                                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        const newExp = formData.experience.filter((_, i) => i !== index);
                                        handleChange('experience', newExp);
                                    }} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Company</Label>
                                        <Input value={exp.company} onChange={(e) => {
                                            const newExp = [...formData.experience];
                                            newExp[index] = { ...exp, company: e.target.value };
                                            handleChange('experience', newExp);
                                        }} className="font-semibold bg-muted/30" placeholder="Company Name" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Position</Label>
                                        <Input value={exp.position} onChange={(e) => {
                                            const newExp = [...formData.experience];
                                            newExp[index] = { ...exp, position: e.target.value };
                                            handleChange('experience', newExp);
                                        }} className="bg-muted/30" placeholder="Job Title" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Location</Label>
                                        <Input value={exp.location} onChange={(e) => {
                                            const newExp = [...formData.experience];
                                            newExp[index] = { ...exp, location: e.target.value };
                                            handleChange('experience', newExp);
                                        }} placeholder="City, State" className="h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Start</Label>
                                        <Input value={exp.startDate} onChange={(e) => {
                                            const newExp = [...formData.experience];
                                            newExp[index] = { ...exp, startDate: e.target.value };
                                            handleChange('experience', newExp);
                                        }} placeholder="MM/YYYY" className="h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">End</Label>
                                        <Input value={exp.endDate || ''} onChange={(e) => {
                                            const newExp = [...formData.experience];
                                            newExp[index] = { ...exp, endDate: e.target.value };
                                            handleChange('experience', newExp);
                                        }} placeholder="Present" className="h-9" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Description (Bullet Points)</Label>
                                    <Textarea value={exp.description} onChange={(e) => {
                                        const newExp = [...formData.experience];
                                        newExp[index] = { ...exp, description: e.target.value };
                                        handleChange('experience', newExp);
                                    }} className="min-h-[120px] bg-muted/30 font-mono text-sm" placeholder="• Achieved X by doing Y..." />
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" className="w-full border-dashed py-6 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" onClick={() => {
                            handleChange('experience', [...formData.experience, { id: crypto.randomUUID(), company: "", position: "", location: "", startDate: "", current: false, description: "" }]);
                        }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Work Experience
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 9. Projects */}
                <AccordionItem value="projects" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <FolderGit2 className="h-4 w-4 text-primary/70" />
                            <span className="font-semibold">Projects</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4">
                        <DragDropContext onDragEnd={(result) => {
                            if (!result.destination) return;
                            const items = Array.from(formData.projects);
                            const [reorderedItem] = items.splice(result.source.index, 1);
                            items.splice(result.destination.index, 0, reorderedItem);
                            handleChange('projects', items);
                        }}>
                            <Droppable droppableId="projects">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                        {formData.projects.map((proj, index) => (
                                            <Draggable key={proj.id || index} draggableId={proj.id || `proj-${index}`} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className="group relative border rounded-lg p-5 bg-card hover:border-primary/50 transition-colors space-y-4 shadow-sm"
                                                    >
                                                        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                            <div {...provided.dragHandleProps} className="cursor-grab p-1 hover:bg-muted rounded">
                                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <Button variant="ghost" size="icon" onClick={() => {
                                                                const newProj = formData.projects.filter((_, i) => i !== index);
                                                                handleChange('projects', newProj);
                                                            }} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs text-muted-foreground">Project Name</Label>
                                                                <Input value={proj.name} onChange={(e) => {
                                                                    const newProj = [...formData.projects];
                                                                    newProj[index] = { ...proj, name: e.target.value };
                                                                    handleChange('projects', newProj);
                                                                }} placeholder="Project Name" className="font-semibold bg-muted/30" />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs text-muted-foreground">Technologies</Label>
                                                                <Input value={proj.technologies} onChange={(e) => {
                                                                    const newProj = [...formData.projects];
                                                                    newProj[index] = { ...proj, technologies: e.target.value };
                                                                    handleChange('projects', newProj);
                                                                }} placeholder="React, Node.js..." className="bg-muted/30" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-muted-foreground">Description</Label>
                                                            <Textarea value={proj.description} onChange={(e) => {
                                                                const newProj = [...formData.projects];
                                                                newProj[index] = { ...proj, description: e.target.value };
                                                                handleChange('projects', newProj);
                                                            }} placeholder="Description..." className="bg-muted/30 min-h-[80px]" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs text-muted-foreground">Link (Optional)</Label>
                                                            <Input value={proj.link || ''} onChange={(e) => {
                                                                const newProj = [...formData.projects];
                                                                newProj[index] = { ...proj, link: e.target.value };
                                                                handleChange('projects', newProj);
                                                            }} placeholder="https://..." className="h-8 text-sm" />
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                        <Button variant="outline" className="w-full border-dashed py-6 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" onClick={() => {
                            handleChange('projects', [...formData.projects, { id: crypto.randomUUID(), name: "", technologies: "", description: "" }]);
                        }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Project
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 5. Education */}
                <AccordionItem value="education" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="h-4 w-4 text-primary/70" />
                            <span className="font-semibold">Education</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4">
                        {formData.education.map((edu, index) => (
                            <div key={edu.id || index} className="group relative border rounded-lg p-5 bg-card hover:border-primary/50 transition-colors space-y-4 shadow-sm">
                                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        const newEdu = formData.education.filter((_, i) => i !== index);
                                        handleChange('education', newEdu);
                                    }} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">School/University</Label>
                                        <Input value={edu.school} onChange={(e) => {
                                            const newEdu = [...formData.education];
                                            newEdu[index] = { ...edu, school: e.target.value };
                                            handleChange('education', newEdu);
                                        }} placeholder="School" className="font-semibold bg-muted/30" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Degree & Major</Label>
                                        <Input value={edu.degree} onChange={(e) => {
                                            const newEdu = [...formData.education];
                                            newEdu[index] = { ...edu, degree: e.target.value };
                                            handleChange('education', newEdu);
                                        }} placeholder="Degree (e.g. BS CS)" className="bg-muted/30" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Start Year</Label>
                                        <Input value={edu.startDate} onChange={(e) => {
                                            const newEdu = [...formData.education];
                                            newEdu[index] = { ...edu, startDate: e.target.value };
                                            handleChange('education', newEdu);
                                        }} placeholder="YYYY" className="h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">End Year</Label>
                                        <Input value={edu.endDate} onChange={(e) => {
                                            const newEdu = [...formData.education];
                                            newEdu[index] = { ...edu, endDate: e.target.value };
                                            handleChange('education', newEdu);
                                        }} placeholder="YYYY" className="h-9" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" className="w-full border-dashed py-6 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" onClick={() => {
                            handleChange('education', [...formData.education, { id: crypto.randomUUID(), school: "", degree: "", field: "", location: "", startDate: "", endDate: "" }]);
                        }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Education
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 6. Skills */}
                <AccordionItem value="skills" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <Code2 className="h-4 w-4 text-primary/70" />
                            <span className="font-semibold">Skills & Interests</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6">
                        <div className="space-y-3">
                            {formData.skills.map((skill, index) => (
                                <div key={skill.id || index} className="flex gap-3 items-center group">
                                    <div className="w-1/3 space-y-1">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Category</Label>
                                        <Input value={skill.category} onChange={(e) => {
                                            const newSkills = [...formData.skills];
                                            newSkills[index] = { ...skill, category: e.target.value };
                                            handleChange('skills', newSkills);
                                        }} placeholder="e.g. Languages" className="h-9 bg-muted/30" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Skills</Label>
                                        <Input value={skill.items} onChange={(e) => {
                                            const newSkills = [...formData.skills];
                                            newSkills[index] = { ...skill, items: e.target.value };
                                            handleChange('skills', newSkills);
                                        }} placeholder="React, TypeScript, Python..." className="h-9 bg-muted/30" />
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 mt-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={() => {
                                        const newSkills = formData.skills.filter((_, i) => i !== index);
                                        handleChange('skills', newSkills);
                                    }}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" className="mt-4 w-full border-dashed hover:bg-muted/50 transition-all" onClick={() => {
                            handleChange('skills', [...formData.skills, { id: crypto.randomUUID(), category: "", items: "" }]);
                        }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Skill Category
                        </Button>

                        <div className="mt-8 pt-6 border-t space-y-2">
                            <Label>Interests</Label>
                            <Textarea value={formData.interests || ""} onChange={(e) => handleChange('interests', e.target.value)} placeholder="Hobbies, Volunteering..." className="bg-muted/30 min-h-[80px]" />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 7. Certifications */}
                <AccordionItem value="certifications" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <Award className="h-4 w-4 text-primary/70" />
                            <span className="font-semibold">Certifications</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4">
                        {formData.certifications.map((cert, index) => (
                            <div key={cert.id || index} className="flex gap-3 items-end group border-b pb-4 last:border-0 last:pb-0">
                                <div className="grid grid-cols-3 gap-3 flex-1">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Name</Label>
                                        <Input value={cert.name} onChange={(e) => {
                                            const newCerts = [...formData.certifications];
                                            newCerts[index] = { ...cert, name: e.target.value };
                                            handleChange('certifications', newCerts);
                                        }} placeholder="AWS SAA" className="h-9 bg-muted/30" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Issuer</Label>
                                        <Input value={cert.issuer} onChange={(e) => {
                                            const newCerts = [...formData.certifications];
                                            newCerts[index] = { ...cert, issuer: e.target.value };
                                            handleChange('certifications', newCerts);
                                        }} placeholder="Amazon" className="h-9 bg-muted/30" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Date</Label>
                                        <Input value={cert.date} onChange={(e) => {
                                            const newCerts = [...formData.certifications];
                                            newCerts[index] = { ...cert, date: e.target.value };
                                            handleChange('certifications', newCerts);
                                        }} placeholder="2024" className="h-9 bg-muted/30" />
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="h-9 w-9 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => {
                                    const newCerts = formData.certifications.filter((_, i) => i !== index);
                                    handleChange('certifications', newCerts);
                                }}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full border-dashed mt-2 hover:bg-muted/50 transition-all" onClick={() => {
                            handleChange('certifications', [...formData.certifications, { id: crypto.randomUUID(), name: "", issuer: "", date: "" }]);
                        }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Certification
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 8. Awards */}
                <AccordionItem value="awards" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <Trophy className="h-4 w-4 text-primary/70" />
                            <span className="font-semibold">Awards & Scholarships</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4">
                        {formData.awards.map((award, index) => (
                            <div key={award.id || index} className="flex gap-3 items-end group border-b pb-4 last:border-0 last:pb-0">
                                <div className="grid grid-cols-3 gap-3 flex-1">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Title</Label>
                                        <Input value={award.title} onChange={(e) => {
                                            const newAwards = [...formData.awards];
                                            newAwards[index] = { ...award, title: e.target.value };
                                            handleChange('awards', newAwards);
                                        }} placeholder="Dean's List" className="h-9 bg-muted/30" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Issuer</Label>
                                        <Input value={award.issuer} onChange={(e) => {
                                            const newAwards = [...formData.awards];
                                            newAwards[index] = { ...award, issuer: e.target.value };
                                            handleChange('awards', newAwards);
                                        }} placeholder="University" className="h-9 bg-muted/30" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Date</Label>
                                        <Input value={award.date} onChange={(e) => {
                                            const newAwards = [...formData.awards];
                                            newAwards[index] = { ...award, date: e.target.value };
                                            handleChange('awards', newAwards);
                                        }} placeholder="2023" className="h-9 bg-muted/30" />
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="h-9 w-9 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => {
                                    const newAwards = formData.awards.filter((_, i) => i !== index);
                                    handleChange('awards', newAwards);
                                }}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full border-dashed mt-2 hover:bg-muted/50 transition-all" onClick={() => {
                            handleChange('awards', [...formData.awards, { id: crypto.randomUUID(), title: "", issuer: "", date: "" }]);
                        }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Award
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 10. Volunteering */}
                <AccordionItem value="volunteering" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <HeartHandshake className="h-4 w-4 text-primary/70" />
                            <span className="font-semibold">Volunteering & Leadership</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4">
                        {formData.volunteering.map((vol, index) => (
                            <div key={vol.id || index} className="space-y-3 mb-4 last:mb-0 relative group p-4 border rounded-lg bg-card/50">
                                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        const newVol = formData.volunteering.filter((_, i) => i !== index);
                                        handleChange('volunteering', newVol);
                                    }} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Organization</Label>
                                        <Input value={vol.organization} onChange={(e) => {
                                            const newVol = [...formData.volunteering];
                                            newVol[index] = { ...vol, organization: e.target.value };
                                            handleChange('volunteering', newVol);
                                        }} className="h-9 bg-muted/30" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Role</Label>
                                        <Input value={vol.role} onChange={(e) => {
                                            const newVol = [...formData.volunteering];
                                            newVol[index] = { ...vol, role: e.target.value };
                                            handleChange('volunteering', newVol);
                                        }} className="h-9 bg-muted/30" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground">Description</Label>
                                    <Textarea value={vol.description} onChange={(e) => {
                                        const newVol = [...formData.volunteering];
                                        newVol[index] = { ...vol, description: e.target.value };
                                        handleChange('volunteering', newVol);
                                    }} rows={2} className="bg-muted/30" />
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full border-dashed hover:bg-muted/50 transition-all" onClick={() => {
                            handleChange('volunteering', [...formData.volunteering, { id: crypto.randomUUID(), organization: "", role: "", startDate: "", current: false, description: "" }]);
                        }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Volunteering
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* 11. Publications */}
                <AccordionItem value="publications" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-primary/70" />
                            <span className="font-semibold">Publications</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4">
                        {formData.publications.map((pub, index) => (
                            <div key={pub.id || index} className="flex gap-3 items-end group border-b pb-4 last:border-0 last:pb-0">
                                <div className="grid grid-cols-3 gap-3 flex-1">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Title</Label>
                                        <Input value={pub.title} onChange={(e) => {
                                            const newPubs = [...formData.publications];
                                            newPubs[index] = { ...pub, title: e.target.value };
                                            handleChange('publications', newPubs);
                                        }} className="h-9 bg-muted/30" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Publisher</Label>
                                        <Input value={pub.publisher} onChange={(e) => {
                                            const newPubs = [...formData.publications];
                                            newPubs[index] = { ...pub, publisher: e.target.value };
                                            handleChange('publications', newPubs);
                                        }} className="h-9 bg-muted/30" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Link</Label>
                                        <Input value={pub.link || ''} onChange={(e) => {
                                            const newPubs = [...formData.publications];
                                            newPubs[index] = { ...pub, link: e.target.value };
                                            handleChange('publications', newPubs);
                                        }} className="h-9 bg-muted/30" />
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="h-9 w-9 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => {
                                    const newPubs = formData.publications.filter((_, i) => i !== index);
                                    handleChange('publications', newPubs);
                                }}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full border-dashed mt-2 hover:bg-muted/50 transition-all" onClick={() => {
                            handleChange('publications', [...formData.publications, { id: crypto.randomUUID(), title: "", publisher: "", date: "" }]);
                        }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Publication
                        </Button>
                    </AccordionContent>
                </AccordionItem>

            </Accordion>
        </div>
    );
}
