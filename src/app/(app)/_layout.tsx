import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View, StyleSheet, StatusBar } from "react-native";
import { supabase } from "@/config/supabase";
import AppSplash from "@/components/SplashScreen";
import { useJobStore } from "@/store/jobStore";
import { scheduleRandomNotification } from "@/service/notification";
import { useUserStore } from "@/store/userStore";

SplashScreen.preventAutoHideAsync();

export default function AppLayout() {
  const router = useRouter();

  const [showSplash, setShowSplash] = useState(true);

  const { initRealtime } = useJobStore();

  const { setSession, setAuthReady } = useUserStore();

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // artificial splash delay (optional branding)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // get existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setSession(session);

      // run user dependent services
      if (session) {
        initRealtime();

        scheduleRandomNotification();

        router.replace("/(app)/(tabs)");
      } else {
        router.replace("/(app)/(auth)");
      }

      setAuthReady(true);

      await SplashScreen.hideAsync();

      setShowSplash(false);
    };

    initAuth();

    // Listen auth changes (LOGIN / LOGOUT / TOKEN REFRESH)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session) {
        initRealtime();

        router.replace("/(app)/(tabs)");
      } else {
        router.replace("/(app)/(auth)");
      }
    });

    return () => {
      isMounted = false;

      subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar backgroundColor="#ccc" barStyle="dark-content" />

      {/* Navigation tree must exist always */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />

        <Stack.Screen name="(auth)" />
      </Stack>

      {/* Splash Overlay */}

      {showSplash && (
        <View style={StyleSheet.absoluteFillObject}>
          <AppSplash />
        </View>
      )}
    </View>
  );
}
