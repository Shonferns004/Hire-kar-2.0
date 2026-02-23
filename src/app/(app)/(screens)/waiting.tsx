import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ensureRealtime, supabase } from "@/config/supabase";
import Waiting from "@/components/arrivals/Waiting";
import ApprovalModal from "@/components/arrivals/ApprovalModal";
import BookingSuccessModal from "@/components/arrivals/CompletedModal";
import { cancelJob, verifyPrice } from "@/service/api";

const PRIMARY = "#a1e633";
const DARK = "#161b0e";
const BG = "#fcfdfa";

const messages = [
  "Finding best matches...",
  "Securing your request...",
  "Finalizing details...",
];

export default function FindingWorkerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const handledFinalState = useRef(false);
  const channelRef = useRef<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [loadApproval, setLoadApproval] = useState(true);

  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const roll = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(-120)).current;
  const [start, setStart] = useState(false);
  const [showVisit, setShowVisit] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [finalJob, setFinalJob] = useState<any>(null);

  const [jobData, setJobData] = useState<any>(null);

  /* ---------------- ANIMATIONS ---------------- */

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(roll, {
          toValue: -60,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(roll, {
          toValue: -120,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(roll, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(progress, {
        toValue: 260,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spinRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });

  /* ---------------- CHANNEL CLEANUP ---------------- */

  const cleanupChannel = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  /* ---------------- STATE MACHINE ---------------- */

  const handleJobState = (job: any) => {
    if (!job) return;

    setJobData(job);

    /* ---------- TERMINAL STATES (DO NOT NAVIGATE) ---------- */

    if (
      job.status === "COMPLETED" ||
      job.status === "CANCELLED_BY_USER" ||
      job.status === "REJECTED" ||
      job.status === "IN_PROGRESS"
    ) {
      if (handledFinalState.current) return;

      handledFinalState.current = true;

      cleanupChannel(); // stop realtime

      setFinalJob(job);
      setShowApprovalModal(false);
      setLoadApproval(false);
      setShowSuccess(true);
      return;
    }

    /* ---------- NON TERMINAL FLOW ---------- */

    switch (job.status) {
      case "INSPECTING":
        setLoadApproval(true);
        setShowApprovalModal(false);
        return;

      case "AWAITING_APPROVAL":
        setLoadApproval(true);
        setShowApprovalModal(true);
        return;

      case "APPROVED":
        setShowApprovalModal(false);
        return;

      case "IN_PROGRESS":
        // Worker is working → user should stay on waiting screen
        setLoadApproval(true);
        return;
    }
  };
  /* ---------------- INITIAL FETCH (CRITICAL) ---------------- */

  useEffect(() => {
    if (!id) return;

    const fetchInitialState = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        handleJobState(data);
      }
    };

    fetchInitialState();
  }, [id]);

  const wasInspected = Boolean(jobData?.inspection_at);

  /* ---------------- REALTIME SUBSCRIPTION ---------------- */

  useEffect(() => {
    let active = true;

    const setup = async () => {
      if (!id) return;

      // 🔴 THIS IS THE MISSING STEP
      await ensureRealtime();

      if (!active) return;


      channelRef.current = supabase
        .channel(`job-${id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "jobs",
            filter: `id=eq.${id}`,
          },
          (payload) => {
            handleJobState(payload.new);
          },
        )
        .subscribe((status) => {
        });
    };

    setup();

    return () => {
      active = false;
      cleanupChannel();
    };
  }, [id]);

  const onClose = async (id: string) => {
    await verifyPrice(id);
    setShowApprovalModal(false);
  };

  const onCancel = async () => {
    await cancelJob(id as any, "CANCELLED_BY_USER");
    setShowApprovalModal(false);
    setShowSuccess(true);
  };
  /* ---------------- UI ---------------- */

  return (
    <>
      {loadApproval && <Waiting />}

      {showApprovalModal && (
        <ApprovalModal
          visible={showApprovalModal}
          jobData={jobData}
          onClose={() => onClose(id as any)}
          onCancel={onCancel}
        />
      )}

      <BookingSuccessModal
        jobData={finalJob}
        visible={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          router.replace("/(app)/(tabs)");
        }}
        onViewDetails={jobData}
      />
    </>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: DARK,
    textAlign: "center",
  },

  price: {
    fontSize: 42,
    fontWeight: "900",
    color: PRIMARY,
    textAlign: "center",
    marginVertical: 14,
  },

  modalSubtitle: {
    textAlign: "center",
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 22,
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
  },

  rejectBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },

  approveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
  },

  rejectText: {
    fontWeight: "800",
    color: "#444",
  },

  approveText: {
    fontWeight: "900",
    color: DARK,
  },
  content: { alignItems: "center", paddingHorizontal: 32 },
  title: { fontSize: 34, fontWeight: "900", color: DARK, marginBottom: 12 },
  rollContainer: {
    height: 60,
    overflow: "hidden",
    marginBottom: 36,
    justifyContent: "center",
  },
  rollText: {
    height: 60,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    color: PRIMARY,
    textTransform: "uppercase",
  },
  loaderWrap: {
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseCircle: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(161,230,51,0.25)",
  },
  loader: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 28,
    lineHeight: 24,
  },
  progressBar: {
    width: 96,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: {
    width: 60,
    height: 6,
    borderRadius: 6,
    backgroundColor: PRIMARY,
  },
  footer: { width: "100%", paddingHorizontal: 32, paddingBottom: 24 },
  cancelBtn: {
    borderWidth: 2,
    borderColor: "#e2e8d8",
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
  },
  cancelText: { fontSize: 18, fontWeight: "900", color: "#6b7280" },
  homeIndicatorWrap: { paddingBottom: 8, alignItems: "center" },
  homeIndicator: {
    width: 130,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
  },
});
