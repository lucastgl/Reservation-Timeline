import React from "react";

// ============================================================================
// X ICON - Ícono de X/Cerrar/Cancelar
// ============================================================================

/**
 * Ícono SVG de X para cancelaciones, cerrar modales, etc.
 * 
 * @param className - Clases CSS de Tailwind para tamaño y color
 * @param size - Tamaño opcional en pixels
 * 
 * @example
 * ```tsx
 * <XIcon className="w-5 h-5 text-red-500" />
 * ```
 */
interface XIconProps {
    className?: string;
    size?: number;
}

export const XIcon: React.FC<XIconProps> = ({ 
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
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
            />
        </svg>
    );
};

export default XIcon;

