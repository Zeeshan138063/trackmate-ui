
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dreamCompaniesService } from "@/services/dreamCompanies";
import { DreamCompanyCard } from "./DreamCompanyCard";
import { Loader2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";

interface DreamCompaniesKanbanProps {
    onSelectCompany: (id: string) => void;
}

const COLUMNS = [
    { id: "Not Contacted", title: "Not Contacted" },
    { id: "Researching", title: "Researching" },
    { id: "Networking", title: "Networking" },
    { id: "Applied", title: "Applied" },
    { id: "Interviewing", title: "Interviewing" },
    { id: "Offer", title: "Offer" },
    // { id: "Rejected", title: "Rejected" }, // Maybe hide Rejected or put at end
];

export function DreamCompaniesKanban({ onSelectCompany }: DreamCompaniesKanbanProps) {
    const queryClient = useQueryClient();
    const { data: companies, isLoading } = useQuery({
        queryKey: ["dream-companies"],
        queryFn: dreamCompaniesService.getAll
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            dreamCompaniesService.update(id, { status }),
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ["dream-companies"] });
            const previousCompanies = queryClient.getQueryData<any[]>(["dream-companies"]);

            if (previousCompanies) {
                queryClient.setQueryData<any[]>(["dream-companies"],
                    previousCompanies.map(c => c.id === id ? { ...c, status } : c)
                );
            }

            return { previousCompanies };
        },
        onError: (err, variables, context) => {
            if (context?.previousCompanies) {
                queryClient.setQueryData(["dream-companies"], context.previousCompanies);
            }
            console.error("Error updating company status:", err);
            toast.error("Failed to update status");
        },
        onSuccess: () => {
            toast.success("Status updated");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["dream-companies"] });
        }
    });

    const columns = useMemo(() => {
        if (!companies) return {};
        const cols: Record<string, typeof companies> = {};
        COLUMNS.forEach(col => cols[col.id] = []);
        companies.forEach(company => {
            const rawStatus = company.status || "Not Contacted";
            // Case-insensitive match to our column IDs
            const matchedCol = COLUMNS.find(c => c.id.toLowerCase() === rawStatus.toLowerCase());
            const status = matchedCol ? matchedCol.id : "Not Contacted";

            if (cols[status]) {
                cols[status].push(company);
            } else {
                cols["Not Contacted"].push(company);
            }
        });
        return cols;
    }, [companies]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId;

        // Optimistic update could go here, but for now we just mutate
        updateStatusMutation.mutate({ id: draggableId, status: newStatus });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)]">
                {COLUMNS.map(column => (
                    <div key={column.id} className="min-w-[300px] w-[300px] flex flex-col bg-muted/10 rounded-lg border border-white/5">
                        <div className="p-3 font-medium border-b border-white/5 flex justify-between items-center bg-muted/20 rounded-t-lg">
                            {column.title}
                            <span className="text-xs text-muted-foreground bg-black/20 px-2 py-0.5 rounded-full">
                                {columns[column.id]?.length || 0}
                            </span>
                        </div>
                        <Droppable droppableId={column.id}>
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[100px]"
                                >
                                    {columns[column.id]?.map((company, index) => (
                                        <Draggable key={company.id} draggableId={company.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{ ...provided.draggableProps.style }}
                                                >
                                                    <DreamCompanyCard
                                                        company={company}
                                                        onClick={() => onSelectCompany(company.id)}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
