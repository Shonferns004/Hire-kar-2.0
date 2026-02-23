import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check } from "phosphor-react-native";

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
  /* ---------------- SETTLEMENT CALCULATION ---------------- */

  const getSettlement = () => {
    if (!jobData) return null;

    // Job completed
    if (jobData.status === "IN_PROGRESS") {
      return {
        label: "TOTAL AMOUNT",
        amount: jobData.final_total,
        description: "The service has been started sucessfully.",
      };
    }

    // Cancelled after inspection
    if (
      jobData.status === "CANCELLED_BY_USER" &&
      jobData.inspection_at !== null
    ) {
      return {
        label: "VISIT FEES",
        amount: jobData.visit_fee,
        description:
          "The job was cancelled after inspection. A visit fee was applied.",
      };
    }

    // Cancelled before inspection
    return {
      label: "NO CHARGES",
      amount: 0,
      description: "The booking was cancelled before inspection.",
    };
  };

  const settlement = getSettlement();

  /* ---------------- RENDER ---------------- */

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
            {/* CENTER CONTENT */}
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
                <Text style={styles.cardAmount}>₹{settlement.amount}</Text>
              </View>
            </View>

            {/* BOTTOM ACTIONS */}
            <View style={styles.bottom}>
              <Pressable style={styles.primaryBtn} onPress={onClose}>
                <Text style={styles.primaryText}>GO TO DASHBOARD</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryBtn}
                onPress={() => onViewDetails?.(jobData)}
              >
                <Text style={styles.secondaryText}>VIEW DETAILS</Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/* ---------------- STYLES ---------------- */

const PRIMARY = "#a1e633";
const DARK = "#161b0e";
const BG = "#fcfdfa";
const BORDER = "#e2e8d8";

const styles = StyleSheet.create({
  /* Screen */
  overlay: {
    flex: 1,
    backgroundColor: BG,
  },

  /* Loader */
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Center content */
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  /* Title */
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: DARK,
    textAlign: "center",
    marginBottom: 24,
  },

  /* Icon */
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

  /* Description */
  description: {
    fontSize: 16,
    color: "rgba(22,27,14,0.65)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 300,
  },

  /* Amount card */
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

  /* Bottom buttons */
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: BG,
  },

  primaryBtn: {
    width: "100%",
    backgroundColor: "#000",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
  },

  secondaryBtn: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
  },

  secondaryText: {
    fontSize: 17,
    fontWeight: "800",
    color: DARK,
  },
});
