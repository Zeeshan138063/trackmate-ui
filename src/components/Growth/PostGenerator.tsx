
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { GrowthEngine } from "@/services/GrowthEngine";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MasterProfile } from "@/types/resume";

export function PostGenerator() {
    const [resume, setResume] = useState<MasterProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [topic, setTopic] = useState("");
    const [format, setFormat] = useState("educational");
    const [generatedPost, setGeneratedPost] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("resumes")
                .select("content")
                .eq("user_id", user.id)
                .order("updated_at", { ascending: false })
                .limit(1)
                .single();

            if (data?.content) {
                // Type assertion since content is JSON
                setResume(data.content as unknown as MasterProfile);
            }
        } catch (err) {
            console.error("Failed to load profile", err);
        }
    };

    const handleGenerate = async () => {
        if (!topic) {
            toast.error("Please enter a topic first.");
            return;
        }
        if (!resume) {
            toast.error("Profile not loaded. Please try again.");
            return;
        }

        setLoading(true);
        setGeneratedPost("");
        try {
            const post = await GrowthEngine.generatePost(topic, format, resume);
            setGeneratedPost(post);
            toast.success("Post generated!");
        } catch (error: any) {
            toast.error("Failed to generate: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedPost);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePublish = async () => {
        if (!generatedPost) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            toast.info("Publishing to LinkedIn...");
            await GrowthEngine.publishToLinkedIn(generatedPost, user.id);
            toast.success("Published successfully! (Simulation Mode)");
        } catch (error: any) {
            if (error.message === "LINKEDIN_NOT_CONNECTED") {
                toast.error("Please connect LinkedIn in Settings > Integrations first.");
            } else if (error.message === "MISSING_MANUAL_TOKEN") {
                toast.error("Developer Mode: Please paste a valid Access Token in Settings > Integrations.");
            } else {
                toast.error("Publish failed: " + error.message);
            }
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label>What do you want to post about?</Label>
                        <Input
                            placeholder="e.g. The future of AI Agents in 2025..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Post Format</Label>
                        <Select value={format} onValueChange={setFormat}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="educational">Educational / How-To</SelectItem>
                                <SelectItem value="story">Personal Story</SelectItem>
                                <SelectItem value="opinion">Controversial Opinion</SelectItem>
                                <SelectItem value="case_study">Case Study</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleGenerate}
                        disabled={loading || !topic}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Drafting...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Draft
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="flex flex-col h-full bg-muted/30">
                <CardContent className="p-6 flex-1">
                    {generatedPost ? (
                        <Textarea
                            className="min-h-[300px] h-full font-sans text-base leading-relaxed bg-background"
                            value={generatedPost}
                            onChange={(e) => setGeneratedPost(e.target.value)}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground min-h-[300px]">
                            <Sparkles className="w-10 h-10 mb-2 opacity-20" />
                            <p>Your draft will appear here.</p>
                        </div>
                    )}
                </CardContent>
                {generatedPost && (
                    <CardFooter className="border-t p-4 flex justify-end gap-2 bg-background/50">
                        <Button variant="outline" onClick={copyToClipboard}>
                            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                        <Button onClick={handlePublish}>
                            Publish to LinkedIn
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
