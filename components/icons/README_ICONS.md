# 🎨 Sistema de Iconos

Biblioteca de iconos reutilizables para el sistema de reservas.

## 📦 Uso

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

## 📋 Iconos Disponibles

### 👥 UsersIcon
**Uso**: Indicar tamaño de reservas, party size

```tsx
<UsersIcon className="w-4 h-4 text-slate-700" />
```

### 🕐 ClockIcon
**Uso**: Indicar horarios, duración, tiempos

```tsx
<ClockIcon className="w-5 h-5 text-gray-500" />
```

### 📅 CalendarIcon
**Uso**: Indicar fechas, reservas, agenda

```tsx
<CalendarIcon className="w-5 h-5 text-blue-600" />
```

### 📞 PhoneIcon
**Uso**: Contacto, información de cliente

```tsx
<PhoneIcon className="w-4 h-4 text-green-600" />
```

### ✅ CheckIcon
**Uso**: Confirmaciones, success

```tsx
<CheckIcon className="w-5 h-5 text-green-500" />
```

### ❌ XIcon
**Uso**: Cancelaciones, cerrar modales

```tsx
<XIcon className="w-5 h-5 text-red-500" />
```

## 🎨 Props

Todos los iconos aceptan:

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `className` | `string` | `"w-4 h-4"` | Clases CSS de Tailwind |
| `size` | `number` | `undefined` | Tamaño en pixels |

## 💡 Ejemplos de Uso

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

## 🎯 Best Practices

### ✅ Hacer

- Usar `className` con clases de Tailwind
- Especificar colores con `text-{color}`
- Incluir `aria-label` en botones con solo icono

```tsx
<button aria-label="Cerrar">
  <XIcon className="w-5 h-5" />
</button>
```

### ❌ Evitar

- Mezclar prop `size` con className de tamaño
- Iconos muy grandes sin contexto (> 48px)

## 📐 Tamaños Recomendados

| Contexto | Tamaño | Clase Tailwind |
|----------|--------|----------------|
| Texto inline | 12-16px | `w-3 h-3` o `w-4 h-4` |
| Botones pequeños | 16-20px | `w-4 h-4` o `w-5 h-5` |
| Botones normales | 20-24px | `w-5 h-5` o `w-6 h-6` |
| Headers | 24-32px | `w-6 h-6` o `w-8 h-8` |

## 🔧 Crear Nuevo Icono

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

## 🎨 Fuente

Basados en [Heroicons](https://heroicons.com/) (MIT License).

---

**Última actualización**: 3 de Noviembre, 2025

