import { useMemo, useCallback } from 'react';
import type { Reservation } from '../../../../Interfaces/interfaces';
import type { ReservationValidation } from '../types';
import {
  findConflict,
  isOutsideServiceHours,
  isInThePast,
  getReservationValidation,
} from '../utils/validationUtils';

/**
 * Hook para detección de conflictos y validaciones de reservas
 * @param allowPastReservations - Si es true, ignora validación de horarios pasados
 */
export function useConflictDetection(
  reservations: Reservation[],
  allowPastReservations: boolean = false
) {
  /**
   * Busca conflictos (memoizado)
   */
  const checkConflict = useCallback(
    (
      tableId: string,
      startTime: string,
      duration: number,
      excludeReservationId?: string
    ): string | null => {
      return findConflict(
        reservations,
        tableId,
        startTime,
        duration,
        excludeReservationId
      );
    },
    [reservations]
  );

  /**
   * Verifica horario de servicio (memoizado)
   */
  const checkServiceHours = useCallback(
    (startTime: string, duration: number): boolean => {
      return isOutsideServiceHours(startTime, duration);
    },
    []
  );

  /**
   * Verifica si está en el pasado (memoizado)
   * Considera el flag allowPastReservations
   */
  const checkPast = useCallback((startTime: string): boolean => {
    return isInThePast(startTime, allowPastReservations);
  }, [allowPastReservations]);

  /**
   * Obtiene validación completa (memoizado)
   */
  const getValidation = useCallback(
    (reservation: Reservation): ReservationValidation => {
      return getReservationValidation(reservation, reservations, allowPastReservations);
    },
    [reservations, allowPastReservations]
  );

  /**
   * Mapa de validaciones por ID de reserva (memoizado)
   */
  const reservationValidations = useMemo(() => {
    const validations = new Map<string, ReservationValidation>();
    reservations.forEach((reservation) => {
      validations.set(reservation.id, getValidation(reservation));
    });
    return validations;
  }, [reservations, getValidation]);

  return {
    findConflict: checkConflict,
    isOutsideServiceHours: checkServiceHours,
    isInThePast: checkPast,
    getReservationValidation: getValidation,
    reservationValidations,
  };
}

