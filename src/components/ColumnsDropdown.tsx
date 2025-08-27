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

export interface ColumnOption {
  id: string;
  label: string;
  checked: boolean;
}

interface ColumnsDropdownProps {
  columns: ColumnOption[];
  onToggleColumn: (columnId: string) => void;
}

export function ColumnsDropdown({ columns, onToggleColumn }: ColumnsDropdownProps) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns className="h-4 w-4 mr-2" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border z-50">
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
                onCheckedChange={() => onToggleColumn(column.id)}
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