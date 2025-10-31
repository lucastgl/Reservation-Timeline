import React from "react";

// ============================================================================
// CLOCK ICON - Ícono de Reloj
// ============================================================================

/**
 * Ícono SVG de reloj para indicar horarios o duración
 * 
 * @param className - Clases CSS de Tailwind para tamaño y color
 * @param size - Tamaño opcional en pixels
 * 
 * @example
 * ```tsx
 * <ClockIcon className="w-4 h-4 text-gray-500" />
 * ```
 */
interface ClockIconProps {
    className?: string;
    size?: number;
}

export const ClockIcon: React.FC<ClockIconProps> = ({ 
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
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" 
                clipRule="evenodd" 
            />
        </svg>
    );
};

export default ClockIcon;

