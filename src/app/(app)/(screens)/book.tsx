import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeViewGestureHandler } from "react-native-gesture-handler";
import { useLocalSearchParams, useRouter } from "expo-router";
import TierCard from "@/components/book/TireCard";
import { useUserStore } from "@/store/userStore";
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
    label: new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
});

const getDefaultScheduledSelection = (dates: Date[]) => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextAvailableSlot = TIME_SLOTS.find((slot) => slot.value > nowMinutes);

  if (nextAvailableSlot) {
    return {
      date: dates[0] ?? null,
      time: nextAvailableSlot.value,
    };
  }

  return {
    date: dates[1] ?? dates[0] ?? null,
    time: TIME_SLOTS[0]?.value ?? null,
  };
};

export default function ConfirmBookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { location: parsedLocation, workerType, selected: selectedLevel } =
    useLocalSearchParams();
  const loc = parsedLocation ? JSON.parse(parsedLocation as string) : null;
  const { location } = useUserStore();

  const [prices, setPrices] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState(null);
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

  const defaultScheduleSelection = useMemo(
    () => getDefaultScheduledSelection(availableDates),
    [availableDates],
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    defaultScheduleSelection.date,
  );
  const [selectedTime, setSelectedTime] = useState<number | null>(
    defaultScheduleSelection.time,
  );

  useEffect(() => {
    if (!isBusinessOpen && bookingMode === "instant") {
      setBookingMode("scheduled");
    }
  }, [bookingMode, isBusinessOpen]);

  const isTimeSlotDisabled = useCallback(
    (slotValue: number) => {
      if (!selectedDate) return false;

      const now = new Date();
      const isSameDay = selectedDate.toDateString() === now.toDateString();

      if (!isSameDay) return false;

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      return slotValue <= nowMinutes;
    },
    [selectedDate],
  );

  useEffect(() => {
    if (bookingMode !== "scheduled" || !selectedDate) return;
    if (selectedTime === null || !isTimeSlotDisabled(selectedTime)) return;

    const now = new Date();
    const isSameDay = selectedDate.toDateString() === now.toDateString();
    if (!isSameDay) return;

    const nextAvailableSlot = TIME_SLOTS.find(
      (slot) => !isTimeSlotDisabled(slot.value),
    );

    if (nextAvailableSlot) {
      setSelectedTime(nextAvailableSlot.value);
      return;
    }

    const tomorrow = availableDates.find(
      (date) => date.toDateString() !== selectedDate.toDateString(),
    );

    if (tomorrow) {
      setSelectedDate(tomorrow);
      setSelectedTime(TIME_SLOTS[0]?.value ?? null);
    }
  }, [availableDates, bookingMode, isTimeSlotDisabled, selectedDate, selectedTime]);

  useEffect(() => {
    const loadPrices = async () => {
      try {
        const res = await fetchPrices({
          type: workerType as any,
          workSize: selectedLevel as any,
        });

        setPrices(res.options);

        if (res.options?.length) {
          setSelectedTier(res.options[0].tier);
        }
      } catch (e) {
        console.log("LOAD PRICE FAIL:", e);
      }
    };

    loadPrices();
  }, [selectedLevel, workerType]);

  const selectedTierData = prices.find((p) => p.tier === selectedTier);

  const bookingDestination = useMemo(() => {
    const source = loc ?? location;
    if (!source) return null;

    return {
      latitude: Number(source.latitude),
      longitude: Number(source.longitude),
      address: source.address,
    };
  }, [loc, location]);

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

    if (!scheduledDateTime) {
      return "Book instantly and we will find a worker right away.";
    }

    return `Scheduled for ${scheduledDateTime.toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }, [isBusinessOpen, scheduledDateTime]);

  const isValidLocation = (value: any) => {
    if (!value) return false;

    const lat = Number(value.latitude);
    const lng = Number(value.longitude);

    if (!lat || !lng) return false;
    if (Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001) return false;
    if (lat > 90 || lat < -90 || lng > 180 || lng < -180) return false;

    return true;
  };

  const handleBooking = async () => {
    if (loading) return;

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
    } catch (e: any) {
      console.log("BOOKING ERROR:", e);
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Booking failed. Please try again.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount =
    Number(selectedTierData?.jobCharge ?? 0) +
    Number(selectedTierData?.visitFee ?? 0);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.85}
        >
          <MaterialIcons name="arrow-back" size={22} color="#475569" />
        </TouchableOpacity>

        <View style={styles.headerCopy}>
          <Text style={styles.sheetTitle}>Select Service Tier</Text>
          <Text style={styles.sheetSubtitle}>Choose the difficulty for your task</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 180, 196) },
        ]}
        showsVerticalScrollIndicator={false}
      >
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
                        style={[styles.dateChip, isSelected && styles.dateChipActive]}
                      >
                        <Text
                          style={[
                            styles.dateChipDay,
                            isSelected && styles.dateChipTextActive,
                          ]}
                        >
                          {date.toLocaleDateString("en-IN", { weekday: "short" })}
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
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
              <MaterialIcons name="bolt" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCopy: {
    flex: 1,
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  sheetSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  schedulerCard: {
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
  tierRow: {
    paddingTop: 2,
    paddingBottom: 8,
    paddingRight: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerCopy: {
    flex: 1,
    paddingRight: 14,
  },
  footerTotal: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  estimate: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "700",
    lineHeight: 18,
    letterSpacing: 1.2,
  },
  totalLabel: {
    color: "#64748b",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  bookBtn: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#000000",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  bookBtnDisabled: {
    opacity: 0.6,
  },
  bookText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#ffffff",
  },
});
