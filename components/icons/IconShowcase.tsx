"use client";

import React from "react";
import * as Icons from "./index";

/**
 * IconShowcase - Componente de demostración de todos los iconos disponibles
 * 
 * Este componente muestra todos los iconos del sistema con diferentes tamaños
 * y colores para facilitar la selección y prueba visual.
 * 
 * @example
 * ```tsx
 * // Agregar a una página para visualizar los iconos
 * import IconShowcase from '@/components/icons/IconShowcase';
 * 
 * <IconShowcase />
 * ```
 */
export default function IconShowcase() {
    const icons = [
        { name: "UsersIcon", component: Icons.UsersIcon, description: "Personas/Grupo" },
        { name: "ClockIcon", component: Icons.ClockIcon, description: "Reloj/Tiempo" },
        { name: "CalendarIcon", component: Icons.CalendarIcon, description: "Calendario/Fecha" },
        { name: "PhoneIcon", component: Icons.PhoneIcon, description: "Teléfono/Contacto" },
        { name: "CheckIcon", component: Icons.CheckIcon, description: "Confirmar/Success" },
        { name: "XIcon", component: Icons.XIcon, description: "Cancelar/Cerrar" },
    ];

    const sizes = [
        { label: "Pequeño", className: "w-4 h-4", px: "16px" },
        { label: "Mediano", className: "w-6 h-6", px: "24px" },
        { label: "Grande", className: "w-8 h-8", px: "32px" },
    ];

    const colors = [
        { label: "Gris", className: "text-gray-600" },
        { label: "Azul", className: "text-blue-500" },
        { label: "Verde", className: "text-green-500" },
        { label: "Rojo", className: "text-red-500" },
        { label: "Amarillo", className: "text-yellow-500" },
        { label: "Púrpura", className: "text-purple-500" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
                Sistema de Iconos
            </h1>
            <p className="text-gray-600 mb-8">
                Biblioteca de iconos reutilizables para el sistema de reservas
            </p>

            {/* Grid de iconos con todos los tamaños */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Todos los Iconos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {icons.map(({ name, component: Icon, description }) => (
                        <div 
                            key={name} 
                            className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-gray-100 rounded">
                                    <Icon className="w-6 h-6 text-gray-700" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{name}</h3>
                                    <p className="text-sm text-gray-500">{description}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 pt-3 border-t border-gray-100">
                                {sizes.map(({ className, px }) => (
                                    <div key={px} className="flex flex-col items-center gap-1">
                                        <Icon className={`${className} text-gray-600`} />
                                        <span className="text-xs text-gray-400">{px}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Demostración de tamaños */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Tamaños Disponibles
                </h2>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    {sizes.map(({ label, className, px }) => (
                        <div key={label} className="flex items-center gap-8 mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-b-0">
                            <div className="w-32">
                                <span className="font-medium text-gray-700">{label}</span>
                                <div className="text-xs text-gray-500">
                                    {className} ({px})
                                </div>
                            </div>
                            <div className="flex gap-6 flex-wrap">
                                {icons.map(({ name, component: Icon }) => (
                                    <div key={name} className="flex flex-col items-center gap-1">
                                        <Icon className={`${className} text-gray-600`} />
                                        <span className="text-xs text-gray-400">{name.replace('Icon', '')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Demostración de colores */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Paleta de Colores
                </h2>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    {colors.map(({ label, className }) => (
                        <div key={label} className="flex items-center gap-8 mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-b-0">
                            <div className="w-32">
                                <span className="font-medium text-gray-700">{label}</span>
                                <div className="text-xs text-gray-500">{className}</div>
                            </div>
                            <div className="flex gap-6 flex-wrap">
                                {icons.map(({ name, component: Icon }) => (
                                    <div key={name} className="flex flex-col items-center gap-1">
                                        <Icon className={`w-6 h-6 ${className}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Ejemplos de uso en contexto */}
            <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Ejemplos en Contexto
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Botones */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">En Botones</h3>
                        <div className="flex flex-wrap gap-2">
                            <button className="bg-green-500 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-green-600">
                                <Icons.CheckIcon className="w-4 h-4" />
                                Confirmar
                            </button>
                            <button className="bg-red-500 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-red-600">
                                <Icons.XIcon className="w-4 h-4" />
                                Cancelar
                            </button>
                            <button className="bg-blue-500 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-blue-600">
                                <Icons.CalendarIcon className="w-4 h-4" />
                                Agendar
                            </button>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">En Badges</h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                <Icons.UsersIcon className="w-3 h-3" />
                                4 personas
                            </span>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                <Icons.ClockIcon className="w-3 h-3" />
                                19:00
                            </span>
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                <Icons.PhoneIcon className="w-3 h-3" />
                                Contactar
                            </span>
                        </div>
                    </div>

                    {/* Lista de info */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">En Listas</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-700">
                                <Icons.UsersIcon className="w-4 h-4 text-gray-500" />
                                <span>6 personas</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <Icons.ClockIcon className="w-4 h-4 text-gray-500" />
                                <span>20:00 - 22:00</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <Icons.PhoneIcon className="w-4 h-4 text-gray-500" />
                                <span>+54 11 1234-5678</span>
                            </div>
                        </div>
                    </div>

                    {/* Estados */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Estados</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Icons.CheckIcon className="w-5 h-5 text-green-500" />
                                <span className="text-gray-700">Confirmado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Icons.XIcon className="w-5 h-5 text-red-500" />
                                <span className="text-gray-700">Cancelado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Icons.ClockIcon className="w-5 h-5 text-yellow-500" />
                                <span className="text-gray-700">Pendiente</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Código de ejemplo */}
            <section className="mt-12">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Código de Ejemplo
                </h2>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-x-auto">
                    <pre className="text-sm">
{`import { UsersIcon, ClockIcon, CheckIcon } from '@/components/icons';

function MyComponent() {
  return (
    <div>
      {/* Tamaño con className */}
      <UsersIcon className="w-5 h-5 text-blue-500" />
      
      {/* Tamaño con prop */}
      <ClockIcon size={24} />
      
      {/* En botón */}
      <button className="flex items-center gap-2">
        <CheckIcon className="w-4 h-4" />
        Confirmar
      </button>
    </div>
  );
}`}
                    </pre>
                </div>
            </section>
        </div>
    );
}

