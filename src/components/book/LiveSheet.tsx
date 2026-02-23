import React, { FC, memo, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { screenHeight } from "@/utils/Constants";
import { useRouter } from "expo-router";
import { calculateArrivalETA } from "@/utils/eta";
import { calculateDistance } from "@/utils/mapUtils";
import { cancelJob } from "@/service/api";

const PRIMARY = "#a3e635";

const androidHeight = [screenHeight * 0.4, screenHeight * 0.3];
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
  worker_lat: number;
  worker_lng: number;
}

const STATUS_LABELS: Record<string, string> = {
  SEARCHING_FOR_WORKER: "Finding worker...",
  ASSIGNED: "Worker assigned",
  ENROUTE: "Worker on the way",
  ARRIVED: "Worker arrived",
  INSPECTING: "Inspection in progress",
  PRICE_SUBMITTED: "Waiting for approval",
  APPROVED: "Work starting",
  IN_PROGRESS: "Work in progress",
  COMPLETED: "Job completed",
  CANCELLED: "Job cancelled",
};
const LiveBottomSheet: FC<{ item: JobItems }> = ({ item }) => {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const [eta, setEta] = useState<number | null>(null);

  const cancel = async () => {
    try {
      setLoading(true);
      await cancelJob(item?.id);
      router.replace("/(app)/(tabs)");
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!item?.worker_lat || !item?.destination?.latitude) return;

    const distance = calculateDistance(
      item.destination.latitude,
      item.destination.longitude,
      item.worker_lat,
      item.worker_lng,
    );

    const etaMin = calculateArrivalETA(distance);

    setEta(etaMin);
  }, [item?.worker_lat, item?.worker_lng]);

  useEffect(() => {
    if (item?.status === "ARRIVED") {
      router.replace({
        pathname: "/waiting",
        params: {
          id: item?.id,
        },
      });
    }
  }, [item?.status]);
  return (
    <View style={styles.bottomSheet}>
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>
            {STATUS_LABELS[item?.status as any] ?? "Updating..."}
          </Text>
          {item?.status == "ASSIGNED" ? (
            <Text style={styles.subtitle}>
              {item?.worker_name} is arriving in {eta} mins
            </Text>
          ) : (
            <Text style={styles.subtitle}>Searching for a worker...</Text>
          )}
        </View>

        <View style={{ alignItems: "flex-end" }}>
          {item?.status == "ASSIGNED" && (
            <>
              <View style={styles.phoneRow}>
                <MaterialIcons name="call" size={16} color={PRIMARY} />
                <Text style={styles.phoneText}>{item.worker_phone}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Overview + OTP */}
      {item?.status == "ASSIGNED" && (
        <View style={styles.gridRow}>
          <View style={[styles.card, styles.otpCard]}>
            <Text style={styles.cardLabel}>OTP CODE</Text>
            <Text style={styles.otp}>{item?.verification_otp}</Text>
            <Text style={styles.otpNote}>SHARE WITH WORKER</Text>
          </View>
        </View>
      )}

      {/* Total */}
      <View style={styles.totalCard}>
        <View>
          <Text style={styles.cardLabel}>ESTIMATED AMOUNT</Text>
          <Text style={styles.feeText}>Visit fees included</Text>
        </View>
        <Text style={styles.totalAmount}>
          $ {item?.job_charge + item?.visit_fee}
        </Text>
      </View>

      {/* Cancel */}
      <TouchableOpacity onPress={cancel} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>Cancel Request</Text>
      </TouchableOpacity>

      <View style={styles.bottomIndicator} />
    </View>
  );
};

export default memo(LiveBottomSheet);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
  },
  profileWrapper: {
    position: "absolute",
    top: "28%",
    alignSelf: "center",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#fff",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: PRIMARY,
    borderRadius: 20,
    padding: 4,
  },
  nameCard: {
    marginTop: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  actionRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  iconButton: {
    height: 48,
    width: 48,
    backgroundColor: "#fff",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  callButton: {
    height: 48,
    width: 48,
    backgroundColor: PRIMARY,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSheet: {
    // marginTop: "auto",
    // backgroundColor: "#fff",
    paddingTop: 5,

    paddingHorizontal: 18,
  },
  handle: {
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    borderRadius: 4,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  phoneText: {
    fontWeight: "700",
    color: PRIMARY,
    marginLeft: 4,
  },
  contactLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
  },
  gridRow: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 8,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  bookingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentText: {
    fontSize: 11,
    color: "#64748b",
  },
  otpCard: {
    alignItems: "center",
    justifyContent: "center",
  },
  otp: {
    fontSize: 32,
    fontWeight: "700",
    color: PRIMARY,
    letterSpacing: 4,
  },
  otpNote: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 6,
  },
  addressCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  locationIcon: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  feeText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "700",
  },
  cancelBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "black",
  },
  cancelText: {
    fontWeight: "700",
    color: "white",
  },
  bottomIndicator: {
    width: 120,
    height: 4,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    borderRadius: 4,
    marginVertical: 20,
  },
});
