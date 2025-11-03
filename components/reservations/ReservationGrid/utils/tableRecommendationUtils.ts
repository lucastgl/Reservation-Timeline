import type { Reservation, Table, Sector } from '../../../../Interfaces/interfaces';
import { findConflict } from './validationUtils';

/**
 * ============================================================================
 * SISTEMA DE RECOMENDACIÓN INTELIGENTE DE MESAS
 * ============================================================================
 * 
 * Este módulo provee funcionalidades para:
 * - Encontrar la mejor mesa disponible según tamaño del grupo
 * - Buscar horarios alternativos cuando el solicitado está ocupado
 * - Optimizar la asignación de mesas para maximizar capacidad
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface TableRecommendation {
  table: Table;
  score: number; // 0-100: qué tan adecuada es la mesa
  reason: string; // Explicación de por qué se recomienda
  isOptimal: boolean; // true si es el mejor match posible
}

export interface TimeSlotRecommendation {
  startTime: string;
  endTime: string;
  offsetMinutes: number; // diferencia con el horario solicitado
  availableTables: TableRecommendation[];
  totalCapacity: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const PERFECT_MATCH_SCORE = 100;
const GOOD_MATCH_THRESHOLD = 70;
const WASTE_PENALTY_PER_SEAT = 5; // Penalización por asiento desperdiciado

// ============================================================================
// FUNCIÓN PRINCIPAL: RECOMENDAR MESA
// ============================================================================

/**
 * Encuentra las mejores mesas disponibles para un grupo
 * @param tables - Lista de todas las mesas
 * @param reservations - Reservas existentes
 * @param partySize - Tamaño del grupo
 * @param startTime - Hora de inicio deseada
 * @param duration - Duración en minutos
 * @param preferredSector - Sector preferido (opcional, puede ser nombre o ID)
 * @param sectors - Lista de sectores para hacer lookup de nombres (opcional)
 * @returns Array de recomendaciones ordenadas por score
 */
