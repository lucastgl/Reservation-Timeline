import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Reservation } from '../Interfaces/interfaces';

/**
 * Store global para estado de la UI
 * 
 * Maneja:
 * - Modales (creación, edición)
 * - Menús contextuales
 * - Paneles laterales (waitlist, analytics)
 * - Estados de loading/error
 */

interface ModalState {
  isOpen: boolean;
  tableId?: string;
  tableName?: string;
  tableCapacity?: { min: number; max: number };
  startTime?: string;
  defaultDuration?: number;
}

interface ContextMenuState {
  isOpen: boolean;
  reservation?: Reservation;
  position: { x: number; y: number };
}

interface EditModalState {
  isOpen: boolean;
  reservation?: Reservation;
}

interface UIState {
  // Modales
  createModal: ModalState;
  editModal: EditModalState;
  
  // Menú contextual
  contextMenu: ContextMenuState;
  
  // Paneles laterales
  isWaitlistOpen: boolean;
  isAnalyticsOpen: boolean;
  
  // Loading/Error
  isLoading: boolean;
  error: string | null;
  
  // Acciones - Modal de creación
  openCreateModal: (
    tableId: string,
    tableName: string,
    tableCapacity: { min: number; max: number },
    startTime: string,
    defaultDuration: number
  ) => void;
  closeCreateModal: () => void;
  
  // Acciones - Modal de edición
  openEditModal: (reservation: Reservation) => void;
  closeEditModal: () => void;
  
  // Acciones - Menú contextual
  openContextMenu: (reservation: Reservation, x: number, y: number) => void;
  closeContextMenu: () => void;
  
  // Acciones - Paneles laterales
  toggleWaitlist: () => void;
  openWaitlist: () => void;
  closeWaitlist: () => void;
  toggleAnalytics: () => void;
  
  // Acciones - Loading/Error
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Estado inicial
      createModal: { isOpen: false },
      editModal: { isOpen: false },
      contextMenu: { isOpen: false, position: { x: 0, y: 0 } },
      isWaitlistOpen: false,
      isAnalyticsOpen: false,
      isLoading: false,
      error: null,
      
      // Modal de creación
      openCreateModal: (tableId, tableName, tableCapacity, startTime, defaultDuration) => {
        set({
          createModal: {
            isOpen: true,
            tableId,
            tableName,
            tableCapacity,
            startTime,
            defaultDuration,
          },
        }, false, 'openCreateModal');
      },
      
      closeCreateModal: () => {
        set({
          createModal: { isOpen: false },
        }, false, 'closeCreateModal');
      },
      
      // Modal de edición
      openEditModal: (reservation) => {
        set({
          editModal: {
            isOpen: true,
            reservation,
          },
        }, false, 'openEditModal');
      },
      
      closeEditModal: () => {
        set({
          editModal: { isOpen: false },
        }, false, 'closeEditModal');
      },
      
      // Menú contextual
      openContextMenu: (reservation, x, y) => {
        set({
          contextMenu: {
            isOpen: true,
            reservation,
            position: { x, y },
          },
        }, false, 'openContextMenu');
      },
      
      closeContextMenu: () => {
        set({
          contextMenu: { isOpen: false, position: { x: 0, y: 0 } },
        }, false, 'closeContextMenu');
      },
      
      // Paneles laterales
      toggleWaitlist: () => {
        set((state) => ({
          isWaitlistOpen: !state.isWaitlistOpen,
        }), false, 'toggleWaitlist');
      },
      
      openWaitlist: () => {
        set({ isWaitlistOpen: true }, false, 'openWaitlist');
      },
      
      closeWaitlist: () => {
        set({ isWaitlistOpen: false }, false, 'closeWaitlist');
      },
      
      toggleAnalytics: () => {
        set((state) => ({
          isAnalyticsOpen: !state.isAnalyticsOpen,
        }), false, 'toggleAnalytics');
      },
      
      // Loading/Error
      setLoading: (isLoading) => {
        set({ isLoading }, false, 'setLoading');
      },
      
      setError: (error) => {
        set({ error, isLoading: false }, false, 'setError');
      },
      
      clearError: () => {
        set({ error: null }, false, 'clearError');
      },
    }),
    { name: 'UIStore' }
  )
);

