import { supabase } from "@/config/supabase";
import { create } from "zustand";

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
    // 🔒 Always deduplicate when setting initial jobs
    const uniqueJobs = Array.from(
      new Map(jobs.map(job => [job.id, job])).values()
    );
    set({ jobs: uniqueJobs });
  },

  initRealtime: () => {
    // 🛑 Prevent multiple subscriptions
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
                ...currentJobs.filter(
                  job => job.id !== payload.new.id
                ),
              ],
            });
          }

          if (payload.eventType === "UPDATE") {
            set({
              jobs: currentJobs.map(job =>
                job.id === payload.new.id
                  ? payload.new
                  : job
              ),
            });
          }

          if (payload.eventType === "DELETE") {
            set({
              jobs: currentJobs.filter(
                job => job.id !== payload.old.id
              ),
            });
          }
        }
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