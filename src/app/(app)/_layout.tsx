import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View, StyleSheet, StatusBar } from "react-native";
import { supabase } from "@/config/supabase";
import AppSplash from "@/components/SplashScreen";
import { useJobStore } from "@/store/jobStore";
import { scheduleRandomNotification } from "@/service/notification";

SplashScreen.preventAutoHideAsync();

export default function AppLayout() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  const { initRealtime } = useJobStore();

  useEffect(() => {
    // Schedule 5 notifications for today
    scheduleRandomNotification();
  }, []);

  useEffect(() => {
    initRealtime();
  }, []);

  useEffect(() => {
    const init = async () => {
      // artificial delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      await SplashScreen.hideAsync();

      if (session) {
        router.replace("/(app)/(tabs)");
      } else {
        router.replace("/(app)/(auth)");
      }

      setShowSplash(false);
    };

    init();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar backgroundColor="#ccc" barStyle={"dark-content"} />
      {/* Navigation tree MUST always exist */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        {/* <Stack.Screen name="(screens)" /> */}
      </Stack>

      {/* Splash as overlay */}
      {showSplash && (
        <View style={StyleSheet.absoluteFill}>
          <AppSplash />
        </View>
      )}
    </View>
  );
}
