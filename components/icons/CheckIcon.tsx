import React from "react";

// ============================================================================
// CHECK ICON - Ícono de Check/Confirmación
// ============================================================================

/**
 * Ícono SVG de check para confirmaciones y estados completados
 * 
 * @param className - Clases CSS de Tailwind para tamaño y color
 * @param size - Tamaño opcional en pixels
 * 
 * @example
 * ```tsx
 * <CheckIcon className="w-5 h-5 text-green-500" />
 * ```
 */
interface CheckIconProps {
    className?: string;
    size?: number;
}

export const CheckIcon: React.FC<CheckIconProps> = ({ 
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
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
            />
        </svg>
    );
};

export default CheckIcon;

