import { View, Text, ActivityIndicator, Alert, StyleSheet } from "react-native";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { screenHeight } from "@/utils/Constants";
import { rideStyles } from "@/styles/rideStyles";
import LiveTracking from "@/components/book/LiveTracking";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { supabase } from "@/config/supabase";
import LiveBottomSheet from "@/components/book/LiveSheet";

const androidHeight = [screenHeight * 0.5, screenHeight * 0.3];

const LiveRideScreen = () => {
  const [jobData, setJobData] = useState<any>(null);
  const [jobCoords, setJobCoords] = useState<any>(null);
  const { id } = useLocalSearchParams();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["35%", "35%"], []);
  const router = useRouter();
  const [mapHeight, setMapHeight] = useState(snapPoints[0]);
  const [loading, setLoading] = useState(true);
  const handledFinalState = useRef(false);

  const handleSheetChanges = useCallback((index: number) => {
    let height = screenHeight * 0.8;
    if (index == 1) {
      height = screenHeight * 0.5;
    }
    setMapHeight(height as any);
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchJob = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (!data || error) {
        setLoading(false);
        router.replace("/(app)/(tabs)");
        return;
      }

      setJobData(data);

      if (
        typeof data.worker_lat === "number" &&
        typeof data.worker_lng === "number"
      ) {
        setJobCoords({
          latitude: data.worker_lat,
          longitude: data.worker_lng,
        });
      }

      setLoading(false);
    };

    fetchJob();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`job-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (!payload.new) return;
          const job = payload.new as any;
          setJobData(job);

          if (!handledFinalState.current) {
            if (job.status === "COMPLETED") {
              handledFinalState.current = true;
              Alert.alert("Job Completed");
              router.replace("/(app)/(tabs)");
            }

            if (job.status === "EXPIRED" || job.status === "CANCELLED") {
              handledFinalState.current = true;
              Alert.alert("Job ended");
              router.replace("/(app)/(tabs)");
            }
          }

          if (job.worker_lat && job.worker_lng) {
            setJobCoords({
              latitude: job.worker_lat,
              longitude: job.worker_lng,
            });
          }
        },
      )
      .subscribe();

    // ✅ CLEANUP (synchronous wrapper)
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <View style={rideStyles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={rideStyles.container}>
      {jobData?.destination && (
        <LiveTracking
          status={jobData.status}
          destination={jobData.destination}
          worker={jobCoords}
        />
      )}

      <BottomSheet
        onChange={handleSheetChanges}
        ref={bottomSheetRef}
        index={0}
        snapPoints={jobData.status === "ASSIGNED" ? ["40%", "40%"] : snapPoints}
        enableDynamicSizing={false}
        enableOverDrag={false}
        handleIndicatorStyle={{ backgroundColor: "#e2e8f0" }}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetScrollView style={styles.sheetContent}>
          <LiveBottomSheet item={jobData} />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
};

export default memo(LiveRideScreen);

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: "#fff",
  },
  sheetContent: {
    paddingHorizontal: 12,
    paddingBottom: 120,
  },
});
