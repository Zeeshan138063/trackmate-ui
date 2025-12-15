
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "lucide-react";

export function IntegrationsSettings() {
    const [loading, setLoading] = useState(false);
    const [keys, setKeys] = useState<{ clientId: string; clientSecret: string; accessToken: string }>({
        clientId: "",
        clientSecret: "",
        accessToken: ""
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("profile_growth_settings")
                .select("linkedin_keys")
                .eq("user_id", user.id)
                .single();

            if (error && error.code !== "PGRST116") { // Ignore if not found
                console.error("Error fetching keys:", error);
            }

            if (data?.linkedin_keys) {
                // Cast to any to access properties since it's JSONB
                const k = data.linkedin_keys as any;
                setKeys({
                    clientId: k.clientId || "",
                    clientSecret: k.clientSecret || "",
                    accessToken: ""
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            // 1. Save keys (Client ID / Secret)
            const { error: settingsError } = await supabase
                .from("profile_growth_settings")
                .upsert({
                    user_id: user.id,
                    linkedin_keys: {
                        clientId: keys.clientId,
                        clientSecret: keys.clientSecret
                    },
                    updated_at: new Date().toISOString()
                }, { onConflict: "user_id" });

            if (settingsError) throw settingsError;

            // 2. Save Token if present
            if (keys.accessToken && keys.accessToken.length > 10) {
                await supabase.from("integration_tokens").upsert({
                    user_id: user.id,
                    provider: "linkedin",
                    access_token: keys.accessToken,
                    expires_at: new Date(Date.now() + 86400000 * 60).toISOString(),
                    metadata: { author_urn: "urn:li:person:UNKNOWN" }
                }, { onConflict: "user_id,provider" });
            }

            toast.success("Credentials & Token saved!");
        } catch (error: any) {
            toast.error("Error saving: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Link className="h-5 w-5 mr-2 text-primary" />
                    Platform Integrations
                </CardTitle>
                <CardDescription>
                    Connect external platforms to enable publishing and analytics.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 border-l-2 border-[#0077b5]/50 pl-4 py-2 bg-blue-50/10 rounded-r-md">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[#0077b5]">LinkedIn</h3>
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded">Required for Auto-Publishing</span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        To publish posts automatically, you need to create a LinkedIn Developer App.
                        <br />
                        1. Go to <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer" className="underline text-primary">LinkedIn Developers</a>.
                        <br />
                        2. Create an App.
                        <br />
                        3. Request "Share on LinkedIn" and "Sign In with LinkedIn" products.
                        <br />
                        4. Copy the Client ID and Secret below.
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="li_client_id">Client ID</Label>
                        <Input
                            id="li_client_id"
                            type="password"
                            value={keys.clientId}
                            onChange={(e) => setKeys({ ...keys, clientId: e.target.value })}
                            placeholder="77..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="li_client_secret">Client Secret</Label>
                        <Input
                            id="li_client_secret"
                            type="password"
                            value={keys.clientSecret}
                            onChange={(e) => setKeys({ ...keys, clientSecret: e.target.value })}
                            placeholder="WJ..."
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or (Developer Mode)
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="li_access_token">Direct Access Token (Optional)</Label>
                        <Input
                            id="li_access_token"
                            type="password"
                            value={keys.accessToken}
                            placeholder="Paste raw OAuth token here to bypass CORS restrictions..."
                            onChange={(e) => setKeys({ ...keys, accessToken: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Since we don't have a backend server running, you can generate a token <a href="https://www.linkedin.com/developers/tools/oauth/token-generator" target="_blank" className="underline text-primary">here</a> and paste it.
                        </p>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : "Save Credentials"}
                </Button>
            </CardContent>
        </Card>
    );
}
