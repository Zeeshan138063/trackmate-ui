import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Bell, Shield, CreditCard, Download, Trash2, Sparkles, Link } from "lucide-react";
import { AIHelper } from "@/utils/ai-helper";
import { PROVIDERS, AIProviderId } from "@/utils/ai-providers/registry";
import { IntegrationsSettings } from "@/components/Settings/IntegrationsSettings";

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    jobAlerts: true,
    weeklyDigest: true
  });

  const [provider, setProvider] = useState<AIProviderId>("gemini");

  // Provider-specific config states
  const [geminiConfig, setGeminiConfig] = useState({ key: "", model: "gemini-2.5-flash" });
  const [openaiConfig, setOpenaiConfig] = useState({ key: "", model: "gpt-4o" });
  const [deepseekConfig, setDeepseekConfig] = useState({ key: "", model: "deepseek-chat" });
  const [huggingfaceConfig, setHuggingfaceConfig] = useState({ key: "", model: "meta-llama/Meta-Llama-3-8B-Instruct" });
  const [openrouterConfig, setOpenrouterConfig] = useState({ key: "", model: "openai/gpt-4o" });

  const [testingConnection, setTestingConnection] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Load general settings
    const storedProvider = localStorage.getItem("AI_PROVIDER") as AIProviderId;
    if (storedProvider) setProvider(storedProvider);

    // Load provider configs
    setGeminiConfig({
      key: localStorage.getItem("GEMINI_API_KEY") || "",
      model: localStorage.getItem("GEMINI_MODEL_NAME") || "gemini-2.5-flash"
    });
    setOpenaiConfig({
      key: localStorage.getItem("OPENAI_API_KEY") || "",
      model: localStorage.getItem("OPENAI_MODEL_NAME") || "gpt-4o"
    });
    setDeepseekConfig({
      key: localStorage.getItem("DEEPSEEK_API_KEY") || "",
      model: localStorage.getItem("DEEPSEEK_MODEL_NAME") || "deepseek-chat"
    });
    setHuggingfaceConfig({
      key: localStorage.getItem("HUGGINGFACE_API_KEY") || "",
      model: localStorage.getItem("HUGGINGFACE_MODEL_NAME") || "meta-llama/Meta-Llama-3-8B-Instruct"
    });
    setOpenrouterConfig({
      key: localStorage.getItem("OPENROUTER_API_KEY") || "",
      model: localStorage.getItem("OPENROUTER_MODEL_NAME") || "openai/gpt-4o"
    });
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("AI_PROVIDER", provider);

    // Save all configs
    localStorage.setItem("GEMINI_API_KEY", geminiConfig.key);
    localStorage.setItem("GEMINI_MODEL_NAME", geminiConfig.model);

    localStorage.setItem("OPENAI_API_KEY", openaiConfig.key);
    localStorage.setItem("OPENAI_MODEL_NAME", openaiConfig.model);

    localStorage.setItem("DEEPSEEK_API_KEY", deepseekConfig.key);
    localStorage.setItem("DEEPSEEK_MODEL_NAME", deepseekConfig.model);

    localStorage.setItem("HUGGINGFACE_API_KEY", huggingfaceConfig.key);
    localStorage.setItem("HUGGINGFACE_MODEL_NAME", huggingfaceConfig.model);

    localStorage.setItem("OPENROUTER_API_KEY", openrouterConfig.key);
    localStorage.setItem("OPENROUTER_MODEL_NAME", openrouterConfig.model);

    setTestStatus({ success: true, message: "Settings saved! Click 'Test Connection' to verify." });
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestStatus(null);
    try {
      // Ensure values are saved first so helper reads fresh data
      handleSaveSettings();

      await AIHelper.validateConnection();
      setTestStatus({ success: true, message: "Connection successful! The API Key and Model Name are valid." });
    } catch (error: any) {
      setTestStatus({ success: false, message: `Connection failed: ${error.message}` });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-7">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="ai">AI Config</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline">Change Photo</Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="john.doe@email.com" />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue="+1 (555) 123-4567" />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" defaultValue="San Francisco, CA" />
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="pst">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                    <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                    <SelectItem value="cst">Central Time (CST)</SelectItem>
                    <SelectItem value="est">Eastern Time (EST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(value) => handleNotificationChange('email', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(value) => handleNotificationChange('push', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Job Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new job opportunities
                    </p>
                  </div>
                  <Switch
                    checked={notifications.jobAlerts}
                    onCheckedChange={(value) => handleNotificationChange('jobAlerts', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Weekly Digest</h4>
                    <p className="text-sm text-muted-foreground">
                      Weekly summary of your job search activity
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(value) => handleNotificationChange('weeklyDigest', value)}
                  />
                </div>
              </div>

              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                AI Configuration
              </CardTitle>
              <CardDescription>
                Configure multiple AI providers and switch between them as needed.
                The <strong>Active</strong> provider will be used for all AI features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="grid gap-4">
                {PROVIDERS.map((p) => {
                  const isActive = provider === p.id;
                  const isConfigured = (() => {
                    if (p.id === 'gemini') return !!geminiConfig.key;
                    if (p.id === 'openai') return !!openaiConfig.key;
                    if (p.id === 'deepseek') return !!deepseekConfig.key;
                    if (p.id === 'huggingface') return !!huggingfaceConfig.key;
                    if (p.id === 'openrouter') return !!openrouterConfig.key;
                    return false;
                  })();

                  return (
                    <div key={p.id} className={`flex flex-col border rounded-lg p-4 transition-all ${isActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center cursor-pointer ${isActive ? 'border-primary bg-primary' : 'border-muted-foreground'}`} onClick={() => {
                            setProvider(p.id);
                            // Auto save provider selection to local storage immediately for better UX
                            localStorage.setItem("AI_PROVIDER", p.id);
                          }}>
                            {isActive && <div className="h-2 w-2 rounded-full bg-white" />}
                          </div>
                          <div>
                            <h4 className="font-semibold">{p.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {isActive ? "Active Provider" : (isConfigured ? "Configured" : "Not Configured")}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          // Toggle expansion logic could go here, but for now we'll just show inputs always or structured differently
                          // Actually, let's just show inputs inline for this design
                        }}>
                          {isActive ? "Connected" : "Configure"}
                        </Button>
                      </div>

                      {/* Config Inputs - Always visible or configured */}
                      <div className="pl-7 space-y-4">
                        {p.id === "gemini" && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">API Key</Label>
                                <Input type="password" value={geminiConfig.key} onChange={(e) => setGeminiConfig({ ...geminiConfig, key: e.target.value })} placeholder="AIza..." className="h-8" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Model</Label>
                                <Input value={geminiConfig.model} onChange={(e) => setGeminiConfig({ ...geminiConfig, model: e.target.value })} className="h-8" />
                              </div>
                            </div>
                          </>
                        )}
                        {p.id === "openai" && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">API Key</Label>
                                <Input type="password" value={openaiConfig.key} onChange={(e) => setOpenaiConfig({ ...openaiConfig, key: e.target.value })} placeholder="sk-..." className="h-8" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Model</Label>
                                <Input value={openaiConfig.model} onChange={(e) => setOpenaiConfig({ ...openaiConfig, model: e.target.value })} className="h-8" />
                              </div>
                            </div>
                          </>
                        )}
                        {p.id === "deepseek" && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">API Key</Label>
                                <Input type="password" value={deepseekConfig.key} onChange={(e) => setDeepseekConfig({ ...deepseekConfig, key: e.target.value })} placeholder="sk-..." className="h-8" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Model</Label>
                                <Input value={deepseekConfig.model} onChange={(e) => setDeepseekConfig({ ...deepseekConfig, model: e.target.value })} className="h-8" />
                              </div>
                            </div>
                          </>
                        )}
                        {p.id === "huggingface" && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">API Key</Label>
                                <Input type="password" value={huggingfaceConfig.key} onChange={(e) => setHuggingfaceConfig({ ...huggingfaceConfig, key: e.target.value })} placeholder="hf_..." className="h-8" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Model</Label>
                                <Input value={huggingfaceConfig.model} onChange={(e) => setHuggingfaceConfig({ ...huggingfaceConfig, model: e.target.value })} className="h-8" />
                              </div>
                            </div>
                          </>
                        )}
                        {p.id === "openrouter" && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">API Key</Label>
                                <Input type="password" value={openrouterConfig.key} onChange={(e) => setOpenrouterConfig({ ...openrouterConfig, key: e.target.value })} placeholder="sk-or-..." className="h-8" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Model</Label>
                                <Input value={openrouterConfig.model} onChange={(e) => setOpenrouterConfig({ ...openrouterConfig, model: e.target.value })} className="h-8" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSaveSettings}>Save All Configurations</Button>
                <Button variant="outline" onClick={handleTestConnection} disabled={testingConnection}>
                  {testingConnection ? "Testing Active Provider..." : "Test Active Connection"}
                </Button>
              </div>

              {testStatus && (
                <div className={`p-3 rounded text-sm ${testStatus.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {testStatus.message}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsSettings />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Manage your privacy and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Password</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button>Update Password</Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Enable 2FA</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Setup</Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Profile Visibility</h4>
                <Select defaultValue="private">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Visible to everyone</SelectItem>
                    <SelectItem value="limited">Limited - Visible to recruiters only</SelectItem>
                    <SelectItem value="private">Private - Not visible to others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Current Plan</h4>
                    <p className="text-sm text-muted-foreground">Pro Plan</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <p>• Unlimited job tracking</p>
                  <p>• Advanced resume builder</p>
                  <p>• Interview preparation</p>
                  <p>• Priority support</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-medium">$29.99/month</span>
                  <Button variant="outline">Change Plan</Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Payment Method</h4>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-6 bg-blue-500 rounded text-white text-xs flex items-center justify-center">
                        VISA
                      </div>
                      <span>**** **** **** 4242</span>
                    </div>
                    <Button variant="outline" size="sm">Update</Button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Billing History</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Pro Plan - December 2024</p>
                      <p className="text-sm text-muted-foreground">Paid on Dec 1, 2024</p>
                    </div>
                    <span className="font-medium">$29.99</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Pro Plan - November 2024</p>
                      <p className="text-sm text-muted-foreground">Paid on Nov 1, 2024</p>
                    </div>
                    <span className="font-medium">$29.99</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export or delete your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Export Data</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Download a copy of all your data including job applications, resumes, and settings.
                </p>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-4">Delete Account</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}