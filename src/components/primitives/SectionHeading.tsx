import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SectionHeadingProps {
  level: 2 | 3;
  id?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export function SectionHeading({ level, id, eyebrow, icon: Icon, children }: SectionHeadingProps) {
  const Tag = level === 2 ? 'h2' : 'h3';
  const size = level === 2 ? 'text-xl' : 'text-lg';
  const above = level === 2 ? 'mt-9 md:mt-10' : 'mt-7';
  return (
    <div className={`${above} mb-4`}>
      {eyebrow ? (
        <p className="mb-1 font-body text-xs font-semibold text-accent">{eyebrow}</p>
      ) : null}
      <Tag
        id={id}
        className={`flex items-center gap-2 font-display font-display-bold ${size} text-primary`}
      >
        <span>{children}</span>
        {Icon ? (
          <Icon className="size-icon-md shrink-0" aria-hidden="true" focusable="false" />
        ) : null}
      </Tag>
    </div>
  );
}
