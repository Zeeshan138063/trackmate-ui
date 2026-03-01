
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DreamCompanySearch, CompanyFilters } from "@/components/dream-companies/DreamCompanySearch";
import { DreamCompanyModal } from "@/components/dream-companies/DreamCompanyModal";
import { DreamCompaniesList } from "@/components/dream-companies/DreamCompaniesList";
import { DreamCompanySheet } from "@/components/dream-companies/DreamCompanySheet";
import { DreamCompaniesKanban } from "@/components/dream-companies/DreamCompaniesKanban";
import { DreamCompaniesStats } from "@/components/dream-companies/DreamCompaniesStats";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { dreamCompaniesService, DreamCompany } from "@/services/dreamCompanies";
import { useMemo } from "react";

const DreamCompanies = () => {
    const [view, setView] = useState<"list" | "kanban">("list");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [filters, setFilters] = useState<CompanyFilters>({
        query: "",
        location: "",
        industry: "all",
        size: "all",
        workType: "all",
        status: "all"
    });

    const queryClient = useQueryClient();

    const { data: companies = [], isLoading } = useQuery({
        queryKey: ["dream-companies"],
        queryFn: dreamCompaniesService.getAll
    });

    const industries = useMemo(() => {
        const unique = new Set(companies.map(c => c.industry).filter(Boolean));
        return Array.from(unique) as string[];
    }, [companies]);

    const statuses = useMemo(() => {
        const unique = new Set(companies.map(c => c.status).filter(Boolean));
        return Array.from(unique) as string[];
    }, [companies]);

    const filteredCompanies = useMemo(() => {
        return companies.filter(company => {
            // SaaS check (redundant if RLS works, but good for safety)
            // if (company.user_id !== currentUserId) return false; // Not needed if RLS is on

            const searchLower = filters.query.toLowerCase();
            const nameMatch = company.name.toLowerCase().includes(searchLower);
            const notesMatch = company.notes?.toLowerCase().includes(searchLower);
            const keywordsMatch = company.keywords?.some(k => k.toLowerCase().includes(searchLower));
            const techStackMatch = company.tech_stack?.some(t => t.toLowerCase().includes(searchLower));

            // Semantic Priority: Match in name, keywords, or tech stack
            const matchesQuery = !filters.query || nameMatch || notesMatch || keywordsMatch || techStackMatch;

            const matchesLocation = !filters.location || company.location?.toLowerCase().includes(filters.location.toLowerCase());
            const matchesIndustry = filters.industry === "all" || company.industry === filters.industry;
            const matchesStatus = filters.status === "all" || company.status === filters.status;

            let matchesWorkType = true;
            if (filters.workType !== "all") {
                if (filters.workType === "remote") matchesWorkType = !!company.offers_remote;
                // Add more granular logic for hybrid/onsite if fields exist, for now basic offers_remote
                else if (filters.workType === "onsite") matchesWorkType = !company.offers_remote;
            }

            return matchesQuery && matchesLocation && matchesIndustry && matchesStatus && matchesWorkType;
        }).sort((a, b) => {
            // Semantic Scoring
            if (!filters.query) return 0;
            const getScore = (c: DreamCompany) => {
                let score = 0;
                if (c.name.toLowerCase().includes(filters.query.toLowerCase())) score += 10;
                if (c.keywords?.some(k => k.toLowerCase().includes(filters.query.toLowerCase()))) score += 5;
                if (c.tech_stack?.some(t => t.toLowerCase().includes(filters.query.toLowerCase()))) score += 5;
                if (c.notes?.toLowerCase().includes(filters.query.toLowerCase())) score += 1;
                return score;
            };
            return getScore(b) - getScore(a);
        });
    }, [companies, filters]);

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["dream-companies"] });
    };

    return (
        <div className="container mx-auto p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Dream Companies</h1>
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

            <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                <div className="flex-1 w-full">
                    <DreamCompanySearch
                        onFilterChange={setFilters}
                        industries={industries}
                        statuses={statuses}
                    />
                </div>
                <Tabs value={view} onValueChange={(v) => setView(v as "list" | "kanban")} className="w-auto">
                    <TabsList className="bg-card/50 h-11">
                        <TabsTrigger value="list" className="h-9 px-6 rounded-lg">List View</TabsTrigger>
                        <TabsTrigger value="kanban" className="h-9 px-6 rounded-lg">Kanban Board</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="min-h-[500px]">
                {view === "list" ? (
                    <DreamCompaniesList
                        onSelectCompany={setSelectedCompanyId}
                        companies={filteredCompanies}
                        isLoading={isLoading}
                    />
                ) : (
                    <DreamCompaniesKanban
                        onSelectCompany={setSelectedCompanyId}
                        initialCompanies={filteredCompanies}
                        isLoading={isLoading}
                    />
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
