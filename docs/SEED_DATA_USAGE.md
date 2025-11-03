# 🎲 Guía de Uso del Generador de Seed Data

Esta guía te muestra cómo usar el generador de reservas aleatorias para testing de performance y desarrollo.

---

## 🚀 Inicio Rápido

### Cargar 100 Reservas Aleatorias en la UI

**Paso 1**: Abre `app/page.tsx`

**Paso 2**: Modifica el `useEffect` que carga las reservas iniciales:

```typescript
import { generateRandomReservations } from "../mocks/seedData";

useEffect(() => {
  if (reservations.length === 0) {
    // Opción A: Usar reservas mock básicas (default)
    // setReservations(mockReservations);
    
    // Opción B: Generar 100 reservas aleatorias para testing
    const randomReservations = generateRandomReservations(100);
    setReservations(randomReservations);
    console.log(`✅ Cargadas ${randomReservations.length} reservas aleatorias`);
  }
}, []);
```

**Paso 3**: Guarda el archivo y recarga la página (`http://localhost:3000`)

**Paso 4**: Verás las 100 reservas distribuidas en el grid de reservas

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Testing de Performance (100 reservas)

```typescript
import { generateRandomReservations } from "../mocks/seedData";

const reservations = generateRandomReservations(100);
setReservations(reservations);
```

### Ejemplo 2: Testing Extremo (500 reservas)

```typescript
const reservations = generateRandomReservations(500);
setReservations(reservations);
```

### Ejemplo 3: Fecha Específica

```typescript
const reservations = generateRandomReservations(200, '2025-10-15');
setReservations(reservations);
```

### Ejemplo 4: Seed Data Completo como JSON

```typescript
import { 
  generateSeedDataWithRandomReservations,
  exportSeedDataAsJSON 
} from '../mocks/seedData';

// Generar seed data completo
const seedData = generateSeedDataWithRandomReservations(100, '2025-10-15');

// Exportar como JSON
const json = exportSeedDataAsJSON(seedData);
console.log(json);

// Copiar el JSON y guardarlo en un archivo .json
```

---

## 🎯 Características del Generador

### ✅ Validaciones Automáticas

- **Sin conflictos**: Evita superposiciones de horarios en la misma mesa
- **Horarios válidos**: Respeta el horario de servicio (12:00-16:00 y 20:00-00:00)
- **Capacidad de mesa**: El tamaño del grupo respeta min/max de cada mesa
- **Duración válida**: Ajusta automáticamente si excede límites

### 📝 Datos Generados

- **Clientes**: Nombres y apellidos aleatorios (españoles)
- **Teléfonos**: Formato argentino `+54 9 XX XXXX-XXXX`
- **Emails**: Generados automáticamente del nombre
- **Estados**: PENDING, CONFIRMED, SEATED, FINISHED, NO_SHOW, CANCELLED
- **Prioridades**: STANDARD, VIP, LARGE_GROUP
- **Fuentes**: web, phone, app, walkin
- **Notas**: 30% de probabilidad de tener notas especiales

### 🔄 Algoritmo de Distribución

1. Distribuye reservas entre todas las mesas disponibles (14 mesas)
2. Para cada reserva, intenta encontrar un slot sin conflicto
3. Hasta 10 intentos por reserva si hay conflictos
4. Si no encuentra slot después de 10 intentos, omite esa reserva
5. Ordena todas las reservas por hora de inicio al finalizar

---

## 🧪 Casos de Uso

### Testing de Performance

```typescript
// Cargar dataset grande para probar rendimiento
const largeDataset = generateRandomReservations(500);
setReservations(largeDataset);

// Luego prueba:
// - Scroll horizontal y vertical
// - Zoom in/out
// - Drag & drop de reservas
// - Filtros y búsqueda
// - Rendimiento general de la UI
```

### Testing de Filtros

```typescript
// Generar reservas con diferentes estados
const reservations = generateRandomReservations(100);

// En la UI, prueba filtrar por:
// - Sectores (Main Hall, Terrace, Bar)
// - Estados (PENDING, CONFIRMED, SEATED, etc.)
// - Búsqueda por nombre o teléfono
```

### Testing de Conflictos

```typescript
// El generador evita conflictos automáticamente
// Pero puedes probar conflictos manualmente:
// 1. Cargar reservas aleatorias
// 2. Intentar crear una reserva que se superponga
// 3. Verificar que el sistema detecta el conflicto
```

---

## 📈 Métricas Esperadas

### Con 100 Reservas

- **Tiempo de generación**: < 500ms
- **Reservas sin conflictos**: ~95-100% (puede haber algunas omisiones si la mesa está muy ocupada)
- **Distribución**: ~7 reservas por mesa en promedio
- **Tiempo de renderizado**: < 1.5s

### Con 500 Reservas

- **Tiempo de generación**: < 2s
- **Reservas sin conflictos**: ~90-95%
- **Distribución**: ~35 reservas por mesa en promedio
- **Tiempo de renderizado**: < 3s

---

## 🐛 Troubleshooting

### Las reservas no aparecen en la UI

1. Verifica que guardaste el archivo `app/page.tsx`
2. Recarga la página completamente (Ctrl+F5)
3. Abre la consola del navegador y verifica errores
4. Verifica que el store de Zustand está inicializado

### Hay muchos conflictos

- Normal con datasets grandes (>300 reservas)
- El generador intenta evitar conflictos pero puede haber algunos
- Considera reducir el número de reservas o aumentar el número de mesas

### Performance lenta con muchas reservas

- Esto es esperado con 500+ reservas
- Prueba activar virtual scrolling (ver `performanceUtils.ts`)
- Considera usar menos reservas para desarrollo diario

---

## 📚 Referencias

- **Archivo principal**: `mocks/seedData.ts`
- **Función principal**: `generateRandomReservations(count, date)`
- **Seed data completo**: `generateSeedDataWithRandomReservations(count, date)`
- **Exportar JSON**: `exportSeedDataAsJSON(seedData)`

---

## 💡 Tips

1. **Para desarrollo diario**: Usa `mockReservations` (más rápido)
2. **Para testing de performance**: Usa `generateRandomReservations(100-500)`
3. **Para demos**: Usa `generateRandomReservations(50)` para balance entre visualización y performance
4. **Para exportar datos**: Usa `exportSeedDataAsJSON()` y guarda en un archivo `.json`

---

**Última actualización**: 3 de Noviembre, 2025

