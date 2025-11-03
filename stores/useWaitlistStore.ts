import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { WaitlistEntry } from '../Interfaces/waitlistInterfaces';

/**
 * Store global para gestión de lista de espera
 * 
 * Maneja:
 * - Lista de clientes en espera
 * - Operaciones CRUD
 * - Conversión a reserva
 * - Notificaciones
 */

interface WaitlistState {
  // Estado
  waitlist: WaitlistEntry[];
  
  // Acciones
  addToWaitlist: (entry: WaitlistEntry) => void;
  updateWaitlistEntry: (id: string, updates: Partial<WaitlistEntry>) => void;
  removeFromWaitlist: (id: string) => void;
  clearWaitlist: () => void;
  
  // Conversión a reserva
  markAsSeated: (id: string) => void;
  markAsCancelled: (id: string) => void;
  markAsNoShow: (id: string) => void;
  
  // Utilidades
  getWaitlistById: (id: string) => WaitlistEntry | undefined;
  getWaitingEntries: () => WaitlistEntry[];
  getVIPEntries: () => WaitlistEntry[];
  getEntryCount: () => number;
  getWaitingCount: () => number;
}

export const useWaitlistStore = create<WaitlistState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        waitlist: [],
        
        // Acciones
        addToWaitlist: (entry) => {
          set((state) => {
            // Prevenir duplicados: verificar por ID Y por contenido (nombre + teléfono + hora preferida)
            const existsById = state.waitlist.some((e) => e.id === entry.id);
            const existsByContent = state.waitlist.some(
              (e) =>
                e.customer.name === entry.customer.name &&
                e.customer.phone === entry.customer.phone &&
                e.preferredTime === entry.preferredTime &&
                Math.abs(new Date(e.addedAt).getTime() - new Date(entry.addedAt).getTime()) < 5000 // Dentro de 5 segundos
            );
            
            if (existsById || existsByContent) {
              console.warn(`⚠️ Entry duplicado detectado. Ignorando:`, {
                id: entry.id,
                name: entry.customer.name,
                existsById,
                existsByContent,
              });
              return state; // No agregar si ya existe
            }
            
            console.log('✅ Agregando entry a waitlist:', entry.id);
            return {
              waitlist: [...state.waitlist, entry],
            };
          }, false, 'addToWaitlist');
        },
        
        updateWaitlistEntry: (id, updates) => {
          set((state) => ({
            waitlist: state.waitlist.map((entry) =>
              entry.id === id ? { ...entry, ...updates } : entry
            ),
          }), false, 'updateWaitlistEntry');
        },
        
        removeFromWaitlist: (id) => {
          set((state) => ({
            waitlist: state.waitlist.filter((entry) => entry.id !== id),
          }), false, 'removeFromWaitlist');
        },
        
        clearWaitlist: () => {
          set({ waitlist: [] }, false, 'clearWaitlist');
        },
        
        // Conversión a reserva
        markAsSeated: (id) => {
          set((state) => ({
            waitlist: state.waitlist.map((entry) =>
              entry.id === id ? { ...entry, status: 'SEATED' as const } : entry
            ),
          }), false, 'markAsSeated');
        },
        
        markAsCancelled: (id) => {
          set((state) => ({
            waitlist: state.waitlist.map((entry) =>
              entry.id === id ? { ...entry, status: 'CANCELLED' as const } : entry
            ),
          }), false, 'markAsCancelled');
        },
        
        markAsNoShow: (id) => {
          set((state) => ({
            waitlist: state.waitlist.map((entry) =>
              entry.id === id ? { ...entry, status: 'NO_SHOW' as const } : entry
            ),
          }), false, 'markAsNoShow');
        },
        
        // Utilidades
        getWaitlistById: (id) => {
          return get().waitlist.find((entry) => entry.id === id);
        },
        
        getWaitingEntries: () => {
          return get().waitlist.filter((entry) => entry.status === 'WAITING');
        },
        
        getVIPEntries: () => {
          return get().waitlist.filter((entry) => entry.priority === 'VIP');
        },
        
        getEntryCount: () => {
          return get().waitlist.length;
        },
        
        getWaitingCount: () => {
          return get().getWaitingEntries().length;
        },
      }),
      {
        name: 'waitlist-storage',
      }
    ),
    { name: 'WaitlistStore' }
  )
);

