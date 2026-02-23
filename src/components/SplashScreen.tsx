import { useJobStore } from "@/store/jobStore";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { getJobDetails } from "@/service/api";

const { width } = Dimensions.get("window");

export default function AppSplash() {
  const { setJobs } = useJobStore();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await getJobDetails();
        setJobs(res?.jobs || []);
      } catch (e) {
        setJobs([]);
      }
    };
    fetchJobs();
  }, []);
  return (
    <View style={styles.container}>
      {/* Ripple layers */}
      <View style={[styles.ripple, styles.ripple1]} />
      <View style={[styles.ripple, styles.ripple2]} />
      <View style={[styles.ripple, styles.ripple3]} />
      <View style={[styles.ripple, styles.ripple4]} />

      {/* Center Content */}
      <View style={styles.center}>
        {/* Glow */}
        <View style={styles.glowOuter} />
        <View style={styles.glowInner} />

        {/* Text */}
        <Text style={styles.title}>HiRe KAR</Text>
        <Text style={styles.subtitle}>GET WORK DONE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a3e635",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  ripple: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(21,24,17,0.12)",
    borderRadius: 9999,
  },

  ripple1: {
    width: width * 1.8,
    height: width * 1.8,
  },
  ripple2: {
    width: width * 1.4,
    height: width * 1.4,
  },
  ripple3: {
    width: width * 1.0,
    height: width * 1.0,
  },
  ripple4: {
    width: width * 0.6,
    height: width * 0.6,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
  },

  glowOuter: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  glowInner: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(21,24,17,0.08)",
  },

  title: {
    marginTop: 24,
    fontSize: 52,
    fontWeight: "900",
    color: "#151811",
    letterSpacing: -2,
  },

  subtitle: {
    fontSize: 16,
    letterSpacing: 4,
    fontWeight: "700",
    color: "rgba(21,24,17,0.8)",
    marginTop: 6,
  },
});
