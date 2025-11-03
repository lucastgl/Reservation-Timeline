/**
 * ============================================================================
 * INTERFACES PARA SISTEMA DE LISTA DE ESPERA
 * ============================================================================
 */

export interface WaitlistEntry {
  id: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  partySize: number;
  preferredTime: string; // ISO string
  addedAt: string; // ISO string - cuándo se agregó a la lista
  estimatedWaitMinutes: number;
  priority: 'STANDARD' | 'VIP';
  notes?: string;
  status: 'WAITING' | 'NOTIFIED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW';
  notifiedAt?: string; // Cuándo se notificó que la mesa está lista
  preferredSector?: string;
}

export interface WaitlistNotification {
  id: string;
  waitlistEntryId: string;
  type: 'SMS' | 'EMAIL' | 'PUSH';
  sentAt: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  message: string;
}

export interface WaitlistStats {
  totalWaiting: number;
  averageWaitTime: number;
  longestWait: number;
  vipCount: number;
  conversionRate: number; // % de lista de espera que se convierte en reserva
}

