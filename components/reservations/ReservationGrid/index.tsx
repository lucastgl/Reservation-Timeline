"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import type { Reservation } from "../../../Interfaces/interfaces";
import type { SectorGroup, TableInfo } from "./types";

// Hooks
import { useReservations } from "./hooks/useReservations";
import { useFilters } from "./hooks/useFilters";
import { useConflictDetection } from "./hooks/useConflictDetection";
import { useDragCreate } from "./hooks/useDragCreate";

// Components
import { TimeHeaderCell } from "./components/TimeHeaderCell";
import { TableRow } from "./components/TableRow";
import { CurrentTimeIndicator } from "./components/CurrentTimeIndicator";
import CreateReservationModal from "../../CreateReservationModal";
import ReservationContextMenu from "../../ReservationContextMenu";
import ReservationToolbar from "../../ReservationToolbar";

// Utils
import { generateTimeSlots, getCurrentMinutes, timeSlotToISO } from "./utils/timeUtils";
import { BASE_STEP_PX, START_HOUR, END_HOUR } from "./utils/constants";

// Generar slots una sola vez (no cambian durante la ejecución)
const timeSlots = generateTimeSlots();

// ============================================================================
// DATOS DE EJEMPLO
// ============================================================================

/**
 * Genera grupos de mesas por sector por defecto
 * NOTA: Esta función solo se usa como fallback si no se pasan grupos explícitamente
 * Los datos reales deben venir del seed data
 */
