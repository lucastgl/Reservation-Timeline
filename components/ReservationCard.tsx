"use client";

import React, { memo, useState, useCallback, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Reservation } from "../Interfaces/interfaces";
import { UsersIcon } from "./icons";

// ============================================================================
// CONSTANTES DE ESTILO POR ESTADO
// ============================================================================

/**
 * Mapeo de colores y estilos según el estado de la reserva
 */
const STATUS_STYLES: Record<Reservation["status"], { 
    bg: string; 
    border: string; 
    text: string;
    pattern?: string;
}> = {
    PENDING: {
        bg: "bg-yellow-300",
        border: "border-yellow-400",
        text: "text-yellow-900",
    },
    CONFIRMED: {
        bg: "bg-blue-400",
        border: "border-blue-500",
        text: "text-white",
    },
    SEATED: {
        bg: "bg-green-400",
        border: "border-green-500",
        text: "text-white",
    },
    FINISHED: {
        bg: "bg-gray-400",
        border: "border-gray-500",
        text: "text-gray-100",
    },
    NO_SHOW: {
        bg: "bg-red-400",
        border: "border-red-500",
        text: "text-white",
    },
    CANCELLED: {
        bg: "bg-gray-300",
        border: "border-gray-400",
        text: "text-gray-700",
        pattern: "striped", // Patrón rayado
    },
};

/**
 * Mapeo de badges de prioridad
 */
const PRIORITY_BADGES: Record<Reservation["priority"], { 
    label: string; 
    color: string;
    show: boolean;
}> = {
    STANDARD: {
        label: "",
        color: "",
        show: false,
    },
    VIP: {
        label: "VIP",
        color: "bg-amber-500 text-white",
        show: true,
    },
    LARGE_GROUP: {
        label: "Grupo",
        color: "bg-purple-500 text-white",
        show: true,
    },
};

// ============================================================================
// INTERFACES DEL COMPONENTE
// ============================================================================

interface ReservationCardProps {
    reservation: Reservation;
    stepPx: number;      // Ancho de cada intervalo de 15 minutos en pixels
    startHour: number;   // Hora de inicio de la grilla (ej: 11)
    minStep: number;     // Minutos por intervalo (ej: 15)
    onResize?: (reservationId: string, newStartTime: string, newDuration: number) => void;
    onContextMenu?: (reservation: Reservation, position: { x: number; y: number }) => void;
    hasConflict?: boolean;  // Indica si hay conflicto con otra reserva
    conflictMessage?: string; // Mensaje descriptivo del conflicto
}

// Constantes para redimensionamiento
const MIN_DURATION = 30;  // 30 minutos
const MAX_DURATION = 240; // 4 horas

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * ReservationCard - Bloque visual de una reserva en la timeline
 * 
 * POSICIONAMIENTO:
 * - X (left): Calculado desde la hora de inicio de la reserva
 * - Y (top): Centrado en la fila de la mesa (con padding)
 * - Width: Basado en la duración de la reserva
 * - Height: Altura de la fila menos padding
 * 
 * COLORES:
 * Cambian según el estado (PENDING, CONFIRMED, SEATED, etc.)
 * 
 * CONTENIDO:
 * - Nombre del cliente
 * - Tamaño del grupo (icono + número)
 * - Rango horario
 * - Badge de prioridad (VIP, Grupo grande)
 */
