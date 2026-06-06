export type PlaceCandidate = {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

type PlacesSearchResponse = {
  places?: Array<{
    formattedAddress?: string;
    location?: {
      latitude?: number;
      longitude?: number;
    };
    displayName?: {
      text?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function searchPlaces(
  query: string,
  options: { limit?: number; apiKey?: string } = {},
): Promise<PlaceCandidate[]> {
  const apiKey = options.apiKey ?? process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location",
    },
    body: JSON.stringify({ textQuery: query }),
  });

  const body = (await response.json()) as PlacesSearchResponse;
  if (!response.ok) {
    throw new Error(body.error?.message ?? `Google Places request failed: ${response.status}`);
  }

  return (body.places ?? []).slice(0, options.limit ?? 3).map((place) => ({
    name: place.displayName?.text ?? place.formattedAddress ?? query,
    address: place.formattedAddress,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
  }));
}

export function formatPlaceCandidate(place: PlaceCandidate): string {
  const address = place.address ? `, ${place.address}` : "";
  const coordinates =
    place.latitude !== undefined && place.longitude !== undefined
      ? ` (${place.latitude}, ${place.longitude})`
      : "";
  return `${place.name}${address}${coordinates}`;
}
