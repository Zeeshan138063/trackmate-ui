import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { dreamCompaniesService } from "@/services/dreamCompanies";
import { Loader2, Building2, Users, MapPin, Calendar, Globe, Linkedin, ExternalLink, Mail, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompanyLogo } from "./CompanyLogo";

interface DreamCompanySheetProps {
    companyId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DreamCompanySheet({ companyId, open, onOpenChange }: DreamCompanySheetProps) {
    const { data: company, isLoading } = useQuery({
        queryKey: ["dream-company", companyId],
        queryFn: () => dreamCompaniesService.getById(companyId!),
        enabled: !!companyId
    });

    const getStatusColor = (status: string | null) => {
        if (!status) return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700";
        switch (status.toLowerCase()) {
            case "hired": return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
            case "offer": return "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20";
            case "applied": return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20";
            case "rejected": return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
            case "interviewing": return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20";
            case "targeting": return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20";
            case "researching": return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
            default: return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700";
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl p-0 gap-0 overflow-hidden flex flex-col border-l border-border bg-background">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : company ? (
                    <>
                        {/* Header Section */}
                        <div className="bg-background border-b border-border px-6 py-6 space-y-4 pr-12">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-4">
                                    <CompanyLogo
                                        src={company.logo_url}
                                        alt={company.name}
                                        className="h-16 w-16 rounded-xl border-border/50"
                                        iconClassName="h-8 w-8 text-muted-foreground/50"
                                    />
                                    <div className="space-y-1">
                                        <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">{company.name}</SheetTitle>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground text-nowrap">
                                            {company.industry && (
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="w-3.5 h-3.5" />
                                                    {company.industry}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="outline" className={`capitalize px-3 py-1 font-medium ${getStatusColor(company.status)}`}>
                                    {company.status || "Unknown"}
                                </Badge>
                            </div>

                            {/* Quick Actions / Links */}
                            <div className="flex gap-2 pt-2">
                                {(company as any).social_media?.linkedin && (
                                    <Button variant="outline" size="sm" className="h-8 gap-2 border-sky-200/20 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:border-sky-800/30 dark:hover:bg-sky-950/30" asChild>
                                        <a href={(company as any).social_media.linkedin} target="_blank" rel="noopener noreferrer">
                                            <Linkedin className="w-4 h-4" />
                                            LinkedIn
                                        </a>
                                    </Button>
                                )}
                                {company.website_url && (
                                    <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
                                        <a href={company.website_url} target="_blank" rel="noopener noreferrer">
                                            <Globe className="w-4 h-4" />
                                            Website
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Tabs & Content */}
                        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                            <div className="px-6 pt-2 bg-background border-b z-10">
                                <TabsList className="bg-transparent h-auto p-0 gap-6 w-full justify-start rounded-none">
                                    <TabsTrigger
                                        value="overview"
                                        className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground"
                                    >
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="contacts"
                                        className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground"
                                    >
                                        Contacts
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="reminders"
                                        className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground"
                                    >
                                        Reminders
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1 bg-muted/10">
                                <div className="p-6 space-y-6">
                                    <TabsContent value="overview" className="space-y-6 m-0 border-none outline-none">

                                        {/* Company Details Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-card p-4 rounded-lg border shadow-sm space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Users className="w-4 h-4" /> Company Size
                                                </div>
                                                <div className="font-medium">{company.company_size || "N/A"}</div>
                                            </div>
                                            <div className="bg-card p-4 rounded-lg border shadow-sm space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <MapPin className="w-4 h-4" /> HQ Location
                                                </div>
                                                <div className="font-medium">{company.location || "N/A"}</div>
                                            </div>
                                            {company.founded_year && (
                                                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Calendar className="w-4 h-4" /> Founded
                                                    </div>
                                                    <div className="font-medium">{company.founded_year}</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* About Section */}
                                        <div className="space-y-3">
                                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">About</h3>
                                            <div className="bg-card p-4 rounded-lg border shadow-sm text-sm leading-relaxed whitespace-pre-wrap">
                                                {company.notes || <span className="text-muted-foreground italic">No notes added.</span>}
                                            </div>
                                        </div>

                                        {/* Other URLs */}
                                        {(company.careers_page_url || ((company as any).social_media && Object.keys((company as any).social_media).length > 1)) && (
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Additional Links</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {company.careers_page_url && (
                                                        <a href={company.careers_page_url} target="_blank" className="flex items-center gap-2 text-sm bg-card border px-3 py-2 rounded-md hover:bg-muted/50 transition-colors">
                                                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                                            Careers Page
                                                        </a>
                                                    )}
                                                    {/* Other generic links */}
                                                    {(company as any).social_media && Object.entries((company as any).social_media).map(([key, url]) => {
                                                        if (key === 'linkedin' || !url || typeof url !== 'string') return null;
                                                        return (
                                                            <a key={key} href={url} target="_blank" className="flex items-center gap-2 text-sm bg-card border px-3 py-2 rounded-md hover:bg-muted/50 transition-colors capitalize">
                                                                <Globe className="w-4 h-4 text-muted-foreground" />
                                                                {key}
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="contacts" className="m-0 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-medium">Key Contacts</h3>
                                            <Button size="sm" variant="outline" className="h-8 gap-2">
                                                <Users className="w-3.5 h-3.5" />
                                                Add Contact
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {company.contacts && company.contacts.length > 0 ? (
                                                company.contacts.map((contact: any) => (
                                                    <div key={contact.id} className="bg-card p-4 rounded-lg border shadow-sm flex items-start justify-between group hover:border-primary/20 transition-colors">
                                                        <div className="flex gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                                                                {contact.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium group-hover:text-primary transition-colors">{contact.name}</div>
                                                                <div className="text-sm text-muted-foreground">{contact.position}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8">
                                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12 text-muted-foreground bg-card border border-dashed rounded-lg">
                                                    No contacts found.
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="reminders" className="m-0 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-medium">Reminders</h3>
                                            <Button size="sm" variant="outline" className="h-8 gap-2">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Add Reminder
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {company.dream_company_reminders && company.dream_company_reminders.length > 0 ? (
                                                company.dream_company_reminders.map((reminder: any) => (
                                                    <div key={reminder.id} className="bg-card p-4 rounded-lg border shadow-sm">
                                                        <p className="text-sm">{reminder.note}</p>
                                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(reminder.due_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12 text-muted-foreground bg-card border border-dashed rounded-lg">
                                                    No active reminders.
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>
                    </>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">Company not found.</div>
                )}
            </SheetContent>
        </Sheet>
    );
}
