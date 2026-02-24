import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";

type CustomLocation = {
  latitude: number;
  longitude: number;
  address: string;
} | null;

interface UserStoreProps {
  location: CustomLocation;
  outOfRange: boolean;
  setOutOfRange: (data: boolean) => void;
  setLocation: (data: CustomLocation) => void;
  clearData: () => void;
  session: Session | null;

  user: User | null;

  authReady: boolean;

  setSession: (session: Session | null) => void;

  setAuthReady: (ready: boolean) => void;
}

export const useUserStore = create<UserStoreProps>((set) => ({
  location: null,
  outOfRange: false,
  setOutOfRange: (data) => set({ outOfRange: data }),
  setLocation: (data) => set({ location: data }),

  session: null,

  user: null,

  authReady: false,

  setSession: (session) =>
    set({
      session,

      user: session?.user ?? null,
    }),

  setAuthReady: (ready) =>
    set({
      authReady: ready,
    }),

  clearData: () =>
    set({
      location: null,
      outOfRange: false,
    }),
}));
