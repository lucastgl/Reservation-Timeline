# 🧪 Suite de Pruebas - Reservation Timeline

Este directorio contiene todas las pruebas automatizadas del sistema de reservas.

## 📁 Estructura

```
test/
├── setup/                      # Configuración de pruebas
│   ├── testUtils.tsx          # Utilidades de testing
│   └── mockData.ts            # Datos mock reutilizables
│
├── unit/                       # Pruebas unitarias
│   └── utils/                 # Funciones puras
│       ├── timeUtils.test.ts
│       └── validationUtils.test.ts
│
├── integration/                # Pruebas de integración
│   ├── ReservationGrid.test.tsx
│   └── CreateReservationModal.test.tsx
│
├── performance/                # Pruebas de rendimiento
│   └── ReservationGrid.perf.test.tsx
│
└── README.md                   # Esta documentación
```

## 🚀 Ejecutar Pruebas

### Todas las pruebas
```bash
npm test
```

### Pruebas en modo watch
```bash
npm test -- --watch
```

### Pruebas específicas
```bash
# Solo pruebas unitarias
npm test unit

# Solo pruebas de integración
npm test integration

# Solo pruebas de performance
npm test performance

# Un archivo específico
npm test CreateReservationModal.test
```

### Coverage
```bash
npm test -- --coverage
```

## ✅ Casos de Prueba Implementados

### 1. **Flujo Feliz - Crear Reserva** ✅
- Click y arrastre sobre celda vacía
- Apertura de modal
- Completar formulario
- Guardar
- Verificar que aparece en la grilla

**Archivo**: `integration/CreateReservationModal.test.tsx`

### 2. **Validación de Capacidad** ✅
- Intentar reservar para 10 personas en mesa de 2-8
- Debe mostrar error
- Botón de guardar deshabilitado

**Archivo**: `integration/CreateReservationModal.test.tsx`

### 3. **Detección de Conflictos** ✅
- Crear reserva en horario ocupado
- Debe mostrar alerta roja
- No permitir guardar

**Archivo**: `integration/CreateReservationModal.test.tsx`

### 4. **Validación de Horario** ✅
- Reserva antes de 11:00 → Error
- Reserva después de 24:00 → Error
- Horario válido → Success

**Archivo**: `integration/CreateReservationModal.test.tsx`

### 5. **Filtrar por Sector** ✅
- Seleccionar "Terraza"
- Solo mostrar mesas de terraza
- Ocultar mesas de interior

**Archivo**: `integration/ReservationGrid.test.tsx`

### 6. **Buscar por Nombre/Teléfono** ✅
- Escribir nombre en búsqueda
- Filtrar reservas en tiempo real
- Mostrar solo coincidencias

**Archivo**: `integration/ReservationGrid.test.tsx`

### 7. **Controles de Zoom** ✅
- Cambiar zoom a 50%, 75%, 100%, 125%, 150%
- Verificar que se aplica
- Verificar indicador visual activo

**Archivo**: `integration/ReservationGrid.test.tsx`

### 8. **Colapsar/Expandir Sectores** ✅
- Click en header de sector
- Ocultar/mostrar mesas
- Mantener estado

**Archivo**: `integration/ReservationGrid.test.tsx`

### 9. **Limpiar Filtros** ✅
- Aplicar múltiples filtros
- Mostrar indicador de cantidad
- Click en "Limpiar"
- Resetear todos los filtros

**Archivo**: `integration/ReservationGrid.test.tsx`

### 10. **Rendimiento con 200 Reservas** ✅
- Cargar 200 reservas
- Medir tiempo de render
- Debe ser < 2 segundos
- Verificar desplazamiento fluido

**Archivo**: `performance/ReservationGrid.perf.test.tsx`

## 🧩 Utilidades de Testing

### `testUtils.tsx`
Render personalizado con providers necesarios (DndContext, etc.)

```typescript
import { render, screen } from '../setup/testUtils'
```

### `mockData.ts`
Datos mock reutilizables

```typescript
import { 
  mockReservations, 
  mockSectorGroups, 
  createMockReservation,
  generateMockReservations 
} from '../setup/mockData'
```

## 📊 Resultados Actuales

**✅ Todos los tests pasando**

```
Test Suites: 6 passed, 6 total
Tests:       43 passed, 43 total
Time:        ~3.7s
```

### Distribución de Tests

| Categoría | Tests | Estado |
|-----------|-------|--------|
| Utilidades (timeUtils) | 6 | ✅ |
| Validaciones | 12 | ✅ |
| Hook useFilters | 8 | ✅ |
| Hook useConflictDetection | 5 | ✅ |
| Integración ReservationGrid | 5 | ✅ |
| Performance | 3 | ✅ |
| **TOTAL** | **43** | **✅** |

## 🔄 Casos Pendientes

Los siguientes casos están pendientes de implementación:

- [ ] Mover reserva (drag & drop)
- [ ] Redimensionar reserva
- [ ] Cambiar estado via context menu
- [ ] Selección múltiple (Cmd + click)
- [ ] Deshacer/Rehacer

Estos requieren testing más avanzado con simulación de eventos de mouse/drag.

## 📝 Agregar Nuevas Pruebas

### 1. Crear archivo de prueba
```typescript
// test/unit/components/MyComponent.test.tsx
import { render, screen } from '../../setup/testUtils'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### 2. Usar mocks
```typescript
import { createMockReservation } from '../../setup/mockData'

const reservation = createMockReservation({
  customer: { name: 'Custom Name' }
})
```

### 3. Testing asíncrono
```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

## 🐛 Debugging

### Ver qué está renderizado
```typescript
import { screen } from '@testing-library/react'

screen.debug() // Imprime el DOM actual
```

### Queries disponibles
```typescript
screen.getByText()        // Lanza error si no encuentra
screen.queryByText()      // Retorna null si no encuentra
screen.findByText()       // Async, espera a que aparezca
screen.getAllByText()     // Array de elementos
```

## 🎯 Best Practices

1. **Arrange, Act, Assert**: Organizar pruebas en 3 fases
2. **User-centric**: Testear como un usuario usaría la app
3. **No implementación**: Evitar testear detalles de implementación
4. **Mock mínimo**: Solo mockear dependencias externas
5. **Nombres descriptivos**: `should do X when Y`

## 📚 Recursos

- [Jest Docs](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

