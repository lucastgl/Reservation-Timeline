import { useState, useCallback, useEffect } from 'react';
import type { Reservation } from '../../../../Interfaces/interfaces';
import type {
  ModalState,
  EditModalState,
  ContextMenuState,
  TableInfo,
} from '../types';
import { timeSlotToISO } from '../utils/timeUtils';
// 🏪 Importar store de Zustand para sincronizar cambios
import { useReservationStore } from '../../../../stores';

/**
 * Hook para manejo completo del CRUD de reservas
 * Ahora sincroniza con Zustand store para reactividad completa
 */
export function useReservations(initialReservations: Reservation[] = []) {
  // 🏪 Obtener reservas y acciones desde Zustand store
  const storeReservations = useReservationStore((state) => state.reservations);
  const addReservation = useReservationStore((state) => state.addReservation);
  const updateReservation = useReservationStore((state) => state.updateReservation);
  const deleteReservation = useReservationStore((state) => state.deleteReservation);
  const setReservations = useReservationStore((state) => state.setReservations);
  
  // Sincronizar store con initialReservations solo una vez al inicio
  useEffect(() => {
    if (initialReservations.length > 0 && storeReservations.length === 0) {
      setReservations(initialReservations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar
  
  // SIEMPRE usar reservas del store (son la fuente de verdad)
  // El store se mantiene sincronizado con todas las operaciones
  const reservations = storeReservations;

  // Estado del modal de creación
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
  });

  // Estado del menú contextual
  const [contextMenuState, setContextMenuState] = useState<ContextMenuState>({
    isOpen: false,
    reservation: null,
    position: { x: 0, y: 0 },
  });

  // Estado del modal de edición
  const [editModalState, setEditModalState] = useState<EditModalState>({
    isOpen: false,
    reservation: null,
  });

  // Ya no necesitamos este efecto, usamos el store directamente

  /**
   * Abrir modal para crear nueva reserva desde un click
   */
  const handleCellClick = useCallback(
    (
      tableId: string,
      timeSlot: number,
      findTable: (tableId: string) => TableInfo | null,
      isInThePast: (startTime: string) => boolean,
      isOutsideServiceHours: (startTime: string, duration: number) => boolean
    ) => {
      const tableInfo = findTable(tableId);
      if (!tableInfo) return;

      const startTime = timeSlotToISO(timeSlot);
      const defaultDuration = 90; // 1.5 horas por defecto

      // Validar antes de abrir el modal
      if (isInThePast(startTime)) {
        console.warn("⚠️ No se puede crear una reserva en el pasado");
        return;
      }

      if (isOutsideServiceHours(startTime, defaultDuration)) {
        console.warn("⚠️ La reserva está fuera del horario de servicio");
        return;
      }

      setModalState({
        isOpen: true,
        tableId,
        tableName: tableInfo.table.name,
        tableCapacity: tableInfo.capacity,
        startTime,
        defaultDuration,
      });
    },
    []
  );

  /**
   * Abrir modal con datos pre-rellenados (usado por drag)
   */
  const openCreateModal = useCallback(
    (
      tableId: string,
      tableName: string,
      tableCapacity: { min: number; max: number },
      startTime: string,
      duration: number
    ) => {
      setModalState({
        isOpen: true,
        tableId,
        tableName,
        tableCapacity,
        startTime,
        defaultDuration: duration,
      });
    },
    []
  );

  /**
   * Cerrar modal de creación
   */
  const closeCreateModal = useCallback(() => {
    setModalState({ isOpen: false });
  }, []);

  /**
   * Guardar nueva reserva
   */
  const handleSaveReservation = useCallback(
    (newReservation: Partial<Reservation>) => {
      // 🏪 Actualizar store de Zustand (reactivo para todos los componentes)
      addReservation(newReservation as Reservation);
    },
    [addReservation]
  );

  /**
   * Actualizar reserva existente
   */
  const handleUpdateReservation = useCallback(
    (updatedReservation: Partial<Reservation>) => {
      if (!updatedReservation.id) return;
      
      // 🏪 Actualizar store de Zustand (reactivo para todos los componentes)
      updateReservation(updatedReservation.id, {
        ...updatedReservation,
        updatedAt: new Date().toISOString(),
      });
    },
    [updateReservation]
  );

  /**
   * Mover reserva a nueva posición/mesa
   */
  const handleMoveReservation = useCallback(
    (reservationId: string, tableId: string, newStartTime: string) => {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) return;

      const duration = reservation.durationMinutes;
      const newEndTime = new Date(
        new Date(newStartTime).getTime() + duration * 60 * 1000
      ).toISOString();

      // 🏪 Actualizar store de Zustand (reactivo para todos los componentes)
      updateReservation(reservationId, {
        tableId,
        startTime: newStartTime,
        endTime: newEndTime,
        updatedAt: new Date().toISOString(),
      });
    },
    [reservations, updateReservation]
  );

  /**
   * Redimensionar una reserva
   */
  const handleReservationResize = useCallback(
    (reservationId: string, newStartTime: string, newDuration: number) => {
      const newEndTime = new Date(
        new Date(newStartTime).getTime() + newDuration * 60 * 1000
      ).toISOString();

      // 🏪 Actualizar store de Zustand (reactivo para todos los componentes)
      updateReservation(reservationId, {
        startTime: newStartTime,
        endTime: newEndTime,
        durationMinutes: newDuration,
        updatedAt: new Date().toISOString(),
      });
    },
    [updateReservation]
  );

  /**
   * Abrir menú contextual
   */
  const handleContextMenu = useCallback(
    (reservation: Reservation, position: { x: number; y: number }) => {
      setContextMenuState({
        isOpen: true,
        reservation,
        position,
      });
    },
    []
  );

  /**
   * Cerrar menú contextual
   */
  const closeContextMenu = useCallback(() => {
    setContextMenuState({
      isOpen: false,
      reservation: null,
      position: { x: 0, y: 0 },
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
   * Cerrar modal de edición
   */
  const closeEditModal = useCallback(() => {
    setEditModalState({ isOpen: false, reservation: null });
  }, []);

  /**
   * Cambiar estado de una reserva
   */
  const handleChangeStatus = useCallback(
    (reservationId: string, newStatus: Reservation["status"]) => {
      // 🏪 Actualizar store de Zustand (reactivo para todos los componentes)
      updateReservation(reservationId, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    },
    [updateReservation]
  );

  /**
   * Marcar reserva como No Show
   */
  const handleMarkNoShow = useCallback((reservationId: string) => {
    // 🏪 Actualizar store de Zustand (reactivo para todos los componentes)
    updateReservation(reservationId, {
      status: "NO_SHOW",
      updatedAt: new Date().toISOString(),
    });
  }, [updateReservation]);

  /**
   * Cancelar una reserva
   */
  const handleCancelReservation = useCallback((reservationId: string) => {
    // 🏪 Actualizar store de Zustand (reactivo para todos los componentes)
    updateReservation(reservationId, {
      status: "CANCELLED",
      updatedAt: new Date().toISOString(),
    });
  }, [updateReservation]);

  /**
   * Duplicar una reserva
   */
  const handleDuplicateReservation = useCallback((reservation: Reservation) => {
    // Crear una copia con una nueva ID y +1 hora
    const newStartTime = new Date(
      new Date(reservation.startTime).getTime() + 60 * 60 * 1000
    );
    const newEndTime = new Date(
      newStartTime.getTime() + reservation.durationMinutes * 60 * 1000
    );

    const duplicated: Reservation = {
      ...reservation,
      id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: newStartTime.toISOString(),
      endTime: newEndTime.toISOString(),
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 🏪 Actualizar store de Zustand (reactivo para todos los componentes)
    addReservation(duplicated);
  }, [addReservation]);

  /**
   * Eliminar una reserva
   */
  const handleDeleteReservation = useCallback((reservationId: string) => {
    // 🏪 Actualizar store de Zustand (reactivo para todos los componentes)
    deleteReservation(reservationId);
  }, [deleteReservation]);

  return {
    // Estado
    reservations,
    modalState,
    contextMenuState,
    editModalState,

    // Handlers de modal de creación
    handleCellClick,
    openCreateModal,
    closeCreateModal,
    handleSaveReservation,

    // Handlers de edición
    handleUpdateReservation,
    handleEditReservation,
    closeEditModal,

    // Handlers de drag & drop
    handleMoveReservation,
    handleReservationResize,

    // Handlers de menú contextual
    handleContextMenu,
    closeContextMenu,
    handleChangeStatus,
    handleMarkNoShow,
    handleCancelReservation,
    handleDuplicateReservation,
    handleDeleteReservation,
  };
}

