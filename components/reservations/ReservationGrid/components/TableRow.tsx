import { memo } from 'react';
import type { Reservation } from '../../../../Interfaces/interfaces';
import type { Table, DragCreateState, ReservationValidation } from '../types';
import { TimeGridCell } from './TimeGridCell';
import ReservationCard from '../../../ReservationCard';

interface TableRowProps {
  table: Table;
  timeSlots: number[];
  stepPx: number;
  totalWidth: number;
  reservations: Reservation[];
  startHour: number;
  minStep: number;
  onCellClick?: (tableId: string, timeSlot: number) => void;
  onCellMouseDown?: (tableId: string, timeSlot: number) => void;
  onCellMouseEnter?: (tableId: string, timeSlot: number) => void;
  onCellMouseUp?: () => void;
  dragCreateState?: DragCreateState;
  onResize?: (
    reservationId: string,
    newStartTime: string,
    newDuration: number
  ) => void;
  onContextMenu?: (
    reservation: Reservation,
    position: { x: number; y: number }
  ) => void;
  reservationValidations?: Map<string, ReservationValidation>;
}

/**
 * Fila completa de una mesa con todas sus celdas de tiempo y reservas
 * Memoizada para evitar re-renderizar todas las mesas cuando cambia el estado
 */
export const TableRow = memo(
  ({
    table,
    timeSlots,
    stepPx,
    totalWidth,
    reservations,
    startHour,
    minStep,
    onCellClick,
    onCellMouseDown,
    onCellMouseEnter,
    onCellMouseUp,
    dragCreateState,
    onResize,
    onContextMenu,
    reservationValidations,
  }: TableRowProps) => {
    // Filtrar reservas de esta mesa específica
    const tableReservations = reservations.filter(
      (r) => r.tableId === table.id
    );

    // Determinar qué celdas están en la selección de drag
    const isInDragSelection = (timeSlot: number): boolean => {
      if (
        !dragCreateState?.isDragging ||
        dragCreateState.tableId !== table.id
      ) {
        return false;
      }
      const start = Math.min(
        dragCreateState.startTimeSlot!,
        dragCreateState.currentTimeSlot!
      );
      const end = Math.max(
        dragCreateState.startTimeSlot!,
        dragCreateState.currentTimeSlot!
      );
      return timeSlot >= start && timeSlot <= end;
    };

    return (
      <div className="relative flex">
        {/* Celdas de fondo de la grilla - cada una es droppable y clickeable */}
        <div className="h-12 flex" style={{ minWidth: totalWidth }}>
          {timeSlots.map((ts) => (
            <TimeGridCell
              key={ts}
              timeSlot={ts}
              stepPx={stepPx}
              tableId={table.id}
              startHour={startHour}
              minStep={minStep}
              onClick={onCellClick}
              onMouseDown={onCellMouseDown}
              onMouseEnter={onCellMouseEnter}
              onMouseUp={onCellMouseUp}
              isInDragSelection={isInDragSelection(ts)}
            />
          ))}
        </div>

        {/* Reservas superpuestas sobre las celdas */}
        {tableReservations.map((reservation) => {
          const validation = reservationValidations?.get(reservation.id);
          return (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              stepPx={stepPx}
              startHour={startHour}
              minStep={minStep}
              onResize={onResize}
              onContextMenu={onContextMenu}
              hasConflict={
                validation?.hasConflict ||
                validation?.isOutsideHours ||
                validation?.isPast ||
                false
              }
              conflictMessage={validation?.errorMessage || undefined}
            />
          );
        })}
      </div>
    );
  }
);

TableRow.displayName = "TableRow";

