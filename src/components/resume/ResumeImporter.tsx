
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { extractTextFromFile } from "@/utils/file-parser";
import { ResumeAIHelper } from "@/utils/resume-ai-helper";
import { MasterProfile } from "@/types/resume";
import { useToast } from "@/hooks/use-toast";

interface ResumeImporterProps {
    onImport: (profile: MasterProfile) => void;
}

export function ResumeImporter({ onImport }: ResumeImporterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
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

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import Resume (PDF/Word)
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import from Resume</DialogTitle>
                    <DialogDescription>
                        Upload your existing resume (PDF or Word). The AI will extract your details to populate your Master Profile.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="resume-file">Resume File</Label>
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
                            <strong>Note:</strong> This uses AI to understand your document structure.
                            It works best with standard layouts. Always review the imported data for accuracy.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleImport}
                    disabled={!file || isProcessing}
                    className="w-full"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Extracting & Parsing...
                        </>
                    ) : (
                        "Start Import"
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
