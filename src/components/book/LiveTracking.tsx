import { View, Image } from "react-native";
import React, { FC, useEffect, useRef, useState, useCallback, memo } from "react";
import Mapbox, { MarkerView } from "@rnmapbox/maps";
import { indiaIntialRegion } from "@/utils/CustomMap";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Dimensions } from "react-native";
import { calculateLiveETA, calculateSpeedKmH } from "@/utils/eta";
import { calculateDistance } from "@/utils/mapUtils";
import { MAP_URL, MAPBOX_TOKEN } from "@/config/constants";

const height = Dimensions.get("window").height;
const CAMERA_OFFSET = height * 0.45;

;

Mapbox.setAccessToken(MAPBOX_TOKEN);

const LiveTracking: FC<{
  destination: any;
  worker: any;
  status: string;
}> = ({ destination, worker, status }) => {
  const mapRef = useRef<Mapbox.MapView>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);

  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [workerAccessGeoJSON, setWorkerAccessGeoJSON] = useState<any>(null);
  const [destAccessGeoJSON, setDestAccessGeoJSON] = useState<any>(null);

  const lastFetchRef = useRef(0);
  const lastFitRef = useRef(0);

  const prevLocation = useRef<any>(null);
  const [eta, setEta] = useState<number | null>(null);

  const toCoord = (p: any) => [p.longitude, p.latitude];

  /* ---------------- ROUTE FETCH ---------------- */

  const fetchRoute = useCallback(async () => {
    if (!destination?.latitude || !worker?.latitude) return;

    const now = Date.now();
    if (now - lastFetchRef.current < 15000) return; // throttle 15s
    lastFetchRef.current = now;

    try {
      const start = `${worker.longitude},${worker.latitude}`;
      const end = `${destination.longitude},${destination.latitude}`;

      const url =
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start};${end}` +
        `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

      const res = await fetch(url);
      const json = await res.json();

      if (!json.routes?.length) return;

      const coords = json.routes[0].geometry.coordinates;

      const workerActual = [worker.longitude, worker.latitude];
      const roadStart = coords[0];
      const roadEnd = coords[coords.length - 1];
      const destinationActual = [destination.longitude, destination.latitude];

      // Main road route
      setRouteGeoJSON({
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
      });

      // Worker → road (dashed)
      setWorkerAccessGeoJSON({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [workerActual, roadStart],
        },
      });

      // Road → destination (dashed)
      setDestAccessGeoJSON({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [roadEnd, destinationActual],
        },
      });
    } catch (e) {
      console.log("Route fetch error:", e);
    }
  }, [destination?.latitude, worker?.latitude]);


  useEffect(() => {
  if (!worker?.latitude) return;

  const now = Date.now();

  if (prevLocation.current) {
    const speed = calculateSpeedKmH(
      prevLocation.current,
      { lat: worker.latitude, lng: worker.longitude, time: now }
    );

    const distance = calculateDistance(
      destination.latitude,
      destination.longitude,
      worker.latitude,
      worker.longitude
    );

    const etaMin = calculateLiveETA(distance, speed);
    setEta(etaMin);
  }

  prevLocation.current = {
    lat: worker.latitude,
    lng: worker.longitude,
    time: now,
  };
}, [worker?.latitude, worker?.longitude]);

  /* Fetch route when worker moves */
  useEffect(() => {
    if (["ASSIGNED", "ARRIVED", "IN_PROGRESS"].includes(status)) {
      fetchRoute();
    }
  }, [worker?.latitude, worker?.longitude, status]);

  /* ---------------- FIT CAMERA ---------------- */

  const fitToMarkers = () => {
    if (isUserInteracting) return;
    if (!cameraRef.current) return;
    if (!destination?.latitude || !worker?.latitude) return;

    const ne = [
      Math.max(destination.longitude, worker.longitude),
      Math.max(destination.latitude, worker.latitude),
    ];

    const sw = [
      Math.min(destination.longitude, worker.longitude),
      Math.min(destination.latitude, worker.latitude),
    ];

    cameraRef.current.fitBounds(ne, sw, 80, 800);
  };

  useEffect(() => {
    const now = Date.now();
    if (now - lastFitRef.current < 4000) return;
    lastFitRef.current = now;

    fitToMarkers();
  }, [destination, worker]);

  /* ---------------- RENDER ---------------- */

  return (
    <View style={{ flex: 1 }}>
      <Mapbox.MapView
        ref={mapRef}
        style={{ flex: 1 }}
        scaleBarEnabled={false}
        styleURL={MAP_URL}
        preferredFramesPerSecond={60}
        pitchEnabled
        onCameraChanged={(e) => {
          if (e.gestures?.isGestureActive) setIsUserInteracting(true);
        }}
        onMapIdle={() => setIsUserInteracting(false)}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={15}
          padding={{
            paddingTop: 0,
            paddingBottom: CAMERA_OFFSET,
            paddingLeft: 0,
            paddingRight: 0,
          }}
          centerCoordinate={
            destination?.latitude
              ? toCoord(destination)
              : (indiaIntialRegion as any)
          }
        />

        {/* Destination marker */}
        {destination?.latitude && (
          <MarkerView coordinate={toCoord(destination)}>
            <FontAwesome5 name="map-pin" size={20} color="red" />
          </MarkerView>
        )}

        {/* Worker marker */}
        {worker?.latitude && (
          <MarkerView coordinate={toCoord(worker)}>
            <Image
              source={
                worker.type === "electrician"
                  ? require("@/assets/icons/electrician.png")
                  : require("@/assets/icons/plumber.png")
              }
              style={{
                width: 32,
                height: 32,
                transform: [{ rotate: `${worker?.heading || 0}deg` }],
              }}
            />
          </MarkerView>
        )}

        {/* Worker → Road */}
        {workerAccessGeoJSON && (
          <Mapbox.ShapeSource id="workerAccess" shape={workerAccessGeoJSON}>
            <Mapbox.LineLayer
              id="workerAccessLine"
              style={{
                lineWidth: 4,
                lineDasharray: [2, 2],
                lineColor: "#64748b",
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Main Road Route */}
        {routeGeoJSON && (
          <Mapbox.ShapeSource id="routeSource" shape={routeGeoJSON} lineMetrics>
            <Mapbox.LineLayer
              id="routeLine"
              style={{
                lineWidth: 6,
                lineCap: "round",
                lineJoin: "round",
                lineGradient: [
                  "interpolate",
                  ["linear"],
                  ["line-progress"],
                  0,
                  "#22c55e",
                  1,
                  "#16a34a",
                ],
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Road → Destination */}
        {destAccessGeoJSON && (
          <Mapbox.ShapeSource id="destAccess" shape={destAccessGeoJSON}>
            <Mapbox.LineLayer
              id="destAccessLine"
              style={{
                lineWidth: 4,
                lineDasharray: [2, 2],
                lineColor: "#64748b",
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>
    </View>
  );
};

export default memo(LiveTracking);
