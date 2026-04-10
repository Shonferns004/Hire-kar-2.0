import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/config/supabase";
import { useUserStore } from "@/store/userStore";

export default function Profile() {
  const router = useRouter();
  const { user } = useUserStore();

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const cards = [
    {
      icon: "favorite-border" as const,
      title: "Favorite Workers",
      subtitle: "Open the workers you have saved for later.",
      onPress: () => router.push("/(app)/(screens)/favorites"),
    },
    {
      icon: "book-online" as const,
      title: "My Bookings",
      subtitle: "Track active, completed, and cancelled bookings.",
      onPress: () => router.push("/(app)/(tabs)/jobs"),
    },
    {
      icon: "support-agent" as const,
      title: "Support Chat",
      subtitle: "Reach us quickly if you need help with a booking.",
      onPress: () => router.push("/(app)/(screens)/chat"),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.phone ?? "H").slice(-1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>HireKar Member</Text>
            </View>
          </View>

          <Text style={styles.name}>{user?.phone ?? "Hire User"}</Text>
          <Text style={styles.subtitle}>
            Manage saved workers, bookings, and support in one place.
          </Text>

          <View style={styles.quickRow}>
            <View style={styles.quickCard}>
              <Text style={styles.quickValue}>24x7</Text>
              <Text style={styles.quickLabel}>Support</Text>
            </View>
            <View style={styles.quickCard}>
              <Text style={styles.quickValue}>Safe</Text>
              <Text style={styles.quickLabel}>Payments</Text>
            </View>
            <View style={styles.quickCard}>
              <Text style={styles.quickValue}>Verified</Text>
              <Text style={styles.quickLabel}>Pros</Text>
            </View>
          </View>
        </View>

        <View style={styles.cards}>
          {cards.map((card) => (
            <Pressable key={card.title} style={styles.card} onPress={card.onPress}>
              <View style={styles.cardIcon}>
                <MaterialIcons name={card.icon} size={24} color="#0f172a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.logoutButton} onPress={signOut}>
          <MaterialIcons name="logout" size={18} color="#dc2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  container: {
    padding: 20,
    gap: 18,
  },
  hero: {
    backgroundColor: "#0f172a",
    borderRadius: 28,
    padding: 22,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#a3e635",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0f172a",
  },
  heroBadge: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: { color: "#cbd5f5", fontSize: 10, fontWeight: "700" },
  name: {
    fontSize: 24,
    fontWeight: "900",
    color: "#f8fafc",
    marginTop: 4,
  },
  subtitle: {
    marginTop: 8,
    color: "#cbd5f5",
    lineHeight: 20,
  },
  quickRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 12,
    marginRight: 10,
  },
  quickValue: { color: "#f8fafc", fontWeight: "800", fontSize: 12 },
  quickLabel: { marginTop: 4, color: "#94a3b8", fontSize: 10 },
  cards: {
    gap: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 18,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  cardSubtitle: {
    marginTop: 4,
    color: "#64748b",
    lineHeight: 18,
  },
  logoutButton: {
    marginTop: 4,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    color: "#dc2626",
    fontWeight: "800",
  },
});
