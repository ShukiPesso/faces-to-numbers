import { Clock } from 'lucide-react';
import { formatMinutes } from '@/lib/format';

export interface DurationBadgeProps {
  minutes: number;
}

export function DurationBadge({ minutes }: DurationBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 font-body text-sm font-regular text-ink-muted">
      <Clock className="size-icon-sm shrink-0" aria-hidden="true" focusable="false" />
      <bdi>{formatMinutes(minutes)}</bdi>
    </span>
  );
}
