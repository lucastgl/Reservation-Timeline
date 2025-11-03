import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Reservation } from '../Interfaces/interfaces';

/**
 * Store global para gestión de reservas
 * 
 * Maneja el estado completo de todas las reservas incluyendo:
 * - Lista de reservas
 * - Operaciones CRUD (Create, Read, Update, Delete)
 * - Historial para undo/redo
 * - Persistencia en localStorage
 */

interface ReservationState {
  // Estado
  reservations: Reservation[];
  selectedReservations: string[]; // IDs de reservas seleccionadas
  history: Reservation[][]; // Historial para undo
  historyIndex: number;
  
  // Acciones
  setReservations: (reservations: Reservation[]) => void;
  addReservation: (reservation: Reservation) => void;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  deleteReservation: (id: string) => void;
  deleteReservations: (ids: string[]) => void;
  
  // Selección múltiple
  selectReservation: (id: string) => void;
  deselectReservation: (id: string) => void;
  toggleReservationSelection: (id: string, isMultiSelect?: boolean) => void;
  clearSelection: () => void;
  
  // Historial (undo/redo)
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Utilidades
  getReservationById: (id: string) => Reservation | undefined;
  getReservationsByTable: (tableId: string) => Reservation[];
  getReservationsByStatus: (status: Reservation['status']) => Reservation[];
}

export const useReservationStore = create<ReservationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        reservations: [],
        selectedReservations: [],
        history: [[]],
        historyIndex: 0,
        
        // Setters
        setReservations: (reservations) => {
          set({ reservations }, false, 'setReservations');
        },
        
        addReservation: (reservation) => {
          set((state) => {
            const newReservations = [...state.reservations, reservation];
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            
            return {
              reservations: newReservations,
              history: [...newHistory, newReservations],
              historyIndex: newHistory.length,
            };
          }, false, 'addReservation');
        },
        
        updateReservation: (id, updates) => {
          set((state) => {
            const newReservations = state.reservations.map((r) =>
              r.id === id ? { ...r, ...updates } : r
            );
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            
            return {
              reservations: newReservations,
              history: [...newHistory, newReservations],
              historyIndex: newHistory.length,
            };
          }, false, 'updateReservation');
        },
        
        deleteReservation: (id) => {
          set((state) => {
            const newReservations = state.reservations.filter((r) => r.id !== id);
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            const newSelectedReservations = state.selectedReservations.filter(
              (selectedId) => selectedId !== id
            );
            
            return {
              reservations: newReservations,
              selectedReservations: newSelectedReservations,
              history: [...newHistory, newReservations],
              historyIndex: newHistory.length,
            };
          }, false, 'deleteReservation');
        },
        
        deleteReservations: (ids) => {
          set((state) => {
            const idsSet = new Set(ids);
            const newReservations = state.reservations.filter((r) => !idsSet.has(r.id));
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            const newSelectedReservations = state.selectedReservations.filter(
              (selectedId) => !idsSet.has(selectedId)
            );
            
            return {
              reservations: newReservations,
              selectedReservations: newSelectedReservations,
              history: [...newHistory, newReservations],
              historyIndex: newHistory.length,
            };
          }, false, 'deleteReservations');
        },
        
        // Selección múltiple
        selectReservation: (id) => {
          set((state) => ({
            selectedReservations: [...state.selectedReservations, id],
          }), false, 'selectReservation');
        },
        
        deselectReservation: (id) => {
          set((state) => ({
            selectedReservations: state.selectedReservations.filter(
              (selectedId) => selectedId !== id
            ),
          }), false, 'deselectReservation');
        },
        
        toggleReservationSelection: (id, isMultiSelect = false) => {
          set((state) => {
            const isSelected = state.selectedReservations.includes(id);
            
            if (isMultiSelect) {
              // Multi-selección (Cmd/Ctrl + click)
              return {
                selectedReservations: isSelected
                  ? state.selectedReservations.filter((selectedId) => selectedId !== id)
                  : [...state.selectedReservations, id],
              };
            } else {
              // Selección simple
              return {
                selectedReservations: isSelected ? [] : [id],
              };
            }
          }, false, 'toggleReservationSelection');
        },
        
        clearSelection: () => {
          set({ selectedReservations: [] }, false, 'clearSelection');
        },
        
        // Historial (undo/redo)
        undo: () => {
          set((state) => {
            if (state.historyIndex > 0) {
              const newIndex = state.historyIndex - 1;
              return {
                reservations: state.history[newIndex],
                historyIndex: newIndex,
              };
            }
            return state;
          }, false, 'undo');
        },
        
        redo: () => {
          set((state) => {
            if (state.historyIndex < state.history.length - 1) {
              const newIndex = state.historyIndex + 1;
              return {
                reservations: state.history[newIndex],
                historyIndex: newIndex,
              };
            }
            return state;
          }, false, 'redo');
        },
        
        canUndo: () => {
          const state = get();
          return state.historyIndex > 0;
        },
        
        canRedo: () => {
          const state = get();
          return state.historyIndex < state.history.length - 1;
        },
        
        // Utilidades
        getReservationById: (id) => {
          return get().reservations.find((r) => r.id === id);
        },
        
        getReservationsByTable: (tableId) => {
          return get().reservations.filter((r) => r.tableId === tableId);
        },
        
        getReservationsByStatus: (status) => {
          return get().reservations.filter((r) => r.status === status);
        },
      }),
      {
        name: 'reservation-storage',
        partialize: (state) => ({
          reservations: state.reservations,
          // No persistir selección ni historial
        }),
      }
    ),
    { name: 'ReservationStore' }
  )
);

