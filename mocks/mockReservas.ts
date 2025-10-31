import type { Reservation } from "../Interfaces/interfaces";

/**
 * Datos mock de reservas para testing del componente ReservationGrid
 * 
 * CONVENCIÓN DE IDs:
 * - Mesas: "t1", "t2", "t3", "t4", "t5"
 * - Reservas: UUID simulados
 * 
 * NOTA: Los horarios usan la fecha actual con horas específicas para testing
 */

// Helper para crear fechas ISO con hora específica hoy
const createDateTime = (hour: number, minute: number = 0): string => {
    const now = new Date();
    now.setHours(hour, minute, 0, 0);
    return now.toISOString();
};

export const mockReservations: Reservation[] = [
    // ========================================================================
    // MESA 1 (Interior) - t1
    // ========================================================================
    {
        id: "res-001",
        tableId: "t1",
        customer: {
            name: "Juan Pérez",
            phone: "+54 11 1234-5678",
            email: "juan@example.com",
        },
        partySize: 4,
        startTime: createDateTime(12, 0),  // 12:00
        endTime: createDateTime(13, 30),   // 13:30
        durationMinutes: 90,
        status: "CONFIRMED",
        priority: "STANDARD",
        source: "web",
        createdAt: createDateTime(10, 0),
        updatedAt: createDateTime(10, 0),
    },
    {
        id: "res-002",
        tableId: "t1",
        customer: {
            name: "María González",
            phone: "+54 11 8765-4321",
        },
        partySize: 2,
        startTime: createDateTime(19, 0),  // 19:00
        endTime: createDateTime(20, 30),   // 20:30
        durationMinutes: 90,
        status: "SEATED",
        priority: "VIP",
        notes: "Cliente VIP - Mesa preferida",
        source: "phone",
        createdAt: createDateTime(9, 0),
        updatedAt: createDateTime(18, 50),
    },

    // ========================================================================
    // MESA 2 (Interior) - t2
    // ========================================================================
    {
        id: "res-003",
        tableId: "t2",
        customer: {
            name: "Carlos López",
            phone: "+54 11 5555-1234",
        },
        partySize: 3,
        startTime: createDateTime(13, 0),  // 13:00
        endTime: createDateTime(14, 0),    // 14:00
        durationMinutes: 60,
        status: "PENDING",
        priority: "STANDARD",
        source: "app",
        createdAt: createDateTime(11, 30),
        updatedAt: createDateTime(11, 30),
    },
    {
        id: "res-004",
        tableId: "t2",
        customer: {
            name: "Ana Martínez",
            phone: "+54 11 9876-5432",
        },
        partySize: 8,
        startTime: createDateTime(20, 30),  // 20:30
        endTime: createDateTime(22, 30),    // 22:30
        durationMinutes: 120,
        status: "CONFIRMED",
        priority: "LARGE_GROUP",
        notes: "Cumpleaños - Necesita torta",
        source: "phone",
        createdAt: createDateTime(8, 0),
        updatedAt: createDateTime(8, 0),
    },

    // ========================================================================
    // MESA 3 (Interior) - t3
    // ========================================================================
    {
        id: "res-005",
        tableId: "t3",
        customer: {
            name: "Roberto Sánchez",
            phone: "+54 11 4444-7777",
        },
        partySize: 2,
        startTime: createDateTime(14, 0),  // 14:00
        endTime: createDateTime(15, 0),    // 15:00
        durationMinutes: 60,
        status: "FINISHED",
        priority: "STANDARD",
        source: "walkin",
        createdAt: createDateTime(14, 0),
        updatedAt: createDateTime(15, 0),
    },
    {
        id: "res-006",
        tableId: "t3",
        customer: {
            name: "Lucía Fernández",
            phone: "+54 11 3333-6666",
        },
        partySize: 4,
        startTime: createDateTime(21, 0),  // 21:00
        endTime: createDateTime(22, 45),   // 22:45
        durationMinutes: 105,
        status: "CONFIRMED",
        priority: "VIP",
        source: "web",
        createdAt: createDateTime(7, 30),
        updatedAt: createDateTime(7, 30),
    },

    // ========================================================================
    // MESA 4 (Terraza) - t4
    // ========================================================================
    {
        id: "res-007",
        tableId: "t4",
        customer: {
            name: "Diego Torres",
            phone: "+54 11 2222-9999",
        },
        partySize: 2,
        startTime: createDateTime(18, 0),  // 18:00
        endTime: createDateTime(19, 0),    // 19:00
        durationMinutes: 60,
        status: "NO_SHOW",
        priority: "STANDARD",
        source: "app",
        createdAt: createDateTime(16, 0),
        updatedAt: createDateTime(18, 30),
    },
    {
        id: "res-008",
        tableId: "t4",
        customer: {
            name: "Sofía Ramírez",
            phone: "+54 11 7777-4444",
        },
        partySize: 6,
        startTime: createDateTime(20, 0),  // 20:00
        endTime: createDateTime(22, 0),    // 22:00
        durationMinutes: 120,
        status: "CONFIRMED",
        priority: "LARGE_GROUP",
        source: "phone",
        createdAt: createDateTime(10, 0),
        updatedAt: createDateTime(10, 0),
    },

    // ========================================================================
    // MESA 5 (Terraza) - t5
    // ========================================================================
    {
        id: "res-009",
        tableId: "t5",
        customer: {
            name: "Pablo Morales",
            phone: "+54 11 8888-2222",
        },
        partySize: 2,
        startTime: createDateTime(19, 30),  // 19:30
        endTime: createDateTime(21, 0),     // 21:00
        durationMinutes: 90,
        status: "CANCELLED",
        priority: "STANDARD",
        notes: "Cancelado por el cliente",
        source: "web",
        createdAt: createDateTime(15, 0),
        updatedAt: createDateTime(17, 0),
    },
    {
        id: "res-010",
        tableId: "t5",
        customer: {
            name: "Valentina Castro",
            phone: "+54 11 6666-3333",
        },
        partySize: 4,
        startTime: createDateTime(22, 0),  // 22:00
        endTime: createDateTime(23, 30),   // 23:30
        durationMinutes: 90,
        status: "PENDING",
        priority: "STANDARD",
        source: "app",
        createdAt: createDateTime(20, 0),
        updatedAt: createDateTime(20, 0),
    },
];

/**
 * Función helper para filtrar reservas por mesa
 */
export const getReservationsByTable = (tableId: string): Reservation[] => {
    return mockReservations.filter(r => r.tableId === tableId);
};

/**
 * Función helper para filtrar reservas por estado
 */
export const getReservationsByStatus = (status: Reservation["status"]): Reservation[] => {
    return mockReservations.filter(r => r.status === status);
};

/**
 * Estadísticas de las reservas mock
 */
export const mockStats = {
    total: mockReservations.length,
    byStatus: {
        PENDING: mockReservations.filter(r => r.status === "PENDING").length,
        CONFIRMED: mockReservations.filter(r => r.status === "CONFIRMED").length,
        SEATED: mockReservations.filter(r => r.status === "SEATED").length,
        FINISHED: mockReservations.filter(r => r.status === "FINISHED").length,
        NO_SHOW: mockReservations.filter(r => r.status === "NO_SHOW").length,
        CANCELLED: mockReservations.filter(r => r.status === "CANCELLED").length,
    },
    byPriority: {
        STANDARD: mockReservations.filter(r => r.priority === "STANDARD").length,
        VIP: mockReservations.filter(r => r.priority === "VIP").length,
        LARGE_GROUP: mockReservations.filter(r => r.priority === "LARGE_GROUP").length,
    },
};

