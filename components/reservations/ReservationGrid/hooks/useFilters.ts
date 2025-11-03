import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Reservation } from '../../../../Interfaces/interfaces';
import type { SectorGroup } from '../types';

/**
 * Hook para manejo de filtros y búsqueda
 */
export function useFilters(
  groups: SectorGroup[],
  reservations: Reservation[]
) {
  // Estado de fecha seleccionada
  // Usar lazy initialization para evitar hydration mismatch
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Solo calcular en el cliente (después de mount)
    if (typeof window !== 'undefined') {
      return new Date();
    }
    // Valor inicial para SSR
    return new Date('2025-01-01');
  });

  // Filtros de sectores
  const [selectedSectors, setSelectedSectors] = useState<string[]>(() =>
    groups.map((g) => g.sector)
  );

  // Filtros de estados
  const [selectedStatuses, setSelectedStatuses] = useState<
    Reservation["status"][]
  >(["PENDING", "CONFIRMED", "SEATED", "FINISHED", "NO_SHOW", "CANCELLED"]);

  // Búsqueda (con debouncing interno para optimización)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  
  // Debounce search query a 300ms
  useEffect(() => {
    // Actualizar inmediatamente si está vacío (quitar filtro rápido)
    if (!searchQuery.trim()) {
      setDebouncedSearchQuery('');
      return;
    }
    
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  // Control de sectores colapsados/expandidos
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groups.forEach((g) => (initial[g.sector] = false));
    return initial;
  });

  /**
   * Filtrar y buscar reservas según criterios activos
   */
  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      // Filtro por estado
      if (!selectedStatuses.includes(reservation.status)) {
        return false;
      }

      // Filtro por búsqueda (nombre o teléfono) - usa versión debounced
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesName = reservation.customer.name
          .toLowerCase()
          .includes(query);
        const matchesPhone = reservation.customer.phone
          .toLowerCase()
          .includes(query);
        if (!matchesName && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [reservations, selectedStatuses, debouncedSearchQuery]);

  /**
   * Filtrar grupos por sectores seleccionados
   */
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => selectedSectors.includes(group.sector));
  }, [groups, selectedSectors]);

  /**
   * Calcular cantidad de filtros activos
   */
  const activeFiltersCount = useMemo(() => {
    let count = 0;

    // Contar sectores no seleccionados
    if (selectedSectors.length < groups.length) {
      count++;
    }

    // Contar estados no seleccionados
    if (selectedStatuses.length < 6) {
      count++;
    }

    // Contar búsqueda activa (usa query original para UI inmediata)
    if (searchQuery.trim()) {
      count++;
    }

    return count;
  }, [
    selectedSectors.length,
    selectedStatuses.length,
    searchQuery,
    groups.length,
  ]);

  /**
   * Limpiar todos los filtros
   */
  const handleClearFilters = useCallback(() => {
    setSelectedSectors(groups.map((g) => g.sector));
    setSelectedStatuses([
      "PENDING",
      "CONFIRMED",
      "SEATED",
      "FINISHED",
      "NO_SHOW",
      "CANCELLED",
    ]);
    setSearchQuery("");
  }, [groups]);

  /**
   * Toggle colapsar/expandir sector
   */
  const toggleSectorCollapse = useCallback((sector: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [sector]: !prev[sector],
    }));
  }, []);

  /**
   * Obtener sectores disponibles
   */
  const availableSectors = useMemo(() => {
    return groups.map((g) => g.sector);
  }, [groups]);

  return {
    // Estado
    selectedDate,
    setSelectedDate,
    selectedSectors,
    setSelectedSectors,
    selectedStatuses,
    setSelectedStatuses,
    searchQuery,
    setSearchQuery,
    collapsed,
    
    // Datos computados
    filteredReservations,
    filteredGroups,
    activeFiltersCount,
    availableSectors,
    
    // Handlers
    handleClearFilters,
    toggleSectorCollapse,
  };
}