function defaultGroups(): SectorGroup[] {
  console.warn('⚠️ ReservationGrid usando grupos por defecto - esto no debería suceder en producción');
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

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface ReservationGridProps {
  groups?: SectorGroup[];
  reservations?: Reservation[];
  allowPastReservations?: boolean;
  onTogglePastReservations?: (allow: boolean) => void;
}

/**
 * ReservationGrid - Componente principal de la grilla de reservas
 * Ahora refactorizado con hooks y componentes separados para mejor mantenibilidad
 */
export default function ReservationGrid({
  groups = defaultGroups(),
  reservations: initialReservations = [],
  allowPastReservations = false,
  onTogglePastReservations,
}: ReservationGridProps) {
  // Debug: Verificar qué grupos se están recibiendo
  useEffect(() => {
    console.log('📊 ReservationGrid - Grupos recibidos:', groups);
    console.log('   - Total sectores:', groups.length);
    groups.forEach(g => console.log(`   - ${g.sector}: ${g.tables.length} mesas`, g.tables.map(t => t.id)));
  }, [groups]);
  
  // ========================================================================
  // HOOKS PERSONALIZADOS
  // ========================================================================

  // Manejo de reservas (CRUD)
  const {
    reservations,
    modalState,
    contextMenuState,
    editModalState,
    handleCellClick: handleCellClickBase,
    openCreateModal,
    closeCreateModal,
    handleSaveReservation,
    handleUpdateReservation,
    handleEditReservation,
    closeEditModal,
    handleMoveReservation,
    handleReservationResize: handleReservationResizeBase,
    handleContextMenu,
    closeContextMenu,
    handleChangeStatus,
    handleMarkNoShow,
    handleCancelReservation,
    handleDuplicateReservation,
    handleDeleteReservation,
  } = useReservations(initialReservations);

  // Filtros y búsqueda
  const {
    selectedDate,
    setSelectedDate,
    selectedSectors,
    setSelectedSectors,
    selectedStatuses,
    setSelectedStatuses,
    searchQuery,
    setSearchQuery,
    collapsed,
    filteredReservations,
    filteredGroups,
    activeFiltersCount,
    availableSectors,
    handleClearFilters,
    toggleSectorCollapse,
  } = useFilters(groups, reservations);

  // Detección de conflictos y validaciones (con flag para permitir horarios pasados)
  const {
    findConflict,
    isOutsideServiceHours,
    isInThePast,
    reservationValidations,
  } = useConflictDetection(reservations, allowPastReservations);

  // ========================================================================
  // ESTADO LOCAL Y REFS
  // ========================================================================

  // Zoom
  const [zoom, setZoom] = useState<number>(1);

  // Tiempo actual en minutos desde medianoche
  // Usar lazy initialization para evitar hydration mismatch (el valor solo se calcula en el cliente)
  const [nowMins, setNowMins] = useState<number>(() => {
    // Solo calcular en el cliente (después de mount)
    if (typeof window !== 'undefined') {
      return getCurrentMinutes();
    }
    // Valor inicial para SSR (no se usa, pero evita warnings)
    return START_HOUR * 60;
  });

  // Referencias para scroll
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeIndicatorRef = useRef<HTMLDivElement | null>(null);

  // ========================================================================
  // HELPERS
  // ========================================================================

  /**
   * Helper para encontrar una mesa por ID
   */
  const findTable = useCallback(
    (tableId: string): TableInfo | null => {
      for (const group of groups) {
        const table = group.tables.find((t) => t.id === tableId);
        if (table) {
          return {
            table,
            sector: group.sector,
            capacity: { min: 2, max: 8 }, // Por defecto, debería venir de la data
          };
        }
      }
      return null;
    },
    [groups]
  );

  // ========================================================================
  // DRAG & DROP HANDLERS
  // ========================================================================

  /**
   * Handler para clicks en celdas (con validaciones)
   */
  const handleCellClick = useCallback(
    (tableId: string, timeSlot: number) => {
      handleCellClickBase(
        tableId,
        timeSlot,
        findTable,
        isInThePast,
        isOutsideServiceHours
      );
    },
    [handleCellClickBase, findTable, isInThePast, isOutsideServiceHours, allowPastReservations]
  );

  /**
   * Handler para redimensionar reservas (con validaciones)
   */
  const handleReservationResize = useCallback(
    (reservationId: string, newStartTime: string, newDuration: number) => {
      // Buscar la reserva
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) return;

      // Verificar conflictos
      const conflictId = findConflict(
        reservation.tableId,
        newStartTime,
        newDuration,
        reservationId
      );
      if (conflictId) {
        console.warn(
          "⚠️ Conflicto detectado: La reserva se superpone con otra existente"
        );
        return;
      }

      // Verificar horario de servicio
      if (isOutsideServiceHours(newStartTime, newDuration)) {
        console.warn("⚠️ La reserva está fuera del horario de servicio");
        return;
      }

      // Verificar si está en el pasado (solo si no se permite edición retroactiva)
      if (!allowPastReservations && isInThePast(newStartTime)) {
        console.warn("⚠️ No se puede crear una reserva en el pasado");
        return;
      }

      // Actualizar
      handleReservationResizeBase(reservationId, newStartTime, newDuration);
    },
    [
      reservations,
      findConflict,
      isOutsideServiceHours,
      isInThePast,
      handleReservationResizeBase,
      allowPastReservations,
    ]
  );

  /**
   * Handler cuando se suelta un elemento arrastrado
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // Caso: Mover una reserva existente a otra celda
      if (
        activeData?.type === "reservation" &&
        overData?.type === "timeslot"
      ) {
        const reservation = activeData.reservation as Reservation;
        const { tableId, timeSlot } = overData;

        const newStartTime = timeSlotToISO(timeSlot);
        const duration = reservation.durationMinutes;

        // Verificar conflictos en la nueva posición
        const conflictId = findConflict(
          tableId,
          newStartTime,
          duration,
          reservation.id
        );
        if (conflictId) {
          console.warn("⚠️ No se puede mover: Conflicto con otra reserva");
          return;
        }

        // Verificar horario de servicio
        if (isOutsideServiceHours(newStartTime, duration)) {
          console.warn("⚠️ No se puede mover: Fuera del horario de servicio");
          return;
        }

        // Verificar si está en el pasado (solo si no se permite edición retroactiva)
        if (!allowPastReservations && isInThePast(newStartTime)) {
          console.warn("⚠️ No se puede mover a un horario pasado");
          return;
        }

        // Actualizar la reserva
        handleMoveReservation(reservation.id, tableId, newStartTime);
      }
    },
    [
      findConflict,
      isOutsideServiceHours,
      isInThePast,
      handleMoveReservation,
      allowPastReservations,
    ]
  );

  // Hook para drag & drop de creación
  const {
    dragCreateState,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellMouseUp,
  } = useDragCreate(findTable, isInThePast, isOutsideServiceHours, openCreateModal);

  // ========================================================================
  // EFECTOS
  // ========================================================================

  // Actualizar tiempo actual cada 30 segundos (solo en el cliente)
  useEffect(() => {
    // Inicializar con el tiempo actual después del mount (solo en cliente)
    setNowMins(getCurrentMinutes());
    
    const intervalId = setInterval(() => {
      setNowMins(getCurrentMinutes());
    }, 30 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // ========================================================================
  // CÁLCULOS DE DIMENSIONES
  // ========================================================================

  const stepPx = BASE_STEP_PX * zoom;
  const totalWidth = timeSlots.length * stepPx;

  const nowOffset = useMemo(() => {
    const start = START_HOUR * 60;
    const minsFromStart = nowMins - start;
    return (minsFromStart / 15) * stepPx;
  }, [nowMins, stepPx]);

  // Auto-scroll al tiempo actual cuando se monta el componente
  useEffect(() => {
    if (containerRef.current && nowOffset > 0) {
      const scrollPosition = nowOffset - containerRef.current.clientWidth / 2;
      containerRef.current.scrollLeft = Math.max(0, scrollPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCurrentTimeVisible =
    nowMins >= START_HOUR * 60 && nowMins <= END_HOUR * 60;

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
        allowPastReservations={allowPastReservations}
        onTogglePastReservations={onTogglePastReservations || (() => {})}
      />

        <div className="relative border border-slate-300 rounded-lg bg-white shadow-lg flex-1 overflow-hidden">
          <div className="flex h-full">
            {/* Columna izquierda sticky - Nombres de Mesas/Sectores */}
            <div className="sticky left-0 z-20 w-56 shrink-0 bg-slate-100 border-r border-slate-300 shadow-md">
              <div className="h-12 border-b border-slate-300 flex items-center px-4 font-semibold text-slate-800 bg-slate-200">
                Mesas / Sectores
              </div>

              <div
                className="overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 11rem)" }}
              >
                {filteredGroups.map((g) => (
                  <div key={g.sector} className="border-b border-slate-200">
                    <button
                      onClick={() => toggleSectorCollapse(g.sector)}
                      className="w-full h-10 flex items-center justify-between px-4 bg-slate-100 hover:bg-slate-150 border-t border-slate-200 text-slate-800 font-semibold text-sm transition-colors"
                    >
                      <span>{g.sector}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          collapsed[g.sector] ? "" : "rotate-180"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

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

            {/* Área de timeline - Scrolleable horizontalmente */}
            <div
              className="overflow-x-auto overflow-y-hidden relative"
              ref={containerRef}
            >
              <div style={{ minWidth: totalWidth }} className="relative">
                {/* Header de horarios */}
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
                      <div className="h-10 bg-slate-50 border-t border-slate-200" />

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
                            minStep={15}
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

                  {/* Indicador de tiempo actual */}
                  {isCurrentTimeVisible && nowOffset > 0 && (
                    <CurrentTimeIndicator
                      ref={timeIndicatorRef}
                      nowOffset={nowOffset}
                      nowMins={nowMins}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de creación rápida */}
      {modalState.isOpen && modalState.tableId && modalState.tableName && (
        <CreateReservationModal
          isOpen={modalState.isOpen}
          onClose={closeCreateModal}
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
          onClose={closeEditModal}
          onSave={handleUpdateReservation}
          tableId={editModalState.reservation.tableId}
          tableName={editModalState.reservation.tableId}
          tableCapacity={{ min: 2, max: 8 }}
          startTime={editModalState.reservation.startTime}
          defaultDuration={editModalState.reservation.durationMinutes}
          existingReservations={reservations.filter(
            (r) => r.id !== editModalState.reservation?.id
          )}
          initialData={editModalState.reservation}
        />
      )}

      {/* Menú contextual */}
      {contextMenuState.isOpen && contextMenuState.reservation && (
        <ReservationContextMenu
          isOpen={contextMenuState.isOpen}
          onClose={closeContextMenu}
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

