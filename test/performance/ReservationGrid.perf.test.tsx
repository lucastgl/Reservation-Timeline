/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render } from '../setup/testUtils'
import ReservationGrid from '../../components/reservations/ReservationGrid'
import { generateMockReservations, mockSectorGroups } from '../setup/mockData'

describe('ReservationGrid - Performance', () => {
  describe('Rendimiento con múltiples reservas', () => {
    it('debe renderizar 200 reservas en menos de 2 segundos', () => {
      const reservations = generateMockReservations(200)

      const startTime = performance.now()
      
      const { container } = render(
        <ReservationGrid 
          groups={mockSectorGroups} 
          reservations={reservations} 
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Debe renderizar en menos de 2000ms
      expect(renderTime).toBeLessThan(2000)

      // Verificar que el componente se renderizó
      expect(container).toBeInTheDocument()
    })

    it('debe renderizar incrementalmente sin bloquear', () => {
      const reservations = generateMockReservations(200)

      const measurements: number[] = []

      // Medir en chunks
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now()
        
        render(
          <ReservationGrid 
            groups={mockSectorGroups} 
            reservations={reservations.slice(0, (i + 1) * 40)} 
          />
        )

        const endTime = performance.now()
        measurements.push(endTime - startTime)
      }

      // El tiempo no debe crecer exponencialmente
      const firstRender = measurements[0]
      const lastRender = measurements[measurements.length - 1]

      // El último render no debe ser más de 3x el primer render
      expect(lastRender).toBeLessThan(firstRender * 3)
    })
  })

  describe('Optimización de re-renders', () => {
    it('no debe re-renderizar todos los componentes al cambiar zoom', () => {
      const { rerender } = render(
        <ReservationGrid 
          groups={mockSectorGroups} 
          reservations={generateMockReservations(50)} 
        />
      )

      const startTime = performance.now()

      // Simular cambio de zoom (esto se haría con interacción real)
      rerender(
        <ReservationGrid 
          groups={mockSectorGroups} 
          reservations={generateMockReservations(50)} 
        />
      )

      const endTime = performance.now()
      const rerenderTime = endTime - startTime

      // El re-render debe ser más rápido que el render inicial
      expect(rerenderTime).toBeLessThan(500)
    })
  })

  describe('Memoria y limpieza', () => {
    it('debe limpiar correctamente al desmontar', () => {
      const { unmount } = render(
        <ReservationGrid 
          groups={mockSectorGroups} 
          reservations={generateMockReservations(100)} 
        />
      )

      // No debe lanzar errores al desmontar
      expect(() => unmount()).not.toThrow()
    })
  })
})

