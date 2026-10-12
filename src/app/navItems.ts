import { House, Info, LocateFixed, Route, type LucideIcon } from 'lucide-react';
import type { StringKey } from '@/lib/i18n';

export interface NavItem {
  key: 'home' | 'tour' | 'whereAmI' | 'about';
  to: string;
  label: StringKey;
  icon: LucideIcon;
}

/** The four primary links shared by BottomNav and SideNav (design/components/layout.md §3, §4). */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'home', to: '/', label: 'nav.home', icon: House },
  { key: 'tour', to: '/tour', label: 'nav.tour', icon: Route },
  { key: 'whereAmI', to: '/tour?locate=1', label: 'nav.whereAmI', icon: LocateFixed },
  { key: 'about', to: '/about', label: 'nav.about', icon: Info },
];

/**
 * Whether a nav item is the current page. `/tour` and `/tour?locate=1` are the same page:
 * "tour" is current there, and "where am I" is never current (it is an entry point to an action).
 */
export function isNavItemCurrent(item: NavItem, pathname: string): boolean {
  switch (item.key) {
    case 'home':
      return pathname === '/';
    case 'tour':
      return pathname === '/tour';
    case 'about':
      return pathname === '/about';
    case 'whereAmI':
      return false;
  }
}
