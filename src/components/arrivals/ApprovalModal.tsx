import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import React from "react";

interface Props {
  jobData: any;
  visible: boolean;
  onClose: () => void;
  onCancel: () => void;
}
const PRIMARY = "#a1e633";
const DARK = "#161b0e";
const BG = "#fcfdfa";

const ApprovalModal = ({ jobData, onClose, onCancel, visible }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Final Price</Text>

          <Text style={styles.price}>₹{jobData?.final_total ?? 0}</Text>

          <Text style={styles.modalSubtitle}>
            The worker has inspected the job and provided the final cost. Do you
            want to continue?
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={onCancel}>
              <Text style={styles.rejectText}>Cancel Job</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.approveBtn} onPress={onClose}>
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ApprovalModal;

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
