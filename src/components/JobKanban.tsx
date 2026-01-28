import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Job } from "@/types/job";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobKanbanProps {
    jobs: Job[];
    onUpdateJob: (job: Job) => void;
    onEditJob: (job: Job) => void;
}

const columns = [
    "Bookmarked",
    "Applying",
    "Applied",
    "Interviewing",
    "Negotiating",
    "Accepted",
    "Rejected",
];

export function JobKanban({ jobs, onUpdateJob, onEditJob }: JobKanbanProps) {
    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const job = jobs.find((j) => j.id === draggableId);
        if (job) {
            onUpdateJob({ ...job, status: destination.droppableId as Job["status"] });
        }
    };

    const getJobsByStatus = (status: string) => {
        return jobs.filter((job) => job.status === status);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-350px)] min-h-[500px]">
                {columns.map((column) => (
                    <div key={column} className="flex-shrink-0 w-80 flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                {column}
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                    {getJobsByStatus(column).length}
                                </Badge>
                            </h3>
                        </div>

                        <Droppable droppableId={column}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 rounded-xl p-2 transition-colors duration-200 ${snapshot.isDraggingOver ? "bg-primary/5" : "bg-muted/30"
                                        }`}
                                >
                                    <div className="flex flex-col gap-3">
                                        {getJobsByStatus(column).map((job, index) => (
                                            <Draggable key={job.id} draggableId={job.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <Card
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`group border-none shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${snapshot.isDragging ? "ring-2 ring-primary shadow-xl rotate-2" : ""
                                                            }`}
                                                    >
                                                        <CardHeader className="p-3 pb-0">
                                                            <div className="flex justify-between items-start">
                                                                <CardTitle className="text-sm font-bold line-clamp-1">
                                                                    {job.position}
                                                                </CardTitle>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => onEditJob(job)}
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="p-3 pt-2 space-y-2">
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Building className="h-3 w-3" />
                                                                <span className="line-clamp-1">{job.company}</span>
                                                            </div>
                                                            {job.location && (
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <MapPin className="h-3 w-3" />
                                                                    <span className="line-clamp-1">{job.location}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center justify-between pt-1">
                                                                <Badge variant="outline" className="text-[10px] font-normal opacity-70">
                                                                    {job.source || 'Manual'}
                                                                </Badge>
                                                                {job.maxSalary && (
                                                                    <span className="text-[10px] font-medium text-primary">
                                                                        ${(job.maxSalary / 1000).toFixed(0)}k
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
