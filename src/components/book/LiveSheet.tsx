import React, { FC, memo, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { calculateDistance } from "@/utils/mapUtils";
import { cancelJob } from "@/service/api";
import { isFavoriteWorker, toggleFavoriteWorker } from "@/utils/favorites";
import { MAPBOX_TOKEN } from "@/config/constants";

type WorkerType =
  | "carpenter"
  | "electrician"
  | "plumber"
  | "painter"
  | "cleaner";

interface JobItems {
  type: WorkerType;
  id: string;
  destination?: any;
  estimated_total?: number;
  status?: string;
  fare: number;
  verification_otp?: number;
  rider: any;
  worker_phone: any;
  visit_fee: number;
  job_charge: number;
  worker_name: string;
  worker_id?: string;
  worker_lat: number;
  worker_lng: number;
}

const STATUS_LABELS: Record<string, string> = {
  SEARCHING: "Finding your worker",
  SCHEDULED: "Scheduled booking",
  ASSIGNED: "Worker assigned",
  ARRIVED: "Worker arrived",
  AWAITING_APPROVAL: "Approval pending",
  IN_PROGRESS: "Work in progress",
  COMPLETED: "Job completed",
  CANCELLED_BY_USER: "Booking cancelled",
  CANCELLED_BY_WORKER: "Worker cancelled",
  AUTO_CANCELLED: "Booking closed",
};

const CANCELABLE_STATUSES = ["SEARCHING", "SCHEDULED", "ASSIGNED"];

const LiveBottomSheet: FC<{ item: JobItems }> = ({ item }) => {
  const [loading, setLoading] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const [favorite, setFavorite] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadFavorite = async () => {
      if (!item?.worker_id) return;
      setFavorite(await isFavoriteWorker(item.worker_id));
    };

    loadFavorite();
  }, [item?.worker_id]);

  const cancel = async () => {
    try {
      setLoading(true);
      await cancelJob(item.id, "CANCELLED_BY_USER");
      Alert.alert("Booking cancelled", "Your booking has been cancelled.");
      router.replace("/(app)/(tabs)");
    } catch (error: any) {
      Alert.alert(
        "Unable to cancel",
        error?.response?.data?.message || "Please try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!item?.worker_id) return;

    const result = await toggleFavoriteWorker({
      id: item.worker_id,
      name: item.worker_name,
      phone: item.worker_phone,
      type: item.type,
    });

    setFavorite(result.isFavorite);
  };

  useEffect(() => {
    let cancelled = false;

    const loadEta = async () => {
      if (
        !item?.worker_lat ||
        !item?.worker_lng ||
        !item?.destination?.latitude ||
        !item?.destination?.longitude
      ) {
        setEta(null);
        return;
      }

      try {
        const start = `${item.worker_lng},${item.worker_lat}`;
        const end = `${item.destination.longitude},${item.destination.latitude}`;
        const url =
          `https://api.mapbox.com/directions/v5/mapbox/driving/${start};${end}` +
          `?overview=false&access_token=${MAPBOX_TOKEN}`;

        const response = await fetch(url);
        const json = await response.json();
        const durationSeconds = json?.routes?.[0]?.duration;

        if (!cancelled && typeof durationSeconds === "number") {
          setEta(Math.max(1, Math.ceil(durationSeconds / 60)));
          return;
        }
      } catch {}

      const fallbackDistance = calculateDistance(
        item.destination.latitude,
        item.destination.longitude,
        item.worker_lat,
        item.worker_lng,
      );

      if (!cancelled) {
        setEta(Math.max(1, Math.ceil((fallbackDistance / 18) * 60)));
      }
    };

    loadEta();

    return () => {
      cancelled = true;
    };
  }, [
    item?.destination?.latitude,
    item?.destination?.longitude,
    item?.worker_lat,
    item?.worker_lng,
  ]);

  useEffect(() => {
    if (item?.status === "ARRIVED") {
      router.replace({
        pathname: "/waiting",
        params: { id: item.id },
      });
    }
  }, [item?.id, item?.status, router]);

  const canCancel = item?.status && CANCELABLE_STATUSES.includes(item.status);

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>LIVE BOOKING</Text>
        <Text style={styles.title}>
          {STATUS_LABELS[item?.status as string] ?? "Booking update"}
        </Text>
        <Text style={styles.subtitle}>
          {item?.status === "ASSIGNED"
            ? `${item?.worker_name ?? "Your worker"} is expected in ${
                eta ?? "--"
              } mins.`
            : item?.status === "SCHEDULED"
              ? "Your request is safely booked for the selected time."
              : "We are keeping the booking updated for you."}
        </Text>
      </View>

      <View style={styles.workerCard}>
        <View style={styles.workerHeader}>
          <View>
            <Text style={styles.sectionLabel}>Worker</Text>
            <Text style={styles.workerName}>
              {item?.worker_name ?? "Assigning worker..."}
            </Text>
            <Text style={styles.workerMeta}>
              {item?.worker_phone ?? "Contact will appear after assignment"}
            </Text>
          </View>

          {item?.worker_id && (
            <Pressable
              style={styles.favoriteButton}
              onPress={toggleFavorite}
            >
              <MaterialIcons
                name={favorite ? "favorite" : "favorite-border"}
                size={18}
                color={favorite ? "#dc2626" : "#0f172a"}
              />
            </Pressable>
          )}
        </View>

        {item?.worker_id && (
          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: "/(app)/(screens)/worker-profile",
                params: {
                  workerId: item.worker_id,
                  workerName: item.worker_name,
                  workerPhone: item.worker_phone,
                  workerType: item.type,
                  jobId: item.id,
                },
              })
            }
          >
            <Text style={styles.secondaryButtonText}>View Worker Profile</Text>
          </Pressable>
        )}
      </View>

      {item?.status === "ASSIGNED" && (
        <View style={styles.otpCard}>
          <Text style={styles.sectionLabel}>Arrival OTP</Text>
          <Text style={styles.otpText}>{item?.verification_otp ?? "--"}</Text>
          <Text style={styles.otpHint}>Share this only after your worker arrives.</Text>
        </View>
      )}

      <View style={styles.amountCard}>
        <View>
          <Text style={styles.sectionLabel}>Estimated Amount</Text>
          <Text style={styles.amountHint}>Includes job charge and visit fee</Text>
        </View>
        <Text style={styles.amountValue}>
          Rs {(item?.job_charge ?? 0) + (item?.visit_fee ?? 0)}
        </Text>
      </View>

      <Pressable
        onPress={cancel}
        disabled={!canCancel || loading}
        style={[
          styles.cancelButton,
          (!canCancel || loading) && styles.cancelButtonDisabled,
        ]}
      >
        <Text style={styles.cancelButtonText}>
          {loading
            ? "Cancelling..."
            : canCancel
              ? "Cancel Booking"
              : "Cancellation unavailable now"}
        </Text>
      </Pressable>
    </View>
  );
};

