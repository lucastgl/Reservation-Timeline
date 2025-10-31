import React from "react";

// ============================================================================
// USERS ICON - Ícono de Personas/Grupo
// ============================================================================

/**
 * Ícono SVG de personas/grupo para indicar el tamaño de la reserva
 * 
 * @param className - Clases CSS de Tailwind para tamaño y color
 * @param size - Tamaño opcional en pixels (por defecto usa className)
 * 
 * @example
 * ```tsx
 * <UsersIcon className="w-4 h-4 text-blue-500" />
 * <UsersIcon size={16} />
 * ```
 */
interface UsersIconProps {
    className?: string;
    size?: number;
}

export const UsersIcon: React.FC<UsersIconProps> = ({ 
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
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
    );
};

export default UsersIcon;

