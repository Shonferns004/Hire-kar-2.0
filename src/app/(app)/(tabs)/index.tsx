import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { screenHeight } from "@/utils/Constants";
import { useUserStore } from "@/store/userStore";
import * as Location from "expo-location";
import { reverseGeocode } from "@/utils/mapUtils";
import SheetContent from "@/components/home/SheetContent";
import Map from "@/components/home/Map";

const androidHeight = [
  screenHeight * 0.4,
  // screenHeight * 0.45,
  screenHeight * 0.4,
];
const height = Dimensions.get("window").height;


export default function Home() {
  const sheetRef = useRef<BottomSheet>(null);
  const [mapLocked, setMapLocked] = useState(false);
  const snapPoints = useMemo(() => androidHeight, []);
  const [mapHeight, setMapHeight] = useState(snapPoints[0]);
  const { setLocation } = useUserStore();
  const [initialCoords, setInitialCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

    const CAMERA_OFFSET = height * 0.45;



  useEffect(() => {
    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (!mounted) return;

      const { latitude, longitude } = pos.coords;

      // send to map
      setInitialCoords({ latitude, longitude });

      // reverse geocode once
      const address = await reverseGeocode(latitude, longitude);

      setLocation({
        latitude,
        longitude,
        address,
      });
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSheetChange = useCallback((index: number) => {
    setMapLocked(index !== -1);
    let height = screenHeight * 0.5;
    if (index === 1) height = screenHeight * 0.5;
    setMapHeight(height);
  }, []);

  return (
    <View style={styles.container}>
      <Map height={mapHeight} initialCoords={initialCoords} />
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        enableOverDrag={false}
        onChange={handleSheetChange}
        enableDynamicSizing={false}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
        enableContentPanningGesture={false}
      >
        <BottomSheetScrollView style={styles.sheetContent}>
          <SheetContent />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  sheetBackground: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: "#f9f9f8",
    // paddingVertical: 15,
  },

  handle: {
    width: 50,
    height: 5,
    backgroundColor: "#ddd",
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
  },
  sheetContent: {
    paddingHorizontal: 15,
    // borderTopLeftRadius: 60,
    // borderTopRightRadius: 60,
    marginTop: 15,
  },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 22,
  },

  action: {
    width: 90,
    height: 90,
    backgroundColor: "#fff",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },

  actionTxt: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 6,
  },

  promo: {
    backgroundColor: "#a1e633",
    padding: 20,
    borderRadius: 30,
  },

  offer: {
    fontSize: 10,
    fontWeight: "700",
    opacity: 0.6,
  },

  promoTitle: {
    marginTop: 6,
    fontWeight: "800",
    color: "#161b0e",
  },

  cta: {
    marginTop: 12,
    backgroundColor: "#161b0e",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  ctaText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
