import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const PRIMARY = "#a1e633";
const BG_LIGHT = "#f7f8f6";
const BG_DARK = "#1b2111";
const TEXT_DARK = "#161b0e";

export default function SuccessScreen() {
    const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={TEXT_DARK} />
          </TouchableOpacity>
        </View>

        {/* Center Content */}
        <View style={styles.center}>
          {/* Success Icon */}
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="check" size={48} color={TEXT_DARK} />
            </View>
          </View>

          {/* Illustration */}
          <View style={styles.illustrationWrapper}>
            <View style={styles.illustrationBox}>
              <ImageBackground
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYIT7b4xM7tCt_lyx-FraOCk5SG94TVBy0ovG7LBKFwvqjtCIe_yI1zDHsS95TvL6ObVZV9_jnU97uSeRmzoMaEH6448Sly6c-yYJM8jXp45d5rsKU_q5CLeluxmH3tXIvo7ntAdwg-UqG08ilcPc5xSj2n1sCzwC4f1CErws98DfZg2beC2wyNaxn2G9hmeimqxRqNMONDufLpotaWvXWhgoG5s5Lvct8aRJHt21in4gaR8wTvVPFO3bifQYKtImIUTWyJSHthjM",
                }}
                resizeMode="cover"
                style={styles.illustrationImage}
              />
            </View>
          </View>

          {/* Headline */}
          <Text style={styles.title}>You're all set!</Text>

          {/* Body */}
          <Text style={styles.body}>
            Registration complete. Your journey begins now. Let's explore your
            new dashboard.
          </Text>
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottom}>
          <TouchableOpacity style={styles.cta} onPress={() => router.replace('/(app)/(tabs)')} >
            <Text style={styles.ctaText}>Go to Dashboard</Text>
            <MaterialIcons
              name="arrow-forward"
              size={22}
              color={TEXT_DARK}
            />
          </TouchableOpacity>

          {/* Home Indicator */}
          <View style={styles.homeIndicatorWrap}>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG_LIGHT,
  },
  container: {
    flex: 1,
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
    backgroundColor: BG_LIGHT,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  closeBtn: {
    padding: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconWrapper: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  illustrationWrapper: {
    width: "100%",
    maxWidth: 280,
    marginBottom: 40,
  },
  illustrationBox: {
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: "rgba(161,230,51,0.1)",
    overflow: "hidden",
  },
  illustrationImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: TEXT_DARK,
    textAlign: "center",
    paddingBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(22,27,14,0.7)",
    textAlign: "center",
    maxWidth: 280,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  cta: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_DARK,
  },
  homeIndicatorWrap: {
    marginTop: 32,
    alignItems: "center",
  },
  homeIndicator: {
    width: 128,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(22,27,14,0.1)",
  },
});
