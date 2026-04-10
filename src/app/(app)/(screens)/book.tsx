import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { NativeViewGestureHandler } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetFooter,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import TierCard from "@/components/book/TireCard";
import { useUserStore } from "@/store/userStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import BookingMap from "@/components/book/BookingMap";
import { getUserPhone } from "@/config/supabase";
import { bookJob, fetchPrices } from "@/service/api";

const PRIMARY = "#a3e635";
const BUSINESS_OPEN_HOUR = 8;
const BUSINESS_CLOSE_HOUR = 20;
const BUSINESS_HOURS_MESSAGE =
  "Instant booking is available only between 8:00 AM and 8:00 PM. Please schedule your booking.";

const SCHEDULE_DAYS = 14;
const TIME_SLOTS = Array.from({ length: 25 }, (_, index) => {
  const totalMinutes = 480 + index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return {
    value: totalMinutes,
    hour,
    minute,
    label: new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
});

export default function ConfirmBookingScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
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
  const [bookingMode, setBookingMode] = useState<"instant" | "scheduled">(
    "instant",
  );
  const isBusinessOpen = useMemo(() => {
    const nowText = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(new Date());

    const hour = Number(nowText);
    return hour >= BUSINESS_OPEN_HOUR && hour < BUSINESS_CLOSE_HOUR;
  }, []);
  const availableDates = useMemo(() => {
    const today = new Date();

    return Array.from({ length: SCHEDULE_DAYS }, (_, index) => {
      const value = new Date(today);
      value.setDate(today.getDate() + index);
      value.setHours(0, 0, 0, 0);
      return value;
    });
  }, []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    availableDates[0] ?? null,
  );
  const [selectedTime, setSelectedTime] = useState<number | null>(
    TIME_SLOTS[13]?.value ?? 720,
  );
  const snapPoints = useMemo(() => {
    if (bookingMode === "scheduled") {
      return ["94%"];
    }

    if (selectedLevel === "large") {
      return ["76%"];
    }

    return ["82%"];
  }, [bookingMode, selectedLevel]);

  useEffect(() => {
    if (!isBusinessOpen && bookingMode === "instant") {
      setBookingMode("scheduled");
    }
  }, [bookingMode, isBusinessOpen]);

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
  }, [selectedLevel, workerType]);

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

  const memoLocation = useMemo(() => {
    if (!loc) return null;
    return {
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      address: loc.address,
    };
  }, [loc]);
  const bookingDestination = useMemo(() => {
    if (memoLocation) return memoLocation;
    if (!location) return null;

    return {
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      address: location.address,
    };
  }, [location, memoLocation]);

  const scheduledDateTime = useMemo(() => {
    if (
      bookingMode !== "scheduled" ||
      !selectedDate ||
      selectedTime === null ||
      selectedTime === undefined
    ) {
      return null;
    }

    const value = new Date(selectedDate);
    value.setHours(Math.floor(selectedTime / 60), selectedTime % 60, 0, 0);
    return value;
  }, [bookingMode, selectedDate, selectedTime]);

  const scheduleSummary = useMemo(() => {
    if (!isBusinessOpen) {
      return "Instant booking is closed right now. Business hours are 8:00 AM to 8:00 PM, so please schedule your booking.";
    }

    if (!scheduledDateTime) return "Book instantly and we will find a worker right away.";

    return `Scheduled for ${scheduledDateTime.toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }, [scheduledDateTime]);

  const isTimeSlotDisabled = (slotValue: number) => {
    if (!selectedDate) return false;

    const now = new Date();
    const isSameDay = selectedDate.toDateString() === now.toDateString();

    if (!isSameDay) return false;

    const slotMinutes = slotValue;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes <= nowMinutes;
  };

  const handleBooking = async () => {
    if (loading) return; // prevents double tap

    if (!isValidLocation(bookingDestination)) {
      alert("Waiting for GPS... Please stand outside or enable location.");
      return;
    }

    if (!selectedTierData) return;
    if (!isBusinessOpen && bookingMode === "instant") {
      alert(BUSINESS_HOURS_MESSAGE);
      return;
    }
    if (bookingMode === "scheduled" && !scheduledDateTime) {
      alert("Please choose a valid date and time for the booking.");
      return;
    }
    if (
      bookingMode === "scheduled" &&
      scheduledDateTime &&
      scheduledDateTime.getTime() <= Date.now()
    ) {
      alert("Please choose a future time for the booking.");
      return;
    }

    try {
      setLoading(true);
      const scheduledFor =
        bookingMode === "scheduled" && scheduledDateTime
          ? scheduledDateTime.toISOString()
          : undefined;

      const payload = {
        type: workerType as string,
        workSize: selectedLevel as string,
        destination: {
          latitude: Number(bookingDestination?.latitude),
          longitude: Number(bookingDestination?.longitude),
          address: bookingDestination?.address,
        },
        phone: await getUserPhone(),
        workerTier: selectedTierData.tier,
        visitFee: selectedTierData.visitFee,
        jobCharge: selectedTierData.jobCharge,
        estimatedTotal: selectedTierData.total,
        minPrice: selectedTierData.minPrice,
        maxPrice: selectedTierData.maxPrice,
        bookingType: bookingMode,
        scheduledFor,
        scheduledDate: scheduledFor?.split("T")[0],
        scheduledTime: scheduledDateTime
          ?.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
          .replace(" ", ""),
      };

      const res = await bookJob(payload as any);

      if (payload.bookingType === "scheduled") {
        router.replace("/(app)/(tabs)/jobs");
        return;
      }

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

  const totalAmount =
    Number(selectedTierData?.jobCharge ?? 0) + Number(selectedTierData?.visitFee ?? 0);

  const renderFooter = (props: any) => (
    <BottomSheetFooter {...props} bottomInset={insets.bottom}>
      <View style={styles.footerShell}>
        <View style={styles.bottom}>
          <View style={styles.totalRow}>
            <View style={styles.footerCopy}>
              {selectedLevel !== "large" && (
                <>
                  <Text style={styles.estimate}>
                    *Amount may change if the worker updates the difficulty after inspection.
                  </Text>
                  <View style={{ height: 8 }} />
                </>
              )}
              <Text style={styles.estimate}>
                *If you reject the worker, only the visit fee will be charged.
              </Text>
            </View>

            <View style={styles.footerTotal}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rs {totalAmount}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleBooking}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.bookBtn, loading && styles.bookBtnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.bookText}>
                  {bookingMode === "scheduled" ? "Schedule Booking" : "Book Now"}
                </Text>
                <MaterialIcons name="bolt" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetFooter>
  );
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {memoLocation && <BookingMap location={memoLocation} />}
      {/* BOTTOM SHEET */}
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        enableOverDrag={false}
        handleIndicatorStyle={{ backgroundColor: "#e2e8f0" }}
        backgroundStyle={styles.sheetBackground}
        footerComponent={renderFooter}
      >
        <BottomSheetScrollView
          style={styles.sheetContent}
          nestedScrollEnabled
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sheetTitle}>Select Service Tier</Text>
          <Text style={styles.sheetSubtitle}>
            Choose the difficulty for your task
          </Text>

          <View style={styles.schedulerCard}>
            <Text style={styles.schedulerTitle}>When should the worker come?</Text>

            <View style={styles.modeRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  if (!isBusinessOpen) {
                    alert(BUSINESS_HOURS_MESSAGE);
                    return;
                  }
                  setBookingMode("instant");
                }}
                disabled={!isBusinessOpen}
                style={[
                  styles.modeChip,
                  bookingMode === "instant" && styles.modeChipActive,
                  !isBusinessOpen && styles.modeChipDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    bookingMode === "instant" && styles.modeChipTextActive,
                    !isBusinessOpen && styles.modeChipTextDisabled,
                  ]}
                >
                  Book now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setBookingMode("scheduled")}
                style={[
                  styles.modeChip,
                  bookingMode === "scheduled" && styles.modeChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    bookingMode === "scheduled" && styles.modeChipTextActive,
                  ]}
                >
                  Schedule
                </Text>
              </TouchableOpacity>
            </View>

            {bookingMode === "scheduled" && (
              <>
                <NativeViewGestureHandler disallowInterruption>
                  <ScrollView
                    horizontal
                    nestedScrollEnabled
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scheduleRow}
                  >
                    {availableDates.map((date) => {
                      const isSelected =
                        selectedDate?.toDateString() === date.toDateString();

                      return (
                        <TouchableOpacity
                          key={date.toISOString()}
                          activeOpacity={0.85}
                          onPress={() => setSelectedDate(date)}
                          style={[
                            styles.dateChip,
                            isSelected && styles.dateChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dateChipDay,
                              isSelected && styles.dateChipTextActive,
                            ]}
                          >
                            {date.toLocaleDateString("en-IN", {
                              weekday: "short",
                            })}
                          </Text>
                          <Text
                            style={[
                              styles.dateChipDate,
                              isSelected && styles.dateChipTextActive,
                            ]}
                          >
                            {date.getDate()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </NativeViewGestureHandler>

                <View style={styles.timeGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTime === slot.value;
                    const isDisabled = isTimeSlotDisabled(slot.value);

                    return (
                      <TouchableOpacity
                        key={slot.value}
                        activeOpacity={0.85}
                        onPress={() => !isDisabled && setSelectedTime(slot.value)}
                        disabled={isDisabled}
                        style={[
                          styles.timeChip,
                          isDisabled && styles.timeChipDisabled,
                          isSelected && styles.timeChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            isDisabled && styles.timeChipTextDisabled,
                            isSelected && styles.timeChipTextActive,
                          ]}
                        >
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={styles.scheduleSummary}>{scheduleSummary}</Text>
          </View>

          <NativeViewGestureHandler disallowInterruption>
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
          </NativeViewGestureHandler>

          {/* TOTAL */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Estimated Amount</Text>
            <Text style={styles.totalValue}>Rs {totalAmount}</Text>
          </View>

          <View style={styles.legacyBottom}>
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
            style={[styles.legacyBookBtn, loading && styles.bookBtnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <>
                <Text style={styles.bookText}>
                  {bookingMode === "scheduled" ? "Schedule Booking" : "Book Now"}
                </Text>
                <MaterialIcons name="bolt" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
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
    paddingTop: 14,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#fff",
  },
  footerShell: {
    backgroundColor: "#fff",
  },
  legacyBottom: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
  },
  footerCopy: {
    flex: 1,
    paddingRight: 14,
  },
  footerTotal: {
    alignItems: "flex-end",
    justifyContent: "center",
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
  schedulerCard: {
    marginTop: 8,
    marginBottom: 18,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  schedulerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  modeChip: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
  },
  modeChipDisabled: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    opacity: 0.6,
  },
  modeChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  modeChipTextDisabled: {
    color: "#94a3b8",
  },
  modeChipTextActive: {
    color: "#ffffff",
  },
  scheduleRow: {
    paddingBottom: 6,
    paddingRight: 12,
  },
  dateChip: {
    width: 76,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
  },
  dateChipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  dateChipDay: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  dateChipDate: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 4,
  },
  dateChipTextActive: {
    color: "#0f172a",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  timeChip: {
    minWidth: "30%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
  },
  timeChipDisabled: {
    opacity: 0.45,
  },
  timeChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  timeChipTextDisabled: {
    color: "#94a3b8",
  },
  timeChipTextActive: {
    color: "#ffffff",
  },
  scheduleSummary: {
    marginTop: 14,
    fontSize: 12,
    color: "#475569",
    fontWeight: "700",
    lineHeight: 18,
  },

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
  },
  sheetScrollContent: {
    paddingBottom: 220,
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
  legacyBookBtn: {
    height: 0,
    opacity: 0,
    marginTop: 0,
    overflow: "hidden",
  },

  bookText: { fontWeight: "700", fontSize: 16, color: "white" },
});
