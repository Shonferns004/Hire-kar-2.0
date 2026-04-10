import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check } from "phosphor-react-native";
import { router } from "expo-router";
import { submitWorkerRating } from "@/service/api";
import StarRatingInput from "@/components/common/StarRatingInput";

type Props = {
  jobData: any;
  visible: boolean;
  onClose: () => void;
  onViewDetails?: (job: any) => void;
};

export default function BookingSuccessModal({
  jobData,
  visible,
  onClose,
  onViewDetails,
}: Props) {
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const settlement = useMemo(() => {
    if (!jobData) return null;

    if (jobData.status === "COMPLETED") {
      return {
        label: "TOTAL PAID",
        amount: jobData.final_total ?? jobData.estimated_total ?? 0,
        description: "The service was completed successfully.",
      };
    }

    if (
      jobData.status === "CANCELLED_BY_USER" &&
      jobData.inspection_at !== null
    ) {
      return {
        label: "VISIT FEE",
        amount: jobData.visit_fee ?? 0,
        description:
          "The booking was cancelled after inspection, so a visit fee was applied.",
      };
    }

    return {
      label: "NO CHARGES",
      amount: 0,
      description: "The booking ended before any payable work began.",
    };
  }, [jobData]);

  const canRateWorker = jobData?.status === "COMPLETED" && !!jobData?.worker_id;

  const handleSubmitRating = async () => {
    if (!jobData?.id || rating < 1) {
      Alert.alert("Add a rating", "Please choose at least one star.");
      return;
    }

    try {
      setSubmitting(true);
      await submitWorkerRating(jobData.id, rating);
      setHasSubmitted(true);
      Alert.alert("Thanks", "Your rating has been saved.");
    } catch (error: any) {
      Alert.alert(
        "Rating failed",
        error?.response?.data?.message || "Please try again in a moment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.overlay}>
        {!settlement ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#a1e633" />
          </View>
        ) : (
          <>
            <View style={styles.content}>
              <Text style={styles.title}>Booking Finished</Text>

              <View style={styles.iconWrapper}>
                <View style={styles.iconGlow} />
                <View style={styles.iconCircle}>
                  <Check size={58} color="#161b0e" weight="bold" />
                </View>
              </View>

              <Text style={styles.description}>{settlement.description}</Text>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>{settlement.label}</Text>
                <Text style={styles.cardAmount}>Rs {settlement.amount}</Text>
              </View>

              {canRateWorker && (
                <View style={styles.ratingCard}>
                  <Text style={styles.ratingTitle}>
                    {hasSubmitted ? "Rating Submitted" : "Rate Your Worker"}
                  </Text>
                  <Text style={styles.ratingSubtitle}>
                    Your feedback helps us improve future bookings.
                  </Text>
                  <StarRatingInput
                    value={rating}
                    onChange={setRating}
                    size={34}
                  />
                  {!hasSubmitted && (
                    <Pressable
                      style={[
                        styles.inlineButton,
                        (submitting || rating < 1) && styles.inlineButtonDisabled,
                      ]}
                      onPress={handleSubmitRating}
                      disabled={submitting || rating < 1}
                    >
                      <Text style={styles.inlineButtonText}>
                        {submitting ? "Saving..." : "Submit Rating"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

            <View style={styles.bottom}>
              {jobData?.worker_id && (
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/(screens)/worker-profile",
                      params: {
                        workerId: jobData.worker_id,
                        jobId: jobData.id,
                        workerName: jobData.worker_name,
                        workerPhone: jobData.worker_phone,
                        workerType: jobData.type,
                      },
                    })
                  }
                >
                  <Text style={styles.secondaryText}>VIEW WORKER</Text>
                </Pressable>
              )}

              <Pressable style={styles.primaryBtn} onPress={onClose}>
                <Text style={styles.primaryText}>GO TO DASHBOARD</Text>
              </Pressable>

              <Pressable
                style={styles.ghostBtn}
                onPress={() => onViewDetails?.(jobData)}
              >
                <Text style={styles.ghostText}>VIEW DETAILS</Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const PRIMARY = "#a1e633";
const DARK = "#161b0e";
const BG = "#fcfdfa";
const BORDER = "#e2e8d8";

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: BG,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: DARK,
    textAlign: "center",
    marginBottom: 24,
  },
  iconWrapper: {
    marginBottom: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  iconGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    backgroundColor: "rgba(161,230,51,0.18)",
    borderRadius: 999,
  },
  iconCircle: {
    width: 110,
    height: 110,
    backgroundColor: PRIMARY,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  description: {
    fontSize: 16,
    color: "rgba(22,27,14,0.65)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 300,
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 24,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "rgba(22,27,14,0.45)",
    marginBottom: 8,
  },
  cardAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: DARK,
  },
  ratingCard: {
    width: "100%",
    marginTop: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: DARK,
    textAlign: "center",
  },
  ratingSubtitle: {
    textAlign: "center",
    color: "#64748b",
    lineHeight: 20,
  },
  inlineButton: {
    marginTop: 8,
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  inlineButtonDisabled: {
    opacity: 0.5,
  },
  inlineButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 10,
    gap: 12,
    backgroundColor: BG,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#000",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
  },
  primaryText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
  },
  secondaryBtn: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#cae58c",
    backgroundColor: "#f7fce8",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
  },
  secondaryText: {
    fontSize: 17,
    fontWeight: "800",
    color: DARK,
  },
  ghostBtn: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
  },
  ghostText: {
    fontSize: 17,
    fontWeight: "800",
    color: DARK,
  },
});
