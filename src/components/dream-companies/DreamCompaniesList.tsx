
import { useQuery } from "@tanstack/react-query";
import { dreamCompaniesService } from "@/services/dreamCompanies";
import { DreamCompanyCard } from "./DreamCompanyCard";
import { Loader2 } from "lucide-react";

interface DreamCompaniesListProps {
    onSelectCompany: (id: string) => void;
}

export function DreamCompaniesList({ onSelectCompany }: DreamCompaniesListProps) {
    const { data: companies, isLoading, error } = useQuery({
        queryKey: ["dream-companies"],
        queryFn: dreamCompaniesService.getAll
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 py-8">
                Failed to load companies. Please try again.
            </div>
        );
    }

    if (!companies || companies.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/10">
                <h3 className="text-lg font-medium mb-2">No companies yet</h3>
                <p>Start building your dream list by adding a company.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {companies.map((company) => (
                <DreamCompanyCard
                    key={company.id}
                    company={company}
                    onClick={() => onSelectCompany(company.id)}
                />
            ))}
        </div>
    );
}
