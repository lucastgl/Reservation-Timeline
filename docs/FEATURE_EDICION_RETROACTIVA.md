# 🔓 Feature: Edición Retroactiva de Reservas

**Fecha de Implementación**: 3 de Noviembre, 2025  
**Estado**: ✅ **IMPLEMENTADO**

---

## 🎯 Descripción

Switch (toggle) que permite habilitar/deshabilitar la restricción de edición de reservas en horarios pasados.

### Problema que Resuelve

Por defecto, el sistema bloquea la creación y edición de reservas en horarios que ya transcurrieron para evitar errores. Sin embargo, hay situaciones legítimas donde se necesita:

- 📝 Registrar una reserva que se olvidó ingresar
- ✏️ Corregir datos de una reserva pasada
- 📊 Completar información histórica
- 🔧 Realizar ajustes administrativos

---

## 🎨 Ubicación en la UI

**Toolbar Superior** - Parte derecha, junto a los controles de zoom

```
┌────────────────────────────────────────────────────────┐
│ [Fecha] [Sectores ▼] [Estado ▼] [Búsqueda] [Zoom ▼]   │
│                              [🔒 Edición retroactiva ▼] │ ← Aquí
└────────────────────────────────────────────────────────┘
```

---

## 🔧 Cómo Funciona

### Estado Desactivado (Por Defecto) 🔒

```
[🔒 Edición retroactiva]  ← Switch apagado (gris)
```

**Comportamiento:**
- ❌ No se pueden crear reservas en horarios pasados
- ❌ No se pueden mover reservas a horarios pasados
- ❌ No se pueden redimensionar reservas hacia el pasado
- ⚠️ Mensaje de error: "La hora de esta reserva ya pasó"
- 🔴 Borde rojo en reservas con conflicto temporal

### Estado Activado 🔓

```
[🔓 Edición retroactiva]  ← Switch encendido (azul)
```

**Comportamiento:**
- ✅ Se pueden crear reservas en cualquier horario
- ✅ Se pueden mover reservas sin restricción temporal
- ✅ Se pueden redimensionar reservas libremente
- ℹ️ Tooltip indica que el modo está activo
- 💡 Otras validaciones siguen activas (conflictos, horario de servicio)

---

## 💻 Implementación Técnica

### 1. Estado Global

Agregado en `app/page.tsx`:

```typescript
const [allowPastReservations, setAllowPastReservations] = useState(false);
```

### 2. Props en Toolbar

Actualizado `ReservationToolbar.tsx`:

```typescript
interface ReservationToolbarProps {
  // ... otras props
  allowPastReservations: boolean;
  onTogglePastReservations: (allow: boolean) => void;
}
```

### 3. Switch UI

Componente toggle en `ReservationToolbar.tsx`:

```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <div className="relative">
    <input
      type="checkbox"
      checked={allowPastReservations}
      onChange={(e) => onTogglePastReservations(e.target.checked)}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-600 ...">
      {/* Toggle animado */}
    </div>
  </div>
  <span>
    {allowPastReservations ? '🔓' : '🔒'} Edición retroactiva
  </span>
</label>
```

### 4. Validación Actualizada

Modificado `validationUtils.ts`:

```typescript
export function isInThePast(
  startTime: string, 
  allowPast: boolean = false
): boolean {
  if (allowPast) return false; // Bypasea la validación
  
  const now = new Date();
  const reservationTime = new Date(startTime);
  return reservationTime < now;
}
```

### 5. Propagación a Hooks

Actualizado `useConflictDetection.ts`:

```typescript
export function useConflictDetection(
  reservations: Reservation[],
  allowPastReservations: boolean = false
) {
  const reservationValidations = useMemo(() => {
    // ... usa allowPastReservations en validaciones
  }, [reservations, allowPastReservations]);
}
```

### 6. ReservationGrid

Recibe y usa el flag:

```typescript
interface ReservationGridProps {
  reservations?: Reservation[];
  allowPastReservations?: boolean;
}

const { reservationValidations } = useConflictDetection(
  reservations, 
  allowPastReservations
);
```

---

## 📊 Flujo de Datos

```
User Toggle Switch
       ↓
setAllowPastReservations(true)
       ↓
allowPastReservations state updated
       ↓
Passed to ReservationGrid
       ↓
Passed to useConflictDetection
       ↓
Passed to isInThePast()
       ↓
Validation bypassed if true
       ↓
No error message shown
       ↓
User can create/edit past reservations
```

---

## ✅ Validaciones que Siguen Activas

Incluso con el modo retroactivo activado, estas validaciones permanecen:

1. ✅ **Conflictos**: No permite reservas superpuestas
2. ✅ **Horario de servicio**: Solo entre 11:00 - 24:00
3. ✅ **Capacidad de mesa**: Min/max personas
4. ✅ **Duración**: Mínimo 30 min, máximo 6 horas
5. ✅ **Datos obligatorios**: Nombre, teléfono, etc.

**Solo se bypasea**: Validación de "horario ya pasó"

---

## 🎬 Casos de Uso

### Caso 1: Registrar Reserva Olvidada

