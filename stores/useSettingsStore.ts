import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Store global para configuraciones de la aplicación
 * 
 * Maneja:
 * - Configuraciones generales
 * - Preferencias de usuario
 * - Flags de funcionalidades
 */

interface SettingsState {
  // Configuraciones generales
  allowPastReservations: boolean;
  autoSave: boolean;
  showNotifications: boolean;
  
  // Configuración de horario de servicio
  serviceStartHour: number;
  serviceEndHour: number;
  
  // Configuración de reservas
  defaultDuration: number; // minutos
  minDuration: number; // minutos
  maxDuration: number; // minutos
  timeStep: number; // minutos (intervalo del grid)
  
  // Preferencias de UI
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  
  // Acciones - Configuraciones generales
  setAllowPastReservations: (allow: boolean) => void;
  toggleAllowPastReservations: () => void;
  setAutoSave: (enabled: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  
  // Acciones - Horario de servicio
  setServiceHours: (startHour: number, endHour: number) => void;
  
  // Acciones - Configuración de reservas
  setDefaultDuration: (minutes: number) => void;
  setDurationLimits: (min: number, max: number) => void;
  setTimeStep: (minutes: number) => void;
  
  // Acciones - Preferencias de UI
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (language: 'es' | 'en') => void;
  setDateFormat: (format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD') => void;
  setTimeFormat: (format: '12h' | '24h') => void;
  
  // Utilidades
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS = {
  allowPastReservations: false,
  autoSave: true,
  showNotifications: true,
  serviceStartHour: 11,
  serviceEndHour: 24,
  defaultDuration: 90,
  minDuration: 30,
  maxDuration: 360,
  timeStep: 15,
  theme: 'light' as const,
  language: 'es' as const,
  dateFormat: 'DD/MM/YYYY' as const,
  timeFormat: '24h' as const,
};

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        // Estado inicial (usando defaults)
        ...DEFAULT_SETTINGS,
        
        // Acciones - Configuraciones generales
        setAllowPastReservations: (allow) => {
          set({ allowPastReservations: allow }, false, 'setAllowPastReservations');
        },
        
        toggleAllowPastReservations: () => {
          set((state) => ({
            allowPastReservations: !state.allowPastReservations,
          }), false, 'toggleAllowPastReservations');
        },
        
        setAutoSave: (enabled) => {
          set({ autoSave: enabled }, false, 'setAutoSave');
        },
        
        setShowNotifications: (show) => {
          set({ showNotifications: show }, false, 'setShowNotifications');
        },
        
        // Acciones - Horario de servicio
        setServiceHours: (startHour, endHour) => {
          set({
            serviceStartHour: startHour,
            serviceEndHour: endHour,
          }, false, 'setServiceHours');
        },
        
        // Acciones - Configuración de reservas
        setDefaultDuration: (minutes) => {
          set({ defaultDuration: minutes }, false, 'setDefaultDuration');
        },
        
        setDurationLimits: (min, max) => {
          set({
            minDuration: min,
            maxDuration: max,
          }, false, 'setDurationLimits');
        },
        
        setTimeStep: (minutes) => {
          set({ timeStep: minutes }, false, 'setTimeStep');
        },
        
        // Acciones - Preferencias de UI
        setTheme: (theme) => {
          set({ theme }, false, 'setTheme');
        },
        
        setLanguage: (language) => {
          set({ language }, false, 'setLanguage');
        },
        
        setDateFormat: (format) => {
          set({ dateFormat: format }, false, 'setDateFormat');
        },
        
        setTimeFormat: (format) => {
          set({ timeFormat: format }, false, 'setTimeFormat');
        },
        
        // Utilidades
        resetToDefaults: () => {
          set(DEFAULT_SETTINGS, false, 'resetToDefaults');
        },
      }),
      {
        name: 'settings-storage',
      }
    ),
    { name: 'SettingsStore' }
  )
);

