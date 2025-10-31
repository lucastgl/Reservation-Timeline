# 🎨 Sistema de Iconos

Biblioteca de iconos reutilizables para el sistema de reservas.

## 📦 Instalación

Los iconos están disponibles como componentes React exportables desde `components/icons`.

## 🚀 Uso

### Importación Individual

```tsx
import { UsersIcon, ClockIcon, CalendarIcon } from '@/components/icons';

function MyComponent() {
  return (
    <div>
      <UsersIcon className="w-5 h-5 text-blue-500" />
      <ClockIcon className="w-4 h-4 text-gray-600" />
      <CalendarIcon size={20} />
    </div>
  );
}
```

### Importación de Todos

```tsx
import * as Icons from '@/components/icons';

function MyComponent() {
  return (
    <div>
      <Icons.UsersIcon className="w-6 h-6" />
      <Icons.ClockIcon className="w-6 h-6" />
    </div>
  );
}
```

### Import por Defecto

```tsx
import Users from '@/components/icons/UsersIcon';
// o usando los alias
import { Users, Clock, Calendar } from '@/components/icons';
```

## 📋 Iconos Disponibles

### 👥 UsersIcon
**Descripción**: Ícono de personas/grupo  
**Uso**: Indicar tamaño de reservas, party size

```tsx
<UsersIcon className="w-4 h-4 text-slate-700" />
```

### 🕐 ClockIcon
**Descripción**: Ícono de reloj  
**Uso**: Indicar horarios, duración, tiempos

```tsx
<ClockIcon className="w-5 h-5 text-gray-500" />
```

### 📅 CalendarIcon
**Descripción**: Ícono de calendario  
**Uso**: Indicar fechas, reservas, agenda

```tsx
<CalendarIcon className="w-5 h-5 text-blue-600" />
```

### 📞 PhoneIcon
**Descripción**: Ícono de teléfono  
**Uso**: Contacto, llamadas, información de cliente

```tsx
<PhoneIcon className="w-4 h-4 text-green-600" />
```

### ✅ CheckIcon
**Descripción**: Ícono de check/confirmación  
**Uso**: Confirmaciones, estados completados, success

```tsx
<CheckIcon className="w-5 h-5 text-green-500" />
```

### ❌ XIcon
**Descripción**: Ícono de X/cerrar/cancelar  
**Uso**: Cancelaciones, cerrar modales, errores

```tsx
<XIcon className="w-5 h-5 text-red-500" />
```

## 🎨 Props

Todos los iconos aceptan las mismas props:

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `className` | `string` | `"w-4 h-4"` | Clases CSS de Tailwind |
| `size` | `number` | `undefined` | Tamaño en pixels (sobreescribe className) |

## 💡 Ejemplos de Uso Real

### En una Tarjeta de Reserva

```tsx
import { UsersIcon, ClockIcon, PhoneIcon } from '@/components/icons';

function ReservationCard({ reservation }) {
  return (
    <div className="p-4 border rounded">
      <h3>{reservation.customer.name}</h3>
      
      <div className="flex items-center gap-2">
        <UsersIcon className="w-4 h-4 text-gray-600" />
        <span>{reservation.partySize} personas</span>
      </div>
      
      <div className="flex items-center gap-2">
        <ClockIcon className="w-4 h-4 text-gray-600" />
        <span>{reservation.time}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <PhoneIcon className="w-4 h-4 text-gray-600" />
        <span>{reservation.customer.phone}</span>
      </div>
    </div>
  );
}
```

### En Botones de Acción

```tsx
import { CheckIcon, XIcon } from '@/components/icons';

function ReservationActions() {
  return (
    <div className="flex gap-2">
      <button className="bg-green-500 text-white px-3 py-2 rounded flex items-center gap-1">
        <CheckIcon className="w-4 h-4" />
        Confirmar
      </button>
      
      <button className="bg-red-500 text-white px-3 py-2 rounded flex items-center gap-1">
        <XIcon className="w-4 h-4" />
        Cancelar
      </button>
    </div>
  );
}
```

### Con Tamaño Dinámico

```tsx
import { CalendarIcon } from '@/components/icons';

function DatePicker({ size = 'md' }) {
  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24
  }[size];
  
  return (
    <div className="flex items-center gap-2">
      <CalendarIcon size={iconSize} />
      <span>Seleccionar fecha</span>
    </div>
  );
}
```

## 🎯 Best Practices

### ✅ Hacer

- Usar `className` con clases de Tailwind para consistencia
- Especificar colores con `text-{color}` en className
- Usar tamaños relativos: `w-4 h-4`, `w-5 h-5`, etc.
- Incluir `aria-label` cuando el icono sea el único contenido de un botón

```tsx
<button aria-label="Cerrar">
  <XIcon className="w-5 h-5" />
</button>
```

### ❌ Evitar

- Mezclar prop `size` con className de tamaño (uno sobreescribe al otro)
- Usar colores inline style cuando Tailwind puede hacerlo
- Iconos muy grandes sin contexto (> 48px)

```tsx
// ❌ Evitar
<UsersIcon size={24} className="w-4 h-4" /> // Conflicto

// ✅ Mejor
<UsersIcon size={24} /> // O usar solo className
```

## 📐 Tamaños Recomendados

| Contexto | Tamaño | Clase Tailwind |
|----------|--------|----------------|
| Texto inline | 12-16px | `w-3 h-3` o `w-4 h-4` |
| Botones pequeños | 16-20px | `w-4 h-4` o `w-5 h-5` |
| Botones normales | 20-24px | `w-5 h-5` o `w-6 h-6` |
| Headers | 24-32px | `w-6 h-6` o `w-8 h-8` |
| Hero sections | 32-48px | `w-8 h-8` o `w-12 h-12` |

## 🔧 Personalización

### Crear Nuevo Icono

1. Crear archivo en `components/icons/NuevoIcon.tsx`:

```tsx
import React from "react";

interface NuevoIconProps {
    className?: string;
    size?: number;
}

export const NuevoIcon: React.FC<NuevoIconProps> = ({ 
    className = "w-4 h-4", 
    size 
}) => {
    const sizeProps = size ? { width: size, height: size } : {};

    return (
        <svg
            className={className}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            {...sizeProps}
        >
            {/* Tu path SVG aquí */}
            <path d="..." />
        </svg>
    );
};

export default NuevoIcon;
```

2. Exportar en `components/icons/index.ts`:

```tsx
export { NuevoIcon } from './NuevoIcon';
export { default as Nuevo } from './NuevoIcon';
```

## 🎨 Fuente de Iconos

Los iconos están basados en [Heroicons](https://heroicons.com/) (MIT License), una biblioteca de iconos de alta calidad mantenida por los creadores de Tailwind CSS.

## 📝 Notas

- Todos los iconos usan `fill="currentColor"` para heredar el color del texto
- Los iconos son componentes React memoizados internamente
- Viewbox estándar: `0 0 20 20` para consistencia
- Accesibilidad: `aria-hidden="true"` por defecto (no son contenido)

## 🤝 Contribuir

Para agregar nuevos iconos:
1. Crear el componente siguiendo la estructura existente
2. Agregar la exportación en `index.ts`
3. Documentar en este README
4. Agregar ejemplo de uso

---

**Última actualización**: 2025-10-31

