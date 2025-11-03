/**
 * ============================================================================
 * SEED DATA GENERATOR
 * ============================================================================
 * 
 * Genera datos de ejemplo en formato JSON para testing y desarrollo.
 * Compatible con el formato especificado en los requerimientos.
 */

import type { Reservation, Table, Sector } from '../Interfaces/interfaces';

// ============================================================================
// INTERFACES PARA SEED DATA
// ============================================================================

export interface SeedRestaurant {
  id: string;
  name: string;
  timezone: string;
  serviceHours: Array<{ start: string; end: string }>;
}

export interface SeedSector {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export interface SeedTable {
  id: string;
  sectorId: string;
  name: string;
  capacity: { min: number; max: number };
  sortOrder: number;
}

export interface SeedData {
  date: string;
  restaurant: SeedRestaurant;
  sectors: SeedSector[];
  tables: SeedTable[];
  reservations: Reservation[];
}

// ============================================================================
// DATOS BASE DEL RESTAURANTE
// ============================================================================

export const seedRestaurant: SeedRestaurant = {
  id: 'R1',
  name: 'Bistro Central',
  timezone: 'America/Argentina/Buenos_Aires',
  serviceHours: [
    { start: '12:00', end: '16:00' },
    { start: '20:00', end: '00:00' },
  ],
};

export const seedSectors: SeedSector[] = [
  { id: 'S1', name: 'Main Hall', color: '#3B82F6', sortOrder: 0 },
  { id: 'S2', name: 'Terrace', color: '#10B981', sortOrder: 1 },
  { id: 'S3', name: 'Bar', color: '#F59E0B', sortOrder: 2 },
];

export const seedTables: SeedTable[] = [
  // Main Hall (S1)
  { id: 'T1', sectorId: 'S1', name: 'Table 1', capacity: { min: 2, max: 2 }, sortOrder: 0 },
  { id: 'T2', sectorId: 'S1', name: 'Table 2', capacity: { min: 2, max: 4 }, sortOrder: 1 },
  { id: 'T3', sectorId: 'S1', name: 'Table 3', capacity: { min: 4, max: 6 }, sortOrder: 2 },
  { id: 'T4', sectorId: 'S1', name: 'Table 4', capacity: { min: 4, max: 6 }, sortOrder: 3 },
  { id: 'T5', sectorId: 'S1', name: 'Table 5', capacity: { min: 6, max: 8 }, sortOrder: 4 },
  
  // Terrace (S2)
  { id: 'T6', sectorId: 'S2', name: 'Table 6', capacity: { min: 2, max: 4 }, sortOrder: 0 },
  { id: 'T7', sectorId: 'S2', name: 'Table 7', capacity: { min: 2, max: 4 }, sortOrder: 1 },
  { id: 'T8', sectorId: 'S2', name: 'Table 8', capacity: { min: 4, max: 6 }, sortOrder: 2 },
  { id: 'T9', sectorId: 'S2', name: 'Table 9', capacity: { min: 4, max: 8 }, sortOrder: 3 },
  { id: 'T10', sectorId: 'S2', name: 'Table 10', capacity: { min: 6, max: 8 }, sortOrder: 4 },
  
  // Bar (S3)
  { id: 'T11', sectorId: 'S3', name: 'Bar Counter 1', capacity: { min: 1, max: 2 }, sortOrder: 0 },
  { id: 'T12', sectorId: 'S3', name: 'Bar Counter 2', capacity: { min: 1, max: 2 }, sortOrder: 1 },
  { id: 'T13', sectorId: 'S3', name: 'Bar Table 1', capacity: { min: 2, max: 4 }, sortOrder: 2 },
  { id: 'T14', sectorId: 'S3', name: 'Bar Table 2', capacity: { min: 2, max: 4 }, sortOrder: 3 },
];

// ============================================================================
// RESERVAS DE EJEMPLO
// ============================================================================

function createDateTime(dateStr: string, hour: number, minute: number = 0): string {
  const date = new Date(dateStr);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const seedReservations: Reservation[] = [
  {
    id: 'RES_001',
    tableId: 'T1',
    customer: {
      name: 'John Doe',
      phone: '+54 9 11 5555-1234',
      email: 'john@example.com',
    },
    partySize: 2,
    startTime: '2025-10-15T20:00:00-03:00',
    endTime: '2025-10-15T21:30:00-03:00',
    durationMinutes: 90,
    status: 'CONFIRMED',
    priority: 'STANDARD',
    source: 'web',
    createdAt: '2025-10-14T15:30:00-03:00',
    updatedAt: '2025-10-14T15:30:00-03:00',
  },
  {
    id: 'RES_002',
    tableId: 'T3',
    customer: {
      name: 'Jane Smith',
      phone: '+54 9 11 5555-5678',
      email: 'jane@example.com',
    },
    partySize: 6,
    startTime: '2025-10-15T20:30:00-03:00',
    endTime: '2025-10-15T22:00:00-03:00',
    durationMinutes: 90,
    status: 'SEATED',
    priority: 'VIP',
    notes: 'Birthday celebration',
    source: 'phone',
    createdAt: '2025-10-15T19:45:00-03:00',
    updatedAt: '2025-10-15T20:35:00-03:00',
  },
];

// ============================================================================
// GENERADOR DE RESERVAS ALEATORIAS
// ============================================================================

const FIRST_NAMES = [
  'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofía',
  'Diego', 'Carmen', 'Miguel', 'Elena', 'Fernando', 'Patricia', 'Roberto', 'Lucía',
  'Javier', 'Isabel', 'Antonio', 'Andrea', 'Francisco', 'Natalia', 'Manuel', 'Gabriela',
  'Ricardo', 'Monica', 'Alejandro', 'Valentina', 'Gonzalo', 'Camila', 'Sergio', 'Martina',
];

const LAST_NAMES = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez',
  'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez',
  'Muñoz', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez',
  'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales',
];

const STATUSES: Reservation['status'][] = ['PENDING', 'CONFIRMED', 'SEATED', 'FINISHED', 'NO_SHOW', 'CANCELLED'];
const PRIORITIES: Reservation['priority'][] = ['STANDARD', 'VIP', 'LARGE_GROUP'];
const SOURCES: Reservation['source'][] = ['web', 'phone', 'app', 'walkin'];

/**
 * Genera una reserva aleatoria para una fecha específica
 */
function generateRandomReservation(
  date: string,
  tableId: string,
  tableCapacity: { min: number; max: number }
): Reservation {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const name = `${firstName} ${lastName}`;
  
  // Generar teléfono argentino aleatorio
  const areaCode = Math.floor(Math.random() * 20) + 11; // 11-30
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  const phone = `+54 9 ${areaCode} ${number.slice(0, 4)}-${number.slice(4)}`;
  
  // Horario de servicio: 12:00-16:00 o 20:00-00:00
  const useLunchService = Math.random() > 0.5;
  let startHour: number;
  let startMinute: number;
  
  if (useLunchService) {
    // 12:00 - 16:00 (última reserva debe terminar antes de las 16:00)
    startHour = Math.floor(Math.random() * 3) + 12; // 12, 13, 14
    startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  } else {
    // 20:00 - 00:00 (última reserva debe terminar antes de las 00:00)
    startHour = Math.floor(Math.random() * 3) + 20; // 20, 21, 22
    startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  }
  
  // Duración: 60, 90, 120 minutos (más probabilidad de 90)
  const durations = [60, 90, 90, 90, 120];
  const durationMinutes = durations[Math.floor(Math.random() * durations.length)];
  
  // Party size dentro de la capacidad de la mesa
  const partySize = Math.floor(
    Math.random() * (tableCapacity.max - tableCapacity.min + 1)
  ) + tableCapacity.min;
  
  const startTime = createDateTime(date, startHour, startMinute);
  let endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60 * 1000).toISOString();
  
