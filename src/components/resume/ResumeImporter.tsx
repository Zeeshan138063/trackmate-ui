
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Loader2, AlertTriangle, CheckCircle2, Link as LinkIcon, Linkedin } from "lucide-react";
import { extractTextFromFile } from "@/utils/file-parser";
import { ResumeAIHelper } from "@/utils/resume-ai-helper";
import { MasterProfile } from "@/types/resume";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
                    type: 'TRACKMATE_FETCH_JOB_DATA', // Reusing the generic fetch type
                    dataId: dataId
                }, window.location.origin);
            }, 1000);
        }

        // Listen for the response
        const messageHandler = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'TRACKMATE_JOB_DATA_RESPONSE' && event.data.data) { // Generic response type
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
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="file">File Upload</TabsTrigger>
                        <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="space-y-4 py-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="resume-file">Resume File (PDF/Word)</Label>
                            <Input
                                id="resume-file"
                                type="file"
                                accept=".pdf,.docx"
                                onChange={handleFileChange}
                            />
                        </div>

                        {file && (
                            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
                                <FileText className="h-4 w-4" />
                                <span className="truncate max-w-[200px]">{file.name}</span>
                                <CheckCircle2 className="h-4 w-4 ml-auto" />
                            </div>
                        )}

                        <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-md border border-blue-200 flex gap-2 items-start">
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
                        <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-slate-50">
                            <div className="bg-blue-100 p-3 rounded-full mb-4">
                                <Linkedin className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Use the Browser Extension</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                To import a LinkedIn profile, please navigate to the profile page on LinkedIn, open the TrackMate Extension, and click <strong>"Import to Resume"</strong>.
                            </p>
                            <div className="text-xs text-slate-500 bg-white p-2 rounded border">
                                <strong>Why?</strong> LinkedIn blocks direct URL importing. The extension securely captures the data from your browser session.
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
