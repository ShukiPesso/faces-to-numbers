import { Clock } from 'lucide-react';
import { formatMinutes } from '@/lib/format';

export interface DurationBadgeProps {
  minutes: number;
}

export function DurationBadge({ minutes }: DurationBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 font-body text-sm font-regular text-ink-muted">
      <bdi>{formatMinutes(minutes)}</bdi>
      <Clock className="size-icon-sm shrink-0" aria-hidden="true" focusable="false" />
    </span>
  );
}
