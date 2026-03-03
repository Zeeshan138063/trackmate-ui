
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Loader2, AlertTriangle, CheckCircle2, Link as LinkIcon, Linkedin, CloudUpload, FileJson } from "lucide-react";
import { extractTextFromFile } from "@/utils/file-parser";
import { ResumeAIHelper } from "@/utils/resume-ai-helper";
import { MasterProfile } from "@/types/resume";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { mapReactiveResumeToMasterProfile } from "@/utils/reactive-resume-mapper";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
    onFileSelected: (file: File) => void;
    accept: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    isProcessing?: boolean;
}

function FileDropZone({ onFileSelected, accept, label, description, icon, isProcessing }: FileDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isProcessing) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (isProcessing) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            onFileSelected(file);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "relative group flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden",
                isDragging
                    ? "border-primary bg-primary/5 scale-[1.02] shadow-lg"
                    : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50",
                isProcessing && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => {
                if (!isProcessing) {
                    document.getElementById(`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`)?.click();
                }
            }}
        >
            <input
                id={`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileSelected(file);
                }}
                disabled={isProcessing}
            />

            <div className={cn(
                "p-4 rounded-full bg-primary/10 text-primary mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                isDragging && "scale-110 animate-bounce"
            )}>
                {icon}
            </div>

            <div className="text-center space-y-1">
                <p className="font-semibold text-lg text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            {/* Subtle glassmorphism/gradient effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
}

interface ResumeImporterProps {
    onImport: (profile: MasterProfile) => void;
}

export function ResumeImporter({ onImport }: ResumeImporterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState("file");
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    // Lifecycle Debugging
    useEffect(() => {
        console.log('[ResumeImporter] Component Mounted');
        return () => console.log('[ResumeImporter] Component UNMOUNTED');
    }, []);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleFileImport = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            // 1. Extract raw text
            const rawText = await extractTextFromFile(file);

            if (!rawText || rawText.length < 50) {
                throw new Error("Could not extract enough text from the file. Please try a different format.");
            }

            // 2. Parse with AI
            const parsedProfile = await ResumeAIHelper.parseResumeFromText(rawText);

            // 3. Callback
            onImport(parsedProfile);

            toast({
                title: "Resume Imported Successfully",
                description: "Your master profile has been populated. Please review the data.",
                variant: "default",
            });
            setIsOpen(false);
            setFile(null); // Reset

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Import Failed",
                description: error.message || "Something went wrong during import.",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLinkedInImport = async () => {
        // No-op manually triggered import for now, as we guide users to extension
    };

    const handleReactiveImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);

                    // Simple validation: check for basics/metadata/sections
                    if (!json.basics || !json.sections || !json.metadata) {
                        throw new Error("Invalid Reactive Resume JSON format. Please ensure you exported from Reactive Resume.");
                    }

                    const profile = mapReactiveResumeToMasterProfile(json);
                    onImport(profile);

                    toast({
                        title: "Import Successful",
                        description: "Your Reactive Resume data has been imported.",
                    });
                    setIsOpen(false);
                } catch (err: any) {
                    toast({
                        title: "Import Failed",
                        description: err.message || "Failed to parse JSON file.",
                        variant: "destructive",
                    });
                } finally {
                    setIsProcessing(false);
                }
            };
            reader.readAsText(file);
        } catch (error: any) {
            setIsProcessing(false);
            toast({
                title: "Error",
                description: "Failed to read the file.",
                variant: "destructive",
            });
        }
    };

    // Listen for extension data
    useEffect(() => {
        // Check URL params for dataId (Extension flow)
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const dataId = params.get('dataId');

        if (action === 'importProfile' && dataId) {
            setIsOpen(true);
            setActiveTab('linkedin');
            setIsProcessing(true);

            // Allow time for bridge to initialize
            setTimeout(() => {
                // Request data from extension via bridge
                window.postMessage({
                    type: 'CAREERPILOT_FETCH_JOB_DATA', // Reusing the generic fetch type
                    dataId: dataId
                }, window.location.origin);
            }, 1000);
        }

        // Listen for the response
        const messageHandler = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'CAREERPILOT_JOB_DATA_RESPONSE' && event.data.data) { // Generic response type
                const profileData = event.data.data;
                // Verify it's profile data (has name/headline or type='profile')
                if (profileData.name || profileData.type === 'profile') {
                    try {
                        setIsProcessing(true);
                        toast({ title: "Profile Data Received", description: "Parsing details..." });

                        // Convert raw profile data to text/JSON for AI parsing
                        // We pass the raw JSON from the extension to the AI to map it strictly to MasterProfile
                        const rawText = JSON.stringify(profileData, null, 2);
                        const parsedProfile = await ResumeAIHelper.parseResumeFromText(rawText);

                        onImport(parsedProfile);

                        toast({
                            title: "LinkedIn Profile Imported",
                            description: "Profile data has been populated.",
                            variant: "default",
                        });
                        setIsOpen(false);

                        // Clear URL params
                        window.history.replaceState({}, '', window.location.pathname);

                    } catch (error: any) {
                        console.error(error);
                        toast({ title: "Parsing Failed", description: error.message, variant: "destructive" });
                    } finally {
                        setIsProcessing(false);
                    }
                }
            }
        };

        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, [onImport, toast]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import Resume / LinkedIn
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Profile</DialogTitle>
                    <DialogDescription>
                        Import data from your existing resume file or LinkedIn profile.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="file" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="file">File Upload</TabsTrigger>
                        <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
                        <TabsTrigger value="reactive">Reactive Resume</TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="space-y-4 py-4">
                        <FileDropZone
                            onFileSelected={setFile}
                            accept=".pdf,.docx"
                            label="Resume File (PDF/Word)"
                            description="Click or drag and drop your resume file here"
                            icon={<CloudUpload className="h-8 w-8" />}
                            isProcessing={isProcessing}
                        />

                        {file && (
                            <div className="flex items-center gap-3 text-sm text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-green-950/30 p-3 rounded-lg border border-green-100 dark:border-green-900/50 animate-in fade-in slide-in-from-top-2">
                                <FileText className="h-5 w-5 text-green-600" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-medium truncate">{file.name}</span>
                                    <span className="text-[10px] opacity-70">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <CheckCircle2 className="h-5 w-5 ml-auto text-green-600" />
                            </div>
                        )}

                        <div className="bg-blue-50 dark:bg-indigo-950/50 text-blue-800 dark:text-indigo-300 text-xs p-3 rounded-md border border-blue-200 dark:border-indigo-800/50 flex gap-2 items-start">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>
                                <strong>Note:</strong> Standard resume layouts work best. Always review imported data.
                            </p>
                        </div>

                        <Button
                            onClick={handleFileImport}
                            disabled={!file || isProcessing}
                            className="w-full"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing File...
                                </>
                            ) : (
                                "Import from File"
                            )}
                        </Button>
                    </TabsContent>

                    <TabsContent value="linkedin" className="space-y-4 py-4">
                        <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-muted/10">
                            <div className="bg-blue-100 p-3 rounded-full mb-4">
                                <Linkedin className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Use the Browser Extension</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                To import a LinkedIn profile, please navigate to the profile page on LinkedIn, open the JobOS Extension, and click <strong>"Import to Resume"</strong>.
                            </p>
                            <div className="text-xs text-slate-500 dark:text-slate-400 bg-muted/30 dark:bg-muted/20 p-2 rounded border">
                                <strong>Why?</strong> LinkedIn blocks direct URL importing. The extension securely captures the data from your browser session.
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="reactive" className="space-y-4 py-4">
                        <div className="space-y-4">
                            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                                <div className="text-sm text-amber-900">
                                    <p className="font-semibold">Import from Reactive Resume</p>
                                    <p className="mt-1">Upload the <strong>.json</strong> export from your Reactive Resume account (rxresu.me) to instantly populate your JobOS profile.</p>
                                </div>
                            </div>

                            <FileDropZone
                                onFileSelected={(file) => {
                                    // Wrap in event-like object for consistency or handle directly
                                    const event = { target: { files: [file] } } as any;
                                    handleReactiveImport(event);
                                }}
                                accept=".json"
                                label="Reactive Resume JSON"
                                description="Upload the .json export from rxresu.me"
                                icon={<FileJson className="h-8 w-8" />}
                                isProcessing={isProcessing}
                            />
                            <p className="text-[10px] text-muted-foreground text-center">Go to Resumes -{">"} Export -{">"} JSON on rxresu.me</p>

                            {isProcessing && (
                                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing data...
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