export default memo(LiveBottomSheet);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14,
  },
  heroCard: {
    backgroundColor: "#0f172a",
    borderRadius: 26,
    padding: 20,
  },
  eyebrow: {
    color: "#a3e635",
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 8,
    color: "#cbd5e1",
    lineHeight: 21,
  },
  workerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 14,
  },
  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sectionLabel: {
    color: "#64748b",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 11,
  },
  workerName: {
    marginTop: 6,
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 20,
  },
  workerMeta: {
    marginTop: 4,
    color: "#475569",
    fontWeight: "600",
  },
  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    borderRadius: 16,
    backgroundColor: "#ecfccb",
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#365314",
    fontWeight: "800",
  },
  otpCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  otpText: {
    marginTop: 8,
    fontSize: 34,
    fontWeight: "900",
    color: "#16a34a",
    letterSpacing: 4,
  },
  otpHint: {
    marginTop: 6,
    color: "#64748b",
    textAlign: "center",
  },
  amountCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  amountHint: {
    marginTop: 6,
    color: "#64748b",
  },
  amountValue: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "900",
  },
  cancelButton: {
    borderRadius: 20,
    backgroundColor: "#111827",
    paddingVertical: 18,
    alignItems: "center",
  },
  cancelButtonDisabled: {
    opacity: 0.45,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
