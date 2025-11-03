import { forwardRef } from 'react';
import { minutesToLabel } from '../utils/timeUtils';

interface CurrentTimeIndicatorProps {
  nowOffset: number;
  nowMins: number;
}

/**
 * Indicador visual del tiempo actual (línea roja vertical)
 */
export const CurrentTimeIndicator = forwardRef<HTMLDivElement, CurrentTimeIndicatorProps>(
  ({ nowOffset, nowMins }, ref) => {
    return (
      <div
        ref={ref}
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
        style={{ left: nowOffset }}
      >
        {/* Círculo superior del indicador */}
        <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-md" />

        {/* Etiqueta con la hora actual */}
        <div className="absolute -top-8 -left-8 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
          {minutesToLabel(nowMins)}
        </div>
      </div>
    );
  }
);

CurrentTimeIndicator.displayName = "CurrentTimeIndicator";

