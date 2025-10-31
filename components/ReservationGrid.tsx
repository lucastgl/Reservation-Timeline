"use client";

import React, { useMemo, useState, useEffect, useRef, memo, useCallback } from "react";
import { DndContext, DragEndEvent, useDroppable } from "@dnd-kit/core";
import ReservationCard from "./ReservationCard";
import CreateReservationModal from "./CreateReservationModal";
import ReservationContextMenu from "./ReservationContextMenu";
import ReservationToolbar from "./ReservationToolbar";
import type { Reservation } from "../Interfaces/interfaces";

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

/**
 * Representa una mesa individual del restaurante
 */
interface Table {
    id: string;
    name: string;
    sector: string;
}

/**
 * Agrupa mesas por sector (Interior, Terraza, etc.)
 */
interface SectorGroup {
    sector: string;
    tables: Table[];
}

// ============================================================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================================================

const START_HOUR = 11; // Hora de inicio (11:00 AM)
const END_HOUR = 24;   // Hora de fin (00:00 del día siguiente, representado como 24)
const MIN_STEP = 15;   // Intervalo de tiempo en minutos (cada celda = 15 min)

// ============================================================================
// FUNCIONES UTILITARIAS
// ============================================================================

/**
 * Agrega ceros a la izquierda para formatear números (ej: 9 -> "09")
 */
function pad(n: number) {
    return n.toString().padStart(2, "0");
}

/**
 * Convierte minutos totales desde medianoche a formato "HH:MM"
 * @param mins - Minutos totales desde las 00:00
 * @returns String formateado como "HH:MM"
 */
