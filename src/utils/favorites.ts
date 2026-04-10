import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "hire.favorite-workers";

export type FavoriteWorker = {
  id: string;
  name?: string;
  phone?: string;
  type?: string;
  rating?: number;
  completedJobs?: number;
};

export const getFavoriteWorkers = async (): Promise<FavoriteWorker[]> => {
  const rawValue = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const isFavoriteWorker = async (workerId: string) => {
  const favorites = await getFavoriteWorkers();
  return favorites.some((worker) => worker.id === workerId);
};

export const toggleFavoriteWorker = async (worker: FavoriteWorker) => {
  const favorites = await getFavoriteWorkers();
  const exists = favorites.some((item) => item.id === worker.id);

  const nextFavorites = exists
    ? favorites.filter((item) => item.id !== worker.id)
    : [worker, ...favorites.filter((item) => item.id !== worker.id)];

  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites));

  return {
    isFavorite: !exists,
    favorites: nextFavorites,
  };
};
