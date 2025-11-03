import { renderHook } from '@testing-library/react'
import { useConflictDetection } from '../../../components/reservations/ReservationGrid/hooks/useConflictDetection'
import { createMockReservation } from '../../setup/mockData'

describe('useConflictDetection', () => {
  it('debe detectar conflicto en horario ocupado', () => {
    const reservations = [
      createMockReservation({
        id: 'res-1',
        tableId: 't1',
        startTime: new Date('2025-11-02T20:00:00').toISOString(),
        endTime: new Date('2025-11-02T21:30:00').toISOString(),
      }),
    ]

    const { result } = renderHook(() => useConflictDetection(reservations))

    const conflict = result.current.findConflict(
      't1',
      new Date('2025-11-02T20:30:00').toISOString(),
      60
    )

    expect(conflict).toBe('res-1')
  })

  it('no debe detectar conflicto en mesa diferente', () => {
    const reservations = [
      createMockReservation({
        id: 'res-1',
        tableId: 't1',
        startTime: new Date('2025-11-02T20:00:00').toISOString(),
        endTime: new Date('2025-11-02T21:30:00').toISOString(),
      }),
    ]

    const { result } = renderHook(() => useConflictDetection(reservations))

    const conflict = result.current.findConflict(
      't2',
      new Date('2025-11-02T20:30:00').toISOString(),
      60
    )

    expect(conflict).toBeNull()
  })

  it('debe validar horario de servicio', () => {
    const { result } = renderHook(() => useConflictDetection([]))

    const outsideHours = result.current.isOutsideServiceHours(
      new Date('2025-11-02T10:00:00').toISOString(),
      60
    )

    expect(outsideHours).toBe(true)
  })

  it('debe generar mapa de validaciones', () => {
    const reservations = [
      createMockReservation({
        id: 'res-1',
        tableId: 't1',
        startTime: new Date('2025-11-02T20:00:00').toISOString(),
        endTime: new Date('2025-11-02T21:30:00').toISOString(),
      }),
    ]

    const { result } = renderHook(() => useConflictDetection(reservations))

    expect(result.current.reservationValidations).toBeInstanceOf(Map)
    expect(result.current.reservationValidations.size).toBe(1)
    expect(result.current.reservationValidations.has('res-1')).toBe(true)
  })
})

