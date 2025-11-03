import type { Reservation, Table, Sector } from '../../../../Interfaces/interfaces';
import { generateTimeSlots } from './timeUtils';
import { findConflict } from './validationUtils';

/**
 * ============================================================================
 * SISTEMA DE ANALÍTICA DE CAPACIDAD
 * ============================================================================
 * 
 * Este módulo provee análisis en tiempo real de:
 * - Ocupación por franja horaria
 * - Mapas de calor de utilización
 * - Comparaciones históricas
 * - Métricas de rendimiento
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface TimeSlotCapacity {
  timeSlot: number; // Minutos desde medianoche
  timeLabel: string; // Formato HH:MM
  totalTables: number;
  occupiedTables: number;
  availableTables: number;
  occupancyPercent: number;
  totalCapacity: number;
  usedCapacity: number;
  status: 'low' | 'medium' | 'high' | 'full';
}

export interface SectorCapacityStats {
  sector: string;
  totalTables: number;
  averageOccupancy: number;
  peakHour: string;
  peakOccupancy: number;
  utilizationScore: number; // 0-100
}

export interface DayComparison {
  date: string;
  totalReservations: number;
  averageOccupancy: number;
  peakOccupancy: number;
  totalRevenue: number; // Placeholder para futura implementación
}

// ============================================================================
// ANÁLISIS POR FRANJA HORARIA
// ============================================================================

/**
 * Calcula la ocupación para cada franja horaria del día
 */
export function calculateHourlyCapacity(
  tables: Table[],
  reservations: Reservation[],
  date: Date = new Date()
): TimeSlotCapacity[] {
  // Filtrar reservas del día seleccionado (incluye pasado y futuro del día)
  const dayReservations = filterReservationsByDate(reservations, date);
  
  const timeSlots = generateTimeSlots();
  const capacityData: TimeSlotCapacity[] = [];

  for (const timeSlot of timeSlots) {
    // Convertir timeSlot a ISO string
    const slotDate = new Date(date);
    slotDate.setHours(Math.floor(timeSlot / 60), timeSlot % 60, 0, 0);
    const startTime = slotDate.toISOString();

    let occupiedCount = 0;
    let usedCapacity = 0;
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity.max, 0);

    // Contar mesas ocupadas en este slot
    for (const table of tables) {
      const conflict = findConflict(
        dayReservations,  // Usar reservas filtradas del día
        table.id,
        startTime,
        15 // Duración de la franja (15 min)
      );

      if (conflict) {
        occupiedCount++;
        // Encontrar la reserva para obtener el party size
        const reservation = dayReservations.find(r => r.id === conflict);
        if (reservation) {
          usedCapacity += reservation.partySize;
        }
      }
    }

    const occupancyPercent = Math.round((occupiedCount / tables.length) * 100);
    const status = getOccupancyStatus(occupancyPercent);

    capacityData.push({
      timeSlot,
      timeLabel: formatTimeSlot(timeSlot),
      totalTables: tables.length,
      occupiedTables: occupiedCount,
      availableTables: tables.length - occupiedCount,
      occupancyPercent,
      totalCapacity,
      usedCapacity,
      status,
    });
  }

  return capacityData;
}

/**
 * Determina el nivel de ocupación
 */
function getOccupancyStatus(percent: number): 'low' | 'medium' | 'high' | 'full' {
  if (percent >= 100) return 'full';
  if (percent >= 90) return 'high';
  if (percent >= 70) return 'medium';
  return 'low';
}

/**
 * Formatea un timeSlot (minutos) a HH:MM
 */
