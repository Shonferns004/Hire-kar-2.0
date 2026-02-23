import {
  View,
  Text,
  Animated,
  Easing,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

const PRIMARY = "#a1e633";
const DARK = "#161b0e";
const BG = "#fcfdfa";

const messages = [
  "Finding best matches...",
  "Securing your request...",
  "Finalizing details...",
];

const Waiting = () => {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const roll = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(-120)).current;

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
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Please Wait...</Text>

        <View style={styles.rollContainer}>
          <Animated.View style={{ transform: [{ translateY: roll }] }}>
            {messages.map((m, i) => (
              <Text key={i} style={styles.rollText}>
                {m}
              </Text>
            ))}
          </Animated.View>
        </View>

        <View style={styles.loaderWrap}>
          <Animated.View
            style={[styles.pulseCircle, { transform: [{ scale: pulseScale }] }]}
          />

          <View style={styles.loader}>
            <Animated.View style={{ transform: [{ rotate: spinRotate }] }}>
              <MaterialIcons name="refresh" size={32} color={DARK} />
            </Animated.View>
          </View>
        </View>

        <Text style={styles.subtitle}>
          We are processing your request.
          {"\n"}This won't take long.
        </Text>

        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { transform: [{ translateX: progress }] },
            ]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => {}}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.homeIndicatorWrap}>
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
};

export default Waiting;

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
