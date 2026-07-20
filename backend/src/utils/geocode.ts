// Turns free-text location (postcode/city) into lat/lng using the free
// Nominatim (OpenStreetMap) API — no API key required, just a contact
// email in the User-Agent per their usage policy. If the lookup fails
// (offline, rate-limited, bad input) we return null and the caller falls
// back to letting the user enter lat/lng manually.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  if (!query.trim()) return null;

  const contact = process.env.GEOCODE_CONTACT_EMAIL || "contact@example.com";
  const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=gb&q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": `physio-connect/0.1 (${contact})` },
    });
    if (!res.ok) return null;

    const results = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!results.length) return null;

    const [first] = results;
    return {
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
      displayName: first.display_name,
    };
  } catch {
    return null;
  }
}
