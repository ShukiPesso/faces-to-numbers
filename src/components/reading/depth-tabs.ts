import type { Depth, StationDepth } from '@/content/schema';
import type { StringKey } from '@/lib/i18n';

export interface DepthTab<K extends string> {
  key: K;
  label: StringKey;
}

export interface DepthTabsProps<K extends string = Depth> {
  value: K;
  onChange: (depth: K) => void;
  /** Tabs to show; defaults to the person depths (30 sec / 2 min / 5 min). */
  tabs?: ReadonlyArray<DepthTab<K>>;
}

export const PERSON_DEPTH_TABS: ReadonlyArray<DepthTab<Depth>> = [
  { key: 's30', label: 'depth.s30' },
  { key: 'm2', label: 'depth.m2' },
  { key: 'm5', label: 'depth.m5' },
];

/** Station depths (Shuki, 2026-10-16): background (2 min), history5 (5 min), historyFull. */
export const STATION_DEPTH_TABS: ReadonlyArray<DepthTab<StationDepth>> = [
  { key: 'm2', label: 'depth.m2' },
  { key: 'm5', label: 'depth.m5' },
  { key: 'full', label: 'depth.full' },
];
