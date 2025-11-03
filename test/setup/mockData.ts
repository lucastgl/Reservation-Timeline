import type { Reservation } from '../../Interfaces/interfaces'
import type { SectorGroup } from '../../components/reservations/ReservationGrid/types'

/**
 * Grupos de mesas mock para testing
 */
export const mockSectorGroups: SectorGroup[] = [
  {
    sector: 'Interior',
    tables: [
      { id: 't1', name: 'Mesa 1', sector: 'Interior' },
      { id: 't2', name: 'Mesa 2', sector: 'Interior' },
      { id: 't3', name: 'Mesa 3', sector: 'Interior' },
    ],
  },
  {
    sector: 'Terraza',
    tables: [
      { id: 't4', name: 'Mesa 4', sector: 'Terraza' },
      { id: 't5', name: 'Mesa 5', sector: 'Terraza' },
    ],
  },
]

/**
 * Reserva mock para testing
 */
export const createMockReservation = (overrides?: Partial<Reservation>): Reservation => {
  const baseReservation: Reservation = {
    id: `res-${Date.now()}`,
    tableId: 't1',
    customer: {
      name: 'Juan Pérez',
      phone: '+54 11 1234-5678',
    },
    partySize: 4,
    startTime: new Date('2025-11-02T20:00:00').toISOString(),
    endTime: new Date('2025-11-02T21:30:00').toISOString(),
    durationMinutes: 90,
    status: 'CONFIRMED',
    priority: 'STANDARD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return { ...baseReservation, ...overrides }
}

/**
 * Múltiples reservas mock para testing
 */
export const mockReservations: Reservation[] = [
  createMockReservation({
    id: 'res-1',
    tableId: 't1',
    customer: { name: 'Juan Pérez', phone: '+54 11 1234-5678' },
    startTime: new Date('2025-11-02T20:00:00').toISOString(),
    endTime: new Date('2025-11-02T21:30:00').toISOString(),
    status: 'CONFIRMED',
  }),
  createMockReservation({
    id: 'res-2',
    tableId: 't2',
    customer: { name: 'María García', phone: '+54 11 8765-4321' },
    startTime: new Date('2025-11-02T19:00:00').toISOString(),
    endTime: new Date('2025-11-02T20:30:00').toISOString(),
    status: 'SEATED',
  }),
  createMockReservation({
    id: 'res-3',
    tableId: 't4',
    customer: { name: 'Carlos López', phone: '+54 11 5555-6666' },
    startTime: new Date('2025-11-02T21:00:00').toISOString(),
    endTime: new Date('2025-11-02T22:30:00').toISOString(),
    status: 'PENDING',
  }),
]

/**
 * Genera N reservas para testing de performance
 */
export const generateMockReservations = (count: number): Reservation[] => {
  const reservations: Reservation[] = []
  const tables = ['t1', 't2', 't3', 't4', 't5']
  const statuses: Reservation['status'][] = ['PENDING', 'CONFIRMED', 'SEATED', 'FINISHED']
  
  for (let i = 0; i < count; i++) {
    const tableId = tables[i % tables.length]
    // Ciclar entre 11:00 y 23:00 para evitar horas inválidas
    const hour = 11 + (Math.floor(i / tables.length) % 12)
    const status = statuses[i % statuses.length]
    
    const startTime = new Date('2025-11-02')
    startTime.setHours(hour, 0, 0, 0)
    
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + 90)
    
    reservations.push(
      createMockReservation({
        id: `res-${i}`,
        tableId,
        customer: {
          name: `Cliente ${i}`,
          phone: `+54 11 ${String(i).padStart(8, '0')}`,
        },
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status,
      })
    )
  }
  
  return reservations
}

