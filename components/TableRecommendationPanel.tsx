"use client";

import React, { useState, useEffect } from 'react';
import type { Table, Reservation, Sector } from '../Interfaces/interfaces';
import { 
  recommendTables, 
  findAlternativeTimeSlots,
  analyzeCustomerPattern,
  type TableRecommendation,
  type TimeSlotRecommendation 
} from './reservations/ReservationGrid/utils/tableRecommendationUtils';

// ============================================================================
// INTERFACES
// ============================================================================

interface TableRecommendationPanelProps {
  tables: Table[];
  reservations: Reservation[];
  partySize: number;
  startTime: string;
  duration: number;
  preferredSector?: string;
  sectors?: Sector[];
  customerPhone?: string;
  onSelectTable: (tableId: string, startTime: string) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function TableRecommendationPanel({
  tables,
  reservations,
  partySize,
  startTime,
  duration,
  preferredSector,
  sectors = [],
  customerPhone,
  onSelectTable,
}: TableRecommendationPanelProps) {
  
  const [recommendations, setRecommendations] = useState<TableRecommendation[]>([]);
  const [alternatives, setAlternatives] = useState<TimeSlotRecommendation[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [customerInsights, setCustomerInsights] = useState<any>(null);

  // ========================================================================
  // EFECTOS
  // ========================================================================

  // Calcular recomendaciones cuando cambian los parámetros
  useEffect(() => {
    if (partySize > 0 && startTime && duration > 0) {
      const recs = recommendTables(
        tables,
        reservations,
        partySize,
        startTime,
        duration,
        preferredSector,
        sectors
      );
      setRecommendations(recs);
    }
  }, [tables, reservations, partySize, startTime, duration, preferredSector, sectors]);

  // Analizar patrón del cliente
  useEffect(() => {
    if (customerPhone && reservations.length > 0) {
      const insights = analyzeCustomerPattern(customerPhone, reservations);
      setCustomerInsights(insights);
    }
  }, [customerPhone, reservations]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleSearchAlternatives = () => {
    const alts = findAlternativeTimeSlots(
      tables,
      reservations,
      partySize,
      startTime,
      duration
    );
    setAlternatives(alts);
    setShowAlternatives(true);
  };

  const handleSelectRecommendation = (tableId: string, time: string) => {
    onSelectTable(tableId, time);
  };

  // ========================================================================
  // HELPERS
  // ========================================================================

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-300';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-300';
    return 'text-gray-600 bg-gray-50 border-gray-300';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 70) return 'Buena';
    return 'Aceptable';
  };

  // ========================================================================
  // RENDER: SIN DISPONIBILIDAD
  // ========================================================================

  if (recommendations.length === 0 && partySize > 0) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">No hay mesas disponibles</h3>
            <p className="text-sm text-red-700 mt-1">
              No se encontraron mesas disponibles para {partySize} persona{partySize > 1 ? 's' : ''} a las {formatTime(startTime)}.
            </p>
            <button
              onClick={handleSearchAlternatives}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar horarios alternativos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER: CON RECOMENDACIONES
  // ========================================================================

  return (
    <div className="space-y-4">
      
      {/* INSIGHTS DEL CLIENTE */}
      {customerInsights && customerInsights.confidence > 40 && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-purple-900">Información del Cliente</h4>
              <div className="mt-2 text-sm text-purple-800 space-y-1">
                {customerInsights.isFrequentCustomer && (
                  <p>✨ Cliente frecuente ({customerInsights.confidence}% confianza)</p>
                )}
                {customerInsights.isPotentialVIP && (
                  <p className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                      VIP Sugerido
                    </span>
                    Considera establecer prioridad VIP
                  </p>
                )}
                {customerInsights.averagePartySize > 0 && (
                  <p>👥 Tamaño típico de grupo: {customerInsights.averagePartySize} personas</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECOMENDACIONES DE MESA */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-900">
            🎯 Mesas Recomendadas ({recommendations.length})
          </h3>
          {recommendations.length > 0 && (
            <button
              onClick={handleSearchAlternatives}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Otros horarios
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {recommendations.slice(0, 5).map((rec, index) => (
            <div
              key={rec.table.id}
              className={`p-4 border-2 rounded-lg hover:shadow-md transition-all cursor-pointer ${getScoreColor(rec.score)}`}
              onClick={() => handleSelectRecommendation(rec.table.id, startTime)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">
                      {rec.table.name}
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getScoreColor(rec.score)}`}>
                      {getScoreLabel(rec.score)} {rec.score}%
                    </span>
                    {rec.isOptimal && (
                      <span className="text-xs">⭐ Match Perfecto</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{rec.reason}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Sector: {(() => {
                      const sectorNameMap = new Map<string, string>();
                      sectors.forEach(sector => {
                        sectorNameMap.set(sector.id, sector.name);
                      });
                      return sectorNameMap.get(rec.table.sectorId) || 
                        (rec.table as Table & { sector?: string }).sector || 
                        rec.table.sectorId;
                    })()}
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HORARIOS ALTERNATIVOS */}
      {showAlternatives && alternatives.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Horarios Alternativos Disponibles
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alternatives.slice(0, 6).map((alt, index) => (
              <div
                key={index}
                className="p-3 bg-white border border-blue-200 rounded hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {formatTime(alt.startTime)}
                      {alt.offsetMinutes !== 0 && (
                        <span className="text-sm text-gray-600 ml-2">
                          ({alt.offsetMinutes > 0 ? '+' : ''}{alt.offsetMinutes} min)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {alt.availableTables.length} mesa{alt.availableTables.length > 1 ? 's' : ''} disponible{alt.availableTables.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectRecommendation(
                      alt.availableTables[0].table.id,
                      alt.startTime
                    )}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                  >
                    Seleccionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