const ReservationCard = memo(({ 
    reservation, 
    stepPx, 
    startHour, 
    minStep,
    onResize,
    onContextMenu,
    hasConflict = false,
    conflictMessage
}: ReservationCardProps) => {
    
    // ========================================================================
    // ESTADO DE REDIMENSIONAMIENTO
    // ========================================================================
    
    const [resizeState, setResizeState] = useState<{
        isResizing: boolean;
        direction: 'left' | 'right' | null;
        startX: number;
        originalStartTime: string;
        originalDuration: number;
        currentDuration: number;
        currentStartTime: string;
    } | null>(null);
    
    // ========================================================================
    // DRAG & DROP
    // ========================================================================
    
    const { 
        setNodeRef, 
        attributes, 
        listeners, 
        transform, 
        isDragging 
    } = useDraggable({
        id: reservation.id,
        data: {
            type: "reservation",
            reservation,
        },
        disabled: resizeState?.isResizing || false, // Deshabilitar drag mientras se redimensiona
    });

    // Estilo de transformación para el drag
    const dragStyle = transform ? {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
    } : {};
    
    // ========================================================================
    // CÁLCULOS DE POSICIÓN Y DIMENSIONES
    // ========================================================================
    
    /**
     * Convierte ISO datetime a minutos desde medianoche
     */
    const timeToMinutes = (isoTime: string): number => {
        const date = new Date(isoTime);
        return date.getHours() * 60 + date.getMinutes();
    };

    /**
     * Formatea minutos a "HH:MM"
     */
    const minutesToTime = (mins: number): string => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };

    // Usar valores del estado de resize o valores originales
    const currentStartTime = resizeState?.currentStartTime || reservation.startTime;
    const currentDuration = resizeState?.currentDuration || reservation.durationMinutes;

    // Convertir tiempos de inicio y fin
    const startMins = timeToMinutes(currentStartTime);
    const endMins = startMins + currentDuration;
    
    // Calcular posición X (offset desde el inicio de la grilla)
    const gridStartMins = startHour * 60;
    const offsetMins = startMins - gridStartMins;
    const leftPosition = (offsetMins / minStep) * stepPx;
    
    // Calcular ancho basado en duración
    const width = (currentDuration / minStep) * stepPx;
    
    // Obtener estilos según estado
    const styles = STATUS_STYLES[reservation.status];
    const priorityBadge = PRIORITY_BADGES[reservation.priority];
    
    // ========================================================================
    // HANDLERS DE REDIMENSIONAMIENTO
    // ========================================================================
    
    /**
     * Inicia el redimensionamiento cuando se presiona un handle
     */
    const handleResizeStart = useCallback((e: React.MouseEvent, direction: 'left' | 'right') => {
        e.stopPropagation();
        e.preventDefault();
        
        setResizeState({
            isResizing: true,
            direction,
            startX: e.clientX,
            originalStartTime: reservation.startTime,
            originalDuration: reservation.durationMinutes,
            currentDuration: reservation.durationMinutes,
            currentStartTime: reservation.startTime,
        });
    }, [reservation.startTime, reservation.durationMinutes]);
    
    /**
     * Maneja el movimiento del mouse durante el resize
     */
    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (!resizeState?.isResizing) return;
        
        const deltaX = e.clientX - resizeState.startX;
        const deltaMinutes = Math.round((deltaX / stepPx) * minStep);
        
        if (resizeState.direction === 'right') {
            // Redimensionar desde el borde derecho (cambiar duración)
            let newDuration = resizeState.originalDuration + deltaMinutes;
            
            // Aplicar restricciones
            newDuration = Math.max(MIN_DURATION, Math.min(MAX_DURATION, newDuration));
            
            // Snap a intervalos de minStep
            newDuration = Math.round(newDuration / minStep) * minStep;
            
            setResizeState(prev => prev ? {
                ...prev,
                currentDuration: newDuration,
            } : null);
            
        } else if (resizeState.direction === 'left') {
            // Redimensionar desde el borde izquierdo (cambiar inicio y duración)
            let newDuration = resizeState.originalDuration - deltaMinutes;
            
            // Aplicar restricciones
            newDuration = Math.max(MIN_DURATION, Math.min(MAX_DURATION, newDuration));
            
            // Snap a intervalos de minStep
            newDuration = Math.round(newDuration / minStep) * minStep;
            
            // Calcular nuevo tiempo de inicio
            const originalStart = new Date(resizeState.originalStartTime);
            const minutesOffset = resizeState.originalDuration - newDuration;
            const newStartTime = new Date(originalStart.getTime() + minutesOffset * 60 * 1000);
            
            setResizeState(prev => prev ? {
                ...prev,
                currentDuration: newDuration,
                currentStartTime: newStartTime.toISOString(),
            } : null);
        }
    }, [resizeState, stepPx, minStep]);
    
    /**
     * Finaliza el redimensionamiento
     */
    const handleResizeEnd = useCallback(() => {
        if (!resizeState?.isResizing) return;
        
        // Solo aplicar cambios si hubo un cambio real
        if (resizeState.currentDuration !== resizeState.originalDuration || 
            resizeState.currentStartTime !== resizeState.originalStartTime) {
            
            onResize?.(
                reservation.id,
                resizeState.currentStartTime,
                resizeState.currentDuration
            );
        }
        
        setResizeState(null);
    }, [resizeState, reservation.id, onResize]);
    
    // Agregar listeners globales para mouse move y up
    useEffect(() => {
        if (!resizeState?.isResizing) return;
        
        window.addEventListener('mousemove', handleResizeMove);
        window.addEventListener('mouseup', handleResizeEnd);
        
        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [resizeState?.isResizing, handleResizeMove, handleResizeEnd]);
    
    /**
     * Handler para click derecho (menú contextual)
     */
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (resizeState?.isResizing) return; // No abrir menú durante resize
        
        onContextMenu?.(reservation, { x: e.clientX, y: e.clientY });
    }, [reservation, onContextMenu, resizeState?.isResizing]);
    
    // ========================================================================
    // RENDER
    // ========================================================================
    
    return (
        <div
            ref={setNodeRef}
            {...(!resizeState?.isResizing ? attributes : {})}
            {...(!resizeState?.isResizing ? listeners : {})}
            onContextMenu={handleContextMenu}
            className={`
                absolute rounded-md shadow-md 
                ${hasConflict ? 'border-4 border-red-500' : `border-2 ${styles.border}`}
                ${styles.bg} ${styles.text}
                overflow-hidden 
                ${resizeState?.isResizing ? 'cursor-col-resize' : 'cursor-grab active:cursor-grabbing'}
                ${resizeState?.isResizing ? '' : 'transition-all duration-200'}
                hover:shadow-lg hover:z-20 ${resizeState?.isResizing ? '' : 'hover:scale-[1.02]'}
                ${styles.pattern === 'striped' ? 'bg-striped' : ''}
                ${isDragging ? 'opacity-50' : ''}
                ${resizeState?.isResizing ? 'z-30 ring-2 ring-blue-400' : ''}
                ${hasConflict ? 'z-40 animate-pulse' : ''}
            `}
            style={{
                left: `${leftPosition}px`,
                width: `${width}px`,
                top: '4px',
                height: 'calc(100% - 8px)', // 48px de altura - 8px de padding
                minWidth: `${stepPx * 2}px`, // Mínimo 2 intervalos (30 min)
                ...dragStyle,
            }}
            title={hasConflict && conflictMessage ? conflictMessage : `${reservation.customer.name} - ${reservation.status}`}
        >
            {/* Patrón rayado para CANCELLED */}
            {styles.pattern === 'striped' && (
                <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)',
                    }}
                />
            )}

            {/* Ícono de advertencia para conflictos */}
            {hasConflict && (
                <div className="absolute -top-2 -right-2 z-50 pointer-events-none">
                    <div className="bg-red-500 rounded-full p-1 shadow-lg animate-bounce">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Handle izquierdo para redimensionar */}
            <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white hover:bg-opacity-40 transition-colors z-10 group"
                onMouseDown={(e) => handleResizeStart(e, 'left')}
                title="Arrastra para cambiar hora de inicio"
            >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white bg-opacity-0 group-hover:bg-opacity-60 rounded-r transition-all" />
            </div>

            {/* Handle derecho para redimensionar */}
            <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white hover:bg-opacity-40 transition-colors z-10 group"
                onMouseDown={(e) => handleResizeStart(e, 'right')}
                title="Arrastra para cambiar duración"
            >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white bg-opacity-0 group-hover:bg-opacity-60 rounded-l transition-all" />
            </div>

            {/* Contenido del bloque */}
            <div className="relative p-2 h-full flex flex-col justify-between text-xs pointer-events-none">
                
                {/* Header: Nombre + Badge de prioridad */}
                <div className="flex items-start justify-between gap-1">
                    <div className="font-bold truncate flex-1 leading-tight">
                        {reservation.customer.name}
                    </div>
                    {priorityBadge.show && (
                        <span className={`
                            px-1.5 py-0.5 rounded text-[10px] font-bold
                            ${priorityBadge.color} shrink-0
                        `}>
                            {priorityBadge.label}
                        </span>
                    )}
                </div>

                {/* Body: Tamaño del grupo */}
                <div className="flex items-center gap-1 font-medium">
                    <UsersIcon className="w-3 h-3" />
                    <span>{reservation.partySize}</span>
                </div>

                {/* Footer: Rango horario */}
                <div className="text-[10px] font-semibold opacity-90 leading-tight">
                    {minutesToTime(startMins)} – {minutesToTime(endMins)}
                </div>
            </div>

            {/* Indicador de duración durante resize */}
            {resizeState?.isResizing && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                    {currentDuration} min
                </div>
            )}
        </div>
    );
});

ReservationCard.displayName = "ReservationCard";

export default ReservationCard;

