
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { DreamCompanyModal } from "@/components/dream-companies/DreamCompanyModal";
import { DreamCompaniesList } from "@/components/dream-companies/DreamCompaniesList";
import { DreamCompanySheet } from "@/components/dream-companies/DreamCompanySheet";
import { DreamCompaniesKanban } from "@/components/dream-companies/DreamCompaniesKanban";
import { DreamCompaniesStats } from "@/components/dream-companies/DreamCompaniesStats";
import { useQueryClient } from "@tanstack/react-query";

const DreamCompanies = () => {
    const [view, setView] = useState<"list" | "kanban">("list");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["dream-companies"] });
    };

    return (
        <div className="container mx-auto p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dream Companies</h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage your target companies strategically.
                    </p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4" />
                    Add Dream Company
                </Button>
            </div>

            <DreamCompaniesStats />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:w-72">
                    <Input placeholder="Search companies..." className="bg-card/50" />
                </div>
                <Tabs value={view} onValueChange={(v) => setView(v as "list" | "kanban")} className="w-auto">
                    <TabsList className="bg-card/50">
                        <TabsTrigger value="list">List View</TabsTrigger>
                        <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="min-h-[500px]">
                {view === "list" ? (
                    <DreamCompaniesList onSelectCompany={setSelectedCompanyId} />
                ) : (
                    <DreamCompaniesKanban onSelectCompany={setSelectedCompanyId} />
                )}
            </div>

            <DreamCompanyModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onSuccess={handleSuccess}
            />

            <DreamCompanySheet
                companyId={selectedCompanyId}
                open={!!selectedCompanyId}
                onOpenChange={(open) => !open && setSelectedCompanyId(null)}
            />
        </div>
    );
};

export default DreamCompanies;
