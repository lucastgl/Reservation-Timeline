import type { WaitlistEntry, WaitlistStats } from '../../../../Interfaces/waitlistInterfaces';
import type { Reservation, Table, Sector } from '../../../../Interfaces/interfaces';
import { findConflict } from './validationUtils';

/**
 * ============================================================================
 * SISTEMA DE GESTIÓN DE LISTA DE ESPERA
 * ============================================================================
 * 
 * Este módulo provee funcionalidades para:
 * - Gestionar cola de espera con prioridades
 * - Calcular tiempos de espera estimados
 * - Auto-promoción cuando hay disponibilidad
 * - Notificaciones simuladas
 */

// ============================================================================
// CONSTANTES
// ============================================================================

const AVERAGE_DINING_TIME = 90; // Minutos promedio por mesa
const VIP_PRIORITY_MULTIPLIER = 2; // Los VIP tienen prioridad x2

// ============================================================================
// GESTIÓN DE LISTA DE ESPERA
// ============================================================================

/**
 * Agrega un cliente a la lista de espera
 */
export function addToWaitlist(
  customer: { name: string; phone: string; email?: string },
  partySize: number,
  preferredTime: string,
  priority: 'STANDARD' | 'VIP' = 'STANDARD',
  preferredSector?: string
): WaitlistEntry {
  const now = new Date().toISOString();

  return {
    id: `waitlist-${Date.now()}`,
    customer,
    partySize,
    preferredTime,
    addedAt: now,
    estimatedWaitMinutes: 0, // Se calculará después
    priority,
    preferredSector,
    status: 'WAITING',
  };
}

/**
 * Calcula tiempo de espera estimado para cada entrada
 */
export function calculateWaitTimes(
  waitlist: WaitlistEntry[],
  tables: Table[],
  reservations: Reservation[],
  sectors: Sector[] = []
): WaitlistEntry[] {
  const now = new Date();
  
  // Crear mapa de sectorId -> nombre del sector
  const sectorNameMap = new Map<string, string>();
  sectors.forEach(sector => {
    sectorNameMap.set(sector.id, sector.name);
  });

  return waitlist.map((entry) => {
    if (entry.status !== 'WAITING') {
      return entry;
    }

    // Buscar mesas adecuadas
    const suitableTables = tables.filter((t) => {
      // Verificar capacidad
      if (entry.partySize < t.capacity.min || entry.partySize > t.capacity.max) {
        return false;
      }
      
      // Verificar sector preferido (si está especificado)
      if (entry.preferredSector) {
        const tableSectorName = sectorNameMap.get(t.sectorId) || t.sectorId;
        const isPreferredSector = 
          tableSectorName === entry.preferredSector ||
          t.sectorId === entry.preferredSector ||
          // Compatibilidad: algunos objetos Table pueden tener 'sector' como string
          (t as Table & { sector?: string }).sector === entry.preferredSector;
        
        if (!isPreferredSector) {
          return false;
        }
      }
      
      return true;
    });

    if (suitableTables.length === 0) {
      return { ...entry, estimatedWaitMinutes: 999 }; // No hay mesas adecuadas
    }

    // Encontrar la próxima mesa disponible
    let minWaitTime = Infinity;

    for (const table of suitableTables) {
      // Buscar cuándo estará libre esta mesa
      const nextAvailable = findNextAvailableTime(
        table,
        reservations,
        now.toISOString()
      );

      if (nextAvailable) {
        const waitMs = new Date(nextAvailable).getTime() - now.getTime();
        const waitMinutes = Math.max(0, Math.ceil(waitMs / (1000 * 60)));
        minWaitTime = Math.min(minWaitTime, waitMinutes);
      }
    }

    // Ajustar por posición en la cola (VIP tiene prioridad)
    const positionInQueue = waitlist
      .filter((e) => e.status === 'WAITING')
      .findIndex((e) => e.id === entry.id);

    const queueAdjustment =
      entry.priority === 'VIP'
        ? Math.floor(positionInQueue / VIP_PRIORITY_MULTIPLIER) * 15
        : positionInQueue * 15;

    const estimatedWaitMinutes =
      minWaitTime === Infinity ? 999 : minWaitTime + queueAdjustment;

    return {
      ...entry,
      estimatedWaitMinutes: Math.round(estimatedWaitMinutes),
    };
  });
}

