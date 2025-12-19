
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { dreamCompaniesService } from "@/services/dreamCompanies";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : company ? (
                    <div className="space-y-6">
                        <SheetHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <SheetTitle className="text-2xl">{company.name}</SheetTitle>
                                    <SheetDescription>{company.industry} • {company.company_size}</SheetDescription>
                                </div>
                                <Badge variant="outline">{company.status}</Badge>
                            </div>
                        </SheetHeader>

                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                                <TabsTrigger value="reminders">Reminders</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-muted-foreground">Notes</h4>
                                    <p className="text-sm bg-muted/30 p-3 rounded-md min-h-[80px]">
                                        {company.notes || "No notes yet."}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-muted-foreground">URLS</h4>
                                    <div className="flex flex-col gap-2 text-sm">
                                        {company.website_url && <a href={company.website_url} target="_blank" className="text-primary hover:underline">Website</a>}
                                        {company.careers_page_url && <a href={company.careers_page_url} target="_blank" className="text-primary hover:underline">Careers Page</a>}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="contacts" className="mt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-medium">Key Contacts</h3>
                                    <Button size="sm" variant="outline">Add Contact</Button>
                                </div>
                                <div className="space-y-4">
                                    {company.contacts && company.contacts.length > 0 ? (
                                        company.contacts.map((contact: any) => (
                                            <div key={contact.id} className="p-3 border rounded-lg bg-card/50">
                                                <div className="font-medium">{contact.name}</div>
                                                <div className="text-xs text-muted-foreground">{contact.position}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                                            No contacts linked yet.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="reminders" className="mt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-medium">Reminders</h3>
                                    <Button size="sm" variant="outline">Set Reminder</Button>
                                </div>
                                <div className="space-y-4">
                                    {company.dream_company_reminders && company.dream_company_reminders.length > 0 ? (
                                        company.dream_company_reminders.map((reminder: any) => (
                                            <div key={reminder.id} className="p-3 border rounded-lg bg-card/50 flex justify-between">
                                                <span>{reminder.note}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(reminder.due_date).toLocaleDateString()}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                                            No reminders set.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="text-center py-12">Company not found.</div>
                )}
            </SheetContent>
        </Sheet>
    );
}
