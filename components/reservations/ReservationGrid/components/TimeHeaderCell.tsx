import { memo } from 'react';
import { minutesToLabel } from '../utils/timeUtils';

interface TimeHeaderCellProps {
  timeSlot: number;
  stepPx: number;
}

/**
 * Celda individual del header de tiempo
 * Memoizado para evitar re-renders innecesarios (hay 53 celdas por defecto)
 */
export const TimeHeaderCell = memo(({ timeSlot, stepPx }: TimeHeaderCellProps) => {
  const isHour = timeSlot % 60 === 0;
  const is30 = timeSlot % 30 === 0;

  return (
    <div
      style={{ width: stepPx }}
      className={`flex items-center justify-center text-xs border-r ${
        isHour
          ? "font-bold text-slate-900 border-slate-400"
          : "text-slate-600 border-slate-300"
      }`}
    >
      {is30 || isHour ? minutesToLabel(timeSlot) : ""}
    </div>
  );
});

TimeHeaderCell.displayName = "TimeHeaderCell";

