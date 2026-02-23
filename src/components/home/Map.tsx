import React, { memo, useEffect, useRef, useState } from "react";
import Mapbox from "@rnmapbox/maps";
import { useUserStore } from "@/store/userStore";
import debounce from "lodash.debounce";
import { reverseGeocode } from "@/utils/mapUtils";
import * as Location from "expo-location";
import { Dimensions } from "react-native";
import { MAP_URL } from "@/config/constants";

type MapCenter = {
  latitude: number;
  longitude: number;
};

const devHeight = Dimensions.get("window").height;

const Map = ({
  initialCoords,
  height,
}: {
  initialCoords: MapCenter | null;
  height: number;
}) => {
  const mapRef = useRef<Mapbox.MapView>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);

  const { setLocation, location } = useUserStore();

  const [markers, setMarkers] = useState<any[]>([]);
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

  const lastMarkerGen = useRef<string | null>(null);

  const generateRandomMarkers = () => {
    if (!location?.latitude) return;

    const types = ["carpenter", "plumber", "electrician", "cleaner"];

    const newMarkers = Array.from({ length: 10 }, (_, index) => ({
      id: index,
      latitude: location.latitude + (Math.random() - 0.5) * 0.01,
      longitude: location.longitude + (Math.random() - 0.5) * 0.01,
      type: types[Math.floor(Math.random() * types.length)],
    }));

    setMarkers(newMarkers);
  };

  useEffect(() => {
    if (!location?.latitude) return;

    const key = `${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}`;
    if (lastMarkerGen.current === key) return;

    lastMarkerGen.current = key;
    generateRandomMarkers();
  }, [location]);

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

  const markerFeatures = {
    type: "FeatureCollection",
    features: markers.map((m) => ({
      type: "Feature",
      id: String(m.id),
      properties: { icon: m.type },
      geometry: {
        type: "Point",
        coordinates: [m.longitude, m.latitude],
      },
    })),
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
        <Mapbox.Images
          images={{
            carpenter: require("@/assets/icons/carpenter.png"),
            plumber: require("@/assets/icons/plumber.png"),
            electrician: require("@/assets/icons/electrician.png"),
            cleaner: require("@/assets/icons/maid.png"),
            worker: require("@/assets/icons/worker.png"),
          }}
        />

        <Mapbox.ShapeSource id="workers" shape={markerFeatures as any}>
          <Mapbox.SymbolLayer
            id="workerSymbols"
            style={{
              iconImage: ["get", "icon"],
              iconSize: 0.1,
              iconAllowOverlap: true,
              iconIgnorePlacement: true,
            }}
          />
        </Mapbox.ShapeSource>

        <Mapbox.Camera
          padding={{
            paddingTop: 0,
            paddingBottom: CAMERA_OFFSET,
            paddingLeft: 0,
            paddingRight: 0,
          }}
          ref={cameraRef}
          zoomLevel={14}
        />

        <Mapbox.LocationPuck
          visible={true}
          puckBearingEnabled={false}
          puckBearing="heading"
        />
      </Mapbox.MapView>
    </>
  );
};

export default memo(Map);