  // Verificar que no pase del horario de servicio
  const endDate = new Date(endTime);
  const endHour = endDate.getHours();
  
  let finalDurationMinutes = durationMinutes;
  
  // Si la reserva termina después de medianoche o después de las 16:00 en servicio de almuerzo
  if ((useLunchService && endHour >= 16) || (!useLunchService && endHour >= 24)) {
    // Ajustar duración para que termine a tiempo
    const maxEndHour = useLunchService ? 16 : 24;
    const maxEndTime = createDateTime(date, maxEndHour, 0);
    finalDurationMinutes = Math.floor(
      (new Date(maxEndTime).getTime() - new Date(startTime).getTime()) / (60 * 1000)
    );
    
    // Si la duración ajustada es muy corta, retry
    if (finalDurationMinutes < 30) {
      return generateRandomReservation(date, tableId, tableCapacity);
    }
    
    // Recalcular endTime con la duración ajustada
    endTime = new Date(new Date(startTime).getTime() + finalDurationMinutes * 60 * 1000).toISOString();
  }
  
  const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
  const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
  const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  
  const createdAt = new Date(new Date(startTime).getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
  const updatedAt = status === 'SEATED' || status === 'FINISHED' 
    ? new Date(startTime).toISOString() 
    : createdAt;
  
  return {
    id: `RES_${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tableId,
    customer: {
      name,
      phone,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    },
    partySize,
    startTime,
    endTime,
    durationMinutes: finalDurationMinutes,
    status,
    priority,
    source,
    createdAt,
    updatedAt,
    notes: Math.random() > 0.7 ? `Special request: ${['Window seat', 'Quiet table', 'Birthday', 'Anniversary'][Math.floor(Math.random() * 4)]}` : undefined,
  };
}

/**
 * Genera múltiples reservas aleatorias para testing de performance
 * 
 * @param count Número de reservas a generar (default: 100)
 * @param date Fecha base para las reservas en formato YYYY-MM-DD (default: hoy)
 * @returns Array de reservas aleatorias ordenadas por hora de inicio
 * 
 * @example
 * ```typescript
 * // Generar 100 reservas para hoy
 * const reservations = generateRandomReservations(100);
 * 
 * // Generar 200 reservas para una fecha específica
 * const reservations = generateRandomReservations(200, '2025-10-15');
 * 
 * // Usar en app/page.tsx para cargar en la UI:
 * import { generateRandomReservations } from "../mocks/seedData";
 * const randomReservations = generateRandomReservations(100);
 * setReservations(randomReservations);
 * ```
 */
export function generateRandomReservations(
  count: number = 100,
  date: string = new Date().toISOString().split('T')[0]
): Reservation[] {
  const reservations: Reservation[] = [];
  const reservationsByTable = new Map<string, Reservation[]>();
  
  // Distribuir reservas entre las mesas
  for (let i = 0; i < count; i++) {
    const table = seedTables[i % seedTables.length];
    const tableReservations = reservationsByTable.get(table.id) || [];
    
    // Intentar generar reserva hasta encontrar un slot sin conflicto
    let attempts = 0;
    let reservation: Reservation | null = null;
    
    while (attempts < 10 && !reservation) {
      const candidate = generateRandomReservation(date, table.id, table.capacity);
      
      // Verificar conflictos con reservas existentes de la misma mesa
      const hasConflict = tableReservations.some((existing) => {
        const existingStart = new Date(existing.startTime).getTime();
        const existingEnd = new Date(existing.endTime).getTime();
        const candidateStart = new Date(candidate.startTime).getTime();
        const candidateEnd = new Date(candidate.endTime).getTime();
        
        return (
          (candidateStart >= existingStart && candidateStart < existingEnd) ||
          (candidateEnd > existingStart && candidateEnd <= existingEnd) ||
          (candidateStart <= existingStart && candidateEnd >= existingEnd)
        );
      });
      
      if (!hasConflict) {
        reservation = candidate;
      }
      
      attempts++;
    }
    
    if (reservation) {
      reservations.push(reservation);
      tableReservations.push(reservation);
      reservationsByTable.set(table.id, tableReservations);
    }
  }
  
  return reservations.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

// ============================================================================
// EXPORTAR SEED DATA COMPLETO
// ============================================================================

/**
 * Genera el objeto seed data completo en formato JSON
 */
export function generateSeedData(date?: string): SeedData {
  const targetDate = date || '2025-10-15';
  
  return {
    date: targetDate,
    restaurant: seedRestaurant,
    sectors: seedSectors,
    tables: seedTables,
    reservations: seedReservations,
  };
}

/**
 * Genera seed data con reservas aleatorias para performance testing
 */
export function generateSeedDataWithRandomReservations(
  reservationCount: number = 100,
  date?: string
): SeedData {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const randomReservations = generateRandomReservations(reservationCount, targetDate);
  
  return {
    date: targetDate,
    restaurant: seedRestaurant,
    sectors: seedSectors,
    tables: seedTables,
    reservations: [...seedReservations, ...randomReservations],
  };
}

// ============================================================================
// EXPORTAR COMO JSON
// ============================================================================

/**
 * Exporta seed data como string JSON formateado
 */
export function exportSeedDataAsJSON(seedData: SeedData): string {
  return JSON.stringify(seedData, null, 2);
}

/**
 * Helper para usar en desarrollo: carga seed data al store
 */
export function loadSeedDataToStore(seedData: SeedData) {
  // Esta función se puede usar para inicializar stores con seed data
  return seedData;
}