function formatTimeSlot(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// ============================================================================
// ANÁLISIS POR SECTOR
// ============================================================================

/**
 * Calcula estadísticas de ocupación por sector
 */
export function analyzeSectorCapacity(
  tables: Table[],
  reservations: Reservation[],
  date: Date = new Date(),
  sectors: Sector[] = []
): SectorCapacityStats[] {
  // Filtrar reservas del día seleccionado (incluye pasado y futuro del día)
  const dayReservations = filterReservationsByDate(reservations, date);
  
  // Crear mapa de sectorId -> nombre del sector
  const sectorNameMap = new Map<string, string>();
  sectors.forEach(sector => {
    sectorNameMap.set(sector.id, sector.name);
  });
  
  // Agrupar mesas por sectorId
  const sectorMap = new Map<string, Table[]>();
  tables.forEach(table => {
    const sectorId = table.sectorId;
    const existing = sectorMap.get(sectorId) || [];
    existing.push(table);
    sectorMap.set(sectorId, existing);
  });

  const stats: SectorCapacityStats[] = [];

  for (const [sectorId, sectorTables] of sectorMap.entries()) {
    // Obtener nombre del sector (o usar sectorId como fallback)
    const sectorName = sectorNameMap.get(sectorId) || sectorId;
    
    const hourlyData = calculateHourlyCapacity(sectorTables, dayReservations, date);
    
    // Calcular promedio de ocupación
    const avgOccupancy = Math.round(
      hourlyData.reduce((sum, slot) => sum + slot.occupancyPercent, 0) / hourlyData.length
    );

    // Encontrar hora pico
    const peakSlot = hourlyData.reduce((max, slot) => 
      slot.occupancyPercent > max.occupancyPercent ? slot : max
    );

    // Calcular score de utilización (considera distribución de ocupación)
    const utilizationScore = calculateUtilizationScore(hourlyData);

    stats.push({
      sector: sectorName,
      totalTables: sectorTables.length,
      averageOccupancy: avgOccupancy,
      peakHour: peakSlot.timeLabel,
      peakOccupancy: peakSlot.occupancyPercent,
      utilizationScore,
    });
  }

  return stats.sort((a, b) => b.averageOccupancy - a.averageOccupancy);
}

/**
 * Calcula un score de qué tan bien se está utilizando la capacidad
 * Score alto = buena distribución de ocupación a lo largo del día
 */
function calculateUtilizationScore(hourlyData: TimeSlotCapacity[]): number {
  // Slots con ocupación óptima (70-90%)
  const optimalSlots = hourlyData.filter(
    slot => slot.occupancyPercent >= 70 && slot.occupancyPercent <= 90
  ).length;

  // Slots con ocupación baja (<50%)
  const lowSlots = hourlyData.filter(
    slot => slot.occupancyPercent < 50
  ).length;

  // Score basado en distribución
  const optimalRatio = optimalSlots / hourlyData.length;
  const lowPenalty = lowSlots / hourlyData.length;

  const score = (optimalRatio * 100) - (lowPenalty * 30);
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// MAPA DE CALOR
// ============================================================================

/**
 * Genera datos para un mapa de calor de ocupación
 * Retorna matriz de valores 0-100 (percent de ocupación)
 */
export function generateHeatmapData(
  tables: Table[],
  reservations: Reservation[],
  startDate: Date,
  days: number = 7
): {
  dates: string[];
  timeSlots: string[];
  data: number[][]; // [día][hora] = % ocupación
} {
  const dates: string[] = [];
  const timeSlots = generateTimeSlots();
  const timeLabels = timeSlots.map(slot => formatTimeSlot(slot));
  const data: number[][] = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);
    dates.push(date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }));

    // Calcular ocupación para este día
    const dayCapacity = calculateHourlyCapacity(tables, reservations, date);
    const dayData = dayCapacity.map(slot => slot.occupancyPercent);
    data.push(dayData);
  }

  return {
    dates,
    timeSlots: timeLabels,
    data,
  };
}

// ============================================================================
// COMPARACIÓN HISTÓRICA
// ============================================================================

/**
 * Compara estadísticas entre diferentes períodos
 */