/**
 * Encuentra el próximo horario disponible para una mesa
 */
function findNextAvailableTime(
  table: Table,
  reservations: Reservation[],
  fromTime: string
): string | null {
  const startTime = new Date(fromTime);
  const endOfDay = new Date(fromTime);
  endOfDay.setHours(23, 59, 59, 999);

  // Buscar en intervalos de 15 minutos
  let currentTime = new Date(startTime);

  while (currentTime <= endOfDay) {
    const timeStr = currentTime.toISOString();
    const conflict = findConflict(
      reservations,
      table.id,
      timeStr,
      AVERAGE_DINING_TIME
    );

    if (!conflict) {
      return timeStr;
    }

    // Avanzar 15 minutos
    currentTime.setMinutes(currentTime.getMinutes() + 15);
  }

  return null; // No disponible hoy
}

// ============================================================================
// AUTO-PROMOCIÓN
// ============================================================================

/**
 * Encuentra entradas de la lista de espera que pueden ser promovidas
 * cuando una mesa se libera
 */
export function findPromotionCandidates(
  waitlist: WaitlistEntry[],
  table: Table,
  availableTime: string,
  currentReservations: Reservation[],
  sectors: Sector[] = []
): WaitlistEntry[] {
  // Crear mapa de sectorId -> nombre del sector
  const sectorNameMap = new Map<string, string>();
  sectors.forEach(sector => {
    sectorNameMap.set(sector.id, sector.name);
  });
  
  const candidates = waitlist
    .filter((entry) => {
      // Solo entradas en espera
      if (entry.status !== 'WAITING') return false;

      // Verificar capacidad
      if (
        entry.partySize < table.capacity.min ||
        entry.partySize > table.capacity.max
      ) {
        return false;
      }

      // Verificar sector preferido
      if (entry.preferredSector) {
        const tableSectorName = sectorNameMap.get(table.sectorId) || table.sectorId;
        const isPreferredSector = 
          tableSectorName === entry.preferredSector ||
          table.sectorId === entry.preferredSector ||
          // Compatibilidad: algunos objetos Table pueden tener 'sector' como string
          (table as Table & { sector?: string }).sector === entry.preferredSector;
        
        if (!isPreferredSector) {
          return false;
        }
      }

      // Verificar que no haya conflicto
      const conflict = findConflict(
        currentReservations,
        table.id,
        availableTime,
        AVERAGE_DINING_TIME
      );

      return !conflict;
    })
    // Ordenar por prioridad y tiempo de espera
    .sort((a, b) => {
      // VIP primero
      if (a.priority === 'VIP' && b.priority !== 'VIP') return -1;
      if (a.priority !== 'VIP' && b.priority === 'VIP') return 1;

      // Por tiempo de espera
      return (
        new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
      );
    });

  return candidates;
}

// ============================================================================
// NOTIFICACIONES
// ============================================================================

/**
 * Simula envío de notificación SMS
 */
export function sendWaitlistNotification(
  entry: WaitlistEntry,
  table: Table,
  availableTime: string,
  sectors: Sector[] = []
): {
  success: boolean;
  message: string;
  notificationId: string;
} {
  const time = new Date(availableTime).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Obtener nombre del sector
  const sectorNameMap = new Map<string, string>();
  sectors.forEach(sector => {
    sectorNameMap.set(sector.id, sector.name);
  });
  const tableSectorName = sectorNameMap.get(table.sectorId) || 
    (table as Table & { sector?: string }).sector || 
    table.sectorId;

  const message = `Hola ${entry.customer.name}! Su mesa para ${entry.partySize} persona${
    entry.partySize > 1 ? 's' : ''
  } está lista. ${table.name} (${tableSectorName}) disponible a las ${time}. Por favor confirme su llegada. - Restaurante`;

  // Simular envío
  console.log(`📱 SMS enviado a ${entry.customer.phone}:`);
  console.log(message);

  return {
    success: true,
    message,
    notificationId: `notif-${Date.now()}`,
  };
}

