import * as Location from "expo-location";
import { useCallback, useState } from "react";

interface Coords {
  latitude: number;
  longitude: number;
}

// Wraps expo-location's permission + fetch flow so screens can offer "use my
// current location" without each one re-handling permission denial or a
// missing GPS fix. Works on web too — expo-location falls back to the
// browser's Geolocation API there.
export function useCurrentLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission was denied — enable it in your device settings to use this.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch {
      setError("Couldn't get your current location. Try again or search from your home location instead.");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setCoords(null);
    setError(null);
  }, []);

  return { coords, loading, error, request, clear };
}
