/**
 * Tipos e interfaces locales para ReservationGrid
 */

import type { Reservation } from "../../../Interfaces/interfaces";

/**
 * Representa una mesa individual del restaurante
 */
export interface Table {
  id: string;
  name: string;
  sector: string;
}

/**
 * Agrupa mesas por sector (Interior, Terraza, etc.)
 */
export interface SectorGroup {
  sector: string;
  tables: Table[];
}

/**
 * Estado del modal de creación/edición
 */
export interface ModalState {
  isOpen: boolean;
  tableId?: string;
  tableName?: string;
  tableCapacity?: { min: number; max: number };
  startTime?: string;
  defaultDuration?: number;
}

/**
 * Estado del menú contextual
 */
export interface ContextMenuState {
  isOpen: boolean;
  reservation: Reservation | null;
  position: { x: number; y: number };
}

/**
 * Estado del modal de edición
 */
export interface EditModalState {
  isOpen: boolean;
  reservation: Reservation | null;
}

/**
 * Estado para drag & drop de creación
 */
export interface DragCreateState {
  isDragging: boolean;
  tableId: string | null;
  startTimeSlot: number | null;
  currentTimeSlot: number | null;
}

/**
 * Información de una mesa con capacidad
 */
export interface TableInfo {
  table: Table;
  sector: string;
  capacity: { min: number; max: number };
}

/**
 * Validación de una reserva
 */
export interface ReservationValidation {
  hasConflict: boolean;
  conflictWithId: string | null;
  isOutsideHours: boolean;
  isPast: boolean;
  errorMessage: string | null;
}

