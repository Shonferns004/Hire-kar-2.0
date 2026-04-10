import React, { memo, useEffect, useRef, useState } from "react";
import Mapbox from "@rnmapbox/maps";
import { useUserStore } from "@/store/userStore";
import debounce from "lodash.debounce";
import { reverseGeocode } from "@/utils/mapUtils";
import * as Location from "expo-location";
import { Dimensions, Image } from "react-native";
import { MAP_URL } from "@/config/constants";
import { supabase } from "@/config/supabase";

type MapCenter = {
  latitude: number;
  longitude: number;
};

const devHeight = Dimensions.get("window").height;

const Map = ({ initialCoords }: { initialCoords: MapCenter | null }) => {
  const mapRef = useRef<Mapbox.MapView>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const gpsLocked = useRef(false);

  const { setLocation, location } = useUserStore();

  const [markers, setMarkers] = useState<any[]>([]);
  const [onlineWorkers, setOnlineWorkers] = useState<any[]>([]);
  const [cameraCenter, setCameraCenter] = useState<MapCenter | null>(null);
  const CAMERA_OFFSET = devHeight * 0.66;

  const debouncedRegionChange = useRef(
    debounce(async (region: MapCenter) => {
      const address = await reverseGeocode(region.latitude, region.longitude);

      setLocation({
        latitude: region.latitude,
        longitude: region.longitude,
        address,
      });
    }, 900),
  ).current;

  useEffect(() => {
    if (!initialCoords) return;

    gpsLocked.current = true;

    cameraRef.current?.setCamera({
      centerCoordinate: [initialCoords.longitude, initialCoords.latitude],
      zoomLevel: 15,
      animationDuration: 0,
    });

    debouncedRegionChange(initialCoords);
  }, [initialCoords]);

  useEffect(() => {
    if (!location) return;

    cameraRef.current?.setCamera({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: 16,
      animationDuration: 800,
    });
  }, [location]);

  useEffect(() => {
    if (!cameraCenter) return;

    debouncedRegionChange(cameraCenter);
  }, [cameraCenter]);

  useEffect(() => {
    const baseCenter = location ?? initialCoords;

    if (!baseCenter) {
      setMarkers([]);
      return;
    }

    const workersToRender =
      onlineWorkers.length > 0
        ? onlineWorkers
        : Array.from({ length: 8 }, (_, index) => ({
            id: `demo-${index}`,
            worker_type: ["carpenter", "plumber", "electrician", "cleaner"][index % 4],
            service_type: "worker",
          }));

    const spreadWorkers = workersToRender.map((worker: any, index: number) => {
      const angle = (index / Math.max(workersToRender.length, 1)) * Math.PI * 2;
      const ring = 0.0025 + (index % 3) * 0.0012;
      const jitter = (index % 2 === 0 ? 1 : -1) * 0.00035;

      return {
        ...worker,
        latitude: baseCenter.latitude + Math.sin(angle) * ring + jitter,
        longitude:
          baseCenter.longitude +
          Math.cos(angle) * ring +
          jitter / Math.max(Math.cos((baseCenter.latitude * Math.PI) / 180), 0.3),
      };
    });

    setMarkers(spreadWorkers);
  }, [initialCoords, location, onlineWorkers]);

  const lastCenter = useRef<MapCenter | null>(null);

  const updateCenterFromMap = async () => {
    try {
      const center = await mapRef.current?.getCenter();
      if (!center) return;

      const newCenter = { latitude: center[1], longitude: center[0] };

      if (
        lastCenter.current &&
        Math.abs(lastCenter.current.latitude - newCenter.latitude) < 0.0007 &&
        Math.abs(lastCenter.current.longitude - newCenter.longitude) < 0.0007
      )
        return;

      lastCenter.current = newCenter;
      setCameraCenter(newCenter);
    } catch {}
  };

  const loadOnlineWorkers = async () => {
    const { data, error } = await supabase
      .from("workers")
      .select("id, latitude, longitude, worker_type, service_type, on_duty")
      .eq("on_duty", true);

    if (error || !data) return;

    const valid = data.filter(
      (worker: any) =>
        typeof worker.latitude === "number" &&
        typeof worker.longitude === "number",
    );

    setOnlineWorkers(valid);
  };

  useEffect(() => {
    loadOnlineWorkers();

    const channel = supabase
      .channel("workers-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workers" },
        (payload: any) => {
          const next = payload.new ?? payload.old;
          if (!next?.id) return;

          const isOnline =
            payload.eventType !== "DELETE" &&
            next.on_duty &&
            typeof next.latitude === "number" &&
            typeof next.longitude === "number";

          setOnlineWorkers((prev) => {
            const without = prev.filter((item) => item.id !== next.id);
            if (!isOnline) return without;
            return [...without, next];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleGpsButtonPress = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const pos = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = pos.coords;

    cameraRef.current?.setCamera({
      centerCoordinate: [longitude, latitude],
      zoomLevel: 16,
      animationDuration: 800,
    });

    const address = await reverseGeocode(latitude, longitude);

    setLocation({ latitude, longitude, address });
  };

  const handleUserLocationUpdate = (loc: any) => {
    if (gpsLocked.current || !loc?.coords) return;

    const { latitude, longitude } = loc.coords;
    gpsLocked.current = true;

    cameraRef.current?.setCamera({
      centerCoordinate: [longitude, latitude],
      zoomLevel: 16,
      animationDuration: 800,
    });
  };

  const normalizeWorkerType = (value: any) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item ?? "")).join(" ").toLowerCase();
    }

    if (value && typeof value === "object") {
      return Object.values(value)
        .map((item) => String(item ?? ""))
        .join(" ")
        .toLowerCase();
    }

    return String(value ?? "").trim().toLowerCase();
  };

  const getIconForWorker = (worker: any) => {
    const rawType = normalizeWorkerType(
      worker.worker_type ?? worker.service_type ?? "worker",
    );

    if (
      rawType.includes("carp") ||
      rawType.includes("wood") ||
      rawType.includes("furniture")
    ) {
      return "carpenter";
    }

    if (rawType.includes("electric") || rawType.includes("wiring")) {
      return "electrician";
    }

    if (rawType.includes("plumb") || rawType.includes("plumer") || rawType.includes("pipe")) {
      return "plumber";
    }

    if (rawType.includes("clean") || rawType.includes("maid")) {
      return "cleaner";
    }

    if (rawType.includes("paint") || rawType.includes("wall")) {
      return "painter";
    }

    return "worker";
  };

  const workerIcons: Record<string, any> = {
    carpenter: require("@/assets/icons/carpenter.png"),
    plumber: require("@/assets/icons/plumber.png"),
    electrician: require("@/assets/icons/electrician.png"),
    cleaner: require("@/assets/icons/maid.png"),
    painter: require("@/assets/icons/painter.png"),
    worker: require("@/assets/icons/worker.png"),
  };

  return (
    <>
      <Mapbox.MapView
        ref={mapRef}
        logoEnabled={false}
        compassEnabled={false}
        surfaceView={false}
        style={{ flex: 1 }}
        scaleBarEnabled={false}
        styleURL={MAP_URL}
        onMapIdle={updateCenterFromMap}
      >
        {markers.map((worker: any) => {
          const iconKey = getIconForWorker(worker);
          const iconSource = workerIcons[iconKey] ?? workerIcons.worker;

          return (
            <Mapbox.PointAnnotation
              key={String(worker.id)}
              id={String(worker.id)}
              coordinate={[worker.longitude, worker.latitude]}
            >
              <Image
                source={iconSource}
                style={{ width: 34, height: 34, resizeMode: "contain" }}
              />
            </Mapbox.PointAnnotation>
          );
        })}

        <Mapbox.Camera
          padding={{
            paddingTop: 0,
            paddingBottom: CAMERA_OFFSET,
            paddingLeft: 0,
            paddingRight: 0,
          }}
          ref={cameraRef}
          zoomLevel={14}
          minZoomLevel={13}
          maxZoomLevel={15}
        />

        <Mapbox.LocationPuck
          visible={true}
          puckBearingEnabled={false}
          puckBearing="heading"
        />
        <Mapbox.UserLocation visible={false} onUpdate={handleUserLocationUpdate} />
      </Mapbox.MapView>
    </>
  );
};

export default memo(Map);
