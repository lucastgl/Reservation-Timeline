import React from "react";

// ============================================================================
// PHONE ICON - Ícono de Teléfono
// ============================================================================

/**
 * Ícono SVG de teléfono para contacto de clientes
 * 
 * @param className - Clases CSS de Tailwind para tamaño y color
 * @param size - Tamaño opcional en pixels
 * 
 * @example
 * ```tsx
 * <PhoneIcon className="w-4 h-4 text-green-600" />
 * ```
 */
interface PhoneIconProps {
    className?: string;
    size?: number;
}

export const PhoneIcon: React.FC<PhoneIconProps> = ({ 
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
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
    );
};

export default PhoneIcon;

