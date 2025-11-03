"use client";

import React, { useState, useCallback, useEffect } from "react";
import type { Reservation } from "../Interfaces/interfaces";
import { debounce } from "./reservations/ReservationGrid/utils/performanceUtils";

// ============================================================================
// INTERFACES
// ============================================================================

interface ReservationToolbarProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    availableSectors: string[];
    selectedSectors: string[];
    onSectorsChange: (sectors: string[]) => void;
    selectedStatuses: Reservation["status"][];
    onStatusesChange: (statuses: Reservation["status"][]) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    zoom: number;
    onZoomChange: (zoom: number) => void;
    activeFiltersCount: number;
    onClearFilters: () => void;
    allowPastReservations: boolean;
    onTogglePastReservations: (allow: boolean) => void;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const ZOOM_OPTIONS = [
    { value: 0.5, label: "50%" },
    { value: 0.75, label: "75%" },
    { value: 1, label: "100%" },
    { value: 1.25, label: "125%" },
    { value: 1.5, label: "150%" },
];

const STATUS_OPTIONS: { value: Reservation["status"]; label: string; emoji: string }[] = [
    { value: "PENDING", label: "Pendiente", emoji: "🟡" },
    { value: "CONFIRMED", label: "Confirmada", emoji: "🔵" },
    { value: "SEATED", label: "Sentada", emoji: "🟢" },
    { value: "FINISHED", label: "Finalizada", emoji: "⚪" },
    { value: "NO_SHOW", label: "No Show", emoji: "🔴" },
    { value: "CANCELLED", label: "Cancelada", emoji: "⚫" },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ReservationToolbar({
    selectedDate,
    onDateChange,
    availableSectors,
    selectedSectors,
    onSectorsChange,
    selectedStatuses,
    onStatusesChange,
    searchQuery,
    onSearchChange,
    zoom,
    onZoomChange,
    activeFiltersCount,
    onClearFilters,
    allowPastReservations,
    onTogglePastReservations,
}: ReservationToolbarProps) {
    
    const [showSectorMenu, setShowSectorMenu] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    
    // Estado para la fecha formateada (solo en cliente para evitar hydration mismatch)
    const [formattedDate, setFormattedDate] = useState<string>("");

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handlePreviousDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        onDateChange(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        onDateChange(newDate);
    };

    const handleToday = () => {
        onDateChange(new Date());
    };

    const toggleSector = (sector: string) => {
        if (selectedSectors.includes(sector)) {
            onSectorsChange(selectedSectors.filter(s => s !== sector));
        } else {
            onSectorsChange([...selectedSectors, sector]);
        }
    };

    const toggleStatus = (status: Reservation["status"]) => {
        if (selectedStatuses.includes(status)) {
            onStatusesChange(selectedStatuses.filter(s => s !== status));
        } else {
            onStatusesChange([...selectedStatuses, status]);
        }
    };

    const selectAllSectors = () => {
        onSectorsChange(availableSectors);
    };

    const deselectAllSectors = () => {
        onSectorsChange([]);
    };

    const selectAllStatuses = () => {
        onStatusesChange(STATUS_OPTIONS.map(s => s.value));
    };

    const deselectAllStatuses = () => {
        onStatusesChange([]);
    };

    // ========================================================================
    // FORMATEO
    // ========================================================================

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatDateInput = (date: Date): string => {
        return date.toISOString().split("T")[0];
    };

    // Actualizar fecha formateada solo en el cliente (después del mount)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setFormattedDate(formatDate(selectedDate));
        }
    }, [selectedDate]);

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="bg-white border-b border-gray-300 shadow-sm">
            {/* Primera fila: Navegación de fecha */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    {/* Navegación de fecha */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePreviousDay}
                            className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        
                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={formatDateInput(selectedDate)}
                                onChange={(e) => onDateChange(new Date(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm font-semibold text-gray-700 capitalize">
                                {formattedDate || formatDateInput(selectedDate)}
                            </span>
                        </div>

                        <button
                            onClick={handleNextDay}
                            className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={handleToday}
                            className="ml-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            Hoy
                        </button>
                    </div>

                    {/* Indicador de filtros activos */}
                    {activeFiltersCount > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-semibold text-blue-700">
                                    {activeFiltersCount} {activeFiltersCount === 1 ? "filtro" : "filtros"}
                                </span>
                            </div>
                            <button
                                onClick={onClearFilters}
                                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            >
                                Limpiar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Segunda fila: Filtros y controles */}
            <div className="px-6 py-3">
                <div className="flex items-center gap-3 flex-wrap">
                    
                    {/* Búsqueda */}
                    <div className="flex-1 min-w-[250px] max-w-[350px]">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="search"
                                name="toolbar-search-reservations"
                                autoComplete="off"
                                placeholder="Buscar por nombre o teléfono..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                            />
                        </div>
                    </div>

                    {/* Filtro de sectores */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSectorMenu(!showSectorMenu)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span>Sectores</span>
                            {selectedSectors.length > 0 && selectedSectors.length < availableSectors.length && (
                                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-semibold">
                                    {selectedSectors.length}
                                </span>
                            )}
                        </button>

                        {showSectorMenu && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setShowSectorMenu(false)}
                                />
                                <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
                                    <div className="p-2 border-b border-gray-200 flex justify-between">
                                        <button
                                            onClick={selectAllSectors}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={deselectAllSectors}
                                            className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                                        >
                                            Ninguno
                                        </button>
                                    </div>
                                    <div className="p-1 max-h-[300px] overflow-y-auto">
                                        {availableSectors.map((sector) => (
                                            <button
                                                key={sector}
                                                onClick={() => toggleSector(sector)}
                                                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center gap-2 ${
                                                    selectedSectors.includes(sector) ? 'bg-blue-50' : ''
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSectors.includes(sector)}
                                                    onChange={() => {}}
                                                    className="rounded"
                                                />
                                                <span className="text-sm">{sector}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Filtro de estados */}
                    <div className="relative">
                        <button
                            onClick={() => setShowStatusMenu(!showStatusMenu)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Estados</span>
                            {selectedStatuses.length > 0 && selectedStatuses.length < STATUS_OPTIONS.length && (
                                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-semibold">
                                    {selectedStatuses.length}
                                </span>
                            )}
                        </button>

                        {showStatusMenu && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setShowStatusMenu(false)}
                                />
                                <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
                                    <div className="p-2 border-b border-gray-200 flex justify-between">
                                        <button
                                            onClick={selectAllStatuses}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={deselectAllStatuses}
                                            className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                                        >
                                            Ninguno
                                        </button>
                                    </div>
                                    <div className="p-1 max-h-[300px] overflow-y-auto">
                                        {STATUS_OPTIONS.map((status) => (
                                            <button
                                                key={status.value}
                                                onClick={() => toggleStatus(status.value)}
                                                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center gap-2 ${
                                                    selectedStatuses.includes(status.value) ? 'bg-blue-50' : ''
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStatuses.includes(status.value)}
                                                    onChange={() => {}}
                                                    className="rounded"
                                                />
                                                <span className="text-lg">{status.emoji}</span>
                                                <span className="text-sm">{status.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Controles de zoom */}
                    <div className="flex items-center gap-1 ml-auto">
                        <span className="text-xs font-medium text-gray-600 mr-2">Zoom:</span>
                        {ZOOM_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => onZoomChange(option.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    zoom === option.value
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Switch para permitir edición retroactiva */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg ml-3">
                        <label className="flex items-center gap-2 cursor-pointer" title="Permite crear y editar reservas en horarios pasados">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={allowPastReservations}
                                    onChange={(e) => onTogglePastReservations(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                {allowPastReservations ? '🔓' : '🔒'} Retroactiva
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

