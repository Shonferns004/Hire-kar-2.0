import axios from "axios";
import { useUserStore } from "@/store/userStore";

let searchController: AbortController | null = null;


export const getLatLong = async (placeId: string) => {
  try {
    // placeId is now "lat,lon"
    const [lat, lon] = placeId.split(",");

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    const address = await reverseGeocode(latitude, longitude);

    return {
      latitude,
      longitude,
      address,
    };
  } catch (error) {
    console.log("LatLong parse error:", error);
    return null;
  }
};

export const reverseGeocode = async (latitude: number, longitude: number) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      {
        headers: {
          "User-Agent": "hirekar-app",
        },
      },
    );

    const data = await res.json();

    return data?.display_name || "Unknown location";
  } catch (error) {
    console.log("Reverse geocode error:", error);
    return "Unknown location";
  }
};


export const getPlacesSuggestions = async (query: string) => {

  try {
    if (!query || query.trim().length < 3) return [];

    // cancel previous request
    if (searchController) {
      searchController.abort();
    }

    searchController = new AbortController();
    const signal = searchController.signal;

    const { location } = useUserStore.getState();
    // ---------- FIRST: Photon (streets & POI) ----------
   const photonRes = await fetch(
  `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lat=${location?.latitude}&lon=${location?.longitude}`,
  { signal }
);


    const photonData = await photonRes.json();

    let results: any[] = [];

    if (photonData?.features?.length) {
      results = photonData.features
        .filter((f: any) => f.properties?.country === "India")
        .map((f: any) => ({
          place_id: `${f.geometry.coordinates[1]},${f.geometry.coordinates[0]}`,
          title:
            f.properties.name ||
            f.properties.street ||
            f.properties.suburb ||
            "Location",
          description:
            f.properties.city || f.properties.state || f.properties.country,
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
        }));
    }

    // ---------- FALLBACK: NOMINATIM (areas/localities like Marol) ----------
    if (results.length < 4) {
      const nomRes = await fetch(
  `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)},India&format=json&addressdetails=1&limit=6`,
  {
    signal,
    headers: {
      "User-Agent": "HirekarApp/1.0 (contact: support@hirekar.app)"
    }
  }
);



      const nomData = await nomRes.json();

      const extra = nomData.map((p: any) => ({
        place_id: `${p.lat},${p.lon}`,
        title:
  p.address?.neighbourhood ||
  p.address?.suburb ||
  p.address?.city ||
  p.display_name.split(",")[0],

        description: p.display_name,
        latitude: parseFloat(p.lat),
        longitude: parseFloat(p.lon),
      }));

      results = [...results, ...extra];
    }

    return results;
  } catch (err) {
    console.log("Search error:", err);
    return [];
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};


export const calculateFare = (distance: number) => {
  const rateStructure = {
    bike: { baseFare: 10, perKmRate: 5, minimumFare: 25 },
    auto: { baseFare: 15, perKmRate: 7, minimumFare: 30 },
    cabEconomy: { baseFare: 20, perKmRate: 10, minimumFare: 50 },
    cabPremium: { baseFare: 30, perKmRate: 15, minimumFare: 70 },
  };

  const fareCalculation = (
    baseFare: number,
    perKmRate: number,
    minimumFare: number,
  ) => {
    const calculatedFare = baseFare + distance * perKmRate;
    return Math.max(calculatedFare, minimumFare);
  };

  return {
    bike: fareCalculation(
      rateStructure.bike.baseFare,
      rateStructure.bike.perKmRate,
      rateStructure.bike.minimumFare,
    ),
    auto: fareCalculation(
      rateStructure.auto.baseFare,
      rateStructure.auto.perKmRate,
      rateStructure.auto.minimumFare,
    ),
    cabEconomy: fareCalculation(
      rateStructure.cabEconomy.baseFare,
      rateStructure.cabEconomy.perKmRate,
      rateStructure.cabEconomy.minimumFare,
    ),
    cabPremium: fareCalculation(
      rateStructure.cabPremium.baseFare,
      rateStructure.cabPremium.perKmRate,
      rateStructure.cabPremium.minimumFare,
    ),
  };
};

function quadraticBezierCurve(
  p1: any,
  p2: any,
  controlPoint: any,
  numPoints: any,
) {
  const points = [];
  const step = 1 / (numPoints - 1);

  for (let t = 0; t <= 1; t += step) {
    const x =
      (1 - t) ** 2 * p1[0] + 2 * (1 - t) * t * controlPoint[0] + t ** 2 * p2[0];
    const y =
      (1 - t) ** 2 * p1[1] + 2 * (1 - t) * t * controlPoint[1] + t ** 2 * p2[1];
    const coord = { latitude: x, longitude: y };
    points.push(coord);
  }

  return points;
}

const calculateControlPoint = (p1: any, p2: any) => {
  const d = Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
  const scale = 1; // Scale factor to reduce bending
  const h = d * scale; // Reduced distance from midpoint
  const w = d / 2;
  const x_m = (p1[0] + p2[0]) / 2;
  const y_m = (p1[1] + p2[1]) / 2;

  const x_c =
    x_m +
    ((h * (p2[1] - p1[1])) /
      (2 * Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2))) *
      (w / d);
  const y_c =
    y_m -
    ((h * (p2[0] - p1[0])) /
      (2 * Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2))) *
      (w / d);

  const controlPoint = [x_c, y_c];
  return controlPoint;
};

export const getPoints = (places: any) => {
  const p1 = [places[0].latitude, places[0].longitude];
  const p2 = [places[1].latitude, places[1].longitude];
  const controlPoint = calculateControlPoint(p1, p2);

  return quadraticBezierCurve(p1, p2, controlPoint, 100);
};

export const vehicleIcons: Record<
  "bike" | "auto" | "cabEconomy" | "cabPremium",
  { icon: any }
> = {
  bike: { icon: require("@/assets/icons/bike.png") },
  auto: { icon: require("@/assets/icons/auto.png") },
  cabEconomy: { icon: require("@/assets/icons/cab.png") },
  cabPremium: { icon: require("@/assets/icons/cab_premium.png") },
};


export const workerIcons: Record<
  "carpenter" | "electrician" | "plumber" | "painter" | "cleaner",
  { icon: any }
> = {
  carpenter: { icon: require("@/assets/icons/carpenter.png") },
  electrician: { icon: require("@/assets/icons/electrician.png") },
  plumber: { icon: require("@/assets/icons/plumber.png") },
  painter: { icon: require("@/assets/icons/painter.png") },
  cleaner: { icon: require("@/assets/icons/cleaner.png") },
};
