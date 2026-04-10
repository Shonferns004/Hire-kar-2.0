import { supabase } from "@/config/supabase";
import { notifyAssignment } from "@/service/notification";
import { create } from "zustand";

const assignmentNotifiedJobs = new Set<string>();

type Job = {
  id: string;
  status: string;
  type: string;
  created_at: string;
};

type JobState = {
  jobs: Job[];
  channel: any | null;
  setJobs: (jobs: Job[]) => void;
  initRealtime: () => void;
  cleanupRealtime: () => void;
};

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  channel: null,

  setJobs: (jobs) => {
    const uniqueJobs = Array.from(
      new Map(jobs.map((job) => [job.id, job])).values(),
    );

    uniqueJobs.forEach((job) => {
      if (job.status === "ASSIGNED") {
        assignmentNotifiedJobs.add(job.id);
      }
    });

    set({ jobs: uniqueJobs });
  },

  initRealtime: () => {
    if (get().channel) return;

    const channel = supabase
      .channel("jobs-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
        },
        (payload: any) => {
          const currentJobs = get().jobs;

          if (payload.eventType === "INSERT") {
            set({
              jobs: [
                payload.new,
                ...currentJobs.filter((job) => job.id !== payload.new.id),
              ],
            });
          }

          if (payload.eventType === "UPDATE") {
            const previousJob = currentJobs.find(
              (job) => job.id === payload.new.id,
            );
            const alreadyNotified = assignmentNotifiedJobs.has(payload.new.id);

            if (
              payload.new?.status === "ASSIGNED" &&
              previousJob?.status !== "ASSIGNED" &&
              !alreadyNotified
            ) {
              assignmentNotifiedJobs.add(payload.new.id);
              notifyAssignment(payload.new);
            }

            if (payload.new?.status !== "ASSIGNED") {
              assignmentNotifiedJobs.delete(payload.new.id);
            }

            set({
              jobs: previousJob
                ? currentJobs.map((job) =>
                    job.id === payload.new.id ? payload.new : job,
                  )
                : [payload.new, ...currentJobs],
            });
          }

          if (payload.eventType === "DELETE") {
            assignmentNotifiedJobs.delete(payload.old.id);
            set({
              jobs: currentJobs.filter((job) => job.id !== payload.old.id),
            });
          }
        },
      )
      .subscribe((status: any) => {
        console.log("Realtime status:", status);
      });

    set({ channel });
  },

  cleanupRealtime: () => {
    const channel = get().channel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ channel: null });
    }
  },
}));
