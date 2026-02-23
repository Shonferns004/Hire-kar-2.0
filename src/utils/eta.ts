export function calculateSpeedKmH(
  prev: { lat: number; lng: number; time: number },
  next: { lat: number; lng: number; time: number }
) {
  const R = 6371; // earth radius km

  const dLat = ((next.lat - prev.lat) * Math.PI) / 180;
  const dLng = ((next.lng - prev.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((prev.lat * Math.PI) / 180) *
      Math.cos((next.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  const hours = (next.time - prev.time) / 3600000;

  if (hours <= 0) return 0;

  return distanceKm / hours;
}

export function calculateLiveETA(distanceKm: number, speedKmH: number) {
  if (!speedKmH || speedKmH < 3) return null; // worker stopped

  const hours = distanceKm / speedKmH;
  return Math.round(hours * 60);
}



//main

export function calculateArrivalETA(distanceKm: number | null) {
  if (!distanceKm || distanceKm <= 0) return 0;

  // inside building / walking
  if (distanceKm < 0.3) {
    return Math.ceil((distanceKm / 4) * 60);
  }

  // local roads / colonies
  if (distanceKm < 2) {
    return Math.ceil((distanceKm / 12) * 60);
  }

  // city travel
  return Math.ceil((distanceKm / 22) * 60);
}