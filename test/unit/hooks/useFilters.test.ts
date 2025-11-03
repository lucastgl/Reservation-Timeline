import { renderHook, act } from '@testing-library/react'
import { useFilters } from '../../../components/reservations/ReservationGrid/hooks/useFilters'
import { mockReservations, mockSectorGroups } from '../../setup/mockData'

describe('useFilters', () => {
  it('debe inicializar con todos los sectores seleccionados', () => {
    const { result } = renderHook(() => 
      useFilters(mockSectorGroups, mockReservations)
    )

    expect(result.current.selectedSectors).toHaveLength(2)
    expect(result.current.selectedSectors).toContain('Interior')
    expect(result.current.selectedSectors).toContain('Terraza')
  })

  it('debe filtrar reservas por estado', () => {
    const { result } = renderHook(() => 
      useFilters(mockSectorGroups, mockReservations)
    )

    // Inicialmente todas las reservas visibles
    expect(result.current.filteredReservations).toHaveLength(3)

    // Filtrar solo CONFIRMED
    act(() => {
      result.current.setSelectedStatuses(['CONFIRMED'])
    })

    expect(result.current.filteredReservations).toHaveLength(1)
    expect(result.current.filteredReservations[0].status).toBe('CONFIRMED')
  })

  it('debe filtrar grupos por sectores seleccionados', () => {
    const { result } = renderHook(() => 
      useFilters(mockSectorGroups, mockReservations)
    )

    // Seleccionar solo Interior
    act(() => {
      result.current.setSelectedSectors(['Interior'])
    })

    expect(result.current.filteredGroups).toHaveLength(1)
    expect(result.current.filteredGroups[0].sector).toBe('Interior')
  })

  it('debe buscar por nombre de cliente', () => {
    const { result } = renderHook(() => 
      useFilters(mockSectorGroups, mockReservations)
    )

    act(() => {
      result.current.setSearchQuery('Juan')
    })

    expect(result.current.filteredReservations).toHaveLength(1)
    expect(result.current.filteredReservations[0].customer.name).toContain('Juan')
  })

  it('debe calcular filtros activos correctamente', () => {
    const { result } = renderHook(() => 
      useFilters(mockSectorGroups, mockReservations)
    )

    // Sin filtros
    expect(result.current.activeFiltersCount).toBe(0)

    // Agregar búsqueda
    act(() => {
      result.current.setSearchQuery('test')
    })

    expect(result.current.activeFiltersCount).toBe(1)

    // Agregar filtro de sector
    act(() => {
      result.current.setSelectedSectors(['Interior'])
    })

    expect(result.current.activeFiltersCount).toBe(2)
  })

  it('debe limpiar todos los filtros', () => {
    const { result } = renderHook(() => 
      useFilters(mockSectorGroups, mockReservations)
    )

    // Aplicar filtros
    act(() => {
      result.current.setSearchQuery('test')
      result.current.setSelectedSectors(['Interior'])
      result.current.setSelectedStatuses(['CONFIRMED'])
    })

    expect(result.current.activeFiltersCount).toBeGreaterThan(0)

    // Limpiar
    act(() => {
      result.current.handleClearFilters()
    })

    expect(result.current.searchQuery).toBe('')
    expect(result.current.selectedSectors).toHaveLength(2)
    expect(result.current.selectedStatuses).toHaveLength(6)
  })

  it('debe colapsar y expandir sectores', () => {
    const { result } = renderHook(() => 
      useFilters(mockSectorGroups, mockReservations)
    )

    // Inicialmente no colapsado
    expect(result.current.collapsed['Interior']).toBe(false)

    // Colapsar
    act(() => {
      result.current.toggleSectorCollapse('Interior')
    })

    expect(result.current.collapsed['Interior']).toBe(true)

    // Expandir
    act(() => {
      result.current.toggleSectorCollapse('Interior')
    })

    expect(result.current.collapsed['Interior']).toBe(false)
  })
})

