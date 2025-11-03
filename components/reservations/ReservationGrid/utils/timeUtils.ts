import { START_HOUR, END_HOUR, MIN_STEP } from './constants';

/**
 * Agrega ceros a la izquierda para formatear números (ej: 9 -> "09")
 */
export function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Convierte minutos totales desde medianoche a formato "HH:MM"
 * @param mins - Minutos totales desde las 00:00
 * @returns String formateado como "HH:MM"
 */
export function minutesToLabel(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
}

/**
 * Genera todos los intervalos de tiempo entre START_HOUR y END_HOUR
 * Cada slot representa MIN_STEP minutos
 * @returns Array de minutos desde medianoche para cada slot
 */
export function generateTimeSlots(): number[] {
  const slots: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    for (let m = 0; m < 60; m += MIN_STEP) {
      const total = h * 60 + m;
      // Detener en END_HOUR:00 (24:00) exactamente
      if (h === END_HOUR && m > 0) continue;
      slots.push(total);
    }
  }
  return slots;
}

/**
 * Convierte un timeSlot (minutos desde medianoche) a un string ISO
 */
export function timeSlotToISO(timeSlot: number): string {
  const today = new Date();
  const hours = Math.floor(timeSlot / 60);
  const minutes = timeSlot % 60;
  today.setHours(hours, minutes, 0, 0);
  return today.toISOString();
}

/**
 * Obtiene el tiempo actual en minutos desde medianoche
 */
export function getCurrentMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

