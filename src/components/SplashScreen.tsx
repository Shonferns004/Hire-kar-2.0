import { useJobStore } from "@/store/jobStore";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { getJobDetails } from "@/service/api";

const { width } = Dimensions.get("window");

const THEME_BG = "#a4db5d";
const INK = "#151811";

function AnimatedRipple({ size, delay }: { size: number; delay: number }) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.22);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.05, {
            duration: 1800,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(0.92, {
            duration: 1800,
            easing: Easing.inOut(Easing.cubic),
          }),
        ),
        -1,
        false,
      ),
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.1, { duration: 1800 }),
          withTiming(0.22, { duration: 1800 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.ripple, { width: size, height: size }, animatedStyle]}
    />
  );
}

export default function AppSplash() {
  const { setJobs } = useJobStore();
  const logoFloat = useSharedValue(0);
  const glowPulse = useSharedValue(0.85);

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
  }, [setJobs]);

  useEffect(() => {
    logoFloat.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );

    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.88, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [glowPulse, logoFloat]);

  const centerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoFloat.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowPulse.value }],
  }));

  return (
    <View style={styles.container}>
      <AnimatedRipple size={width * 1.8} delay={0} />
      <AnimatedRipple size={width * 1.4} delay={220} />
      <AnimatedRipple size={width * 1.0} delay={440} />
      <AnimatedRipple size={width * 0.6} delay={660} />

      <Animated.View
        style={[styles.center, centerAnimatedStyle]}
        entering={FadeIn.duration(450)}
      >
        <Animated.View style={[styles.glowOuter, glowAnimatedStyle]} />
        <Animated.View style={[styles.glowInner, glowAnimatedStyle]} />

        <Animated.Text
          entering={FadeIn.delay(150).duration(400)}
          style={styles.title}
        >
          HireKar
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(320).duration(400)}
          style={styles.subtitle}
        >
          GET WORK DONE
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_BG,
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
    color: INK,
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
