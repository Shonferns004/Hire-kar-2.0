import { View, ActivityIndicator, StyleSheet } from "react-native";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { rideStyles } from "@/styles/rideStyles";
import LiveTracking from "@/components/book/LiveTracking";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { ensureRealtime, supabase } from "@/config/supabase";
import LiveBottomSheet from "@/components/book/LiveSheet";

const FINAL_STATUSES = [
  "COMPLETED",
  "CANCELLED_BY_USER",
  "CANCELLED_BY_WORKER",
  "AUTO_CANCELLED",
  "EXPIRED",
];

const LiveRideScreen = () => {
  const [jobData, setJobData] = useState<any>(null);
  const [jobCoords, setJobCoords] = useState<any>(null);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const bottomSheetRef = useRef(null);
  const handledFinalState = useRef(false);
  const [loading, setLoading] = useState(true);
  const jobId = Array.isArray(id) ? id[0] : id;
  const snapPoints = useMemo(() => {
    if (jobData?.status === "ASSIGNED") {
      return ["34%", "54%", "78%"];
    }

    if (jobData?.status === "SCHEDULED") {
      return ["30%", "46%", "68%"];
    }

    return ["52%", "52%", "52%"];
  }, [jobData?.status]);

  const hydrateJob = useCallback(
    (job: any) => {
      if (!job) return;

      if (job.status === "ARRIVED" || FINAL_STATUSES.includes(job.status)) {
        router.replace({
          pathname: "/waiting",
          params: { id: job.id },
        });
        return;
      }

      setJobData((prev: any) => ({
        ...prev,
        ...job,
      }));

      if (
        typeof job.worker_lat === "number" &&
        typeof job.worker_lng === "number"
      ) {
        setJobCoords({
          latitude: Number(job.worker_lat),
          longitude: Number(job.worker_lng),
        });
      }
    },
    [router],
  );

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (!data || error) {
        setLoading(false);
        router.replace("/(app)/(tabs)");
        return;
      }

      hydrateJob(data);
      setLoading(false);
    };

    fetchJob();
  }, [hydrateJob, jobId, router]);

  useEffect(() => {
    if (!jobId) return;

    let active = true;
    let channel: any = null;

    const subscribeToJob = async () => {
      await ensureRealtime();
      if (!active) return;

      channel = supabase
        .channel(`job-${jobId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "jobs",
            filter: `id=eq.${jobId}`,
          },
          (payload) => hydrateJob(payload.new),
        )
        .subscribe();
    };

    subscribeToJob();

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [hydrateJob, jobId]);

  useEffect(() => {
    if (!jobData || handledFinalState.current) return;

    if (jobData.status === "ARRIVED") {
      handledFinalState.current = true;
      router.replace({
        pathname: "/waiting",
        params: { id: jobData.id },
      });
    }
  }, [jobData, router]);

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
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enableOverDrag={false}
        enablePanDownToClose={false}
        handleIndicatorStyle={{ backgroundColor: "#e2e8f0" }}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetScrollView
          style={styles.sheetContent}
          contentContainerStyle={styles.sheetContentContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
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
  },
  sheetContentContainer: {
    paddingBottom: 120,
  },
});
