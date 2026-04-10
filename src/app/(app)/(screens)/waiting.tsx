import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ensureRealtime, supabase } from "@/config/supabase";
import Waiting from "@/components/arrivals/Waiting";
import ApprovalModal from "@/components/arrivals/ApprovalModal";
import BookingSuccessModal from "@/components/arrivals/CompletedModal";
import { cancelJob, verifyPrice } from "@/service/api";

const FINAL_STATUSES = [
  "COMPLETED",
  "CANCELLED_BY_USER",
  "CANCELLED_BY_WORKER",
  "AUTO_CANCELLED",
  "REJECTED",
];

export default function FindingWorkerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const handledFinalState = useRef(false);
  const channelRef = useRef<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showWaitingState, setShowWaitingState] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [finalJob, setFinalJob] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);

  const cleanupChannel = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const handleJobState = useCallback((job: any) => {
    if (!job) return;

    setJobData(job);

    if (FINAL_STATUSES.includes(job.status)) {
      if (handledFinalState.current) return;

      handledFinalState.current = true;
      cleanupChannel();
      setFinalJob(job);
      setShowApprovalModal(false);
      setShowWaitingState(false);
      setShowSuccess(true);
      return;
    }

    switch (job.status) {
      case "INSPECTING":
        setShowWaitingState(true);
        setShowApprovalModal(false);
        return;
      case "AWAITING_APPROVAL":
        setShowWaitingState(true);
        setShowApprovalModal(true);
        return;
      case "APPROVED":
      case "IN_PROGRESS":
        setShowWaitingState(true);
        setShowApprovalModal(false);
        return;
      default:
        setShowWaitingState(true);
        setShowApprovalModal(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchInitialState = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        handleJobState(data);
      }
    };

    fetchInitialState();
  }, [handleJobState, id]);

  useEffect(() => {
    let active = true;

    const setup = async () => {
      if (!id) return;

      await ensureRealtime();
      if (!active) return;

      channelRef.current = supabase
        .channel(`job-${id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "jobs",
            filter: `id=eq.${id}`,
          },
          (payload) => handleJobState(payload.new),
        )
        .subscribe();
    };

    setup();

    return () => {
      active = false;
      cleanupChannel();
    };
  }, [handleJobState, id]);

  const onApprove = async (jobId: string) => {
    await verifyPrice(jobId);
    setShowApprovalModal(false);
  };

  const onCancel = async () => {
    await cancelJob(id as string, "CANCELLED_BY_USER");
    setShowApprovalModal(false);
    router.replace("/(app)/(tabs)");
  };

  return (
    <>
      {showWaitingState && <Waiting />}

      {showApprovalModal && (
        <ApprovalModal
          visible={showApprovalModal}
          jobData={jobData}
          onClose={() => onApprove(id as string)}
          onCancel={onCancel}
        />
      )}

      <BookingSuccessModal
        jobData={finalJob}
        visible={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          router.replace("/(app)/(tabs)");
        }}
        onViewDetails={() =>
          router.push({
            pathname: "/(app)/(tabs)/jobs",
            params: { highlight: finalJob?.id },
          })
        }
      />
    </>
  );
}
