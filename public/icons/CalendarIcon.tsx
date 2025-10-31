import React from "react";

// ============================================================================
// CALENDAR ICON - Ícono de Calendario
// ============================================================================

/**
 * Ícono SVG de calendario para indicar fechas o reservas
 * 
 * @param className - Clases CSS de Tailwind para tamaño y color
 * @param size - Tamaño opcional en pixels
 * 
 * @example
 * ```tsx
 * <CalendarIcon className="w-5 h-5 text-blue-600" />
 * ```
 */
interface CalendarIconProps {
    className?: string;
    size?: number;
}

export const CalendarIcon: React.FC<CalendarIconProps> = ({ 
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
            <path 
                fillRule="evenodd" 
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" 
                clipRule="evenodd" 
            />
        </svg>
    );
};

export default CalendarIcon;