export function recommendTables(
  tables: Table[],
  reservations: Reservation[],
  partySize: number,
  startTime: string,
  duration: number,
  preferredSector?: string,
  sectors: Sector[] = []
): TableRecommendation[] {
  // Crear mapa de sectorId -> nombre del sector
  const sectorNameMap = new Map<string, string>();
  sectors.forEach(sector => {
    sectorNameMap.set(sector.id, sector.name);
  });

  const recommendations: TableRecommendation[] = [];

  for (const table of tables) {
    // 1. Verificar si la mesa está disponible
    const conflict = findConflict(
      reservations,
      table.id,
      startTime,
      duration
    );

    if (conflict) continue; // Mesa ocupada, siguiente

    // 2. Verificar capacidad mínima y máxima
    if (partySize < table.capacity.min || partySize > table.capacity.max) {
      continue; // No cumple requisitos de capacidad
    }

    // 3. Calcular score de adecuación
    const score = calculateTableScore(table, partySize, preferredSector, sectorNameMap);
    const reason = generateRecommendationReason(table, partySize, preferredSector, sectorNameMap);
    const isOptimal = score === PERFECT_MATCH_SCORE;

    recommendations.push({
      table,
      score,
      reason,
      isOptimal,
    });
  }

  // Ordenar por score descendente
  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Calcula el score de adecuación de una mesa
 * Score perfecto (100): Mesa ideal para el tamaño del grupo en sector preferido
 */
function calculateTableScore(
  table: Table,
  partySize: number,
  preferredSector?: string,
  sectorNameMap: Map<string, string> = new Map()
): number {
  let score = 100;

  // Penalización por asientos desperdiciados
  const wastedSeats = table.capacity.max - partySize;
  score -= wastedSeats * WASTE_PENALTY_PER_SEAT;

  // Bonus si está en el sector preferido
  if (preferredSector) {
    // Obtener nombre del sector de la mesa
    const tableSectorName = sectorNameMap.get(table.sectorId) || table.sectorId;
    
    // Comparar con preferredSector (puede ser nombre o ID)
    const isPreferredSector = 
      tableSectorName === preferredSector || 
      table.sectorId === preferredSector ||
      // Compatibilidad: algunos objetos Table pueden tener 'sector' como string
      (table as Table & { sector?: string }).sector === preferredSector;
    
    if (isPreferredSector) {
      score += 10;
    }
  }

  // Bonus si el grupo está en el rango ideal (80% - 100% de capacidad)
  const utilizationPercent = (partySize / table.capacity.max) * 100;
  if (utilizationPercent >= 80 && utilizationPercent <= 100) {
    score += 15;
  }

  // Asegurar que el score esté en rango 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Genera una explicación legible de por qué se recomienda esta mesa
 */
function generateRecommendationReason(
  table: Table,
  partySize: number,
  preferredSector?: string,
  sectorNameMap: Map<string, string> = new Map()
): string {
  const utilizationPercent = Math.round((partySize / table.capacity.max) * 100);
  const wastedSeats = table.capacity.max - partySize;

  let reason = `Capacidad ${table.capacity.min}-${table.capacity.max} personas`;

  if (wastedSeats === 0) {
    reason += ' (Match perfecto ✨)';
  } else if (wastedSeats <= 2) {
    reason += ` (${wastedSeats} asiento${wastedSeats > 1 ? 's' : ''} libre${wastedSeats > 1 ? 's' : ''})`;
  } else {
    reason += ` (Utilización: ${utilizationPercent}%)`;
  }

  if (preferredSector) {
    // Obtener nombre del sector de la mesa
    const tableSectorName = sectorNameMap.get(table.sectorId) || table.sectorId;
    
    // Comparar con preferredSector (puede ser nombre o ID)
    const isPreferredSector = 
      tableSectorName === preferredSector || 
      table.sectorId === preferredSector ||
      // Compatibilidad: algunos objetos Table pueden tener 'sector' como string
      (table as Table & { sector?: string }).sector === preferredSector;
    
    if (isPreferredSector) {
      reason += ` • En ${tableSectorName} 🎯`;
    }
  }

  return reason;
}

// ============================================================================
// BUSCAR SIGUIENTE HORARIO DISPONIBLE
// ============================================================================

/**
 * Busca horarios alternativos cuando el horario solicitado está ocupado
 * @param tables - Lista de todas las mesas
 * @param reservations - Reservas existentes
 * @param partySize - Tamaño del grupo
 * @param requestedStartTime - Hora solicitada originalmente
 * @param duration - Duración en minutos
 * @param searchWindows - Ventanas de búsqueda en minutos [15, 30, 60]
 * @returns Array de horarios alternativos ordenados por cercanía
 */
export function findAlternativeTimeSlots(
  tables: Table[],
  reservations: Reservation[],
  partySize: number,
  requestedStartTime: string,
  duration: number,
  searchWindows: number[] = [15, 30, 60]
): TimeSlotRecommendation[] {
  const alternatives: TimeSlotRecommendation[] = [];
  const baseTime = new Date(requestedStartTime).getTime();

  // Buscar en ventanas de tiempo (antes y después)
  for (const windowMinutes of searchWindows) {
    const windowMs = windowMinutes * 60 * 1000;

    // Buscar ANTES del horario solicitado
    const earlierTime = new Date(baseTime - windowMs).toISOString();
    const earlierSlot = checkTimeSlot(
      tables,
      reservations,
      partySize,
      earlierTime,
      duration,
      -windowMinutes
    );
    if (earlierSlot.availableTables.length > 0) {
      alternatives.push(earlierSlot);
    }

    // Buscar DESPUÉS del horario solicitado
    const laterTime = new Date(baseTime + windowMs).toISOString();
    const laterSlot = checkTimeSlot(
      tables,
      reservations,
      partySize,
      laterTime,
      duration,
      windowMinutes
    );
    if (laterSlot.availableTables.length > 0) {
      alternatives.push(laterSlot);
    }
  }

  // Ordenar por cercanía al horario original (menor offset primero)
  return alternatives.sort((a, b) => 
    Math.abs(a.offsetMinutes) - Math.abs(b.offsetMinutes)
  );
}

/**
 * Verifica disponibilidad en un horario específico
 */
function checkTimeSlot(
  tables: Table[],
  reservations: Reservation[],
  partySize: number,
  startTime: string,
  duration: number,
  offsetMinutes: number
): TimeSlotRecommendation {
  const availableTables = recommendTables(
    tables,
    reservations,
    partySize,
    startTime,
    duration
  );

  const totalCapacity = availableTables.reduce(
    (sum, rec) => sum + rec.table.capacity.max,
    0
  );

  const endTime = new Date(
    new Date(startTime).getTime() + duration * 60 * 1000
  ).toISOString();

  return {
    startTime,
    endTime,
    offsetMinutes,
    availableTables,
    totalCapacity,
  };
}

// ============================================================================
// ANÁLISIS DE DISPONIBILIDAD
// ============================================================================

/**
 * Obtiene estadísticas de disponibilidad para un rango de tiempo
 * Útil para mostrar nivel de ocupación general
 */
export function getAvailabilityStats(
  tables: Table[],
  reservations: Reservation[],
  startTime: string,
  duration: number
): {
  totalTables: number;
  availableTables: number;
  occupancyPercent: number;
  availableCapacity: number;
} {
  let availableCount = 0;
  let availableCapacity = 0;

  for (const table of tables) {
    const conflict = findConflict(
      reservations,
      table.id,
      startTime,
      duration
    );

    if (!conflict) {
      availableCount++;
      availableCapacity += table.capacity.max;
    }
  }

  const occupancyPercent = Math.round(
    ((tables.length - availableCount) / tables.length) * 100
  );

  return {
    totalTables: tables.length,
    availableTables: availableCount,
    occupancyPercent,
    availableCapacity,
  };
}

// ============================================================================
// DETECCIÓN DE PATRONES (Preparación para IA)
// ============================================================================

/**
 * Analiza patrones de reserva para sugerencias inteligentes
 * @param customerPhone - Teléfono del cliente
 * @param reservations - Historial de reservas
 * @returns Sugerencias basadas en comportamiento
 */
export function analyzeCustomerPattern(
  customerPhone: string,
  reservations: Reservation[]
): {
  isFrequentCustomer: boolean;
  isPotentialVIP: boolean;
  averagePartySize: number;
  preferredSector: string | null;
  suggestedPriority: Reservation['priority'];
  confidence: number; // 0-100
} {
  // Filtrar reservas del cliente
  const customerReservations = reservations.filter(
    (r) => r.customer.phone === customerPhone
  );

  const reservationCount = customerReservations.length;
  const isFrequentCustomer = reservationCount >= 3;

  // Calcular tamaño promedio de grupo
  const avgPartySize =
    reservationCount > 0
      ? Math.round(
          customerReservations.reduce((sum, r) => sum + r.partySize, 0) /
            reservationCount
        )
      : 0;

  // Detectar sector preferido
  const sectorCounts: Record<string, number> = {};
  customerReservations.forEach((r) => {
    // Necesitaríamos acceso a la info de la mesa para saber el sector
    // Por ahora simplificado
  });

  // Determinar si es potencial VIP
  const isPotentialVIP =
    reservationCount >= 5 || // 5+ reservas
    customerReservations.some((r) => r.priority === 'VIP');

  // Sugerir prioridad
  let suggestedPriority: Reservation['priority'] = 'STANDARD';
  if (isPotentialVIP) {
    suggestedPriority = 'VIP';
  } else if (reservationCount >= 10) {
    suggestedPriority = 'LARGE_GROUP';
  }

  // Nivel de confianza basado en cantidad de datos
  const confidence = Math.min(100, reservationCount * 20);

  return {
    isFrequentCustomer,
    isPotentialVIP,
    averagePartySize: avgPartySize,
    preferredSector: null, // Simplificado por ahora
    suggestedPriority,
    confidence,
  };
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default {
  recommendTables,
  findAlternativeTimeSlots,
  getAvailabilityStats,
  analyzeCustomerPattern,
};

