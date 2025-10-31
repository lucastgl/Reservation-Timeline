"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import type { Reservation } from "../Interfaces/interfaces";

// ============================================================================
// INTERFACES
// ============================================================================

interface CreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservation: Partial<Reservation>) => void;
  tableId: string;
  tableName: string;
  tableCapacity: { min: number; max: number };
  startTime: string; // ISO string
  defaultDuration: number; // minutos
  existingReservations: Reservation[]; // Para validar conflictos
  initialData?: Reservation; // Para modo edición
}

interface FormData {
  customerName: string;
  customerPhone: string;
  partySize: number;
  durationMinutes: number;
  status: Reservation["status"];
  priority: Reservation["priority"];
  notes: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const MIN_DURATION = 30; // 30 minutos
const MAX_DURATION = 360; // 6 horas

const STATUS_OPTIONS: {
  value: Reservation["status"];
  label: string;
  color: string;
}[] = [
  {
    value: "PENDING",
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "CONFIRMED",
    label: "Confirmada",
    color: "bg-blue-100 text-blue-800",
  },
  { value: "SEATED", label: "Sentada", color: "bg-green-100 text-green-800" },
];

const PRIORITY_OPTIONS: { value: Reservation["priority"]; label: string }[] = [
  { value: "STANDARD", label: "Estándar" },
  { value: "VIP", label: "VIP" },
  { value: "LARGE_GROUP", label: "Grupo Grande" },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Modal de creación rápida de reservas
 *
 * Validaciones:
 * - Nombre del cliente: obligatorio
 * - Teléfono: obligatorio, formato válido
 * - Tamaño del grupo: entre min y max de capacidad de la mesa
 * - Duración: entre 30 min y 6 horas
 * - No conflictos con reservas existentes
 */
export default function CreateReservationModal({
  isOpen,
  onClose,
  onSave,
  tableId,
  tableName,
  tableCapacity,
  startTime,
  defaultDuration,
  existingReservations,
  initialData,
}: CreateReservationModalProps) {
  
  const isEditMode = !!initialData;
  // ========================================================================
  // ESTADO
  // ========================================================================

  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    customerPhone: "",
    partySize: 2,
    durationMinutes: defaultDuration,
    status: "CONFIRMED",
    priority: "STANDARD",
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [hasConflict, setHasConflict] = useState(false);

  // Resetear formulario cuando cambia isOpen o defaultDuration
  useEffect(() => {
    if (!isOpen) return;

    // Usar setTimeout para evitar el warning de setState en effect
    const timeoutId = setTimeout(() => {
      if (initialData) {
        // Modo edición: cargar datos existentes
        setFormData({
          customerName: initialData.customer.name,
          customerPhone: initialData.customer.phone,
          partySize: initialData.partySize,
          durationMinutes: initialData.durationMinutes,
          status: initialData.status,
          priority: initialData.priority,
          notes: initialData.notes || "",
        });
      } else {
        // Modo creación: formulario vacío
        setFormData({
          customerName: "",
          customerPhone: "",
          partySize: 2,
          durationMinutes: defaultDuration,
          status: "CONFIRMED",
          priority: "STANDARD",
          notes: "",
        });
      }
      setErrors({});
      setHasConflict(false);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isOpen, defaultDuration, initialData]);

  // ========================================================================
  // VALIDACIONES
  // ========================================================================

  /**
   * Verifica si hay conflicto con reservas existentes
   */
  const checkConflicts = (start: string, duration: number): boolean => {
    const startMs = new Date(start).getTime();
    const endMs = startMs + duration * 60 * 1000;

    return existingReservations.some((reservation) => {
      if (reservation.tableId !== tableId) return false;

      const resStartMs = new Date(reservation.startTime).getTime();
      const resEndMs = new Date(reservation.endTime).getTime();

      // Verificar solapamiento
      return (
        (startMs >= resStartMs && startMs < resEndMs) ||
        (endMs > resStartMs && endMs <= resEndMs) ||
        (startMs <= resStartMs && endMs >= resEndMs)
      );
    });
  };

  /**
   * Valida todos los campos del formulario
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Nombre del cliente
    if (!formData.customerName.trim()) {
      newErrors.customerName = "El nombre es obligatorio";
    }

    // Teléfono
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = "El teléfono es obligatorio";
    } else if (
      !/^\+?\d{10,15}$/.test(formData.customerPhone.replace(/[\s-()]/g, ""))
    ) {
      newErrors.customerPhone = "Formato de teléfono inválido";
    }

    // Tamaño del grupo
    if (formData.partySize < tableCapacity.min) {
      newErrors.partySize = `Mínimo ${tableCapacity.min} personas`;
    } else if (formData.partySize > tableCapacity.max) {
      newErrors.partySize = `Máximo ${tableCapacity.max} personas (capacidad de la mesa)`;
    }

    // Duración
    if (formData.durationMinutes < MIN_DURATION) {
      newErrors.durationMinutes = `Duración mínima: ${MIN_DURATION} min`;
    } else if (formData.durationMinutes > MAX_DURATION) {
      newErrors.durationMinutes = `Duración máxima: ${MAX_DURATION} min (6 horas)`;
    }

    // Conflictos
    const conflict = checkConflicts(startTime, formData.durationMinutes);
    setHasConflict(conflict);
    if (conflict) {
      newErrors.durationMinutes = "Conflicto con otra reserva";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const endTime = new Date(
      new Date(startTime).getTime() + formData.durationMinutes * 60 * 1000
    );

    const reservationData: Partial<Reservation> = {
      id: isEditMode ? initialData.id : `res-${Date.now()}`, // Mantener ID en modo edición
      tableId,
      customer: {
        name: formData.customerName,
        phone: formData.customerPhone,
        notes: formData.notes || undefined,
      },
      partySize: formData.partySize,
      startTime: startTime,
      endTime: endTime.toISOString(),
      durationMinutes: formData.durationMinutes,
      status: formData.status,
      priority: formData.priority,
      notes: formData.notes || undefined,
      createdAt: isEditMode ? initialData.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(reservationData);
    onClose();
  };

  // ========================================================================
  // HELPERS
  // ========================================================================

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateEndTime = () => {
    const end = new Date(
      new Date(startTime).getTime() + formData.durationMinutes * 60 * 1000
    );
    return formatTime(end.toISOString());
  };

  // ========================================================================
  // RENDER
  // ========================================================================

   return (
     <Modal
       isOpen={isOpen}
       onClose={onClose}
       size="4xl"
       scrollBehavior="inside"
       placement="center"
       backdrop="blur"
       classNames={{
         wrapper: "z-[100]",
         backdrop: "z-[99]",
         base: "max-w-4xl mx-auto",
         closeButton: "hidden"
       }}
     >
       <ModalContent className="bg-gray-50 border border-gray-300 rounded-lg shadow-sm pb-4">
         <ModalHeader className="flex flex-row items-center justify-between border-b border-gray-300 pb-4 bg-white">
           <div className="flex flex-col gap-1">
             <h2 className="text-xl font-bold text-gray-900">
               {isEditMode ? "Editar Reserva" : "Nueva Reserva"}
             </h2>
             <div className="flex items-center gap-2 text-sm text-gray-600">
               <span className="font-medium">{tableName}</span>
               <span>•</span>
               <span>
                 {formatTime(startTime)} - {calculateEndTime()}
               </span>
             </div>
           </div>
           <button
             onClick={onClose}
             className="p-2 hover:bg-gray-100 rounded-full transition-colors"
             aria-label="Cerrar modal"
           >
             <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
         </ModalHeader>

        <ModalBody className="py-6">
          {/* Alerta de conflicto */}
          {hasConflict && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 font-medium">
                    Conflicto detectado
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Ya existe una reserva en este horario
                  </p>
                </div>
              </div>
            </div>
          )} 


          <div className="flex gap-6">
            {/* BLOQUE IZQUIERDO - Información Principal */}
            <div className="flex-1 space-y-5 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Información del Cliente
              </h3>
              
              {/* Nombre del cliente */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nombre del Cliente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleChange("customerName", e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                                    ${
                                      errors.customerName
                                        ? "border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500"
                                        : "border-gray-300 bg-white hover:border-gray-400"
                                    }`}
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                />
                {errors.customerName && (
                  <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.customerName}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    handleChange("customerPhone", e.target.value)
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                                    ${
                                      errors.customerPhone
                                        ? "border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500"
                                        : "border-gray-300 bg-white hover:border-gray-400"
                                    }`}
                  placeholder="Ej: +54 11 1234-5678"
                />
                {errors.customerPhone && (
                  <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.customerPhone}
                  </p>
                )}
              </div>

              {/* Número de personas */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Número de Personas <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.partySize}
                    onChange={(e) =>
                      handleChange("partySize", parseInt(e.target.value) || 0)
                    }
                    min={tableCapacity.min}
                    max={tableCapacity.max}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors
                                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                                        ${
                                          errors.partySize
                                            ? "border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500"
                                            : "border-gray-300 bg-white hover:border-gray-400"
                                        }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Capacidad de la mesa: {tableCapacity.min} a{" "}
                  {tableCapacity.max} personas
                </p>
                {errors.partySize && (
                  <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.partySize}
                  </p>
                )}
              </div>

              {/* Duración */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Duración <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      handleChange(
                        "durationMinutes",
                        parseInt(e.target.value) || 0
                      )
                    }
                    min={MIN_DURATION}
                    max={MAX_DURATION}
                    step={15}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors
                                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                                        ${
                                          errors.durationMinutes
                                            ? "border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500"
                                            : "border-gray-300 bg-white hover:border-gray-400"
                                        }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-sm text-gray-500">minutos</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Mínimo 30 min, máximo 6 horas (intervalos de 15 min)
                </p>
                {errors.durationMinutes && (
                  <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.durationMinutes}
                  </p>
                 )}
               </div>
             </div>
             
