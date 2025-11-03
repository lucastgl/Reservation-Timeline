"use client";

import React, { useState, useMemo } from 'react';
import type { WaitlistEntry } from '../Interfaces/waitlistInterfaces';
import type { Table, Reservation } from '../Interfaces/interfaces';
import {
  calculateWaitTimes,
  findPromotionCandidates,
  sendWaitlistNotification,
  markAsNotified,
  calculateWaitlistStats,
  sortWaitlistByPriority,
  convertToReservation,
} from './reservations/ReservationGrid/utils/waitlistUtils';
import {
  recommendTables,
  findAlternativeTimeSlots,
  type TimeSlotRecommendation,
} from './reservations/ReservationGrid/utils/tableRecommendationUtils';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Button } from '@heroui/button';

// 🏪 Importar stores de Zustand
import { useReservationStore, useWaitlistStore, useUIStore } from '../stores';

// ============================================================================
// INTERFACES
// ============================================================================

interface WaitlistPanelProps {
  tables: Table[];
  // onConvertToReservation ya no se usa, el store maneja todo directamente
  onUpdateEntry: (entryId: string, updates: Partial<WaitlistEntry>) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function WaitlistPanel({
  tables,
  onUpdateEntry,
}: WaitlistPanelProps) {
  // 🏪 Obtener datos desde Zustand stores (actualizados en tiempo real)
  const waitlist = useWaitlistStore((state) => state.waitlist);
  const reservations = useReservationStore((state) => state.reservations);
  const isOpen = useUIStore((state) => state.isWaitlistOpen);
  const onClose = useUIStore((state) => state.closeWaitlist);
  const addToWaitlistStore = useWaitlistStore((state) => state.addToWaitlist);
  const clearWaitlistStore = useWaitlistStore((state) => state.clearWaitlist);
  const addReservation = useReservationStore((state) => state.addReservation);
  
  // Estado local para formulario de agregar
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Estado para modal de alternativas
  const { isOpen: isAlternativesModalOpen, onOpen: onOpenAlternativesModal, onClose: onCloseAlternativesModal } = useDisclosure();
  const [alternativesData, setAlternativesData] = useState<{
    entry: WaitlistEntry;
    alternatives: TimeSlotRecommendation[];
  } | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    partySize: 2,
    preferredTime: new Date().toISOString(),
    priority: 'STANDARD' as 'STANDARD' | 'VIP',
    preferredSector: '',
  });
  
  // 🏪 Calcular valores con useMemo en lugar de useEffect + setState
  const sortedWaitlist = useMemo(() => {
    const withWaitTimes = calculateWaitTimes(waitlist, tables, reservations);
    return sortWaitlistByPriority(withWaitTimes);
  }, [waitlist, tables, reservations]);

  const stats = useMemo(() => {
    return calculateWaitlistStats(waitlist);
  }, [waitlist]);

  const promotionSuggestions = useMemo(() => {
    const suggestions = new Map<string, WaitlistEntry[]>();
    const now = new Date().toISOString();

    // Para cada mesa, encontrar candidatos
    tables.forEach((table) => {
      const candidates = findPromotionCandidates(
        waitlist,
        table,
        now,
        reservations
      );
      
      if (candidates.length > 0) {
        suggestions.set(table.id, candidates);
      }
    });

    return suggestions;
  }, [waitlist, tables, reservations]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleAddToWaitlist = () => {
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      alert('Por favor completa nombre y teléfono');
      return;
    }

    // Generar ID único con timestamp + random más robusto
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substr(2, 9);
    const random2 = Math.random().toString(36).substr(2, 9);
    const uniqueId = `waitlist-${timestamp}-${random1}-${random2}`;
    
    const newEntry: WaitlistEntry = {
      id: uniqueId,
      customer: {
        name: formData.customerName.trim(),
        phone: formData.customerPhone.trim(),
      },
      partySize: formData.partySize,
      preferredTime: formData.preferredTime,
      addedAt: new Date().toISOString(),
      estimatedWaitMinutes: 0, // Se calculará automáticamente
      priority: formData.priority,
      preferredSector: formData.preferredSector || undefined,
      status: 'WAITING',
    };

    console.log('🔵 Intentando agregar entry:', newEntry.id);
    
    // 🏪 SOLO agregar al store de Zustand (una sola llamada)
    addToWaitlistStore(newEntry);

    // Resetear formulario y cerrar
    setFormData({
      customerName: '',
      customerPhone: '',
      partySize: 2,
      preferredTime: new Date().toISOString(),
      priority: 'STANDARD',
      preferredSector: '',
    });
    setShowAddForm(false);
  };

  const handleNotifyCustomer = (entry: WaitlistEntry, tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    const now = new Date().toISOString();
    const notification = sendWaitlistNotification(entry, table, now);

    if (notification.success) {
      const updated = markAsNotified(entry);
      onUpdateEntry(entry.id, updated);

      // Mostrar confirmación
      alert(`✅ Notificación enviada a ${entry.customer.name}`);
    }
  };

  const handleConvert = (entry: WaitlistEntry, tableId?: string, startTime?: string) => {
    // Helper para generar ID único
    const generateId = () => `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Si se proporciona tableId y startTime, convertir directamente
    if (tableId && startTime) {
      const partialReservation = convertToReservation(entry, tableId, startTime);
      const endTimeValue = partialReservation.endTime || new Date(new Date(startTime).getTime() + 90 * 60 * 1000).toISOString();
      const now = new Date().toISOString();
      
      const newReservation: Reservation = {
        id: partialReservation.id || generateId(),
        tableId,
        customer: entry.customer,
        partySize: entry.partySize,
        startTime,
        endTime: endTimeValue,
        durationMinutes: partialReservation.durationMinutes || 90,
        status: (partialReservation.status || 'CONFIRMED') as Reservation['status'],
        priority: (entry.priority === 'VIP' ? 'VIP' : 'STANDARD') as Reservation['priority'],
        notes: partialReservation.notes || `Convertido de lista de espera`,
        createdAt: partialReservation.createdAt || now,
        updatedAt: partialReservation.updatedAt || now,
      };
      
      console.log('✅ Creando reserva desde waitlist (directa):', newReservation);
      addReservation(newReservation);
      onUpdateEntry(entry.id, { status: 'SEATED' });
      return;
    }

    // Buscar mesa disponible en el horario preferido
    const preferredTime = entry.preferredTime;
    const duration = 90; // Duración promedio
    const defaultStartTime = preferredTime;

    // 1. Buscar mesas disponibles en el horario preferido
    const recommendations = recommendTables(
      tables,
      reservations,
      entry.partySize,
      defaultStartTime,
      duration,
      entry.preferredSector
    );

    // 2. Si hay disponibilidad exacta, usar la mejor opción
    if (recommendations.length > 0) {
      const bestTable = recommendations[0].table;
      const partialReservation = convertToReservation(entry, bestTable.id, defaultStartTime);
      const endTimeValue = partialReservation.endTime || new Date(new Date(defaultStartTime).getTime() + 90 * 60 * 1000).toISOString();
      const now = new Date().toISOString();
      
      const newReservation: Reservation = {
        id: partialReservation.id || generateId(),
        tableId: bestTable.id,
        customer: entry.customer,
        partySize: entry.partySize,
        startTime: defaultStartTime,
        endTime: endTimeValue,
        durationMinutes: partialReservation.durationMinutes || 90,
        status: (partialReservation.status || 'CONFIRMED') as Reservation['status'],
        priority: (entry.priority === 'VIP' ? 'VIP' : 'STANDARD') as Reservation['priority'],
        notes: partialReservation.notes || `Convertido de lista de espera`,
        createdAt: partialReservation.createdAt || now,
        updatedAt: partialReservation.updatedAt || now,
      };
      
      console.log('✅ Creando reserva desde waitlist:', newReservation);
      addReservation(newReservation);
      onUpdateEntry(entry.id, { status: 'SEATED' });
      return;
    }

    // 3. Si no hay disponibilidad exacta, buscar alternativas
    const alternatives = findAlternativeTimeSlots(
      tables,
      reservations,
      entry.partySize,
      defaultStartTime,
      duration,
      [15, 30, 60]
    );

    // 4. Si hay alternativas, mostrar modal
    if (alternatives.length > 0) {
      setAlternativesData({ entry, alternatives });
      onOpenAlternativesModal();
      return;
    }

    // 5. Si no hay alternativas, buscar en otros sectores
    // Nota: Las mesas mock tienen 'sector' como string, pero el tipo Table tiene 'sectorId'
    // Para compatibilidad, verificamos ambas propiedades
    const allSectors = ['Interior', 'Terraza', 'Bar'];
    const otherSectors = allSectors.filter(s => s !== entry.preferredSector);
    
    for (const sector of otherSectors) {
      const sectorRecommendations = recommendTables(
        tables.filter(t => {
          // Compatibilidad: algunas mesas tienen 'sector' como string directo
          const tableWithSector = t as Table & { sector?: string };
          return tableWithSector.sector === sector || t.sectorId === sector;
        }),
        reservations,
        entry.partySize,
        defaultStartTime,
        duration
      );

      if (sectorRecommendations.length > 0) {
        const bestTable = sectorRecommendations[0].table;
        const partialReservation = convertToReservation(entry, bestTable.id, defaultStartTime);
        const endTimeValue = partialReservation.endTime || new Date(new Date(defaultStartTime).getTime() + 90 * 60 * 1000).toISOString();
        const now = new Date().toISOString();
        
        const newReservation: Reservation = {
          id: partialReservation.id || generateId(),
          tableId: bestTable.id,
          customer: entry.customer,
          partySize: entry.partySize,
          startTime: defaultStartTime,
          endTime: endTimeValue,
          durationMinutes: partialReservation.durationMinutes || 90,
          status: (partialReservation.status || 'CONFIRMED') as Reservation['status'],
          priority: (entry.priority === 'VIP' ? 'VIP' : 'STANDARD') as Reservation['priority'],
          notes: partialReservation.notes || `Convertido de lista de espera`,
          createdAt: partialReservation.createdAt || now,
          updatedAt: partialReservation.updatedAt || now,
        };
        
        console.log('✅ Creando reserva desde waitlist (sector alternativo):', newReservation);
        addReservation(newReservation);
        onUpdateEntry(entry.id, { status: 'SEATED' });
        alert(`✅ Reserva creada en ${sector} (sector alternativo)`);
        return;
      }
    }

    // 6. Si no hay disponibilidad en ningún sector, buscar alternativas sin restricción de sector
    const unrestrictedAlternatives = findAlternativeTimeSlots(
      tables,
      reservations,
      entry.partySize,
      defaultStartTime,
      duration,
      [15, 30, 60]
    );

    if (unrestrictedAlternatives.length > 0) {
      setAlternativesData({ entry, alternatives: unrestrictedAlternatives });
      onOpenAlternativesModal();
      return;
    }

    // 7. Si no hay ninguna opción disponible
    alert('❌ No hay disponibilidad para este cliente. Intente más tarde o considere otro horario.');
  };

  const handleClearWaitlist = () => {
    if (confirm('¿Está seguro de que desea vaciar toda la lista de espera? Esta acción no se puede deshacer.')) {
      clearWaitlistStore();
    }
  };

  const handleCancel = (entryId: string) => {
    onUpdateEntry(entryId, { status: 'CANCELLED' });
  };

  const handleMarkNoShow = (entryId: string) => {
    onUpdateEntry(entryId, { status: 'NO_SHOW' });
  };

  // ========================================================================
  // HELPERS
  // ========================================================================

  const formatWaitTime = (minutes: number) => {
    if (minutes >= 999) return '2+ horas';
    if (minutes >= 120) return `${Math.floor(minutes / 60)}+ horas`;
    if (minutes >= 60) return `~${Math.floor(minutes / 60)}h ${minutes % 60}min`;
    return `~${minutes} min`;
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: WaitlistEntry['status']) => {
    switch (status) {
      case 'WAITING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'NOTIFIED': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'SEATED': return 'bg-green-100 text-green-800 border-green-300';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'NO_SHOW': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: WaitlistEntry['status']) => {
    switch (status) {
      case 'WAITING': return 'Esperando';
      case 'NOTIFIED': return 'Notificado';
      case 'SEATED': return 'Sentado';
      case 'CANCELLED': return 'Cancelado';
      case 'NO_SHOW': return 'No Show';
      default: return status;
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl border-l border-gray-300 z-50 flex flex-col">
      
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              ⏳ Lista de Espera
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {stats?.totalWaiting || 0} esperando
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar panel"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {waitlist.length > 0 && (
          <button
            onClick={handleClearWaitlist}
            className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Vaciar Lista
          </button>
        )}
      </div>

      {/* ESTADÍSTICAS */}
      {stats && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-600">Tiempo Avg</p>
              <p className="text-lg font-bold text-gray-900">{stats.averageWaitTime}min</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Más Largo</p>
              <p className="text-lg font-bold text-orange-600">{stats.longestWait}min</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Conversión</p>
              <p className="text-lg font-bold text-green-600">{stats.conversionRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* SUGERENCIAS DE AUTO-PROMOCIÓN */}
      {promotionSuggestions.size > 0 && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-200">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                ¡Mesas disponibles!
              </p>
              <p className="text-xs text-green-700 mt-1">
                {promotionSuggestions.size} mesa{promotionSuggestions.size > 1 ? 's' : ''} disponible{promotionSuggestions.size > 1 ? 's' : ''} para promoción
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE ESPERA */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {sortedWaitlist.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 font-medium">No hay clientes esperando</p>
            <p className="text-sm text-gray-400 mt-1">Agrega el primer cliente a la lista</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedWaitlist.map((entry, index) => {
              const hasSuggestion = Array.from(promotionSuggestions.values())
                .some(candidates => candidates.some(c => c.id === entry.id));

              return (
                <div
                  key={entry.id}
                  className={`p-4 border-2 rounded-lg ${
                    hasSuggestion ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'
                  } hover:shadow-md transition-shadow`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {entry.priority === 'VIP' && (
                          <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                            ⭐ VIP
                          </span>
                        )}
                        <h3 className="font-semibold text-gray-900">
                          #{index + 1} {entry.customer.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span>👥 {entry.partySize} personas</span>
                        <span>⏱️ {formatWaitTime(entry.estimatedWaitMinutes)}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(entry.status)}`}>
                      {getStatusLabel(entry.status)}
                    </span>
                  </div>

                  {/* Info adicional */}
                  <div className="text-xs text-gray-600 space-y-1 mb-3">
                    <p>📞 {entry.customer.phone}</p>
                    <p>🕐 Hora preferida: {formatTime(entry.preferredTime)}</p>
                    {entry.preferredSector && (
                      <p>📍 Sector: {entry.preferredSector}</p>
                    )}
                    <p className="text-gray-500">
                      Agregado: {formatTime(entry.addedAt)}
                    </p>
                  </div>

                  {/* Acciones */}
                  {entry.status === 'WAITING' && (
                    <div className="flex gap-2">
                      {hasSuggestion && (
                        <button
                          onClick={() => {
                            const tableId = Array.from(promotionSuggestions.keys())
                              .find(tid => promotionSuggestions.get(tid)?.some(c => c.id === entry.id));
                            if (tableId) handleNotifyCustomer(entry, tableId);
                          }}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1"
                        >
                          📱 Notificar
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(entry.id)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {entry.status === 'WAITING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConvert(entry)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                      >
                        ✓ Sentar
                      </button>
                      <button
                        onClick={() => handleCancel(entry.id)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {entry.status === 'NOTIFIED' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const tableId = Array.from(promotionSuggestions.keys())[0];
                          if (tableId) {
                            const suggestedTable = tables.find(t => t.id === tableId);
                            if (suggestedTable) {
                              handleConvert(entry, tableId, entry.preferredTime);
                            } else {
                              handleConvert(entry);
                            }
                          } else {
                            handleConvert(entry);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                      >
                        ✓ Sentar
                      </button>
                      <button
                        onClick={() => handleMarkNoShow(entry.id)}
                        className="px-3 py-2 bg-red-200 text-red-700 rounded text-sm hover:bg-red-300"
                      >
                        No Show
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER CON BOTÓN AGREGAR */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Agregar a Lista de Espera
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Nuevo Cliente</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    customerName: '',
                    customerPhone: '',
                    partySize: 2,
                    preferredTime: new Date().toISOString(),
                    priority: 'STANDARD',
                    preferredSector: '',
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nombre del cliente"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              <input
                type="tel"
                placeholder="Teléfono"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Personas"
                  min="1"
                  max="20"
                  value={formData.partySize}
                  onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) || 2 })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'STANDARD' | 'VIP' })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="STANDARD">Estándar</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              
              <input
                type="datetime-local"
                value={formData.preferredTime.slice(0, 16)}
                onChange={(e) => setFormData({ ...formData, preferredTime: new Date(e.target.value).toISOString() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              <select
                value={formData.preferredSector}
                onChange={(e) => setFormData({ ...formData, preferredSector: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Sin preferencia de sector</option>
                <option value="Interior">Interior</option>
                <option value="Terraza">Terraza</option>
                <option value="Bar">Bar</option>
              </select>
            </div>
            
            <button
              onClick={handleAddToWaitlist}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Agregar
            </button>
          </div>
        )}
      </div>

      {/* Modal de Alternativas */}
      <Modal isOpen={isAlternativesModalOpen} onClose={onCloseAlternativesModal} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-bold">Horarios Alternativos Disponibles</h3>
            <p className="text-sm text-gray-600 font-normal">
              No hay disponibilidad en el horario solicitado. Seleccione una alternativa:
            </p>
          </ModalHeader>
          <ModalBody>
            {alternativesData && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900">
                    Cliente: {alternativesData.entry.customer.name}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Grupo: {alternativesData.entry.partySize} personas • Horario solicitado: {formatTime(alternativesData.entry.preferredTime)}
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {alternativesData.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatTime(alt.startTime)} - {formatTime(alt.endTime)}
                          </p>
                          {alt.offsetMinutes !== 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              {alt.offsetMinutes > 0 ? '+' : ''}{alt.offsetMinutes} minutos del horario solicitado
                            </p>
                          )}
                        </div>
                        {alt.offsetMinutes === 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                            Horario exacto
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Mesas disponibles ({alt.availableTables.length}):
                        </p>
                        <div className="space-y-1">
                          {alt.availableTables.slice(0, 3).map((rec, recIdx) => (
                            <div
                              key={recIdx}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                            >
                              <div>
                                <span className="font-medium">{rec.table.name}</span>
                                <span className="text-gray-600 ml-2">({((rec.table as Table & { sector?: string }).sector) || 'N/A'})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">{rec.reason}</span>
                                {rec.isOptimal && (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                                    Óptima
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          {alt.availableTables.length > 3 && (
                            <p className="text-xs text-gray-500 italic">
                              +{alt.availableTables.length - 3} mesas más disponibles
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            const bestTable = alt.availableTables[0].table;
                            handleConvert(alternativesData.entry, bestTable.id, alt.startTime);
                            onCloseAlternativesModal();
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mt-2"
                        >
                          Seleccionar {alt.availableTables[0].table.name} a las {formatTime(alt.startTime)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {alternativesData.alternatives.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 font-medium">No hay alternativas disponibles</p>
                    <p className="text-sm text-gray-400 mt-1">Intente otro horario o día</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onCloseAlternativesModal}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

