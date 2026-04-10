import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { FavoriteWorker, getFavoriteWorkers, toggleFavoriteWorker } from "@/utils/favorites";

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteWorker[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    setRefreshing(true);
    const items = await getFavoriteWorkers();
    setFavorites(items);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const removeFavorite = async (worker: FavoriteWorker) => {
    await toggleFavoriteWorker(worker);
    loadFavorites();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={20} color="#0f172a" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Favorite Workers</Text>
          <Text style={styles.subtitle}>
            Quickly return to workers you trust the most.
          </Text>
        </View>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadFavorites} />
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <MaterialIcons name="favorite-border" size={34} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>
              When you save a worker from a booking, they will appear here.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable
              style={{ flex: 1, gap: 6 }}
              onPress={() =>
                router.push({
                  pathname: "/(app)/(screens)/worker-profile",
                  params: {
                    workerId: item.id,
                    workerName: item.name,
                    workerPhone: item.phone,
                    workerType: item.type,
                  },
                })
              }
            >
              <Text style={styles.cardTitle}>{item.name ?? "Worker"}</Text>
              <Text style={styles.cardMeta}>
                {(item.type ?? "Service").toString().toUpperCase()}
              </Text>
              <Text style={styles.cardMeta}>{item.phone ?? "Phone unavailable"}</Text>
            </Pressable>

            <Pressable
              style={styles.removeButton}
              onPress={() => removeFavorite(item)}
            >
              <MaterialIcons name="delete-outline" size={20} color="#b91c1c" />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 4,
    color: "#64748b",
    lineHeight: 20,
  },
  listContent: {
    padding: 20,
    gap: 14,
    flexGrow: 1,
  },
  emptyCard: {
    flex: 1,
    minHeight: 320,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  cardMeta: {
    color: "#64748b",
    fontWeight: "600",
  },
  removeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
});
