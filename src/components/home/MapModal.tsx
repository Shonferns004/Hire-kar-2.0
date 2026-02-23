import React, { FC, memo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Dimensions,
} from "react-native";
import Mapbox from "@rnmapbox/maps";
import { MaterialIcons } from "@expo/vector-icons";
import { reverseGeocode } from "@/utils/mapUtils";
import { useRouter } from "expo-router";
import { mapStyles } from "@/styles/mapStyles";
import { MAP_URL } from "@/config/constants";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedLocation: any;
  onSelectLocation: (location: any) => void;
  workerType: string;
}

const MapModal: FC<Props> = ({
  visible,
  onClose,
  onSelectLocation,
  workerType,
}) => {
  const cameraRef = useRef<Mapbox.Camera>(null);
  const router = useRouter();

  const [address, setAddress] = useState("");
  const lastCenter = useRef<{ latitude: number; longitude: number } | null>(
    null
  );

  // critical flags
  const gpsLocked = useRef(false);
  const debounceRef = useRef<any>(null);

  /* =====================================================
     FIRST REAL GPS FIX (Mapbox native location engine)
  ===================================================== */

  const onUserLocationUpdate = async (loc: any) => {
    if (!loc?.coords) return;

    const { latitude, longitude } = loc.coords;

    // run only once
    if (!gpsLocked.current) {
      gpsLocked.current = true;

      lastCenter.current = { latitude, longitude };

      // center camera exactly on user
      cameraRef.current?.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 16,
        animationDuration: 1200,
      });

      const addr = await reverseGeocode(latitude, longitude);
      setAddress(addr);
    }
  };

  /* =====================================================
     USER DRAGS MAP (PIN PICKER)
  ===================================================== */

  const onCameraChanged = async (e: any) => {
    if (!gpsLocked.current) return;
    if (!e?.properties?.center) return;

    const [lng, lat] = e.properties.center;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (
        lastCenter.current &&
        Math.abs(lastCenter.current.latitude - lat) < 0.00008 &&
        Math.abs(lastCenter.current.longitude - lng) < 0.00008
      )
        return;

      lastCenter.current = { latitude: lat, longitude: lng };

      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
    }, 600);
  };

  /* =====================================================
     RECENTER BUTTON
  ===================================================== */

  const recenter = () => {
    if (!lastCenter.current) return;

    const { latitude, longitude } = lastCenter.current;

    cameraRef.current?.setCamera({
      centerCoordinate: [longitude, latitude],
      zoomLevel: 16,
      animationDuration: 700,
    });
  };

  /* =====================================================
     CONFIRM LOCATION
  ===================================================== */

  const confirmLocation = () => {
    if (!lastCenter.current) return;

    onSelectLocation({
      ...lastCenter.current,
      address,
    });

    router.push({
      pathname: "/(app)/(screens)/level",
      params: {
        location: JSON.stringify({
          ...lastCenter.current,
          address,
        }),
        workerType,
      },
    });

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <Mapbox.MapView
          style={StyleSheet.absoluteFillObject}
          styleURL={MAP_URL}
          logoEnabled={false}
          compassEnabled={false}
          rotateEnabled={false}
          scaleBarEnabled={false}
          onCameraChanged={onCameraChanged}
        >
          {/* THIS IS THE CRITICAL FIX */}
          <Mapbox.Camera
            ref={cameraRef}
            zoomLevel={14}
            padding={{
              paddingTop: 0,
              paddingBottom: 180, // aligns puck with pin
              paddingLeft: 0,
              paddingRight: 0,
            }}
          />

          {/* real gps listener */}
          <Mapbox.UserLocation visible={false} onUpdate={onUserLocationUpdate} />

          {/* puck */}
          <Mapbox.LocationPuck puckBearingEnabled puckBearing="heading" />
        </Mapbox.MapView>

        {/* CENTER PIN */}
        <View pointerEvents="none" style={styles.pinContainer}>
          <View style={styles.pickLabel}>
            <Text style={styles.pickLabelText}>Pick this spot</Text>
          </View>
          <Image source={require("@/assets/icons/drop_marker.png")} style={mapStyles.marker} />
        </View>

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={26} color="#161b0e" />
          </TouchableOpacity>

          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color="#9ca3af" />
            <TextInput
              placeholder="Search for area, street..."
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
            />
            <MaterialIcons name="keyboard-voice" size={20} color="#9ca3af" />
          </View>
        </View>

        {/* GPS BUTTON */}
        <View style={styles.gpsWrapper}>
          <TouchableOpacity onPress={recenter} style={styles.gpsBtn}>
            <MaterialIcons name="my-location" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* BOTTOM SHEET */}
        <View style={styles.sheet}>
          <View style={{ gap: 18 }}>
            <View>
              <View style={styles.selectedRow}>
                <View style={styles.dot} />
                <Text style={styles.selectedLabel}>Selected Address</Text>
              </View>

              <View style={styles.addressRow}>
                <Text style={styles.addressText}>
                  {address || "Finding your location..."}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={confirmLocation} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>Confirm Address</Text>
              <MaterialIcons name="chevron-right" size={26} color="#161b0e" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default memo(MapModal);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  pinContainer: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -90,
    alignItems: "center",
    zIndex: 20,
  },

  pickLabel: {
    backgroundColor: "#161b0e",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 4,
  },

  pickLabelText: {
    color: "white",
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  topBar: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  backBtn: {
    width: 48,
    height: 48,
    backgroundColor: "white",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

  searchBox: {
    flex: 1,
    height: 48,
    backgroundColor: "white",
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
    elevation: 6,
  },

  searchInput: { flex: 1, fontSize: 15, fontWeight: "500", color: "#161b0e" },

  gpsWrapper: { position: "absolute", right: 20, bottom: 400 },

  gpsBtn: {
    width: 55,
    height: 55,
    borderRadius: 999,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    paddingBottom: 40,
    elevation: 20,
  },

  selectedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, backgroundColor: "#a1e633", borderRadius: 8 },
  selectedLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: "#9ca3af" },
  addressRow: { flexDirection: "row" },
  addressText: { flex: 1, fontSize: 17, fontWeight: "700", color: "#161b0e", lineHeight: 22 },

  confirmBtn: {
    marginTop: 6,
    height: 60,
    backgroundColor: "black",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },

  confirmText: { fontSize: 16, fontWeight: "800", color: "white" },
});