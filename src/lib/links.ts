import type { LatLng } from '@/lib/geo';

const coords = (p: LatLng): string => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;

export function wazeUrl(p: LatLng): string {
  return `https://waze.com/ul?ll=${coords(p)}&navigate=yes`;
}

export function googleMapsUrl(p: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${coords(p)}`;
}

export function stationPath(slug: string): string {
  return `/station/${slug}`;
}

export function personPath(id: string): string {
  return `/person/${id}`;
}
