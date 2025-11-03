"use client";

import React, { useMemo } from 'react';
import type { Table, Sector } from '../Interfaces/interfaces';
import {
  calculateHourlyCapacity,
  analyzeSectorCapacity,
  calculateDailyKPIs,
  type TimeSlotCapacity
} from './reservations/ReservationGrid/utils/capacityAnalyticsUtils';

// 🏪 Importar stores de Zustand
import { useReservationStore, useFilterStore } from '../stores';

// ============================================================================
// INTERFACES
// ============================================================================

interface CapacityAnalyticsPanelProps {
  tables: Table[];
  sectors?: Sector[];
  onTimeSlotClick?: (timeSlot: number) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function CapacityAnalyticsPanel({
  tables,
  sectors = [],
  onTimeSlotClick,
}: CapacityAnalyticsPanelProps) {
  // 🏪 Obtener datos desde Zustand stores (actualizados en tiempo real)
  const reservations = useReservationStore((state) => state.reservations);
  const selectedDate = useFilterStore((state) => state.selectedDate);
  
  // ========================================================================
  // MEMOIZACIÓN DE CÁLCULOS
  // ========================================================================

  const hourlyCapacity = useMemo(
    () => calculateHourlyCapacity(tables, reservations, selectedDate),
    [tables, reservations, selectedDate]
  );

  const sectorStats = useMemo(
    () => analyzeSectorCapacity(tables, reservations, selectedDate, sectors),
    [tables, reservations, selectedDate, sectors]
  );

  const dailyKPIs = useMemo(
    () => calculateDailyKPIs(tables, reservations, selectedDate, sectors),
    [tables, reservations, selectedDate, sectors]
  );

  // ========================================================================
  // HELPERS
  // ========================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'full': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'full': return 'Completa';
      default: return '';
    }
  };

  const handleBarClick = (slot: TimeSlotCapacity) => {
    if (onTimeSlotClick) {
      onTimeSlotClick(slot.timeSlot);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="bg-white border-b border-gray-300 shadow-sm">
      
      {/* KPIs PRINCIPALES */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Métricas del Día</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          
          {/* Total Reservas */}
          <div>
            <p className="text-xs text-gray-600">Reservas</p>
            <p className="text-2xl font-bold text-gray-900">{dailyKPIs.totalReservations}</p>
          </div>

          {/* Ocupación Promedio */}
          <div>
            <p className="text-xs text-gray-600">Ocupación Media</p>
            <p className="text-2xl font-bold text-blue-600">{dailyKPIs.averageOccupancy}%</p>
          </div>

          {/* Hora Pico */}
          <div>
            <p className="text-xs text-gray-600">Hora Pico</p>
            <p className="text-2xl font-bold text-orange-600">{dailyKPIs.peakHour}</p>
            <p className="text-xs text-gray-600">{dailyKPIs.peakOccupancy}%</p>
          </div>

          {/* Score de Utilización */}
          <div>
            <p className="text-xs text-gray-600">Score Utilización</p>
            <p className="text-2xl font-bold text-green-600">{dailyKPIs.utilizationScore}</p>
          </div>

          {/* Rotación */}
          <div>
            <p className="text-xs text-gray-600">Turnos/Mesa</p>
            <p className="text-2xl font-bold text-purple-600">{dailyKPIs.turnsPerTable}</p>
          </div>

          {/* Sector Popular */}
          <div>
            <p className="text-xs text-gray-600">Sector Top</p>
            <p className="text-lg font-bold text-gray-900 truncate">{dailyKPIs.mostPopularSector}</p>
          </div>
        </div>
      </div>

      {/* GRÁFICO DE BARRAS DE OCUPACIÓN */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            📈 Ocupación por Franja Horaria
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">&lt;70%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-600">70-90%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-gray-600">&gt;90%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600">100%</span>
            </div>
          </div>
        </div>

        {/* Contenedor con scroll horizontal */}
        <div className="overflow-x-auto">
          <div className="flex items-end gap-1 min-w-max h-24 pb-6 relative">
            {hourlyCapacity.map((slot, index) => {
              // Solo mostrar cada 4 slots (cada hora) para no saturar
              const showLabel = index % 4 === 0;
              
              return (
                <div
                  key={slot.timeSlot}
                  className="relative group flex-shrink-0"
                  style={{ width: '12px' }}
                >
                  {/* Barra */}
                  <div
                    className={`${getStatusColor(slot.status)} rounded-t cursor-pointer hover:opacity-80 transition-opacity`}
                    style={{
                      height: `${slot.occupancyPercent}%`,
                      minHeight: slot.occupancyPercent > 0 ? '2px' : '0',
                    }}
                    onClick={() => handleBarClick(slot)}
                    title={`${slot.timeLabel} - ${slot.occupancyPercent}% ocupado`}
                  />

                  {/* Label de hora */}
                  {showLabel && (
                    <span className="absolute -bottom-5 left-0 text-[10px] text-gray-600 -rotate-45 origin-top-left whitespace-nowrap">
                      {slot.timeLabel}
                    </span>
                  )}

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
                      <p className="font-semibold">{slot.timeLabel}</p>
                      <p className="mt-1">Ocupación: {slot.occupancyPercent}%</p>
                      <p>Mesas: {slot.occupiedTables}/{slot.totalTables}</p>
                      <p>Capacidad: {slot.usedCapacity}/{slot.totalCapacity}</p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        Click para saltar
                      </p>
                      {/* Flecha del tooltip */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ESTADÍSTICAS POR SECTOR */}
      {sectorStats.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            🏢 Rendimiento por Sector
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sectorStats.map((stat) => (
              <div
                key={stat.sector}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{stat.sector}</h4>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                    Score {stat.utilizationScore}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-600">Mesas</p>
                    <p className="font-semibold text-gray-900">{stat.totalTables}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Ocupación Avg</p>
                    <p className="font-semibold text-gray-900">{stat.averageOccupancy}%</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600">Pico: {stat.peakHour}</p>
                    {/* Barra de progreso */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          stat.peakOccupancy >= 90 ? 'bg-red-500' :
                          stat.peakOccupancy >= 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${stat.peakOccupancy}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

