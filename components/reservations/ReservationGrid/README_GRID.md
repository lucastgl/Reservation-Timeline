# ReservationGrid - Arquitectura Modular

## 📁 Estructura de Carpetas

```
ReservationGrid/
├── index.tsx              # Componente principal (coordina vista y estado global)
├── hooks/                 # Hooks personalizados (lógica reutilizable)
│   ├── useReservations.ts    # CRUD de reservas
│   ├── useDragCreate.ts      # Drag & drop para crear reservas
│   ├── useConflictDetection.ts # Validaciones y detección de conflictos
│   └── useFilters.ts         # Filtros, búsqueda y estado del toolbar
├── utils/                 # Funciones puras sin dependencias de React
│   ├── timeUtils.ts          # Funciones de tiempo (pad, minutesToLabel, etc.)
│   ├── validationUtils.ts    # Validaciones (isOutsideServiceHours, etc.)
│   └── constants.ts          # Constantes de configuración
├── components/            # Subcomponentes presentacionales
│   ├── TimeHeaderCell.tsx    # Celda del header de tiempo
│   ├── TimeGridCell.tsx      # Celda individual de la grilla
│   ├── TableRow.tsx          # Fila completa de una mesa
│   └── CurrentTimeIndicator.tsx # Indicador de tiempo actual
├── types.ts               # Interfaces y tipos locales
└── README_GRID.md         # Esta documentación
```

## 🎯 Principios de Diseño

### 1. **Separación de Responsabilidades**
- **index.tsx**: Coordina la vista y maneja el estado global
- **Hooks**: Encapsulan lógica reutilizable
- **Utils**: Funciones puras, fáciles de testear
- **Components**: Presentacionales, sin lógica de negocio

### 2. **Hooks Personalizados**

#### `useReservations.ts`
Maneja todo el CRUD de reservas:
- Creación (`handleSaveReservation`, `openCreateModal`)
- Lectura (estado `reservations`)
- Actualización (`handleUpdateReservation`, `handleMoveReservation`)
- Eliminación (`handleDeleteReservation`)
- Acciones especiales (duplicar, cambiar estado, marcar no show)

#### `useDragCreate.ts`
Aísla la lógica de drag & drop para crear reservas:
- `dragCreateState`: Estado de la selección actual
- `handleCellMouseDown`: Inicio del drag
- `handleCellMouseEnter`: Actualización durante el drag
- `handleCellMouseUp`: Finalización y apertura del modal
- Limpieza automática de event listeners

#### `useConflictDetection.ts`
Centraliza todas las validaciones:
- `findConflict`: Detecta superposiciones
- `isOutsideServiceHours`: Valida horario de servicio (11:00 - 24:00)
- `isInThePast`: Verifica si la reserva ya pasó
- `getReservationValidation`: Genera validación completa
- `reservationValidations`: Map con todas las validaciones precalculadas

#### `useFilters.ts`
Maneja todo el estado de filtros y búsqueda:
- `selectedSectors`: Sectores activos
- `selectedStatuses`: Estados activos
- `searchQuery`: Texto de búsqueda
- `filteredGroups`: Grupos filtrados
- `filteredReservations`: Reservas filtradas
- `activeFiltersCount`: Contador de filtros activos
- `collapsed`: Estado de sectores colapsados

### 3. **Funciones Utilitarias**

#### `timeUtils.ts`
Funciones puras para manejo de tiempo:

```typescript
// Agrega cero a la izquierda
pad(5) // "05"

// Convierte minutos desde medianoche a HH:MM
minutesToLabel(870) // "14:30"

// Genera array de slots de tiempo (11:00 - 24:00, cada 15 min)
generateTimeSlots() // [660, 675, 690, ...]

// Convierte slot a ISO string
timeSlotToISO(660) // "2025-11-03T11:00:00.000Z"

// Obtiene minutos actuales desde medianoche
getCurrentMinutes() // 870 (si son las 14:30)
```

#### `validationUtils.ts`
Funciones puras para validaciones:

