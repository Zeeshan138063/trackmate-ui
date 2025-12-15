
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, PenTool, Calendar, History, TrendingUp } from "lucide-react";
import { PostGenerator } from "@/components/Growth/PostGenerator";

export default function GrowthDashboard() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Growth Engine</h1>
                    <p className="text-muted-foreground mt-1">
                        AI-powered content strategy and LinkedIn automation.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button>
                        <PenTool className="w-4 h-4 mr-2" />
                        New Post
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Engagement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center">
                            --
                            <span className="text-xs font-normal text-muted-foreground ml-2">(Data unavailable)</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Posts Published</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Drafts in Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="generator" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="generator">
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Generator
                    </TabsTrigger>
                    <TabsTrigger value="queue">
                        <Calendar className="w-4 h-4 mr-2" />
                        Scheduled
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <History className="w-4 h-4 mr-2" />
                        History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="generator" className="space-y-6">
                    <PostGenerator />
                </TabsContent>

                <TabsContent value="queue">
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No posts scheduled.
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No publishing history yet.
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
