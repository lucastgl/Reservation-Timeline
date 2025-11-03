import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Reservation } from '../Interfaces/interfaces';

/**
 * Store global para filtros y configuración de vista
 * 
 * Maneja:
 * - Filtros (sectores, estados)
 * - Búsqueda
 * - Zoom
 * - Fecha seleccionada
 * - Sectores colapsados
 */

interface FilterState {
  // Filtros
  selectedDate: Date;
  selectedSectors: string[];
  selectedStatuses: Reservation['status'][];
  searchQuery: string;
  
  // Vista
  zoom: number;
  collapsedSectors: Record<string, boolean>;
  
  // Acciones - Filtros
  setSelectedDate: (date: Date) => void;
  setSelectedSectors: (sectors: string[]) => void;
  toggleSector: (sector: string) => void;
  setSelectedStatuses: (statuses: Reservation['status'][]) => void;
  toggleStatus: (status: Reservation['status']) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  
  // Acciones - Vista
  setZoom: (zoom: number) => void;
  toggleSectorCollapse: (sector: string) => void;
  collapseAllSectors: () => void;
  expandAllSectors: () => void;
  
  // Utilidades
  getActiveFiltersCount: () => number;
  hasActiveFilters: () => boolean;
}

const DEFAULT_ZOOM = 1;
const DEFAULT_STATUSES: Reservation['status'][] = [
  'PENDING',
  'CONFIRMED',
  'SEATED',
  'FINISHED',
  'NO_SHOW',
  'CANCELLED',
];

export const useFilterStore = create<FilterState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        selectedDate: new Date(),
        selectedSectors: [],
        selectedStatuses: DEFAULT_STATUSES,
        searchQuery: '',
        zoom: DEFAULT_ZOOM,
        collapsedSectors: {},
        
        // Acciones - Filtros
        setSelectedDate: (date) => {
          set({ selectedDate: date }, false, 'setSelectedDate');
        },
        
        setSelectedSectors: (sectors) => {
          set({ selectedSectors: sectors }, false, 'setSelectedSectors');
        },
        
        toggleSector: (sector) => {
          set((state) => {
            const isSelected = state.selectedSectors.includes(sector);
            return {
              selectedSectors: isSelected
                ? state.selectedSectors.filter((s) => s !== sector)
                : [...state.selectedSectors, sector],
            };
          }, false, 'toggleSector');
        },
        
        setSelectedStatuses: (statuses) => {
          set({ selectedStatuses: statuses }, false, 'setSelectedStatuses');
        },
        
        toggleStatus: (status) => {
          set((state) => {
            const isSelected = state.selectedStatuses.includes(status);
            return {
              selectedStatuses: isSelected
                ? state.selectedStatuses.filter((s) => s !== status)
                : [...state.selectedStatuses, status],
            };
          }, false, 'toggleStatus');
        },
        
        setSearchQuery: (query) => {
          set({ searchQuery: query }, false, 'setSearchQuery');
        },
        
        clearFilters: () => {
          set({
            selectedSectors: [],
            selectedStatuses: DEFAULT_STATUSES,
            searchQuery: '',
          }, false, 'clearFilters');
        },
        
        // Acciones - Vista
        setZoom: (zoom) => {
          set({ zoom }, false, 'setZoom');
        },
        
        toggleSectorCollapse: (sector) => {
          set((state) => ({
            collapsedSectors: {
              ...state.collapsedSectors,
              [sector]: !state.collapsedSectors[sector],
            },
          }), false, 'toggleSectorCollapse');
        },
        
        collapseAllSectors: () => {
          set((state) => {
            const allCollapsed: Record<string, boolean> = {};
            Object.keys(state.collapsedSectors).forEach((sector) => {
              allCollapsed[sector] = true;
            });
            return { collapsedSectors: allCollapsed };
          }, false, 'collapseAllSectors');
        },
        
        expandAllSectors: () => {
          set({ collapsedSectors: {} }, false, 'expandAllSectors');
        },
        
        // Utilidades
        getActiveFiltersCount: () => {
          const state = get();
          let count = 0;
          
          if (state.selectedSectors.length > 0) count++;
          if (state.selectedStatuses.length !== DEFAULT_STATUSES.length) count++;
          if (state.searchQuery.trim() !== '') count++;
          
          return count;
        },
        
        hasActiveFilters: () => {
          return get().getActiveFiltersCount() > 0;
        },
      }),
      {
        name: 'filter-storage',
        partialize: (state) => ({
          zoom: state.zoom,
          collapsedSectors: state.collapsedSectors,
          // No persistir filtros temporales
        }),
      }
    ),
    { name: 'FilterStore' }
  )
);

