import {
  findConflict,
  isOutsideServiceHours,
  isInThePast,
  getReservationValidation,
} from '../../../components/reservations/ReservationGrid/utils/validationUtils'
import { createMockReservation, mockReservations } from '../../setup/mockData'

describe('validationUtils', () => {
  describe('findConflict', () => {
    it('debe detectar conflicto cuando hay superposición', () => {
      const reservations = [
        createMockReservation({
          id: 'res-1',
          tableId: 't1',
          startTime: new Date('2025-11-02T20:00:00').toISOString(),
          endTime: new Date('2025-11-02T21:30:00').toISOString(),
        }),
      ]

      // Intentar reservar en el mismo horario
      const conflict = findConflict(
        reservations,
        't1',
        new Date('2025-11-02T20:30:00').toISOString(),
        60
      )

      expect(conflict).toBe('res-1')
    })

    it('no debe detectar conflicto en mesas diferentes', () => {
      const reservations = [
        createMockReservation({
          id: 'res-1',
          tableId: 't1',
          startTime: new Date('2025-11-02T20:00:00').toISOString(),
          endTime: new Date('2025-11-02T21:30:00').toISOString(),
        }),
      ]

      const conflict = findConflict(
        reservations,
        't2', // Mesa diferente
        new Date('2025-11-02T20:30:00').toISOString(),
        60
      )

      expect(conflict).toBeNull()
    })

    it('no debe detectar conflicto cuando no hay superposición', () => {
      const reservations = [
        createMockReservation({
          id: 'res-1',
          tableId: 't1',
          startTime: new Date('2025-11-02T20:00:00').toISOString(),
          endTime: new Date('2025-11-02T21:30:00').toISOString(),
        }),
      ]

      // Reservar después
      const conflict = findConflict(
        reservations,
        't1',
        new Date('2025-11-02T21:30:00').toISOString(),
        60
      )

      expect(conflict).toBeNull()
    })

    it('debe excluir la reserva actual al verificar', () => {
      const reservations = [
        createMockReservation({
          id: 'res-1',
          tableId: 't1',
          startTime: new Date('2025-11-02T20:00:00').toISOString(),
          endTime: new Date('2025-11-02T21:30:00').toISOString(),
        }),
      ]

      // Redimensionar la misma reserva no debe generar conflicto consigo misma
      const conflict = findConflict(
        reservations,
        't1',
        new Date('2025-11-02T20:00:00').toISOString(),
        120,
        'res-1' // Excluir esta reserva
      )

      expect(conflict).toBeNull()
    })

    it('debe ignorar reservas canceladas o finalizadas', () => {
      const reservations = [
        createMockReservation({
          id: 'res-1',
          tableId: 't1',
          startTime: new Date('2025-11-02T20:00:00').toISOString(),
          endTime: new Date('2025-11-02T21:30:00').toISOString(),
          status: 'CANCELLED',
        }),
      ]

      const conflict = findConflict(
        reservations,
        't1',
        new Date('2025-11-02T20:30:00').toISOString(),
        60
      )

      expect(conflict).toBeNull()
    })
  })

  describe('isOutsideServiceHours', () => {
    it('debe detectar horario antes de las 11:00', () => {
      const startTime = new Date('2025-11-02T10:00:00').toISOString()
      expect(isOutsideServiceHours(startTime, 60)).toBe(true)
    })

    it('debe detectar horario después de las 24:00', () => {
      // 23:30 + 60 min = 00:30 del día siguiente (fuera de horario)
      const startTime = new Date('2025-11-02T23:30:00').toISOString()
      expect(isOutsideServiceHours(startTime, 60)).toBe(true)
    })

    it('debe aceptar horario dentro del servicio', () => {
      const startTime = new Date('2025-11-02T20:00:00').toISOString()
      expect(isOutsideServiceHours(startTime, 90)).toBe(false)
    })

    it('debe aceptar horario en el límite inferior', () => {
      const startTime = new Date('2025-11-02T11:00:00').toISOString()
      expect(isOutsideServiceHours(startTime, 60)).toBe(false)
    })
  })

  describe('isInThePast', () => {
    it('debe detectar fechas pasadas', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hora atrás
      expect(isInThePast(pastDate)).toBe(true)
    })

    it('debe detectar fechas futuras', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString() // 1 hora adelante
      expect(isInThePast(futureDate)).toBe(false)
    })
  })

  describe('getReservationValidation', () => {
    it('debe retornar validación completa sin errores', () => {
      // Usar una fecha futura para evitar que el test falle por fecha pasada
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30) // 30 días en el futuro
      futureDate.setHours(20, 0, 0, 0)
      
      const endDate = new Date(futureDate)
      endDate.setMinutes(endDate.getMinutes() + 90)

      const reservation = createMockReservation({
        startTime: futureDate.toISOString(),
        endTime: endDate.toISOString(),
        durationMinutes: 90,
      })

      const validation = getReservationValidation(reservation, [])

      expect(validation.hasConflict).toBe(false)
      expect(validation.isOutsideHours).toBe(false)
      expect(validation.isPast).toBe(false)
      expect(validation.errorMessage).toBeNull()
    })

    it('debe detectar conflicto y generar mensaje', () => {
      const existingReservation = createMockReservation({
        id: 'res-1',
        tableId: 't1',
        customer: { name: 'María García', phone: '+54 11 8765-4321' },
        startTime: new Date('2025-11-02T20:00:00').toISOString(),
        endTime: new Date('2025-11-02T21:30:00').toISOString(),
      })

      const newReservation = createMockReservation({
        id: 'res-2',
        tableId: 't1',
        startTime: new Date('2025-11-02T20:30:00').toISOString(),
        endTime: new Date('2025-11-02T22:00:00').toISOString(),
      })

      const validation = getReservationValidation(newReservation, [existingReservation])

      expect(validation.hasConflict).toBe(true)
      expect(validation.conflictWithId).toBe('res-1')
      expect(validation.errorMessage).toContain('María García')
    })

    it('debe detectar horario fuera de servicio', () => {
      const reservation = createMockReservation({
        startTime: new Date('2025-11-02T10:00:00').toISOString(),
        endTime: new Date('2025-11-02T11:30:00').toISOString(),
        durationMinutes: 90,
      })

      const validation = getReservationValidation(reservation, [])

      expect(validation.isOutsideHours).toBe(true)
      expect(validation.errorMessage).toContain('horario de servicio')
    })
  })
})

