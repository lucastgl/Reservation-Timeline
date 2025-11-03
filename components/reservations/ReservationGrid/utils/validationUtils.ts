import { START_HOUR, END_HOUR } from './constants';
import type { Reservation } from '../../../../Interfaces/interfaces';

/**
 * Busca conflictos con otras reservas en la misma mesa
 * @returns ID de la reserva con la que hay conflicto, o null si no hay conflicto
 */
export function findConflict(
  reservations: Reservation[],
  tableId: string,
  startTime: string,
  duration: number,
  excludeReservationId?: string
): string | null {
  const newStart = new Date(startTime).getTime();
  const newEnd = newStart + duration * 60 * 1000;

  const conflictingReservation = reservations.find((r) => {
    // Excluir la reserva actual (cuando estamos redimensionando)
    if (r.id === excludeReservationId) return false;

    // Solo verificar reservas en la misma mesa
    if (r.tableId !== tableId) return false;

    // Ignorar reservas canceladas o finalizadas
    if (r.status === "CANCELLED" || r.status === "FINISHED") return false;

    const existingStart = new Date(r.startTime).getTime();
    const existingEnd = new Date(r.endTime).getTime();

    // Verificar superposición
    return newStart < existingEnd && newEnd > existingStart;
  });

  return conflictingReservation?.id || null;
}

/**
 * Verifica si una hora está fuera del horario de servicio
 */
export function isOutsideServiceHours(
  startTime: string,
  duration: number
): boolean {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const startHour = start.getHours() + start.getMinutes() / 60;
  let endHour = end.getHours() + end.getMinutes() / 60;
  
  // Si la fecha de fin es diferente a la de inicio, significa que pasó a otro día
  if (end.getDate() !== start.getDate()) {
    endHour += 24;
  }

  // Horario de servicio: 11:00 - 24:00
  return startHour < START_HOUR || endHour > END_HOUR;
}

/**
 * Verifica si una hora ya pasó
 * @param startTime - Hora de inicio en formato ISO
 * @param allowPast - Si es true, ignora la validación (permite horarios pasados)
 */
export function isInThePast(startTime: string, allowPast: boolean = false): boolean {
  if (allowPast) return false; // Si se permite edición retroactiva, nunca está en el pasado
  
  const now = new Date();
  const reservationTime = new Date(startTime);
  return reservationTime < now;
}

/**
 * Obtiene todas las validaciones de una reserva
 * @param allowPast - Si es true, ignora la validación de horarios pasados
 */
export function getReservationValidation(
  reservation: Reservation,
  reservations: Reservation[],
  allowPast: boolean = false
): {
  hasConflict: boolean;
  conflictWithId: string | null;
  isOutsideHours: boolean;
  isPast: boolean;
  errorMessage: string | null;
} {
  const conflictId = findConflict(
    reservations,
    reservation.tableId,
    reservation.startTime,
    reservation.durationMinutes,
    reservation.id
  );
  const outsideHours = isOutsideServiceHours(
    reservation.startTime,
    reservation.durationMinutes
  );
  const past = isInThePast(reservation.startTime, allowPast);

  let errorMessage: string | null = null;
  if (conflictId) {
    const conflictingReservation = reservations.find((r) => r.id === conflictId);
    if (conflictingReservation) {
      errorMessage = `Conflicto con reserva de ${conflictingReservation.customer.name}`;
    }
  } else if (outsideHours) {
    errorMessage = `Fuera del horario de servicio (${START_HOUR}:00 - ${END_HOUR}:00)`;
  } else if (past) {
    errorMessage = "La hora de esta reserva ya pasó";
  }

  return {
    hasConflict: !!conflictId,
    conflictWithId: conflictId,
    isOutsideHours: outsideHours,
    isPast: past,
    errorMessage,
  };
}

