import type { LucideIcon } from 'lucide-react';
import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import { t } from '@/lib/i18n';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'link';

export interface ButtonProps {
  variant?: ButtonVariant;
  href?: string;
  external?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'start' | 'end';
  fullWidth?: boolean;
  busy?: boolean;
  pressed?: boolean;
  onClick?: () => void;
  children: ReactNode;
  'data-testid'?: string;
}

const BASE =
  'font-body font-semibold text-base transition-colors duration-[var(--duration-fast)] hover:underline active:underline';

const BOX =
  'inline-flex min-h-[var(--tap-min)] min-w-[var(--tap-min)] items-center justify-center gap-2 rounded-md px-5 py-2 md:px-6';

const VARIANTS: Record<Exclude<ButtonVariant, 'link'>, string> = {
  primary: 'bg-primary text-primary-ink',
  secondary: 'border-hairline border-primary bg-surface text-primary hover:bg-bg',
  quiet: 'bg-transparent text-primary',
};

const PRESSED = 'bg-primary text-primary-ink hover:bg-primary';

export function Button({
  variant = 'secondary',
  href,
  external = false,
  icon: Icon,
  iconPosition = 'start',
  fullWidth = false,
  busy = false,
  pressed,
  onClick,
  children,
  'data-testid': testId,
}: ButtonProps) {
  const isLink = variant === 'link';
  const classes = [
    BASE,
    isLink ? 'text-primary underline' : BOX,
    isLink
      ? ''
      : variant === 'secondary' && pressed === true
        ? `border-hairline border-primary ${PRESSED}`
        : VARIANTS[variant],
    fullWidth && !isLink ? 'w-full' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const iconNode = Icon ? (
    <Icon className="size-icon-md shrink-0" aria-hidden="true" focusable="false" />
  ) : null;
  const externalNode = external ? (
    <>
      <span className="sr-only">{t('common.externalLink')}</span>
      <ExternalLink
        className="size-icon-sm shrink-0 rtl:scale-x-[-1]"
        aria-hidden="true"
        focusable="false"
      />
    </>
  ) : null;

  const content = (
    <>
      {iconPosition === 'start' ? iconNode : null}
      <span>{children}</span>
      {iconPosition === 'end' ? iconNode : null}
      {externalNode}
    </>
  );

  if (href !== undefined) {
    return (
      <a
        className={classes}
        href={href}
        data-testid={testId}
        aria-busy={busy || undefined}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      data-testid={testId}
      aria-pressed={pressed}
      aria-busy={busy || undefined}
      onClick={busy ? undefined : onClick}
    >
      {content}
    </button>
  );
}
