import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import TierCard from "@/components/book/TireCard";
import { useUserStore } from "@/store/userStore";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import BookingMap from "@/components/book/BookingMap";
import { getUserPhone } from "@/config/supabase";
import { screenHeight } from "@/utils/Constants";
import { bookJob, fetchPrices } from "@/service/api";

const PRIMARY = "#a3e635";

const androidHeight = [screenHeight * 0.8, screenHeight * 0.8];

export default function ConfirmBookingScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => androidHeight, []);
  const {
    location: parsedLocation,
    workerType,
    selected: selectedLevel,
  } = useLocalSearchParams();
  const loc = parsedLocation ? JSON.parse(parsedLocation as string) : null;
  const { location } = useUserStore();
  const [prices, setPrices] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // const navigate = useNavigation()

  useEffect(() => {
    const loadPrices = async () => {
      try {
        const res = await fetchPrices({
          type: workerType as any,
          workSize: selectedLevel as any,
        });

        setPrices(res.options);

        // auto select first tier
        if (res.options?.length) {
          const first = res.options[0].tier;
          setSelectedTier(first);
        }
      } catch (e) {
        console.log("LOAD PRICE FAIL:", e);
      }
    };

    loadPrices();
  }, []);

  const handleOptionSelect = useCallback((tier: string) => {
    setSelectedTier(tier as any);
  }, []);

  const selectedTierData = prices.find((p) => p.tier === selectedTier);

  useEffect(() => {
    if (!selectedTierData) return;

    // Optional: you can log to verify
  }, [selectedTierData]);

  const isValidLocation = (loc: any) => {
    if (!loc) return false;

    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);

    if (!lat || !lng) return false;

    // reject near-zero coords
    if (Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001) return false;

    // reject impossible coords
    if (lat > 90 || lat < -90 || lng > 180 || lng < -180) return false;

    return true;
  };

  const gpsReady = isValidLocation(location);

  const memoLocation = useMemo(() => {
    if (!loc) return null;
    return {
      latitude: loc.latitude,
      longitude: loc.longitude,
    };
  }, [loc?.latitude, loc?.longitude]);

  const handleBooking = async () => {
    if (loading) return; // prevents double tap

    if (!isValidLocation(loc)) {
      alert("Waiting for GPS... Please stand outside or enable location.");
      return;
    }

    if (!selectedTierData) return;

    try {
      setLoading(true);

      const payload = {
        type: workerType as string,
        workSize: selectedLevel as string,
        destination: {
          latitude: Number(location?.latitude),
          longitude: Number(location?.longitude),
          address: location?.address,
        },
        phone: await getUserPhone(),
        workerTier: selectedTierData.tier,
        visitFee: selectedTierData.visitFee,
        jobCharge: selectedTierData.jobCharge,
        estimatedTotal: selectedTierData.total,
        minPrice: selectedTierData.minPrice,
        maxPrice: selectedTierData.maxPrice,
      };

      const res = await bookJob(payload as any);

      router.replace({
        pathname: "/live-job",
        params: { id: res.job.id },
      });
    } catch (e) {
      console.log("BOOKING ERROR:", e);
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {memoLocation && <BookingMap location={memoLocation} />}
      {/* BOTTOM SHEET */}
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={selectedLevel === "large" ? ["55%", "55%"] : snapPoints}
        enablePanDownToClose={false}
        enableOverDrag={false}
        handleIndicatorStyle={{ backgroundColor: "#e2e8f0" }}
        backgroundStyle={styles.sheetBackground}
        enableContentPanningGesture={false}
      >
        <BottomSheetScrollView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Select Service Tier</Text>
          <Text style={styles.sheetSubtitle}>
            Choose the difficulty for your task
          </Text>

          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tierRow}
          >
            {prices.map((p) => (
              <TierCard
                key={p.tier}
                id={p.tier}
                min={p.minPrice}
                max={p.maxPrice}
                jobCharge={p.jobCharge}
                title={p.tier.toUpperCase()}
                subtitle={p.description}
                visitFee={p.visitFee}
                icon="fitness-center"
                selected={selectedTier as any}
                onSelect={setSelectedTier as any}
              />
            ))}
          </ScrollView>

          {/* TOTAL */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Estimated Amount</Text>
            <Text style={styles.totalValue}>
              ₹ {selectedTierData?.jobCharge + selectedTierData?.visitFee}
            </Text>
          </View>

          <View style={styles.bottom}>
            <View style={styles.totalRow}>
              <View>
                {selectedLevel !== "large" && (
                  <>
                    <Text style={styles.estimate}>
                      *Amount will change if the worker changes the difficulty
                      level on inspection{" "}
                    </Text>
                    <View style={{ height: 10 }} />
                  </>
                )}
                <Text style={styles.estimate}>
                  *If you reject the worker, you will be charged the visit fee
                  only.
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleBooking}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.bookBtn, loading && styles.bookBtnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <>
                <Text style={styles.bookText}>Book Now</Text>
                <MaterialIcons name="bolt" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  sheetBackground: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: "#fff",
  },
  bookBtnDisabled: {
    opacity: 0.6,
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
  bottom: {
    paddingHorizontal: 24,
    // paddingTop: 2,
    paddingBottom: 5,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#fff",
  },

  totalRows: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  estimate: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "700",
    lineHeight: 18,
    letterSpacing: 2,
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

  tierRow: { paddingTop: 10, paddingBottom: 10, paddingRight: 12 },

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
  sheetContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },

  bookBtn: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  bookText: { fontWeight: "700", fontSize: 16, color: "white" },
});