**Situación**: 
Son las 15:00 y te das cuenta que olvidaste registrar una reserva del mediodía.

**Solución**:
1. Activar switch "🔓 Edición retroactiva"
2. Click en la celda de 12:00
3. Crear la reserva normalmente
4. Desactivar el switch

### Caso 2: Corregir Datos Históricos

**Situación**: 
Necesitas corregir el teléfono de un cliente de una reserva de ayer.

**Solución**:
1. Activar switch "🔓 Edición retroactiva"
2. Click derecho en la reserva → Editar
3. Modificar los datos
4. Guardar

### Caso 3: Análisis Retrospectivo

**Situación**: 
Quieres completar datos de reservas pasadas para estadísticas.

**Solución**:
1. Activar switch "🔓 Edición retroactiva"
2. Trabajar en todas las reservas necesarias
3. Desactivar cuando termines

---

## 🔐 Seguridad y Permisos

### Recomendaciones

1. **Logging**: Considera registrar cuándo se activa este modo
2. **Permisos**: En producción, solo admin/manager deberían poder activarlo
3. **Auditoría**: Registrar cambios en reservas pasadas
4. **Tiempo límite**: Opcionalmente, permitir solo X días hacia atrás

### Implementación Futura (Sugerida)

```typescript
// Ejemplo de control de permisos
const canEditPast = user.role === 'admin' || user.role === 'manager';

{canEditPast && (
  <div className="...">
    {/* Switch de edición retroactiva */}
  </div>
)}
```

---

## 📝 Documentación de Usuario

### Para el Usuario Final

**¿Qué hace el switch "Edición retroactiva"?**

Por defecto, no puedes crear o modificar reservas en horarios que ya pasaron. Esto evita errores accidentales.

Si necesitas registrar una reserva del pasado o corregir datos históricos:

1. Activa el switch "🔓 Edición retroactiva" (se pone azul)
2. Realiza los cambios necesarios
3. **Importante**: Desactiva el switch cuando termines

**💡 Tip**: Deja el switch desactivado siempre que sea posible para evitar errores.

---

## 🎨 Estilos del Switch

```css
/* Estado OFF (gris) */
.peer:not(:checked) + div {
  background-color: #d1d5db; /* gray-300 */
}

/* Estado ON (azul) */
.peer:checked + div {
  background-color: #2563eb; /* blue-600 */
}

/* Animación del círculo */
.peer:checked:after {
  transform: translateX(100%);
}
```

---

## 🧪 Testing

### Casos a Probar

1. **Toggle funciona**
   - Click activa/desactiva correctamente
   - Estado se refleja en la UI

2. **Validación OFF (default)**
   - Intenta crear reserva a las 10:00 cuando son las 15:00
   - Debe mostrar error

3. **Validación ON**
   - Activa el switch
   - Crea la misma reserva a las 10:00
   - Debe permitirlo sin error

4. **Otras validaciones siguen activas**
   - Con switch ON, intenta crear reserva con conflicto
   - Debe mostrar error de conflicto

---

## 📊 Métricas

### Impacto en Performance

- ✅ Sin impacto significativo
- El flag es simplemente un booleano
- Las validaciones ya existían, solo se bypasea una

### UX Improvement

- ✅ Flexibilidad para casos especiales
- ✅ No compromete seguridad por defecto
- ✅ Fácil de activar/desactivar
- ✅ Visual claro (🔒 vs 🔓)

---

## 🔄 Changelog

### v1.0.0 - 3 de Noviembre, 2025

**Added:**
- ✅ Switch "Edición retroactiva" en toolbar
- ✅ Flag `allowPastReservations` en estado global
- ✅ Parámetro `allowPast` en `isInThePast()`
- ✅ Parámetro en `getReservationValidation()`
- ✅ Propagación a través de hooks
- ✅ Iconos 🔒/🔓 para estado visual
- ✅ Tooltip explicativo

**Modified:**
- ✅ `validationUtils.ts` - Función `isInThePast`
- ✅ `useConflictDetection.ts` - Hook actualizado
- ✅ `ReservationGrid/index.tsx` - Acepta prop
- ✅ `ReservationToolbar.tsx` - Switch UI
- ✅ `app/page.tsx` - Estado global

---

## 📚 Referencias

- [Código: validationUtils.ts](../components/reservations/ReservationGrid/utils/validationUtils.ts)
- [Código: ReservationToolbar.tsx](../components/ReservationToolbar.tsx)
- [Código: useConflictDetection.ts](../components/reservations/ReservationGrid/hooks/useConflictDetection.ts)

---

## 🎯 Próximas Mejoras (Opcional)

- [ ] Agregar confirmación al activar el switch
- [ ] Registrar en logs cuándo se activa
- [ ] Limitar a X días hacia atrás
- [ ] Control de permisos por rol de usuario
- [ ] Auditoría de cambios en reservas pasadas
- [ ] Badge visual cuando el modo está activo

---

**Estado**: ✅ **COMPLETAMENTE IMPLEMENTADO Y FUNCIONAL**

*Última actualización: 3 de Noviembre, 2025*