/**
 * Marca una entrada como notificada
 */
export function markAsNotified(entry: WaitlistEntry): WaitlistEntry {
  return {
    ...entry,
    status: 'NOTIFIED',
    notifiedAt: new Date().toISOString(),
  };
}

/**
 * Convierte entrada de waitlist a reserva
 */
export function convertToReservation(
  entry: WaitlistEntry,
  tableId: string,
  startTime: string
): Partial<Reservation> {
  return {
    id: `res-from-waitlist-${entry.id}`,
    tableId,
    customer: entry.customer,
    partySize: entry.partySize,
    startTime,
    endTime: new Date(
      new Date(startTime).getTime() + AVERAGE_DINING_TIME * 60 * 1000
    ).toISOString(),
    durationMinutes: AVERAGE_DINING_TIME,
    status: 'CONFIRMED',
    priority: entry.priority,
    notes: `Convertido de lista de espera. ${entry.notes || ''}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

/**
 * Calcula estadísticas de la lista de espera
 */
export function calculateWaitlistStats(
  waitlist: WaitlistEntry[]
): WaitlistStats {
  const waiting = waitlist.filter((e) => e.status === 'WAITING');
  const seated = waitlist.filter((e) => e.status === 'SEATED');
  const total = waitlist.length;

  // Tiempo de espera promedio (de los que ya fueron sentados)
  const avgWaitTime =
    seated.length > 0
      ? Math.round(
          seated.reduce((sum, e) => {
            if (e.notifiedAt) {
              const waitMs =
                new Date(e.notifiedAt).getTime() -
                new Date(e.addedAt).getTime();
              return sum + waitMs / (1000 * 60);
            }
            return sum;
          }, 0) / seated.length
        )
      : 0;

  // Espera más larga actual
  const now = new Date().getTime();
  const longestWait =
    waiting.length > 0
      ? Math.max(
          ...waiting.map((e) => {
            const waitMs = now - new Date(e.addedAt).getTime();
            return Math.round(waitMs / (1000 * 60));
          })
        )
      : 0;

  // Cantidad de VIPs
  const vipCount = waiting.filter((e) => e.priority === 'VIP').length;

  // Tasa de conversión
  const conversionRate =
    total > 0 ? Math.round((seated.length / total) * 100) : 0;

  return {
    totalWaiting: waiting.length,
    averageWaitTime: avgWaitTime,
    longestWait,
    vipCount,
    conversionRate,
  };
}

// ============================================================================
// ORDENAMIENTO CON PRIORIDAD
// ============================================================================

/**
 * Ordena la lista de espera por prioridad y tiempo
 */
export function sortWaitlistByPriority(
  waitlist: WaitlistEntry[]
): WaitlistEntry[] {
  return [...waitlist].sort((a, b) => {
    // Primero por estado (WAITING primero)
    const statusOrder = { WAITING: 0, NOTIFIED: 1, SEATED: 2, CANCELLED: 3, NO_SHOW: 4 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Luego por prioridad
    if (a.priority === 'VIP' && b.priority !== 'VIP') return -1;
    if (a.priority !== 'VIP' && b.priority === 'VIP') return 1;

    // Finalmente por tiempo de espera (más antiguo primero)
    return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
  });
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default {
  addToWaitlist,
  calculateWaitTimes,
  findPromotionCandidates,
  sendWaitlistNotification,
  markAsNotified,
  convertToReservation,
  calculateWaitlistStats,
  sortWaitlistByPriority,
};

