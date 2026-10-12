export interface PageTitleProps {
  children: string;
}

/** The single `h1` of a page (shared by the page stubs and NotFoundPage). */
export function PageTitle({ children }: PageTitleProps) {
  return <h1 className="font-display text-2xl font-display-bold text-ink">{children}</h1>;
}
