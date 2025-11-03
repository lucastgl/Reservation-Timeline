import React from 'react'
import { render, screen } from '../setup/testUtils'
import ReservationGrid from '../../components/reservations/ReservationGrid'
import { mockReservations, mockSectorGroups } from '../setup/mockData'

describe('ReservationGrid - Básico', () => {
  it('debe renderizar sin errores', () => {
    const { container } = render(
      <ReservationGrid 
        groups={mockSectorGroups} 
        reservations={[]} 
      />
    )
    
    expect(container).toBeInTheDocument()
  })

  it('debe mostrar los encabezados de sectores', () => {
    render(
      <ReservationGrid 
        groups={mockSectorGroups} 
        reservations={[]} 
      />
    )

    expect(screen.getByText('Interior')).toBeInTheDocument()
    expect(screen.getByText('Terraza')).toBeInTheDocument()
  })

  it('debe mostrar las mesas', () => {
    render(
      <ReservationGrid 
        groups={mockSectorGroups} 
        reservations={[]} 
      />
    )

    expect(screen.getByText('Mesa 1')).toBeInTheDocument()
    expect(screen.getByText('Mesa 4')).toBeInTheDocument()
  })

  it('debe mostrar el toolbar', () => {
    render(
      <ReservationGrid 
        groups={mockSectorGroups} 
        reservations={[]} 
      />
    )

    expect(screen.getByPlaceholderText(/buscar por nombre/i)).toBeInTheDocument()
  })

  it('debe mostrar controles de zoom', () => {
    render(
      <ReservationGrid 
        groups={mockSectorGroups} 
        reservations={[]} 
      />
    )

    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('150%')).toBeInTheDocument()
  })
})

