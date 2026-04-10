import { View, Text, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { supabase } from "@/config/supabase";
import { useLocalSearchParams, router } from "expo-router";

const Searching = () => {
  const { id } = useLocalSearchParams();

  useEffect(() => {
    const jobId = Array.isArray(id) ? id[0] : id;
    if (!jobId) return;

    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const job = payload.new;

          console.log("JOB UPDATE:", job.status);

          if (job.status === "ASSIGNED") {
            router.replace({
              pathname: "/live-job",
              params: { id: job.id },
            });
          }

          if (job.status === "EXPIRED") {
            router.replace("/(app)/(tabs)");
          }
        },
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 20, fontSize: 18, fontWeight: "600" }}>
        Finding a nearby worker...
      </Text>
    </View>
  );
};

export default Searching;
