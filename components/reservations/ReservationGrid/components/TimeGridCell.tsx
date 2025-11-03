import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface TimeGridCellProps {
  timeSlot: number;
  stepPx: number;
  tableId: string;
  startHour: number;
  minStep: number;
  onClick?: (tableId: string, timeSlot: number) => void;
  onMouseDown?: (tableId: string, timeSlot: number) => void;
  onMouseEnter?: (tableId: string, timeSlot: number) => void;
  onMouseUp?: () => void;
  isInDragSelection?: boolean;
}

/**
 * Celda de tiempo individual en la grilla con capacidad droppable
 * Memoizada porque se renderizan cientos de celdas (53 slots × cantidad de mesas)
 */
export const TimeGridCell = memo(
  ({
    timeSlot,
    stepPx,
    tableId,
    startHour,
    minStep,
    onClick,
    onMouseDown,
    onMouseEnter,
    onMouseUp,
    isInDragSelection,
  }: TimeGridCellProps) => {
    const isHour = timeSlot % 60 === 0;
    const is30 = timeSlot % 30 === 0;

    // Hacer cada celda droppable
    const { setNodeRef, isOver } = useDroppable({
      id: `cell-${tableId}-${timeSlot}`,
      data: {
        type: "timeslot",
        tableId,
        timeSlot,
        startHour,
        minStep,
      },
    });

    const handleDoubleClick = () => {
      if (onClick) {
        onClick(tableId, timeSlot);
      }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      // Solo iniciar drag con click izquierdo
      if (e.button === 0 && onMouseDown) {
        onMouseDown(tableId, timeSlot);
      }
    };

    const handleMouseEnter = () => {
      if (onMouseEnter) {
        onMouseEnter(tableId, timeSlot);
      }
    };

    return (
      <div
        ref={setNodeRef}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseUp={onMouseUp}
        style={{ width: stepPx }}
        className={`h-12 border-t border-r shrink-0 transition-colors cursor-pointer select-none ${
          isHour
            ? "border-slate-300"
            : is30
            ? "border-slate-200"
            : "border-slate-100"
        } ${isOver ? "bg-blue-100" : ""} 
            ${
              isInDragSelection
                ? "bg-blue-200 border-blue-400"
                : "hover:bg-slate-50"
            }`}
        title="Doble click o arrastra para crear reserva"
      />
    );
  }
);

TimeGridCell.displayName = "TimeGridCell";

