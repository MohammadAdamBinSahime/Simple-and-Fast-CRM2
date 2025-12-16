import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanColumn<T> {
  id: string;
  title: string;
  items: T[];
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T) => React.ReactNode;
  onDragEnd: (itemId: string, newColumnId: string) => void;
  onAddItem?: (columnId: string) => void;
  getItemId: (item: T) => string;
  isLoading?: boolean;
  testIdPrefix?: string;
}

export function KanbanBoard<T>({
  columns,
  renderCard,
  onDragEnd,
  onAddItem,
  getItemId,
  isLoading,
  testIdPrefix = "kanban",
}: KanbanBoardProps<T>) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedItem) {
      onDragEnd(draggedItem, columnId);
    }
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-80">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-6 rounded-full" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" data-testid={`${testIdPrefix}-board`}>
      {columns.map((column) => (
        <div
          key={column.id}
          className={cn(
            "flex-shrink-0 w-80 bg-muted/50 rounded-lg transition-colors",
            dragOverColumn === column.id && "bg-muted"
          )}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
          data-testid={`${testIdPrefix}-column-${column.id}`}
        >
          <div className="p-4 sticky top-0">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-medium text-sm">{column.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {column.items.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {column.items.map((item) => {
                const itemId = getItemId(item);
                return (
                  <div
                    key={itemId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, itemId)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "cursor-grab active:cursor-grabbing transition-opacity",
                      draggedItem === itemId && "opacity-50"
                    )}
                    data-testid={`${testIdPrefix}-card-${itemId}`}
                  >
                    <Card className="hover-elevate">
                      <div className="absolute top-3 right-3 opacity-50">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      {renderCard(item)}
                    </Card>
                  </div>
                );
              })}
              {column.items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No items
                </div>
              )}
            </div>
            {onAddItem && (
              <Button
                variant="ghost"
                className="w-full mt-3 justify-start"
                onClick={() => onAddItem(column.id)}
                data-testid={`${testIdPrefix}-add-${column.id}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add item
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
