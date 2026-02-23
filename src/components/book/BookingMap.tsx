import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import React, { FC, memo, useEffect, useRef } from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { mapStyles } from "@/styles/mapStyles";
import { useRouter } from "expo-router";
import { MAP_URL } from "@/config/constants";
import Mapbox from "@rnmapbox/maps";

const PRIMARY = "#a3e635";

const height = Dimensions.get("window").height;

type Coord = {
  latitude: number;
  longitude: number;
};

const BookingMap: FC<{ location: Coord }> = ({ location }) => {
  const cameraRef = useRef<Mapbox.Camera>(null);
  const CAMERA_OFFSET = height * 0.6;
  const router = useRouter();

  useEffect(() => {
    if (!location) return;

    cameraRef.current?.setCamera({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: 16,
      padding: {
        paddingTop: 0,
        paddingBottom: CAMERA_OFFSET,
        paddingLeft: 0,
        paddingRight: 0,
      },
      animationDuration: 800,
    });
  }, [location]);

  const goToLocation = () => {
    if (!location) return;

    cameraRef.current?.setCamera({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: 15,

      animationDuration: 500,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <Mapbox.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL={MAP_URL}
        logoEnabled={false}
        compassEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        scaleBarEnabled={false}
        attributionEnabled={false}
        surfaceView={false}
        preferredFramesPerSecond={30}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={16}
          centerCoordinate={[location?.longitude, location?.latitude]}
          padding={{
            paddingTop: 0,
            paddingBottom: CAMERA_OFFSET,
            paddingLeft: 0,
            paddingRight: 0,
          }}
        />
        {location && (
          <Mapbox.PointAnnotation
            id="worker"
            coordinate={[location.longitude, location.latitude]}
          >
            <View style={mapStyles.marker}>
              <Ionicons name="location" size={28} color="#ff5b5b" />
            </View>
          </Mapbox.PointAnnotation>
        )}
      </Mapbox.MapView>

      <TouchableOpacity style={mapStyles.gpsButton} onPress={goToLocation}>
        <Ionicons name="locate" size={28} color="#3C75BE" />
      </TouchableOpacity>

      {/* BACK BUTTON */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <MaterialIcons name="arrow-back" size={22} color="#475569" />
      </TouchableOpacity>
    </View>
  );
};

export default memo(BookingMap);

const styles = StyleSheet.create({
  container: { flex: 1 },

  sheetBackground: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: "#fff",
  },

  centerPin: {
    position: "absolute",
    top: "35%",
    alignSelf: "center",
    alignItems: "center",
  },

  pinOuter: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#3b82f6",
  },

  pinLabel: {
    marginTop: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  pinLabelText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  backBtn: {
    position: "absolute",
    top: 16,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

  sheetTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  sheetSubtitle: { fontSize: 12, color: "#64748b", marginBottom: 12 },

  tierRow: { flexDirection: "row", gap: 12 },

  tierCard: {
    width: 120,
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },

  tierCardActive: {
    borderColor: PRIMARY,
    backgroundColor: "rgba(163,230,53,0.08)",
  },

  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(163,230,53,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  tierTitle: { fontWeight: "700" },
  tierSub: { fontSize: 10, color: "#64748b" },
  tierPrice: { marginTop: 4, color: PRIMARY, fontWeight: "700" },

  paymentLabel: {
    marginTop: 24,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#94a3b8",
  },

  paymentCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  paymentLeft: { flexDirection: "row", alignItems: "center", gap: 12 },

  cardNumber: { fontWeight: "700" },
  cardExpiry: { fontSize: 10, color: "#64748b" },

  totalRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  totalLabel: { color: "#64748b" },
  totalValue: { fontSize: 22, fontWeight: "700" },

  bookBtn: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  bookText: { fontWeight: "700", fontSize: 16, color: "#0f172a" },
});
