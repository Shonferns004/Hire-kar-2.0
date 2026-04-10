import React, { useMemo, useRef, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { screenHeight } from "@/utils/Constants";
import { useUserStore } from "@/store/userStore";
import * as Location from "expo-location";
import { reverseGeocode } from "@/utils/mapUtils";
import SheetContent from "@/components/home/SheetContent";
import Map from "@/components/home/Map";

const androidHeight = [screenHeight * 0.38, screenHeight * 0.68];
export default function Home() {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => androidHeight, []);
  const { setLocation } = useUserStore();
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 22,
    stiffness: 160,
    mass: 0.7,
  });
  const [initialCoords, setInitialCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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

  return (
    <View style={styles.container}>
      <Map initialCoords={initialCoords} />
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enableOverDrag
        enableDynamicSizing={false}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
        enableContentPanningGesture
        enableHandlePanningGesture
        style={styles.sheet}
        animationConfigs={animationConfigs}
        animateOnMount
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          style={styles.sheetScroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled
        >
          <SheetContent sheetRef={sheetRef} />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  sheetBackground: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: "#f9f9f8",
  },

  handle: {
    width: 50,
    height: 5,
    backgroundColor: "#e2e8f0",
  },
  sheet: {
    overflow: "hidden",
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
    paddingTop: 14,
    paddingBottom: 140,
  },
  sheetScroll: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: "hidden",
    backgroundColor: "#f9f9f8",
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
