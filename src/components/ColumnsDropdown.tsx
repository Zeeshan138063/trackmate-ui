import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Columns } from "lucide-react";

const columnOptions = [
  { id: "minSalary", label: "Min. Salary", checked: false },
  { id: "maxSalary", label: "Max. Salary", checked: true },
  { id: "location", label: "Location", checked: true },
  { id: "status", label: "Status", checked: true },
  { id: "datePosted", label: "Date Posted", checked: false },
  { id: "dateSaved", label: "Date Saved", checked: true },
  { id: "deadline", label: "Deadline", checked: true },
  { id: "dateApplied", label: "Date Applied", checked: true },
  { id: "followUp", label: "Follow up", checked: true },
  { id: "excitement", label: "Excitement", checked: true },
];

export function ColumnsDropdown() {
  const [columns, setColumns] = useState(columnOptions);

  const handleColumnToggle = (columnId: string) => {
    setColumns(prev => 
      prev.map(col => 
        col.id === columnId ? { ...col, checked: !col.checked } : col
      )
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns className="h-4 w-4 mr-2" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border">
        <DropdownMenuLabel className="text-sm font-medium">
          Show columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2 space-y-2">
          {columns.map((column) => (
            <div key={column.id} className="flex items-center space-x-2">
              <Checkbox
                id={column.id}
                checked={column.checked}
                onCheckedChange={() => handleColumnToggle(column.id)}
              />
              <label
                htmlFor={column.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {column.label}
              </label>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}