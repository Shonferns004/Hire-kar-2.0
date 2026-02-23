import React, { useMemo } from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BookOpenTextIcon,
  UserCircleDashedIcon,
  HouseLineIcon,
  ApplePodcastsLogoIcon,
  BookIcon,
} from "phosphor-react-native";
import { useJobStore } from "@/store/jobStore";

const { height: screenHeight } = Dimensions.get("window");

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { jobs } = useJobStore();

  /* ---------------- ONGOING JOB BADGE ---------------- */
  const hasOngoingBooking = jobs.some((job) =>
    [
      "IN_PROGRESS",
      "SEARCHING_FOR_WORKER",
      "ARRIVED",
      "AWAITING_APPROVAL",
      "ASSIGNED",
    ].includes(job.status),
  );

  /* ---------------- RESPONSIVE TAB HEIGHT ----------------
     8.5% of screen height is a very stable ratio for mobile nav bars
  ------------------------------------------------------- */

  const baseTabHeight = screenHeight * 0.085;

  // CRITICAL → clamp or large phones become ridiculous
  const TAB_HEIGHT = useMemo(() => {
    const min = 56;
    const max = 82;

    const clamped = Math.min(Math.max(baseTabHeight, min), max);

    return clamped + insets.bottom;
  }, [insets.bottom]);

  /* ---------------- ICON SIZE SCALES WITH TAB ---------------- */

  const ICON_SIZE = useMemo(() => {
    const size = TAB_HEIGHT * 0.45;
    return Math.min(Math.max(size, 30), 34);
  }, [TAB_HEIGHT]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        freezeOnBlur: true,
        tabBarActiveTintColor: "#a1e633",
        tabBarInactiveTintColor: "#111",

        tabBarStyle: {
          height: TAB_HEIGHT,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: "#e6e6e6",
          backgroundColor: "#fff",
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <HouseLineIcon weight="fill" size={ICON_SIZE} color={color} />
            ) : (
              <HouseLineIcon size={ICON_SIZE} color={color} />
            ),
        }}
      />

      {/* DISCOVER */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <ApplePodcastsLogoIcon
                weight="fill"
                size={ICON_SIZE}
                color={color}
              />
            ) : (
              <ApplePodcastsLogoIcon size={ICON_SIZE} color={color} />
            ),
        }}
      />

      {/* JOBS */}
      <Tabs.Screen
        name="jobs"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: "relative" }}>
              {focused ? (
                <BookOpenTextIcon
                  weight="fill"
                  size={ICON_SIZE}
                  color={color}
                />
              ) : (
                <BookIcon size={ICON_SIZE} color={color} />
              )}

              {hasOngoingBooking && <View style={styles.badge} />}
            </View>
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <UserCircleDashedIcon
                weight="fill"
                size={ICON_SIZE}
                color={color}
              />
            ) : (
              <UserCircleDashedIcon size={ICON_SIZE} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -2,
    right: -6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ff3b30",
  },
});