             {/* BLOQUE DERECHO - Configuración de la Reserva */}
             <div className="flex-1 space-y-5 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
               <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                 Configuración de la Reserva
               </h3>
               
               {/* Estado */}
               <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Estado de la Reserva
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    handleChange(
                      "status",
                      e.target.value as Reservation["status"]
                    )
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                                    bg-white hover:border-gray-400 transition-colors cursor-pointer"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Prioridad
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    handleChange(
                      "priority",
                      e.target.value as Reservation["priority"]
                    )
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                                    bg-white hover:border-gray-400 transition-colors cursor-pointer"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notas{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                                    bg-white hover:border-gray-400 transition-colors resize-none"
                  placeholder="Alergias, preferencias, solicitudes especiales..."
                />
              </div>
            </div>
          </div>
        </ModalBody>

         <ModalFooter className="border-t border-gray-300 pt-4 bg-white">
           <div className="flex gap-3 w-full">
             <button
               onClick={onClose}
               className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 
                                hover:bg-gray-50 active:bg-gray-100 rounded-lg font-medium 
                                transition-all duration-150 shadow-sm"
             >
               Cancelar
             </button>
             <button
               onClick={handleSubmit}
               disabled={hasConflict}
               className={`flex-1 px-6 py-2.5 text-white rounded-lg font-medium 
                                transition-all duration-150 shadow-sm ${
                                  hasConflict
                                    ? "bg-gray-400 cursor-not-allowed opacity-60"
                                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                                }`}
             >
               Crear Reserva
             </button>
           </div>
         </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
