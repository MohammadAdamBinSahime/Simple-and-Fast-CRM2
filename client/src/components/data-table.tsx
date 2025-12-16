import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  selectedRows?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  getRowId: (row: T) => string;
  emptyMessage?: string;
  testIdPrefix?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  onRowClick,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  getRowId,
  emptyMessage = "No data found.",
  testIdPrefix = "table",
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedRows.length === data.length;

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectRow && <TableHead className="w-10"><Skeleton className="h-4 w-4" /></TableHead>}
              {columns.map((col) => (
                <TableHead key={col.key}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {onSelectRow && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid={`${testIdPrefix}-empty`}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectRow && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => onSelectAll?.()}
                  aria-label="Select all"
                  data-testid={`${testIdPrefix}-select-all`}
                />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead 
                key={col.key} 
                className={cn("text-xs font-medium uppercase tracking-wide", col.className)}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const rowId = getRowId(row);
            const isSelected = selectedRows.includes(rowId);
            return (
              <TableRow
                key={rowId}
                className={cn(
                  onRowClick && "cursor-pointer hover-elevate",
                  isSelected && "bg-muted"
                )}
                onClick={() => onRowClick?.(row)}
                data-testid={`${testIdPrefix}-row-${rowId}`}
              >
                {onSelectRow && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectRow(rowId)}
                      aria-label={`Select row ${rowId}`}
                      data-testid={`${testIdPrefix}-select-${rowId}`}
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn("py-3", col.className)}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
