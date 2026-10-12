import type { ComponentProps, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { t } from '@/lib/i18n';

export interface MarkdownProps {
  children: string;
  variant?: 'body' | 'read';
}

const EXTERNAL = /^https?:\/\//i;

function MdLink({ href, children }: ComponentProps<'a'>) {
  const external = href !== undefined && EXTERNAL.test(href);
  return (
    <a
      href={href}
      className="font-semibold text-primary underline hover:bg-bg"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
      {external ? <span className="sr-only">{t('common.externalLink')}</span> : null}
    </a>
  );
}

function MdHeading({ children }: { children?: ReactNode }) {
  return <p className="mb-4 font-semibold last:mb-0">{children}</p>;
}

function MdEmphasis({ children }: { children?: ReactNode }) {
  return <span className="font-semibold">{children}</span>;
}

const COMPONENTS_BODY: Components = {
  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: MdEmphasis,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc ps-6 marker:text-ink-muted last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => <ol className="mb-4 list-decimal ps-6 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="mb-2 last:mb-0">{children}</li>,
  a: MdLink,
  h1: MdHeading,
  h2: MdHeading,
  h3: MdHeading,
  h4: MdHeading,
  h5: MdHeading,
  h6: MdHeading,
  img: () => null,
};

const COMPONENTS_READ: Components = {
  ...COMPONENTS_BODY,
  p: ({ children }) => <p className="mb-5 text-read font-regular last:mb-0">{children}</p>,
};

export function Markdown({ children, variant = 'body' }: MarkdownProps) {
  const wrapper =
    variant === 'read'
      ? 'max-w-measure rounded-lg border-hairline border-border bg-surface p-5 font-body text-ink md:p-6'
      : 'max-w-measure font-body text-base text-ink';
  return (
    <div data-inline-text className={wrapper}>
      <ReactMarkdown components={variant === 'read' ? COMPONENTS_READ : COMPONENTS_BODY}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
