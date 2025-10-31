"use client";

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import type { Reservation } from "../Interfaces/interfaces";

// ============================================================================
// INTERFACES
// ============================================================================

interface ReservationContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
    reservation: Reservation;
    position?: { x: number; y: number };
    onEdit: (reservation: Reservation) => void;
    onChangeStatus: (reservationId: string, newStatus: Reservation["status"]) => void;
    onMarkNoShow: (reservationId: string) => void;
    onCancel: (reservationId: string) => void;
    onDuplicate: (reservation: Reservation) => void;
    onDelete: (reservationId: string) => void;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const STATUS_OPTIONS: { value: Reservation["status"]; label: string; emoji: string; color: string }[] = [
    { value: "PENDING", label: "Pendiente", emoji: "🟡", color: "text-yellow-600" },
    { value: "CONFIRMED", label: "Confirmada", emoji: "🔵", color: "text-blue-600" },
    { value: "SEATED", label: "Sentada", emoji: "🟢", color: "text-green-600" },
    { value: "FINISHED", label: "Finalizada", emoji: "⚪", color: "text-gray-600" },
    { value: "NO_SHOW", label: "No Show", emoji: "🔴", color: "text-red-600" },
    { value: "CANCELLED", label: "Cancelada", emoji: "⚫", color: "text-gray-800" },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ReservationContextMenu({
    isOpen,
    onClose,
    reservation,
    onEdit,
    onChangeStatus,
    onMarkNoShow,
    onCancel,
    onDuplicate,
    onDelete,
}: ReservationContextMenuProps) {
    
    const [showStatusSubmenu, setShowStatusSubmenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleEdit = () => {
        onEdit(reservation);
        onClose();
    };

    const handleStatusChange = (newStatus: Reservation["status"]) => {
        onChangeStatus(reservation.id, newStatus);
        setShowStatusSubmenu(false);
        onClose();
    };

    const handleMarkNoShow = () => {
        onMarkNoShow(reservation.id);
        onClose();
    };

    const handleCancel = () => {
        onCancel(reservation.id);
        onClose();
    };

    const handleDuplicate = () => {
        onDuplicate(reservation);
        onClose();
    };

    const handleDeleteConfirm = () => {
        onDelete(reservation.id);
        setShowDeleteConfirm(false);
        onClose();
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            placement="center"
            backdrop="blur"
            size="md"
            classNames={{
                wrapper: "z-[100]",
                backdrop: "z-[99]",
                base: "max-w-md mx-auto",
            }}
        >
            <ModalContent className="bg-white border border-gray-200 rounded-lg shadow-xl">
                {/* Confirmación de eliminación */}
                {showDeleteConfirm ? (
                    <>
                        <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-bold text-gray-900">⚠️ Confirmar eliminación</h3>
                        </ModalHeader>
                        <ModalBody className="py-6">
                            <p className="text-gray-700">
                                ¿Estás seguro de que deseas <span className="font-bold text-red-600">eliminar</span> esta reserva?
                            </p>
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm font-semibold text-gray-900">{reservation.customer.name}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    {new Date(reservation.startTime).toLocaleString("es-ES", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                            <p className="text-sm text-red-600 mt-4 font-medium">
                                Esta acción no se puede deshacer.
                            </p>
                        </ModalBody>
                        <ModalFooter className="border-t border-gray-200 pt-4">
                            <Button
                                color="default"
                                variant="flat"
                                onPress={() => setShowDeleteConfirm(false)}
                                className="font-medium"
                            >
                                Cancelar
                            </Button>
                            <Button
                                color="danger"
                                onPress={handleDeleteConfirm}
                                className="font-medium bg-red-600 text-white"
                            >
                                Eliminar reserva
                            </Button>
                        </ModalFooter>
                    </>
                ) : showStatusSubmenu ? (
                    /* Submenú de cambio de estado */
                    <>
                        <ModalHeader className="flex flex-row items-center gap-3 border-b border-gray-200 pb-4">
                            <button
                                onClick={() => setShowStatusSubmenu(false)}
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h3 className="text-lg font-bold text-gray-900">Cambiar estado</h3>
                        </ModalHeader>
                        <ModalBody className="py-4">
                            <div className="space-y-2">
                                {STATUS_OPTIONS.map((status) => (
                                    <button
                                        key={status.value}
                                        onClick={() => handleStatusChange(status.value)}
                                        disabled={reservation.status === status.value}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 rounded-lg
                                            transition-all text-left
                                            ${reservation.status === status.value
                                                ? "bg-gray-100 cursor-not-allowed opacity-50"
                                                : "hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
                                            }
                                        `}
                                    >
                                        <span className="text-2xl">{status.emoji}</span>
                                        <div className="flex-1">
                                            <p className={`font-semibold ${status.color}`}>
                                                {status.label}
                                            </p>
                                        </div>
                                        {reservation.status === status.value && (
                                            <span className="text-xs text-gray-500 font-medium">Actual</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </ModalBody>
                        <ModalFooter className="border-t border-gray-200 pt-4">
                            <Button
                                color="default"
                                variant="flat"
                                onPress={() => setShowStatusSubmenu(false)}
                                className="font-medium"
                            >
                                Volver
                            </Button>
                        </ModalFooter>
                    </>
                ) : (
                    /* Menú principal */
                    <>
                        <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-bold text-gray-900">Opciones de reserva</h3>
                            <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                                <p className="text-sm font-semibold text-gray-900">{reservation.customer.name}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    {new Date(reservation.startTime).toLocaleString("es-ES", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })} • {reservation.partySize} personas
                                </p>
                            </div>
                        </ModalHeader>
                        <ModalBody className="py-4">
                            <div className="space-y-2">
                                {/* Editar detalles */}
                                <button
                                    onClick={handleEdit}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 hover:shadow-sm transition-all text-left active:scale-[0.98]"
                                >
                                    <span className="text-2xl">✏️</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Editar detalles</p>
                                        <p className="text-xs text-gray-600">Modificar información completa</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                {/* Cambiar estado */}
                                <button
                                    onClick={() => setShowStatusSubmenu(true)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-50 hover:shadow-sm transition-all text-left active:scale-[0.98]"
                                >
                                    <span className="text-2xl">🔄</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Cambiar estado</p>
                                        <p className="text-xs text-gray-600">
                                            Actual: <span className="font-medium text-indigo-600">{reservation.status}</span>
                                        </p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                {/* Marcar como No Show */}
                                {reservation.status !== "NO_SHOW" && (
                                    <button
                                        onClick={handleMarkNoShow}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 hover:shadow-sm transition-all text-left active:scale-[0.98]"
                                    >
                                        <span className="text-2xl">⏰</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">Marcar como No Show</p>
                                            <p className="text-xs text-gray-600">Cliente no se presentó</p>
                                        </div>
                                    </button>
                                )}

                                {/* Cancelar reserva */}
                                {reservation.status !== "CANCELLED" && (
                                    <button
                                        onClick={handleCancel}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-yellow-50 hover:shadow-sm transition-all text-left active:scale-[0.98]"
                                    >
                                        <span className="text-2xl">❌</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">Cancelar reserva</p>
                                            <p className="text-xs text-gray-600">Marcar como cancelada</p>
                                        </div>
                                    </button>
                                )}

                                <div className="border-t border-gray-200 my-2" />

                                {/* Duplicar */}
                                <button
                                    onClick={handleDuplicate}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 hover:shadow-sm transition-all text-left active:scale-[0.98]"
                                >
                                    <span className="text-2xl">📋</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Duplicar reserva</p>
                                        <p className="text-xs text-gray-600">Crear copia en otra hora/mesa</p>
                                    </div>
                                </button>

                                {/* Eliminar */}
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 hover:shadow-sm transition-all text-left active:scale-[0.98]"
                                >
                                    <span className="text-2xl">🗑️</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-red-600">Eliminar reserva</p>
                                        <p className="text-xs text-gray-600">Eliminar permanentemente</p>
                                    </div>
                                </button>
                            </div>
                        </ModalBody>
                        <ModalFooter className="border-t border-gray-200 pt-4">
                            <Button
                                color="default"
                                variant="flat"
                                onPress={onClose}
                                className="font-medium"
                            >
                                Cerrar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

