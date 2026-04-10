import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { getWorkerProfile, getWorkerRatings } from "@/service/api";
import {
  isFavoriteWorker,
  toggleFavoriteWorker,
} from "@/utils/favorites";

export default function WorkerProfileScreen() {
  const { workerId, workerName, workerPhone, workerType } = useLocalSearchParams();
  const [worker, setWorker] = useState<any>(null);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const resolvedWorkerId = Array.isArray(workerId) ? workerId[0] : workerId;
  const reviewsCount = recentReviews.length > 0
    ? recentReviews.length
    : (worker?.ratings_count ?? 0);

  useEffect(() => {
    const load = async () => {
      if (!resolvedWorkerId) {
        setLoading(false);
        return;
      }

      try {
        const [profile, ratingsData, currentFavorite] = await Promise.all([
          getWorkerProfile(resolvedWorkerId),
          getWorkerRatings(resolvedWorkerId),
          isFavoriteWorker(resolvedWorkerId),
        ]);

        setWorker(profile);
        setRecentReviews(ratingsData?.ratings ?? []);
        setFavorite(currentFavorite);
      } catch {
        setWorker({
          id: resolvedWorkerId,
          name: Array.isArray(workerName) ? workerName[0] : workerName,
          phone: Array.isArray(workerPhone) ? workerPhone[0] : workerPhone,
          service_type: Array.isArray(workerType) ? workerType[0] : workerType,
          average_rating: 0,
          ratings_count: 0,
          completed_jobs: 0,
        });
        setRecentReviews([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [resolvedWorkerId, workerName, workerPhone, workerType]);

  const stats = useMemo(() => {
    if (!worker) return [];

    return [
      {
        label: "Rating",
        value: worker.average_rating
          ? `${worker.average_rating} / 10`
          : "New",
      },
      {
        label: "Reviews",
        value: `${worker.ratings_count ?? 0}`,
      },
      {
        label: "Completed Jobs",
        value: `${worker.completed_jobs ?? 0}`,
      },
      {
        label: "Skill Points",
        value: `${worker.skill_points ?? 0}`,
      },
    ];
  }, [worker]);

  const onToggleFavorite = async () => {
    if (!worker?.id) return;

    const result = await toggleFavoriteWorker({
      id: worker.id,
      name: worker.name,
      phone: worker.phone,
      type: worker.service_type,
      rating: worker.average_rating,
      completedJobs: worker.completed_jobs,
    });

    setFavorite(result.isFavorite);
    Alert.alert(
      result.isFavorite ? "Saved to favorites" : "Removed from favorites",
      result.isFavorite
        ? `${worker.name ?? "This worker"} has been added to your favorites.`
        : `${worker.name ?? "This worker"} was removed from your favorites.`,
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#a1e633" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color="#0f172a" />
          </Pressable>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(worker?.name ?? "W").slice(0, 1).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.name}>{worker?.name ?? "Worker"}</Text>
          <Text style={styles.type}>
            {(worker?.service_type ?? "General Service").toString().toUpperCase()}
          </Text>

          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <MaterialIcons name="star" size={16} color="#f59e0b" />
              <Text style={styles.pillText}>
                {worker?.average_rating
                  ? `${worker.average_rating} (${reviewsCount})`
                  : "No ratings yet"}
              </Text>
            </View>
            <View style={styles.pill}>
              <MaterialIcons name="call" size={16} color="#16a34a" />
              <Text style={styles.pillText}>{worker?.phone ?? "Not shared"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.primaryButton} onPress={onToggleFavorite}>
            <MaterialIcons
              name={favorite ? "favorite" : "favorite-border"}
              size={18}
              color="#fff"
            />
            <Text style={styles.primaryButtonText}>
              {favorite ? "Saved to Favorites" : "Add to Favorites"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Ratings</Text>
        <View style={styles.noteCard}>
          {recentReviews.length > 0 ? (
            recentReviews.map((review: any, index: number) => (
              <View
                key={review.id ?? `${review.job_id}-${index}`}
                style={styles.reviewRow}
              >
                <View style={styles.reviewCopy}>
                  <View style={styles.reviewStars}>
                    <MaterialIcons name="star" size={16} color="#f59e0b" />
                    <Text style={styles.reviewValue}>{review.rating} / 10</Text>
                  </View>
                  <Text style={styles.reviewDate}>
                    {review.created_at
                      ? new Date(review.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : "Recent review"}
                  </Text>
                </View>
                <Text style={styles.reviewJob}>Job {index + 1}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noteText}>
              {worker?.completed_jobs
                ? "This worker has completed jobs, but no customer rating has been submitted yet."
                : "No ratings yet."}
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Why Save Workers</Text>
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Favorite workers are easier to revisit when you want a trusted person
            for your next booking.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  container: {
    padding: 20,
    gap: 18,
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    alignSelf: "flex-start",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#d9f99d",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#365314",
  },
  name: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
  },
  type: {
    color: "#64748b",
    fontWeight: "700",
    letterSpacing: 1,
  },
  pillRow: {
    width: "100%",
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pillText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  actionsRow: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#0f172a",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
  },
  statLabel: {
    color: "#64748b",
    fontWeight: "700",
  },
  statValue: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
  },
  noteCard: {
    backgroundColor: "#ecfccb",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#bef264",
  },
  noteText: {
    color: "#365314",
    lineHeight: 22,
    fontWeight: "700",
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  reviewStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewCopy: {
    gap: 4,
  },
  reviewValue: {
    color: "#365314",
    fontWeight: "800",
  },
  reviewDate: {
    color: "#4d7c0f",
    fontSize: 12,
    fontWeight: "600",
  },
  reviewJob: {
    color: "#4d7c0f",
    fontWeight: "700",
  },
});
