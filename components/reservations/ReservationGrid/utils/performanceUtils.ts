/**
 * ============================================================================
 * PERFORMANCE UTILITIES
 * ============================================================================
 * 
 * Utilidades para optimizar el rendimiento del grid:
 * - Normalización de datos para búsquedas rápidas
 * - Debouncing de operaciones costosas
 * - Helpers para virtual scrolling
 */

import type { Reservation } from '../../../../Interfaces/interfaces';

// ============================================================================
// NORMALIZACIÓN DE ESTADO
// ============================================================================

/**
 * Estructura normalizada para búsquedas rápidas de reservas
 */
export interface NormalizedReservations {
  byId: Map<string, Reservation>;
  byTableId: Map<string, Reservation[]>;
  byTimeSlot: Map<number, Reservation[]>; // timeSlot index -> reservations
  byStatus: Map<Reservation['status'], Reservation[]>;
  indices: {
    tableTimeIndex: Map<string, Map<number, Reservation[]>>; // tableId -> timeSlot -> reservations
  };
}

/**
 * Normaliza reservas en estructuras indexadas para búsquedas O(1)
 */
export function normalizeReservations(reservations: Reservation[]): NormalizedReservations {
  const byId = new Map<string, Reservation>();
  const byTableId = new Map<string, Reservation[]>();
  const byTimeSlot = new Map<number, Reservation[]>();
  const byStatus = new Map<Reservation['status'], Reservation[]>();
  const tableTimeIndex = new Map<string, Map<number, Reservation[]>>();

  reservations.forEach((reservation) => {
    // Index por ID
    byId.set(reservation.id, reservation);

    // Index por mesa
    if (!byTableId.has(reservation.tableId)) {
      byTableId.set(reservation.tableId, []);
    }
    byTableId.get(reservation.tableId)!.push(reservation);

    // Index por status
    if (!byStatus.has(reservation.status)) {
      byStatus.set(reservation.status, []);
    }
    byStatus.get(reservation.status)!.push(reservation);

    // Index por timeSlot (calcula el slot de inicio)
    const startTime = new Date(reservation.startTime);
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const timeSlot = Math.floor((startMinutes - 11 * 60) / 15); // 11:00 es slot 0

    if (timeSlot >= 0) {
      if (!byTimeSlot.has(timeSlot)) {
        byTimeSlot.set(timeSlot, []);
      }
      byTimeSlot.get(timeSlot)!.push(reservation);

      // Index por mesa + timeSlot (para búsquedas ultra-rápidas)
      if (!tableTimeIndex.has(reservation.tableId)) {
        tableTimeIndex.set(reservation.tableId, new Map());
      }
      const tableIndex = tableTimeIndex.get(reservation.tableId)!;
      if (!tableIndex.has(timeSlot)) {
        tableIndex.set(timeSlot, []);
      }
      tableIndex.get(timeSlot)!.push(reservation);
    }
  });

  return {
    byId,
    byTableId,
    byTimeSlot,
    byStatus,
    indices: {
      tableTimeIndex,
    },
  };
}

/**
 * Encuentra reservas para una mesa en un timeSlot específico (O(1))
 */
export function getReservationsAtTableTimeSlot(
  normalized: NormalizedReservations,
  tableId: string,
  timeSlot: number
): Reservation[] {
  return normalized.indices.tableTimeIndex.get(tableId)?.get(timeSlot) || [];
}

/**
 * Encuentra todas las reservas de una mesa (O(1))
 */
export function getReservationsByTable(
  normalized: NormalizedReservations,
  tableId: string
): Reservation[] {
  return normalized.byTableId.get(tableId) || [];
}

// ============================================================================
// DEBOUNCING
// ============================================================================

/**
 * Crea una función debounced que retrasa la ejecución
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Versión de debounce con cancelación
 */
export function debounceWithCancel<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): { debounced: (...args: Parameters<T>) => void; cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return { debounced, cancel };
}

// ============================================================================
// REQUEST ANIMATION FRAME
// ============================================================================

/**
 * Ejecuta una función usando requestAnimationFrame para smooth updates
 */
export function rafDebounce<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      rafId = null;
      func(...args);
    });
  };
}

/**
 * Throttle usando requestAnimationFrame (para eventos de scroll/drag)
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const execute = () => {
    if (lastArgs) {
      func(...lastArgs);
      lastArgs = null;
    }
    rafId = null;
  };

  return function executedFunction(...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(execute);
    }
  };
}

// ============================================================================
// VIRTUAL SCROLLING HELPERS
// ============================================================================

export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Número de items a renderizar fuera del viewport
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
  visibleItems: number[];
}

/**
 * Calcula qué items deben ser renderizados en virtual scrolling
 */
export function calculateVirtualScroll(
  scrollTop: number,
  totalItems: number,
  config: VirtualScrollConfig
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 2 } = config;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems: number[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(i);
  }

  return {
    startIndex,
    endIndex,
    totalHeight: totalItems * itemHeight,
    offsetY: startIndex * itemHeight,
    visibleItems,
  };
}

// ============================================================================
// COORDINATE SYSTEM HELPERS
// ============================================================================

/**
 * Convierte tiempo (minutos desde medianoche) a píxeles X
 */
export function timeToPixels(
  minutes: number,
  startHour: number,
  stepPx: number
): number {
  const startMinutes = startHour * 60;
  const offsetMinutes = minutes - startMinutes;
  return Math.max(0, (offsetMinutes / 15) * stepPx);
}

/**
 * Convierte píxeles X a tiempo (minutos desde medianoche)
 */
export function pixelsToTime(
  pixels: number,
  startHour: number,
  stepPx: number
): number {
  const slot = Math.floor(pixels / stepPx);
  return startHour * 60 + slot * 15;
}

/**
 * Convierte índice de mesa (Y) a píxeles Y
 */
export function tableIndexToPixels(tableIndex: number, rowHeight: number): number {
  return tableIndex * rowHeight;
}

/**
 * Convierte píxeles Y a índice de mesa
 */
export function pixelsToTableIndex(pixels: number, rowHeight: number): number {
  return Math.floor(pixels / rowHeight);
}

// ============================================================================
// MEMOIZATION HELPERS
// ============================================================================

/**
 * Compara dos arrays de reservas para determinar si cambiaron
 */
export function reservationsEqual(
  a: Reservation[],
  b: Reservation[]
): boolean {
  if (a.length !== b.length) return false;

  const aIds = new Set(a.map((r) => r.id));
  const bIds = new Set(b.map((r) => r.id));

  if (aIds.size !== bIds.size) return false;

  for (const id of aIds) {
    if (!bIds.has(id)) return false;
    
    const aRes = a.find((r) => r.id === id);
    const bRes = b.find((r) => r.id === id);
    
    if (!aRes || !bRes) return false;
    if (aRes.updatedAt !== bRes.updatedAt) return false;
  }

  return true;
}

/**
 * Compara dos mapas para determinar si cambiaron
 */
export function mapsEqual<K, V>(a: Map<K, V>, b: Map<K, V>): boolean {
  if (a.size !== b.size) return false;

  for (const [key, value] of a) {
    if (!b.has(key)) return false;
    if (b.get(key) !== value) return false;
  }

  return true;
}

