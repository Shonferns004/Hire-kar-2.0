import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

type Level = "small" | "medium" | "large";

export default function TaskDifficultyScreen() {
  const [selected, setSelected] = useState<Level>("medium");
  const { location: parsedLoc, workerType } = useLocalSearchParams();
  const location = parsedLoc ? JSON.parse(parsedLoc as string) : null;

  const router = useRouter();

  const goToBookingScreen = () => {
    router.replace({
      pathname: "/(app)/(screens)/book",
      params: {
        location: JSON.stringify(location),
        workerType,
        selected,
      },
    });
  };

  const Card = ({ id, title, desc, icon, iconColor, iconBg, popular }: any) => {
    const active = selected === id;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setSelected(id)}
        style={[styles.card, active && styles.selectedCard]}
      >
        {/* icon */}
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={26} color={iconColor} />
        </View>

        {/* text */}
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{desc}</Text>
        </View>

        {popular && (
          <View style={styles.popular}>
            <Text style={styles.popularText}>POPULAR</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.phone}>
      <StatusBar translucent barStyle={"dark-content"} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.back}>
            <MaterialIcons name="chevron-left" size={26} color="#475569" />
          </TouchableOpacity>

          <Text style={styles.title}>Select Task Difficulty</Text>
        </View>

        <Text style={styles.subtitle}>
          Estimate how much effort your job requires. The worker will confirm
          the final price after inspection.
        </Text>
      </View>

      {/* CARDS */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Card
          id="small"
          title="Small"
          desc="Small task, under 30 minutes. Minimal tools or effort."
          price={25}
          icon="eco"
          iconColor="#16a34a"
          iconBg="#ecfdf5"
        />

        <Card
          id="medium"
          title="Medium"
          desc="Standard job requiring some effort or basic tools."
          price={45}
          icon="fitness-center"
          iconColor="#a3e635"
          iconBg="rgba(163,230,53,0.2)"
          popular
        />

        <Card
          id="large"
          title="Large"
          desc="Physically demanding or time-consuming work."
          price={75}
          icon="construction"
          iconColor="#ea580c"
          iconBg="#fff7ed"
        />
      </ScrollView>

      {/* BOTTOM PANEL */}
      <View style={styles.bottom}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.estimate}>
              The worker will inspect the job on arrival and confirm the final
              price before starting.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={goToBookingScreen}
          style={styles.continueBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.continueText}>Continue</Text>
          <MaterialIcons name="chevron-right" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.homeBar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  phone: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: StatusBar.currentHeight,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
    marginTop: 15,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },

  back: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  steps: {
    flexDirection: "row",
    gap: 8,
  },

  stepActive: {
    width: 32,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#a3e635",
  },

  stepInactive: {
    width: 32,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 0,
    marginLeft: 10,
  },

  subtitle: {
    fontSize: 13,
    color: "#64748b",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    marginBottom: 16,
    backgroundColor: "#fff",
  },

  selectedCard: {
    borderColor: "#a3e635",
    backgroundColor: "rgba(163,230,53,0.06)",
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  cardDesc: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },

  price: {
    fontWeight: "700",
    color: "#a3e635",
    fontSize: 16,
  },

  base: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "700",
    letterSpacing: 1,
  },

  popular: {
    position: "absolute",
    top: -10,
    right: 0,
    backgroundColor: "#a3e635",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  popularText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
  },

  bottom: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#fff",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  estimate: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "700",
    lineHeight: 18,
    letterSpacing: 2,
  },

  total: {
    fontSize: 26,
    fontWeight: "700",
  },

  breakdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  breakdownText: {
    color: "#a3e635",
    fontSize: 14,
    fontWeight: "600",
  },

  continueBtn: {
    backgroundColor: "black",
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },

  continueText: {
    fontWeight: "700",
    fontSize: 16,
    color: "white",
  },

  homeBar: {
    width: 130,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginTop: 24,
  },
});
