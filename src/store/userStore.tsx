import { create } from "zustand";

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
}

export const useUserStore = create<UserStoreProps>((set) => ({
  location: null,
  outOfRange: false,
  setOutOfRange: (data) => set({ outOfRange: data }),
  setLocation: (data) => set({ location: data }),

  clearData: () =>
    set({
      location: null,
      outOfRange: false,
    }),
}));