```typescript
// Busca conflictos con otras reservas
findConflict(reservations, 't1', startTime, 90) // 'res-123' o null

// Valida horario de servicio
isOutsideServiceHours('2025-11-03T10:00', 60) // true (antes de las 11:00)

// Verifica si está en el pasado
isInThePast('2025-11-01T20:00') // true

// Obtiene validación completa
getReservationValidation(reservation, allReservations)
// {
//   hasConflict: false,
//   conflictWithId: null,
//   isOutsideHours: false,
//   isPast: false,
//   errorMessage: null
// }
```

### 4. **Componentes Presentacionales**

Todos los subcomponentes están memoizados con `React.memo`:

#### `TimeHeaderCell.tsx`
```typescript
<TimeHeaderCell timeSlot={660} zoom={1} />
// Renderiza: "11:00"
```

#### `TimeGridCell.tsx`
```typescript
<TimeGridCell
  tableId="t1"
  timeSlot={660}
  isCreating={false}
  onMouseDown={handleMouseDown}
  onMouseEnter={handleMouseEnter}
  onMouseUp={handleMouseUp}
/>
```

#### `TableRow.tsx`
Renderiza una fila completa:
- Nombre de la mesa
- Celdas de tiempo
- Reservas de la mesa
- Maneja eventos de drag & drop

#### `CurrentTimeIndicator.tsx`
Línea vertical roja que indica la hora actual.

## 🚀 Uso

### Importación Básica

```tsx
import ReservationGrid from '@/components/reservations/ReservationGrid';
import { mockReservations } from '@/mocks/mockReservas';

function App() {
  return <ReservationGrid reservations={mockReservations} />;
}
```

### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `reservations` | `Reservation[]` | Array de reservas inicial |

El componente maneja internamente:
- Grupos de mesas por sector
- Estado de filtros
- Zoom
- Validaciones
- Drag & drop

## 📊 Flujo de Datos

```
User Interaction
      ↓
   Handlers (index.tsx)
      ↓
   Custom Hooks
      ↓
   State Update
      ↓
Presentational Components
      ↓
   Re-render (memoized)
```

## 🧪 Testing

Todos los hooks y utilidades tienen tests unitarios:

```bash
# Tests de utils
npm test test/unit/utils/

# Tests de hooks
npm test test/unit/hooks/

# Tests de integración
npm test test/integration/
```

Ver `test/README_TESTS.md` para más información.

## 🔄 Flujos Principales

### Crear Reserva (Drag & Drop)
1. Usuario hace mouse down en celda vacía
2. `useDragCreate` captura el evento
3. Usuario arrastra para extender duración
4. Mouse up → validaciones → abre modal
5. Usuario completa formulario
6. `useReservations` guarda la reserva

### Mover Reserva
1. Usuario arrastra `ReservationCard`
2. `@dnd-kit/core` maneja el drag
3. `handleMoveReservation` valida el nuevo slot
4. Si es válido → actualiza estado
5. Si hay conflicto → muestra advertencia

### Filtrar Reservas
1. Usuario interactúa con `ReservationToolbar`
2. `useFilters` actualiza estado
3. `filteredReservations` se recalcula (memoizado)
4. Grilla se re-renderiza solo con cambios

## 🎨 Personalización

### Cambiar Horario de Servicio

Editar `utils/constants.ts`:

```typescript
export const START_HOUR = 12; // Iniciar a las 12:00
export const END_HOUR = 23;   // Terminar a las 23:00
```

### Cambiar Intervalo de Tiempo

```typescript
export const MIN_STEP = 30; // Cambiar a intervalos de 30 min
```

### Modificar Colores de Estado

Editar en `ReservationCard.tsx` o crear tema personalizado.

## 📚 Recursos Adicionales

- [Documentación de Tests](../../../test/README_TESTS.md)
- [Sistema de Iconos](../../icons/README_ICONS.md)
- [README Principal](../../../README.md)

## 🐛 Debugging

### React DevTools
Usar extensión de React DevTools para inspeccionar:
- Estado de hooks personalizados
- Props de componentes memoizados
- Re-renders innecesarios

### Logging
Descomentar logs en hooks para debugging:

```typescript
// En useFilters.ts
console.log('Filtered reservations:', filteredReservations);
```

---

-- 

