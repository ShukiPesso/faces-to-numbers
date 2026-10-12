import { useCallback, useEffect, useRef, useState } from 'react';
import { getStations } from '@/content';
import { findNearbyStation, type NearbyResult } from '@/lib/geo';

export type NearbyState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'done'; result: NearbyResult };

const PERMISSION_DENIED = 1;

/**
 * On-device "where am I". Location is read only inside `locate()`, which must be called from a
 * user click. The position is used for one computation and never stored, logged or sent.
 */
export function useNearbyStation(): {
  state: NearbyState;
  locate: () => void;
  reset: () => void;
} {
  const [state, setState] = useState<NearbyState>({ status: 'idle' });
  // Incremented on reset/unmount so a late callback cannot overwrite the state.
  const requestId = useRef(0);

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setState({ status: 'unavailable' });
      return;
    }
    requestId.current += 1;
    const id = requestId.current;
    setState({ status: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (id !== requestId.current) return;
        setState({
          status: 'done',
          result: findNearbyStation(
            { lat: position.coords.latitude, lng: position.coords.longitude },
            getStations(),
          ),
        });
      },
      (error) => {
        if (id !== requestId.current) return;
        setState({ status: error.code === PERMISSION_DENIED ? 'denied' : 'unavailable' });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  const reset = useCallback(() => {
    requestId.current += 1;
    setState({ status: 'idle' });
  }, []);

  return { state, locate, reset };
}
