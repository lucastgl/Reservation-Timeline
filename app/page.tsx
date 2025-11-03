"use client";
import { useEffect } from "react";
import ReservationGrid from "../components/reservations/ReservationGrid";
import CapacityAnalyticsPanel from "../components/CapacityAnalyticsPanel";
import WaitlistPanel from "../components/WaitlistPanel";
import { mockReservations } from "../mocks/mockReservas";
import { seedTables, seedSectors } from "../mocks/seedData";
// generateRandomReservations está disponible para uso opcional (ver comentarios en useEffect)
// import { generateRandomReservations } from "../mocks/seedData";
import type { Table } from "../Interfaces/interfaces";

// Importar stores de Zustand
import {
  useReservationStore,
  useUIStore,
  useWaitlistStore,
  useSettingsStore,
} from "../stores";

export default function Home() {
  // 🏪 Estado desde Zustand stores (sin prop drilling)
  const reservations = useReservationStore((state) => state.reservations);
  const setReservations = useReservationStore((state) => state.setReservations);
  
  // Los callbacks ahora son solo para compatibilidad, el store maneja todo
  const updateWaitlistEntry = useWaitlistStore((state) => state.updateWaitlistEntry);
  
  const openWaitlist = useUIStore((state) => state.openWaitlist);
  
  // Settings store - allowPastReservations y su setter
  const allowPastReservations = useSettingsStore((state) => state.allowPastReservations);
  const setAllowPastReservations = useSettingsStore((state) => state.setAllowPastReservations);

  // ⚙️ Inicializar store con datos mock (solo en primera carga)
  useEffect(() => {
    // Solo cargar si el store está vacío
    if (reservations.length === 0) {
      setReservations(mockReservations);
      
      // 🎲 OPCIONAL: Para testing de performance, descomenta las siguientes líneas:
      // const randomReservations = generateRandomReservations(100); // Cambia el número según necesites
      // setReservations(randomReservations);
      // console.log(`✅ Cargadas ${randomReservations.length} reservas aleatorias para testing`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Usar seed data para mesas y sectores
  // Compatibilidad: convertir seedTables a formato con 'sector' para componentes legacy
  const mockTables = seedTables.map(table => {
    const sector = seedSectors.find(s => s.id === table.sectorId);
    return {
      id: table.id,
      name: table.name,
      sector: sector?.name || 'Unknown',
      capacity: table.capacity,
      // Campos adicionales para compatibilidad con tipos legacy
      sectorId: table.sectorId,
      sortOrder: table.sortOrder,
    } as Table & { sector: string }; // Type assertion para compatibilidad
  });

  const handleTimeSlotClick = (timeSlot: number) => {
    // Scroll al horario clickeado (implementación básica)
    console.log(`Scrolling to time slot: ${timeSlot}`);
    // Aquí podrías implementar scroll automático al horario
  };

  const waitingCount = useWaitlistStore((state) => 
    state.waitlist.filter((e) => e.status === 'WAITING').length
  );

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gray-50">
      {/* Header con botón de lista de espera */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              📅 Reservation Timeline
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Sistema de gestión de reservas con IA
            </p>
          </div>
          <button
            onClick={openWaitlist}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Lista de Espera
            {waitingCount > 0 && (
              <span className="px-2 py-0.5 bg-purple-800 text-white text-xs font-bold rounded-full">
                {waitingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Panel de Analítica de Capacidad */}
      <CapacityAnalyticsPanel
        tables={mockTables}
        sectors={seedSectors}
        onTimeSlotClick={handleTimeSlotClick}
      />

      {/* Grid de Reservas */}
      <div className="flex-1 overflow-auto">
        <ReservationGrid 
          reservations={reservations}
          allowPastReservations={allowPastReservations}
          onTogglePastReservations={setAllowPastReservations}
        />
      </div>

      {/* Panel de Lista de Espera */}
      <WaitlistPanel
        tables={mockTables}
        onUpdateEntry={updateWaitlistEntry}
      />
    </div>
  );
}