export function comparePeriods(
  tables: Table[],
  reservations: Reservation[],
  currentDate: Date,
  comparisonDate: Date
): {
  current: DayComparison;
  comparison: DayComparison;
  changes: {
    reservations: number; // % change
    occupancy: number; // % change
    trend: 'up' | 'down' | 'stable';
  };
} {
  // Filtrar reservas por fecha
  const currentReservations = filterReservationsByDate(reservations, currentDate);
  const comparisonReservations = filterReservationsByDate(reservations, comparisonDate);

  // Calcular stats para cada período
  const currentStats = calculateDayStats(tables, currentReservations, currentDate);
  const comparisonStats = calculateDayStats(tables, comparisonReservations, comparisonDate);

  // Calcular cambios
  const reservationChange = calculatePercentChange(
    comparisonStats.totalReservations,
    currentStats.totalReservations
  );
  const occupancyChange = calculatePercentChange(
    comparisonStats.averageOccupancy,
    currentStats.averageOccupancy
  );

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (occupancyChange > 5) trend = 'up';
  else if (occupancyChange < -5) trend = 'down';

  return {
    current: currentStats,
    comparison: comparisonStats,
    changes: {
      reservations: reservationChange,
      occupancy: occupancyChange,
      trend,
    },
  };
}

/**
 * Filtra reservas por día específico
 */
function filterReservationsByDate(reservations: Reservation[], date: Date): Reservation[] {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return reservations.filter(r => {
    const resDate = new Date(r.startTime);
    return resDate >= dayStart && resDate <= dayEnd;
  });
}

/**
 * Calcula estadísticas para un día específico
 */
function calculateDayStats(
  tables: Table[],
  reservations: Reservation[],
  date: Date
): DayComparison {
  const hourlyData = calculateHourlyCapacity(tables, reservations, date);
  
  const avgOccupancy = Math.round(
    hourlyData.reduce((sum, slot) => sum + slot.occupancyPercent, 0) / hourlyData.length
  );

  const peakOccupancy = Math.max(...hourlyData.map(slot => slot.occupancyPercent));

  return {
    date: date.toLocaleDateString('es-AR'),
    totalReservations: reservations.length,
    averageOccupancy: avgOccupancy,
    peakOccupancy,
    totalRevenue: 0, // Placeholder
  };
}

/**
 * Calcula cambio porcentual
 */
function calculatePercentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100);
}

// ============================================================================
// MÉTRICAS DE RENDIMIENTO
// ============================================================================

/**
 * Calcula KPIs clave para el día
 */
export function calculateDailyKPIs(
  tables: Table[],
  reservations: Reservation[],
  date: Date = new Date(),
  sectors: Sector[] = []
): {
  totalReservations: number;
  averageOccupancy: number;
  peakOccupancy: number;
  peakHour: string;
  utilizationScore: number;
  turnsPerTable: number; // Rotación promedio
  mostPopularSector: string;
} {
  const dayReservations = filterReservationsByDate(reservations, date);
  const hourlyData = calculateHourlyCapacity(tables, dayReservations, date);
  const sectorStats = analyzeSectorCapacity(tables, dayReservations, date, sectors);

  const avgOccupancy = Math.round(
    hourlyData.reduce((sum, slot) => sum + slot.occupancyPercent, 0) / hourlyData.length
  );

  const peakSlot = hourlyData.reduce((max, slot) => 
    slot.occupancyPercent > max.occupancyPercent ? slot : max
  );

  const utilizationScore = calculateUtilizationScore(hourlyData);

  // Calcular rotación promedio (reservas por mesa)
  const turnsPerTable = tables.length > 0 
    ? Number((dayReservations.length / tables.length).toFixed(1))
    : 0;

  const mostPopularSector = sectorStats.length > 0 
    ? sectorStats[0].sector 
    : 'N/A';

  return {
    totalReservations: dayReservations.length,
    averageOccupancy: avgOccupancy,
    peakOccupancy: peakSlot.occupancyPercent,
    peakHour: peakSlot.timeLabel,
    utilizationScore,
    turnsPerTable,
    mostPopularSector,
  };
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default {
  calculateHourlyCapacity,
  analyzeSectorCapacity,
  generateHeatmapData,
  comparePeriods,
  calculateDailyKPIs,
};

