import { useState, useCallback, useEffect } from 'react';
import type { DragCreateState, TableInfo } from '../types';
import { timeSlotToISO } from '../utils/timeUtils';
import { START_HOUR, END_HOUR, MIN_STEP } from '../utils/constants';

/**
 * Hook para manejar la creación de reservas mediante drag & drop
 */
export function useDragCreate(
  findTable: (tableId: string) => TableInfo | null,
  isInThePast: (startTime: string) => boolean,
  isOutsideServiceHours: (startTime: string, duration: number) => boolean,
  onCreateReservation: (
    tableId: string,
    tableName: string,
    tableCapacity: { min: number; max: number },
    startTime: string,
    duration: number
  ) => void
) {
  const [dragCreateState, setDragCreateState] = useState<DragCreateState>({
    isDragging: false,
    tableId: null,
    startTimeSlot: null,
    currentTimeSlot: null,
  });

  /**
   * Iniciar creación de reserva arrastrando
   */
  const handleCellMouseDown = useCallback(
    (tableId: string, timeSlot: number) => {
      // Validar que no sea una hora pasada
      const startTime = timeSlotToISO(timeSlot);
      if (isInThePast(startTime)) {
        console.warn("⚠️ No se puede crear una reserva en el pasado");
        return;
      }

      // Validar horario de servicio
      const start = new Date(startTime);
      const startHour = start.getHours() + start.getMinutes() / 60;
      if (startHour < START_HOUR || startHour >= END_HOUR) {
        console.warn("⚠️ Fuera del horario de servicio");
        return;
      }

      setDragCreateState({
        isDragging: true,
        tableId,
        startTimeSlot: timeSlot,
        currentTimeSlot: timeSlot,
      });
    },
    [isInThePast]
  );

  /**
   * Actualizar selección mientras se arrastra
   */
  const handleCellMouseEnter = useCallback(
    (tableId: string, timeSlot: number) => {
      if (dragCreateState.isDragging && dragCreateState.tableId === tableId) {
        setDragCreateState((prev) => ({
          ...prev,
          currentTimeSlot: timeSlot,
        }));
      }
    },
    [dragCreateState.isDragging, dragCreateState.tableId]
  );

  /**
   * Finalizar creación de reserva arrastrando
   */
  const handleCellMouseUp = useCallback(() => {
    if (
      dragCreateState.isDragging &&
      dragCreateState.tableId &&
      dragCreateState.startTimeSlot !== null &&
      dragCreateState.currentTimeSlot !== null
    ) {
      const tableInfo = findTable(dragCreateState.tableId);
      if (!tableInfo) {
        setDragCreateState({
          isDragging: false,
          tableId: null,
          startTimeSlot: null,
          currentTimeSlot: null,
        });
        return;
      }

      // Calcular inicio y fin (puede arrastrarse hacia atrás)
      const startSlot = Math.min(
        dragCreateState.startTimeSlot,
        dragCreateState.currentTimeSlot
      );
      const endSlot = Math.max(
        dragCreateState.startTimeSlot,
        dragCreateState.currentTimeSlot
      );

      // Calcular duración en minutos (incluir la celda final)
      const durationInIntervals = (endSlot - startSlot) / MIN_STEP + 1;
      const duration = durationInIntervals * MIN_STEP;

      const startTime = timeSlotToISO(startSlot);

      // Validar antes de abrir el modal
      if (isInThePast(startTime)) {
        console.warn("⚠️ No se puede crear una reserva en el pasado");
        setDragCreateState({
          isDragging: false,
          tableId: null,
          startTimeSlot: null,
          currentTimeSlot: null,
        });
        return;
      }

      if (isOutsideServiceHours(startTime, duration)) {
        console.warn("⚠️ La reserva está fuera del horario de servicio");
        setDragCreateState({
          isDragging: false,
          tableId: null,
          startTimeSlot: null,
          currentTimeSlot: null,
        });
        return;
      }

      // Llamar al callback para crear la reserva
      onCreateReservation(
        dragCreateState.tableId,
        tableInfo.table.name,
        tableInfo.capacity,
        startTime,
        duration
      );
    }

    // Resetear estado de drag
    setDragCreateState({
      isDragging: false,
      tableId: null,
      startTimeSlot: null,
      currentTimeSlot: null,
    });
  }, [
    dragCreateState,
    findTable,
    isInThePast,
    isOutsideServiceHours,
    onCreateReservation,
  ]);

  // Agregar listener global para mouse up (por si se suelta fuera de las celdas)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragCreateState.isDragging) {
        handleCellMouseUp();
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [dragCreateState.isDragging, handleCellMouseUp]);

  return {
    dragCreateState,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellMouseUp,
  };
}

