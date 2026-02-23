import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  User,
  GraduationCap,
  Gear,
  ChatCircleDots,
  EnvelopeSimple,
  BookOpen,
  SignOut,
  House,
  SquaresFour,
  ClipboardText,
  Plus,
  PencilSimple,
  CheckCircle,
} from "phosphor-react-native";
import { getUserId, supabase } from "@/config/supabase";
import { useRouter } from "expo-router";

export default function Profile() {
  const userId = getUserId();
  const router = useRouter();

  useEffect(() => {
    const getname = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log(data?.session);
    };
    getname();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ alignItems: "center" }}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcQYo77BJRBjjPA1_J-ZhqTxhCPNeAL1zZ3UxdJ3bQ6J596D4p9gAK5GVOUlmYmU5E3po10-G_5wo8ZBrMIZsanYmIJGC8-ovELeyQs_9djooONwNkeiXv5awEfTOUOzMzV8M7bKX_u_jO0NUZPsXtZZKiwj0_Q13lK5qLhwb3EL8RAtB2KvO6Q_i8Wb7eRWKOH4s-0TMXjo2WoCDQY9pUT5dzgLibXq4U1FN0mBngz5K7CgbAg-AwMK2afkVjk6BsK2HO-iD_sxE",
                }}
                style={styles.avatar}
              />

              <TouchableOpacity style={styles.editBadge}>
                <PencilSimple size={14} weight="bold" color="#161b0e" />
              </TouchableOpacity>
            </View>

            <Text style={styles.name}>{}</Text>

            <View style={styles.proBadge}>
              <CheckCircle size={14} weight="fill" color="#a1e633" />
              <Text style={styles.proText}>PRO MEMBER</Text>
            </View>
          </View>
        </View>

        {/* BODY */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          {/* ACCOUNT */}
          <Section title="Account">
            <Row icon={<User size={22} />} label="Personal Information" />
            <Row icon={<Gear size={22} />} label="Account Settings" />
          </Section>

          {/* HELP */}
          <Section title="Get Help">
            <HelpRow
            onPress={() => router.push("/(app)/(screens)/chat")}
              icon={<ChatCircleDots size={26} color="#a1e633" />}
              title="Chat with us"
              desc="Speak with our support team"
              online
            />
            <HelpRow
              icon={<EnvelopeSimple size={26} color="#a1e633" />}
              title="Email Support"
              desc="Response time: ~2 hours"
            />
          </Section>

          {/* LOGOUT */}
          <TouchableOpacity style={styles.logoutBtn}>
            <SignOut size={18} color="#ef4444" />
            <Text style={styles.logoutText}>LOGOUT ACCOUNT</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ---------- COMPONENTS ---------- */

const Section = ({ title, children }: any) => (
  <View style={{ paddingHorizontal: 24, marginTop: 26 }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={{ gap: 12 }}>{children}</View>
  </View>
);

const Row = ({ icon, label }: any) => (
  <TouchableOpacity style={styles.row}>
    <View style={styles.rowLeft}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowText}>{label}</Text>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const HelpRow = ({ icon, title, desc, online,onPress }: any) => (
  <TouchableOpacity style={styles.helpRow} onPress={onPress}>
    <View style={styles.helpIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.helpTitle}>{title}</Text>
        {online && <View style={styles.onlineDot} />}
      </View>
      <Text style={styles.helpDesc}>{desc}</Text>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const NavItem = ({ icon, label, active }: any) => (
  <View style={{ alignItems: "center" }}>
    {icon}
    <Text style={[styles.navText, active && { color: "#a1e633" }]}>
      {label}
    </Text>
  </View>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fcfdfa" },
  wrapper: { flex: 1, alignSelf: "center", width: "100%" },

  header: {
    paddingTop: 40,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderColor: "#e2e8d8",
    backgroundColor: "#fff",
  },

  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#a1e633",
    padding: 4,
    marginBottom: 12,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 48 },

  editBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    backgroundColor: "#a1e633",
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },

  name: { fontSize: 24, fontWeight: "900", marginBottom: 6 },

  proBadge: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(161,230,51,0.15)",
    borderRadius: 999,
    alignItems: "center",
    gap: 6,
  },
  proText: { fontSize: 11, fontWeight: "900" },

  sectionTitle: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "900",
    opacity: 0.4,
    marginBottom: 14,
  },

  row: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8d8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { fontWeight: "700", fontSize: 14 },
  chevron: { fontSize: 20, opacity: 0.3 },

  helpRow: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8d8",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  helpIcon: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(161,230,51,0.15)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  helpTitle: { fontWeight: "700", fontSize: 14 },
  helpDesc: { fontSize: 11, opacity: 0.5 },
  onlineDot: {
    width: 6,
    height: 6,
    backgroundColor: "#22c55e",
    borderRadius: 3,
    marginLeft: 6,
  },

  logoutBtn: {
    marginTop: 26,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 92,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 32,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderTopWidth: 1,
    borderColor: "#e2e8d8",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },

  navText: { fontSize: 9, fontWeight: "700", marginTop: 4, opacity: 0.5 },

  fabWrapper: { marginTop: -38 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#a1e633",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
});