function minutesToLabel(mins: number) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${pad(h)}:${pad(m)}`;
}

/**
 * Genera todos los intervalos de tiempo entre START_HOUR y END_HOUR
 * Cada slot representa MIN_STEP minutos
 * @returns Array de minutos desde medianoche para cada slot
 */
function generateTimeSlots() {
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

// Generar slots una sola vez (no cambian durante la ejecución)
const timeSlots = generateTimeSlots();

// ============================================================================
// COMPONENTES MEMOIZADOS (OPTIMIZACIÓN DE PERFORMANCE)
// ============================================================================

/**
 * Celda individual del header de tiempo
 * Memoizado para evitar re-renders innecesarios (hay 53 celdas por defecto)
 */
const TimeHeaderCell = memo(({ 
    timeSlot, 
    stepPx 
}: { 
    timeSlot: number; 
    stepPx: number 
}) => {
    const isHour = timeSlot % 60 === 0;
    const is30 = timeSlot % 30 === 0;

    return (
        <div
            style={{ width: stepPx }}
            className={`flex items-center justify-center text-xs border-r ${
                isHour 
                    ? "font-bold text-slate-900 border-slate-400" 
                    : "text-slate-600 border-slate-300"
            }`}
        >
            {is30 || isHour ? minutesToLabel(timeSlot) : ""}
        </div>
    );
});
TimeHeaderCell.displayName = "TimeHeaderCell";

/**
 * Celda de tiempo individual en la grilla con capacidad droppable
 * Memoizada porque se renderizan cientos de celdas (53 slots × cantidad de mesas)
 */
const TimeGridCell = memo(({ 
    timeSlot, 
    stepPx,
    tableId,
    startHour,
    minStep,
    onClick,
    onMouseDown,
    onMouseEnter,
    onMouseUp,
    isInDragSelection
}: { 
    timeSlot: number; 
    stepPx: number;
    tableId: string;
    startHour: number;
    minStep: number;
    onClick?: (tableId: string, timeSlot: number) => void;
    onMouseDown?: (tableId: string, timeSlot: number) => void;
    onMouseEnter?: (tableId: string, timeSlot: number) => void;
    onMouseUp?: () => void;
    isInDragSelection?: boolean;
}) => {
    const isHour = timeSlot % 60 === 0;
    const is30 = timeSlot % 30 === 0;

    // Hacer cada celda droppable
    const { setNodeRef, isOver } = useDroppable({
        id: `cell-${tableId}-${timeSlot}`,
        data: {
            type: "timeslot",
            tableId,
            timeSlot,
            startHour,
            minStep,
        },
    });

    const handleDoubleClick = () => {
        if (onClick) {
            onClick(tableId, timeSlot);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Solo iniciar drag con click izquierdo
        if (e.button === 0 && onMouseDown) {
            onMouseDown(tableId, timeSlot);
        }
    };

    const handleMouseEnter = () => {
        if (onMouseEnter) {
            onMouseEnter(tableId, timeSlot);
        }
    };

    return (
        <div
            ref={setNodeRef}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseUp={onMouseUp}
            style={{ width: stepPx }}
            className={`h-12 border-t border-r shrink-0 transition-colors cursor-pointer select-none ${
                isHour 
                    ? "border-slate-300" 
                    : is30 
                    ? "border-slate-200" 
                    : "border-slate-100"
            } ${isOver ? "bg-blue-100" : ""} 
            ${isInDragSelection ? "bg-blue-200 border-blue-400" : "hover:bg-slate-50"}`}
            title="Doble click o arrastra para crear reserva"
        />
    );
});
TimeGridCell.displayName = "TimeGridCell";

/**
 * Fila completa de una mesa con todas sus celdas de tiempo y reservas
 * Memoizada para evitar re-renderizar todas las mesas cuando cambia el estado
 */
const TableRow = memo(({ 
    table,
    timeSlots, 
    stepPx, 
    totalWidth,
    reservations,
    startHour,
    minStep,
    onCellClick,
    onCellMouseDown,
    onCellMouseEnter,
    onCellMouseUp,
    dragCreateState,
    onResize,
    onContextMenu,
    reservationValidations
}: { 
    table: Table;
    timeSlots: number[]; 
    stepPx: number; 
    totalWidth: number;
    reservations: Reservation[];
    startHour: number;
    minStep: number;
    onCellClick?: (tableId: string, timeSlot: number) => void;
    onCellMouseDown?: (tableId: string, timeSlot: number) => void;
    onCellMouseEnter?: (tableId: string, timeSlot: number) => void;
    onCellMouseUp?: () => void;
    dragCreateState?: {
        isDragging: boolean;
        tableId: string | null;
        startTimeSlot: number | null;
        currentTimeSlot: number | null;
    };
    onResize?: (reservationId: string, newStartTime: string, newDuration: number) => void;
    onContextMenu?: (reservation: Reservation, position: { x: number; y: number }) => void;
    reservationValidations?: Map<string, { hasConflict: boolean; conflictWithId: string | null; isOutsideHours: boolean; isPast: boolean; errorMessage: string | null }>;
}) => {
    // Filtrar reservas de esta mesa específica
    const tableReservations = reservations.filter(r => r.tableId === table.id);

    // Determinar qué celdas están en la selección de drag
    const isInDragSelection = (timeSlot: number): boolean => {
        if (!dragCreateState?.isDragging || dragCreateState.tableId !== table.id) {
            return false;
        }
        const start = Math.min(dragCreateState.startTimeSlot!, dragCreateState.currentTimeSlot!);
        const end = Math.max(dragCreateState.startTimeSlot!, dragCreateState.currentTimeSlot!);
        return timeSlot >= start && timeSlot <= end;
    };

    return (
        <div className="relative flex">
            {/* Celdas de fondo de la grilla - cada una es droppable y clickeable */}
            <div className="h-12 flex" style={{ minWidth: totalWidth }}>
                {timeSlots.map((ts) => (
                    <TimeGridCell 
                        key={ts} 
                        timeSlot={ts} 
                        stepPx={stepPx}
                        tableId={table.id}
                        startHour={startHour}
                        minStep={minStep}
                        onClick={onCellClick}
                        onMouseDown={onCellMouseDown}
                        onMouseEnter={onCellMouseEnter}
                        onMouseUp={onCellMouseUp}
                        isInDragSelection={isInDragSelection(ts)}
                    />
                ))}
            </div>
            
            {/* Reservas superpuestas sobre las celdas */}
            {tableReservations.map((reservation) => {
                const validation = reservationValidations?.get(reservation.id);
                return (
                    <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        stepPx={stepPx}
                        startHour={startHour}
                        minStep={minStep}
                        onResize={onResize}
                        onContextMenu={onContextMenu}
                        hasConflict={validation?.hasConflict || validation?.isOutsideHours || validation?.isPast || false}
                        conflictMessage={validation?.errorMessage || undefined}
                    />
                );
            })}
        </div>
    );
});
TableRow.displayName = "TableRow";

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * ReservationGrid - Componente principal de la grilla de reservas
 * 
 * ESTRUCTURA:
 * ┌─────────────┬──────────────────────────────────────┐
 * │ Mesas/      │ 11:00  11:30  12:00  ...  24:00     │ <- Header de tiempo
 * │ Sectores    ├──────────────────────────────────────┤
 * ├─────────────┤                                      │
 * │ Mesa 1      │ [────────────────────────────────]   │ <- Fila de mesa
 * │ Mesa 2      │ [────────────────────────────────]   │
 * └─────────────┴──────────────────────────────────────┘
 *    ↑ Sticky       ↑ Scrollable horizontalmente
 * 
 * FLUJO DE DATOS:
 * 1. groups (prop) → sectores con sus mesas
 * 2. timeSlots (const) → 53 intervalos de 15min de 11:00 a 24:00
 * 3. nowMins (state) → tiempo actual en minutos, se actualiza cada 30seg
 * 4. nowOffset (computed) → posición pixel del indicador de tiempo actual
 * 
 * OPTIMIZACIONES:
 * - Componentes memoizados (TimeHeaderCell, TimeGridCell, TableRow)
 * - useEffect con cleanup para el intervalo de tiempo
 * - useMemo para cálculos derivados (nowOffset)
 * - Auto-scroll al tiempo actual al montar
 */
export default function ReservationGrid({
    groups = defaultGroups(),
    reservations: initialReservations = [],
}: {
    groups?: SectorGroup[];
    reservations?: Reservation[];
}) {
    // ========================================================================
    // ESTADO Y REFS
    // ========================================================================
    
    // Estado de reservas (local para drag & drop)
    const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
    
    // Estado del modal de creación
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        tableId?: string;
        tableName?: string;
        tableCapacity?: { min: number; max: number };
        startTime?: string;
        defaultDuration?: number;
    }>({
        isOpen: false,
    });
    
    // Estado del menú contextual
    const [contextMenuState, setContextMenuState] = useState<{
        isOpen: boolean;
        reservation: Reservation | null;
        position: { x: number; y: number };
    }>({
        isOpen: false,
        reservation: null,
        position: { x: 0, y: 0 },
    });
    
    // Estado del modal de edición
    const [editModalState, setEditModalState] = useState<{
        isOpen: boolean;
        reservation: Reservation | null;
    }>({
        isOpen: false,
        reservation: null,
    });
    
    // Estado para crear reservas arrastrando
    const [dragCreateState, setDragCreateState] = useState<{
        isDragging: boolean;
        tableId: string | null;
        startTimeSlot: number | null;
        currentTimeSlot: number | null;
    }>({
        isDragging: false,
        tableId: null,
        startTimeSlot: null,
        currentTimeSlot: null,
    });
    
    // ========================================================================
    // ESTADO DEL TOOLBAR (FILTROS Y CONTROLES)
    // ========================================================================
    
    // Fecha seleccionada
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    
    // Filtros de sectores
    const [selectedSectors, setSelectedSectors] = useState<string[]>(() => 
        groups.map(g => g.sector)
    );
    
    // Filtros de estados
    const [selectedStatuses, setSelectedStatuses] = useState<Reservation["status"][]>([
        "PENDING", "CONFIRMED", "SEATED", "FINISHED", "NO_SHOW", "CANCELLED"
    ]);
    
    // Búsqueda
    const [searchQuery, setSearchQuery] = useState<string>("");
    
    // Zoom
    const [zoom, setZoom] = useState<number>(1);
    
    // Control de sectores colapsados/expandidos
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        groups.forEach((g) => (initial[g.sector] = false));
        return initial;
    });
    
    // Referencia al contenedor scrolleable para auto-scroll
    const containerRef = useRef<HTMLDivElement | null>(null);
    
    // Referencia al indicador de tiempo actual para scroll inicial
    const timeIndicatorRef = useRef<HTMLDivElement | null>(null);
    
    // Actualizar reservas cuando cambia la prop
    useEffect(() => {
        setReservations(initialReservations);
    }, [initialReservations]);

    // ========================================================================
    // TIEMPO ACTUAL Y ACTUALIZACIÓN
    // ========================================================================
    
    // Tiempo actual en minutos desde medianoche (ej: 14:30 = 870 minutos)
    const [nowMins, setNowMins] = useState<number>(() => {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
    });

    // Actualizar tiempo actual cada 30 segundos
    useEffect(() => {
        const intervalId = setInterval(() => {
            const d = new Date();
            setNowMins(d.getHours() * 60 + d.getMinutes());
        }, 30 * 1000); // 30 segundos
        
        return () => clearInterval(intervalId);
    }, []);

    // ========================================================================
    // CÁLCULOS DE DIMENSIONES (CON ZOOM)
    // ========================================================================
    
    const baseStepPx = 48; // Ancho base de cada celda de 15 minutos
    const stepPx = baseStepPx * zoom; // Aplicar zoom
    const totalWidth = timeSlots.length * stepPx; // Ancho total de la timeline

    /**
     * Calcula la posición en pixels del indicador de tiempo actual
     * Basado en la diferencia entre el tiempo actual y la hora de inicio
     */
    const nowOffset = useMemo(() => {
        const start = START_HOUR * 60;
        const minsFromStart = nowMins - start;
        return (minsFromStart / MIN_STEP) * stepPx;
    }, [nowMins, stepPx]);

    // Auto-scroll al tiempo actual cuando se monta el componente
    useEffect(() => {
        if (containerRef.current && nowOffset > 0) {
            // Centrar el indicador de tiempo actual en la vista
            const scrollPosition = nowOffset - (containerRef.current.clientWidth / 2);
            containerRef.current.scrollLeft = Math.max(0, scrollPosition);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Solo al montar, intencionalmente sin nowOffset en deps

    // Determinar si el tiempo actual está dentro del rango visible
    const isCurrentTimeVisible = nowMins >= START_HOUR * 60 && nowMins <= END_HOUR * 60;

    // ========================================================================
    // DRAG & DROP HANDLERS
    // ========================================================================

    /**
     * Helper para encontrar una mesa por ID
     * Memoizada para evitar cambios en las dependencias de otros useCallback
     */
    const findTable = useCallback((tableId: string): { table: Table; sector: string; capacity: { min: number; max: number } } | null => {
        for (const group of groups) {
            const table = group.tables.find(t => t.id === tableId);
            if (table) {
                return {
                    table,
                    sector: group.sector,
                    capacity: { min: 2, max: 8 }, // Por defecto, debería venir de la data
                };
            }
        }
        return null;
    }, [groups]);

    /**
     * Convierte slot de tiempo a ISO datetime
     */
    const timeSlotToISO = (timeSlot: number): string => {
        const today = new Date();
        const hours = Math.floor(timeSlot / 60);
        const minutes = timeSlot % 60;
        today.setHours(hours, minutes, 0, 0);
        return today.toISOString();
    };

    /**
     * Handler cuando se suelta un elemento arrastrado
     */
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // Caso 1: Mover una reserva existente a otra celda
        if (activeData?.type === "reservation" && overData?.type === "timeslot") {
            const reservation = activeData.reservation as Reservation;
            const { tableId, timeSlot } = overData;

            const newStartTime = timeSlotToISO(timeSlot);
            const duration = reservation.durationMinutes;

            // Verificar conflictos en la nueva posición
            const conflictId = findConflict(tableId, newStartTime, duration, reservation.id);
            if (conflictId) {
                console.warn('⚠️ No se puede mover: Conflicto con otra reserva');
                return;
            }

            // Verificar horario de servicio
            if (isOutsideServiceHours(newStartTime, duration)) {
                console.warn('⚠️ No se puede mover: Fuera del horario de servicio');
                return;
            }

            // Verificar si está en el pasado
            if (isInThePast(newStartTime)) {
                console.warn('⚠️ No se puede mover a un horario pasado');
                return;
            }

            const newEndTime = new Date(new Date(newStartTime).getTime() + duration * 60 * 1000).toISOString();

            // Actualizar la reserva
            setReservations(prevReservations =>
                prevReservations.map(r =>
                    r.id === reservation.id
                        ? {
                              ...r,
                              tableId,
                              startTime: newStartTime,
                              endTime: newEndTime,
                              updatedAt: new Date().toISOString(),
                          }
                        : r
                )
            );
        }
    };

    /**
     * Handler para clicks en celdas vacías (crear nueva reserva)
     */
    const handleCellClick = (tableId: string, timeSlot: number) => {
        const tableInfo = findTable(tableId);
        if (!tableInfo) return;

        const startTime = timeSlotToISO(timeSlot);
        const defaultDuration = 90; // 1.5 horas por defecto

        setModalState({
            isOpen: true,
            tableId,
            tableName: tableInfo.table.name,
            tableCapacity: tableInfo.capacity,
            startTime,
            defaultDuration,
        });
    };

    /**
     * Iniciar creación de reserva arrastrando
     */
    const handleCellMouseDown = (tableId: string, timeSlot: number) => {
        setDragCreateState({
            isDragging: true,
            tableId,
            startTimeSlot: timeSlot,
            currentTimeSlot: timeSlot,
        });
    };

    /**
     * Actualizar selección mientras se arrastra
     */
    const handleCellMouseEnter = (tableId: string, timeSlot: number) => {
        if (dragCreateState.isDragging && dragCreateState.tableId === tableId) {
            setDragCreateState(prev => ({
                ...prev,
                currentTimeSlot: timeSlot,
            }));
        }
    };

    /**
     * Finalizar creación de reserva arrastrando
     */
    const handleCellMouseUp = useCallback(() => {
        if (dragCreateState.isDragging && dragCreateState.tableId && dragCreateState.startTimeSlot !== null && dragCreateState.currentTimeSlot !== null) {
            const tableInfo = findTable(dragCreateState.tableId);
            if (!tableInfo) {
                setDragCreateState({
                    isDragging: false,
                    tableId: null,
                    startTimeSlot: null,
                    currentTimeSlot: null,
                });
                return;
            }

            // Calcular inicio y fin (puede arrastrarse hacia atrás)
            const startSlot = Math.min(dragCreateState.startTimeSlot, dragCreateState.currentTimeSlot);
            const endSlot = Math.max(dragCreateState.startTimeSlot, dragCreateState.currentTimeSlot);
            
            // Calcular duración en minutos (incluir la celda final)
            const durationInIntervals = (endSlot - startSlot) / MIN_STEP + 1;
            const duration = durationInIntervals * MIN_STEP;

            const startTime = timeSlotToISO(startSlot);

            setModalState({
                isOpen: true,
                tableId: dragCreateState.tableId,
                tableName: tableInfo.table.name,
                tableCapacity: tableInfo.capacity,
                startTime,
                defaultDuration: duration,
            });
        }

        // Resetear estado de drag
        setDragCreateState({
            isDragging: false,
            tableId: null,
            startTimeSlot: null,
            currentTimeSlot: null,
        });
    }, [dragCreateState, findTable]);

    // Agregar listener global para mouse up (por si se suelta fuera de las celdas)
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (dragCreateState.isDragging) {
                handleCellMouseUp();
            }
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [dragCreateState.isDragging, handleCellMouseUp]);

    /**
     * Guardar nueva reserva desde el modal
     */
    const handleSaveReservation = (newReservation: Partial<Reservation>) => {
        setReservations(prevReservations => [
            ...prevReservations,
            newReservation as Reservation,
        ]);
    };

    /**
     * Actualizar reserva existente desde el modal de edición
     */
    const handleUpdateReservation = (updatedReservation: Partial<Reservation>) => {
        setReservations(prevReservations =>
            prevReservations.map(r =>
                r.id === updatedReservation.id
                    ? { ...r, ...updatedReservation, updatedAt: new Date().toISOString() }
                    : r
            )
        );
    };

    /**
     * Detecta conflictos entre reservas en la misma mesa
     * Retorna el ID de la reserva en conflicto o null
     */
    const findConflict = useCallback((
        tableId: string,
        startTime: string,
        duration: number,
        excludeReservationId?: string
    ): string | null => {
        const newStart = new Date(startTime).getTime();
        const newEnd = newStart + duration * 60 * 1000;

        const conflictingReservation = reservations.find(r => {
            // Excluir la reserva actual (cuando estamos redimensionando)
            if (r.id === excludeReservationId) return false;
            
            // Solo verificar reservas en la misma mesa
            if (r.tableId !== tableId) return false;
            
            // Ignorar reservas canceladas o finalizadas
            if (r.status === 'CANCELLED' || r.status === 'FINISHED') return false;

            const existingStart = new Date(r.startTime).getTime();
            const existingEnd = new Date(r.endTime).getTime();

            // Verificar superposición
            return (newStart < existingEnd && newEnd > existingStart);
        });

        return conflictingReservation?.id || null;
    }, [reservations]);

    /**
     * Verifica si una hora está fuera del horario de servicio
     */
    const isOutsideServiceHours = useCallback((startTime: string, duration: number): boolean => {
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 60 * 1000);
        
        const startHour = start.getHours() + start.getMinutes() / 60;
        const endHour = end.getHours() + end.getMinutes() / 60;
        
        // Horario de servicio: 11:00 - 24:00
        return startHour < START_HOUR || endHour > END_HOUR;
    }, []);

    /**
     * Verifica si una hora ya pasó
     */
    const isInThePast = useCallback((startTime: string): boolean => {
        const now = new Date();
        const reservationTime = new Date(startTime);
        return reservationTime < now;
    }, []);

    /**
     * Obtiene todas las validaciones de una reserva
     */
    const getReservationValidation = useCallback((
        reservation: Reservation
    ): {
        hasConflict: boolean;
        conflictWithId: string | null;
        isOutsideHours: boolean;
        isPast: boolean;
        errorMessage: string | null;
    } => {
        const conflictId = findConflict(
            reservation.tableId,
            reservation.startTime,
            reservation.durationMinutes,
            reservation.id
        );
        const outsideHours = isOutsideServiceHours(reservation.startTime, reservation.durationMinutes);
        const past = isInThePast(reservation.startTime);

        let errorMessage: string | null = null;
        if (conflictId) {
            const conflictingReservation = reservations.find(r => r.id === conflictId);
            if (conflictingReservation) {
                errorMessage = `Conflicto con reserva de ${conflictingReservation.customer.name}`;
            }
        } else if (outsideHours) {
            errorMessage = `Fuera del horario de servicio (${START_HOUR}:00 - ${END_HOUR}:00)`;
        } else if (past) {
            errorMessage = "La hora de esta reserva ya pasó";
        }

        return {
            hasConflict: !!conflictId,
            conflictWithId: conflictId,
            isOutsideHours: outsideHours,
            isPast: past,
            errorMessage,
        };
    }, [findConflict, isOutsideServiceHours, isInThePast, reservations]);

    /**
     * Mapa de validaciones por ID de reserva (memoizado)
     */
    const reservationValidations = useMemo(() => {
        const validations = new Map<string, ReturnType<typeof getReservationValidation>>();
        reservations.forEach(reservation => {
            validations.set(reservation.id, getReservationValidation(reservation));
        });
        return validations;
    }, [reservations, getReservationValidation]);

    /**
     * Handler para redimensionar una reserva
     */
    const handleReservationResize = useCallback((
        reservationId: string,
        newStartTime: string,
        newDuration: number
    ) => {
        // Buscar la reserva
        const reservation = reservations.find(r => r.id === reservationId);
        if (!reservation) return;

        // Verificar conflictos
        const conflictId = findConflict(reservation.tableId, newStartTime, newDuration, reservationId);
        if (conflictId) {
            console.warn('⚠️ Conflicto detectado: La reserva se superpone con otra existente');
            return;
        }

        // Verificar horario de servicio
        if (isOutsideServiceHours(newStartTime, newDuration)) {
            console.warn('⚠️ La reserva está fuera del horario de servicio');
            return;
        }

        // Verificar si está en el pasado
        if (isInThePast(newStartTime)) {
            console.warn('⚠️ No se puede crear una reserva en el pasado');
            return;
        }

        // Calcular nuevo endTime
        const newEndTime = new Date(
            new Date(newStartTime).getTime() + newDuration * 60 * 1000
        ).toISOString();

        // Actualizar la reserva
        setReservations(prevReservations =>
            prevReservations.map(r =>
                r.id === reservationId
                    ? {
                          ...r,
                          startTime: newStartTime,
                          endTime: newEndTime,
                          durationMinutes: newDuration,
                          updatedAt: new Date().toISOString(),
                      }
                    : r
            )
        );
    }, [reservations, findConflict, isOutsideServiceHours, isInThePast]);

    // ========================================================================
    // HANDLERS DEL MENÚ CONTEXTUAL
    // ========================================================================

    /**
     * Abre el menú contextual
     */
    const handleContextMenu = useCallback((reservation: Reservation, position: { x: number; y: number }) => {
        setContextMenuState({
            isOpen: true,
            reservation,
            position,
        });
    }, []);

    /**
     * Editar detalles de una reserva
     */
    const handleEditReservation = useCallback((reservation: Reservation) => {
        setEditModalState({
            isOpen: true,
            reservation,
        });
    }, []);

    /**
     * Cambiar estado de una reserva
     */
    const handleChangeStatus = useCallback((reservationId: string, newStatus: Reservation["status"]) => {
        setReservations(prevReservations =>
            prevReservations.map(r =>
                r.id === reservationId
                    ? { ...r, status: newStatus, updatedAt: new Date().toISOString() }
                    : r
            )
        );
    }, []);

    /**
     * Marcar reserva como No Show
     */
    const handleMarkNoShow = useCallback((reservationId: string) => {
        setReservations(prevReservations =>
            prevReservations.map(r =>
                r.id === reservationId
                    ? { ...r, status: "NO_SHOW", updatedAt: new Date().toISOString() }
                    : r
            )
        );
    }, []);

    /**
     * Cancelar una reserva
     */
    const handleCancelReservation = useCallback((reservationId: string) => {
        setReservations(prevReservations =>
            prevReservations.map(r =>
                r.id === reservationId
                    ? { ...r, status: "CANCELLED", updatedAt: new Date().toISOString() }
                    : r
            )
        );
    }, []);

    /**
     * Duplicar una reserva
     */
    const handleDuplicateReservation = useCallback((reservation: Reservation) => {
        // Crear una copia con una nueva ID y +1 hora
        const newStartTime = new Date(new Date(reservation.startTime).getTime() + 60 * 60 * 1000);
        const newEndTime = new Date(newStartTime.getTime() + reservation.durationMinutes * 60 * 1000);

        const duplicated: Reservation = {
            ...reservation,
            id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
            status: "PENDING",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setReservations(prevReservations => [...prevReservations, duplicated]);
    }, []);

    /**
     * Eliminar una reserva
     */
    const handleDeleteReservation = useCallback((reservationId: string) => {
        setReservations(prevReservations =>
            prevReservations.filter(r => r.id !== reservationId)
        );
    }, []);

    // ========================================================================
    // FILTRADO Y BÚSQUEDA
    // ========================================================================

    /**
     * Filtrar y buscar reservas según criterios activos
     */
    const filteredReservations = useMemo(() => {
        return reservations.filter(reservation => {
            // Filtro por estado
            if (!selectedStatuses.includes(reservation.status)) {
                return false;
            }

            // Filtro por búsqueda (nombre o teléfono)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesName = reservation.customer.name.toLowerCase().includes(query);
                const matchesPhone = reservation.customer.phone.toLowerCase().includes(query);
                if (!matchesName && !matchesPhone) {
                    return false;
                }
            }

            return true;
        });
    }, [reservations, selectedStatuses, searchQuery]);

    /**
     * Filtrar grupos por sectores seleccionados
     */
    const filteredGroups = useMemo(() => {
        return groups.filter(group => selectedSectors.includes(group.sector));
    }, [groups, selectedSectors]);

    /**
     * Calcular cantidad de filtros activos
     */
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        
        // Contar sectores no seleccionados
        if (selectedSectors.length < groups.length) {
            count++;
        }
        
        // Contar estados no seleccionados
        if (selectedStatuses.length < 6) {
            count++;
        }
        
        // Contar búsqueda activa
        if (searchQuery.trim()) {
            count++;
        }
        
        return count;
    }, [selectedSectors.length, selectedStatuses.length, searchQuery, groups.length]);

    /**
     * Limpiar todos los filtros
     */
    const handleClearFilters = useCallback(() => {
        setSelectedSectors(groups.map(g => g.sector));
        setSelectedStatuses(["PENDING", "CONFIRMED", "SEATED", "FINISHED", "NO_SHOW", "CANCELLED"]);
        setSearchQuery("");
    }, [groups]);

    /**
     * Toggle colapsar/expandir sector
     */
    const toggleSectorCollapse = useCallback((sector: string) => {
        setCollapsed(prev => ({
            ...prev,
            [sector]: !prev[sector]
        }));
    }, []);

    /**
     * Obtener sectores disponibles
     */
    const availableSectors = useMemo(() => {
        return groups.map(g => g.sector);
    }, [groups]);

    // ========================================================================
    // RENDER
    // ========================================================================
    
    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="w-full h-screen bg-slate-50 flex flex-col">
                {/* Toolbar superior */}
                <ReservationToolbar
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    availableSectors={availableSectors}
                    selectedSectors={selectedSectors}
                    onSectorsChange={setSelectedSectors}
                    selectedStatuses={selectedStatuses}
                    onStatusesChange={setSelectedStatuses}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    activeFiltersCount={activeFiltersCount}
                    onClearFilters={handleClearFilters}
                />

                <div className="relative border border-slate-300 rounded-lg bg-white shadow-lg flex-1 overflow-hidden">
                    <div className="flex h-full">

                    {/* ============================================================
                        COLUMNA IZQUIERDA STICKY - Nombres de Mesas/Sectores
                        ============================================================ */}
                    <div className="sticky left-0 z-20 w-56 shrink-0 bg-slate-100 border-r border-slate-300 shadow-md">
                        
                        {/* Header de la columna */}
                        <div className="h-12 border-b border-slate-300 flex items-center px-4 font-semibold text-slate-800 bg-slate-200">
                            Mesas / Sectores
                        </div>

                        {/* Lista de mesas agrupadas por sector */}
                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 11rem)' }}>
                            {filteredGroups.map((g) => (
                                <div key={g.sector} className="border-b border-slate-200">
                                    {/* Encabezado del sector - clickeable para colapsar */}
                                    <button
                                        onClick={() => toggleSectorCollapse(g.sector)}
                                        className="w-full h-10 flex items-center justify-between px-4 bg-slate-100 hover:bg-slate-150 border-t border-slate-200 text-slate-800 font-semibold text-sm transition-colors"
                                    >
                                        <span>{g.sector}</span>
                                        <svg 
                                            className={`w-4 h-4 transition-transform ${collapsed[g.sector] ? '' : 'rotate-180'}`}
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Mesas del sector */}
                                    {!collapsed[g.sector] && (
                                        <div>
                                            {g.tables.map((t) => (
                                                <div
                                                    key={t.id}
                                                    className="h-12 flex items-center px-4 border-t border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    <span className="font-medium">{t.name}</span>
                                                    <span className="ml-2 text-xs text-slate-500">
                                                        ({g.sector})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ============================================================
                        ÁREA DE TIMELINE - Scrolleable horizontalmente
                        ============================================================ */}
                    <div className="overflow-x-auto overflow-y-hidden relative" ref={containerRef}>
                        <div style={{ minWidth: totalWidth }} className="relative">
                            
                            {/* Header de horarios (sticky top) */}
                            <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-100 to-slate-50 border-b border-slate-300 shadow-sm">
                                <div className="h-12 flex items-stretch">
                                    {timeSlots.map((ts) => (
                                        <TimeHeaderCell key={ts} timeSlot={ts} stepPx={stepPx} />
                                    ))}
                                </div>
                            </div>

                            {/* Contenedor de filas de mesas */}
                            <div className="relative">
                                {filteredGroups.map((g) => (
                                    <div key={g.sector}>
                                        {/* Fila de encabezado del sector (matching con sidebar) */}
                                        <div className="h-10 bg-slate-50 border-t border-slate-200" />

                                        {/* Filas de mesas */}
                                        {!collapsed[g.sector] &&
                                            g.tables.map((t) => (
                                                <TableRow 
                                                    key={t.id}
                                                    table={t}
                                                    timeSlots={timeSlots}
                                                    stepPx={stepPx}
                                                    totalWidth={totalWidth}
                                                    reservations={filteredReservations}
                                                    startHour={START_HOUR}
                                                    minStep={MIN_STEP}
                                                    onCellClick={handleCellClick}
                                                    onCellMouseDown={handleCellMouseDown}
                                                    onCellMouseEnter={handleCellMouseEnter}
                                                    onCellMouseUp={handleCellMouseUp}
                                                    dragCreateState={dragCreateState}
                                                    onResize={handleReservationResize}
                                                    onContextMenu={handleContextMenu}
                                                    reservationValidations={reservationValidations}
                                                />
                                            ))}
                                    </div>
                                ))}

                                {/* ================================================
                                    INDICADOR DE TIEMPO ACTUAL (Línea roja vertical)
                                    ================================================
                                    Se posiciona absolutamente según nowOffset
                                    Solo se muestra si el tiempo actual está dentro
                                    del rango de horarios configurado
                                */}
                                {isCurrentTimeVisible && nowOffset > 0 && (
                                    <div
                                        ref={timeIndicatorRef}
                                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                                        style={{ left: nowOffset }}
                                    >
                                        {/* Círculo superior del indicador */}
                                        <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-md" />
                                        
                                        {/* Etiqueta con la hora actual */}
                                        <div className="absolute -top-8 -left-8 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                            {minutesToLabel(nowMins)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
            
            {/* Modal de creación rápida - fuera del contenedor con overflow */}
            {modalState.isOpen && modalState.tableId && modalState.tableName && (
                <CreateReservationModal
                    isOpen={modalState.isOpen}
                    onClose={() => setModalState({ isOpen: false })}
                    onSave={handleSaveReservation}
                    tableId={modalState.tableId}
                    tableName={modalState.tableName}
                    tableCapacity={modalState.tableCapacity || { min: 2, max: 8 }}
                    startTime={modalState.startTime || new Date().toISOString()}
                    defaultDuration={modalState.defaultDuration || 90}
                    existingReservations={reservations}
                />
            )}

            {/* Modal de edición completa */}
            {editModalState.isOpen && editModalState.reservation && (
                <CreateReservationModal
                    isOpen={editModalState.isOpen}
                    onClose={() => setEditModalState({ isOpen: false, reservation: null })}
                    onSave={handleUpdateReservation}
                    tableId={editModalState.reservation.tableId}
                    tableName={editModalState.reservation.tableId} // TODO: obtener nombre de mesa
                    tableCapacity={{ min: 2, max: 8 }} // TODO: obtener capacidad real
                    startTime={editModalState.reservation.startTime}
                    defaultDuration={editModalState.reservation.durationMinutes}
                    existingReservations={reservations.filter(r => r.id !== editModalState.reservation?.id)}
                    initialData={editModalState.reservation}
                />
            )}

            {/* Menú contextual */}
            {contextMenuState.isOpen && contextMenuState.reservation && (
                <ReservationContextMenu
                    isOpen={contextMenuState.isOpen}
                    onClose={() => setContextMenuState({ isOpen: false, reservation: null, position: { x: 0, y: 0 } })}
                    reservation={contextMenuState.reservation}
                    position={contextMenuState.position}
                    onEdit={handleEditReservation}
                    onChangeStatus={handleChangeStatus}
                    onMarkNoShow={handleMarkNoShow}
                    onCancel={handleCancelReservation}
                    onDuplicate={handleDuplicateReservation}
                    onDelete={handleDeleteReservation}
                />
            )}
        </DndContext>
    );
}

// ============================================================================
// DATOS DE EJEMPLO
// ============================================================================

/**
 * Genera grupos de mesas por sector por defecto
 * Esta función proporciona datos de ejemplo para testing/desarrollo
 * En producción, estos datos vendrían de una API o base de datos
 */
function defaultGroups(): SectorGroup[] {
    return [
        {
            sector: "Interior",
            tables: [
                { id: "t1", name: "Mesa 1", sector: "Interior" },
                { id: "t2", name: "Mesa 2", sector: "Interior" },
                { id: "t3", name: "Mesa 3", sector: "Interior" },
            ],
        },
        {
            sector: "Terraza",
            tables: [
                { id: "t4", name: "Mesa 4", sector: "Terraza" },
                { id: "t5", name: "Mesa 5", sector: "Terraza" },
            ],
        },
    ];
}
