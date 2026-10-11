import { describe, expect, it } from 'vitest';
import { googleMapsUrl, personPath, stationPath, wazeUrl } from '@/lib/links';

describe('links', () => {
  it('UT-LINK-01 wazeUrl exact string with 6 decimals', () => {
    expect(wazeUrl({ lat: 31.5, lng: 34.5 })).toBe(
      'https://waze.com/ul?ll=31.500000,34.500000&navigate=yes',
    );
    expect(wazeUrl({ lat: 31.1234567, lng: 34.1234564 })).toBe(
      'https://waze.com/ul?ll=31.123457,34.123456&navigate=yes',
    );
  });

  it('UT-LINK-02 googleMapsUrl exact string', () => {
    expect(googleMapsUrl({ lat: 31.5, lng: 34.25 })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=31.500000,34.250000',
    );
  });

  it('UT-LINK-03 stationPath and personPath', () => {
    expect(stationPath('nova')).toBe('/station/nova');
    expect(personPath('aner-shapira')).toBe('/person/aner-shapira');
  });
});
