import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { FlatList } from "react-native";
import {
  Broom,
  Wrench,
  LightbulbFilament,
  Clock,
  CheckCircle,
  XCircle,
} from "phosphor-react-native";
import { useRouter } from "expo-router";
import { useJobStore } from "@/store/jobStore";
import { getJobDetails } from "@/service/api";

const { width } = Dimensions.get("window");
const PRIMARY = "#22c55e";
const PAGE_SIZE = 6;

const getJobDateTime = (job: any) => {
  const rawValue =
    job?.scheduledFor ||
    job?.scheduled_for ||
    job?.scheduled_at ||
    job?.bookingTime ||
    job?.booking_time ||
    job?.created_at;

  if (!rawValue) return "Date not available";

  const value = new Date(rawValue);
  if (Number.isNaN(value.getTime())) return String(rawValue);

  return value
    .toLocaleString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", " �");
};

const TaskCard = ({
  Icon,
  color,
  statusColor,
  status,
  title,
  time,
  onPress,
}: any) => (
  <TouchableOpacity onPress={onPress} style={styles.card}>
    <View style={styles.cardTop}>
      <View style={[styles.iconBox, { backgroundColor: color + "1A" }]}>
        <Icon size={26} color={color} weight="fill" />
      </View>

      <View style={[styles.statusPill, { borderColor: statusColor }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
      </View>
    </View>

    <Text style={styles.title}>{title}</Text>

    <View style={styles.row}>
      <Clock size={14} color="#64748b" weight="fill" />
      <Text style={styles.meta}>{time}</Text>
    </View>
  </TouchableOpacity>
);

const EmptyState = ({ title, subtitle, Icon, actionText, onAction }: any) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconBox}>
      <Icon size={48} color="#94a3b8" weight="fill" />
    </View>

    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>

    {actionText && (
      <TouchableOpacity style={styles.emptyButton} onPress={onAction}>
        <Text style={styles.emptyButtonText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default function PriorityBoardScreen() {
  const scrollX = useSharedValue(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [active, setActive] = useState(0);
  const { jobs, setJobs, initRealtime } = useJobStore();
  const router = useRouter();

  const [pages, setPages] = useState({ 0: 1, 1: 1, 2: 1 });

  useEffect(() => {
    const loadInitialJobs = async () => {
      try {
        const res = await getJobDetails();
        setJobs(res?.jobs || []);
      } catch {
        setJobs([]);
      }
    };

    loadInitialJobs();
    initRealtime();
  }, []);

  const ongoing = jobs.filter((job) =>
    [
      "IN_PROGRESS",
      "SEARCHING",
      "SCHEDULED",
      "ARRIVED",
      "AWAITING_APPROVAL",
      "ASSIGNED",
    ].includes(job.status),
  );
  const completed = jobs.filter((job) => job.status === "COMPLETED");
  const cancelled = jobs.filter((job) =>
    [
      "CANCELLED",
      "REJECTED",
      "CANCELLED_BY_WORKER",
      "CANCELLED_BY_USER",
    ].includes(job.status),
  );

  const getIconAndColor = (type: string) => {
    switch (type) {
      case "cleaner":
        return { Icon: Broom, color: "#16a34a" };
      case "plumber":
      case "carpenter":
        return { Icon: Wrench, color: "#2563eb" };
      case "electrician":
        return { Icon: LightbulbFilament, color: "#f97316" };
      default:
        return { Icon: Wrench, color: "#64748b" };
    }
  };

  const getBatchColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "#16a34a";
      case "ASSIGNED":
        return "#2563eb";
      case "SCHEDULED":
        return "#8b5cf6";
      case "AWAITING_APPROVAL":
        return "#f97316";
      case "COMPLETED":
        return "#0f766e";
      case "CANCELLED":
      case "REJECTED":
      case "CANCELLED_BY_WORKER":
      case "CANCELLED_BY_USER":
        return "#ef4444";
      default:
        return "#f97316";
    }
  };

  const handleJobPress = (job: any) => {
    if (!job) return;
    if (["AWAITING_APPROVAL", "IN_PROGRESS"].includes(job.status)) {
      router.push({
        pathname: "/(app)/(screens)/waiting",
        params: { id: job.id },
      });
    } else if (
      job.status === "ASSIGNED" ||
      job.status === "SEARCHING" ||
      job.status === "ARRIVED" ||
      job.status === "SCHEDULED"
    ) {
      router.push({
        pathname: "/(app)/(screens)/live-job",
        params: { id: job.id },
      });
    } else if (job.worker_id) {
      router.push({
        pathname: "/(app)/(screens)/worker-profile",
        params: {
          workerId: job.worker_id,
          workerName: job.worker_name,
          workerPhone: job.worker_phone,
          workerType: job.type,
          jobId: job.id,
        },
      });
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const goToTab = (index: number) => {
    setActive(index);
    scrollRef.current?.scrollTo({ x: width * index, animated: true });
  };

  const renderList = (data: any[], label: string, tabIndex: number) => {
    if (data.length === 0) {
      const EmptyIcon =
        tabIndex === 0 ? Clock : tabIndex === 1 ? CheckCircle : XCircle;

      return (
        <EmptyState
          Icon={EmptyIcon}
          title={`No ${label} Tasks`}
          subtitle={`You do not have any ${label.toLowerCase()} bookings right now.`}
          actionText={tabIndex === 0 ? "Book a Service" : undefined}
          onAction={() => router.push("/")}
        />
      );
    }

    const visibleData = data.slice(
      0,
      pages[tabIndex as keyof typeof pages] * PAGE_SIZE,
    );

    return (
      <FlatList
        data={visibleData}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (visibleData.length < data.length) {
            setPages((prev) => ({
              ...prev,
              [tabIndex]: prev[tabIndex as keyof typeof prev] + 1,
            }));
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          <>
            {visibleData.length < data.length && (
              <ActivityIndicator size="small" color={PRIMARY} />
            )}
            {tabIndex === 2 && data.length > 0 && (
              <View style={styles.cancelInfoBox}>
                <Text style={styles.cancelInfoText}>
                  Canceled tasks will be deleted within 2 days.
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          const { Icon, color } = getIconAndColor(item.type);
          const statusColor = getBatchColor(item.status);
          const formattedDateTime = getJobDateTime(item);

          return (
            <TaskCard
              Icon={Icon}
              color={color}
              statusColor={statusColor}
              status={
                [
                  "CANCELLED_BY_USER",
                  "REJECTED",
                  "CANCELLED_BY_WORKER",
                  "AUTO_CANCELLED",
                ].includes(item.status)
                  ? "CANCELLED"
                  : item.status
              }
              title={item.type?.toUpperCase()}
              time={formattedDateTime}
              onPress={() => handleJobPress(item)}
            />
          );
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>Track and manage your tasks.</Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          {[
            { label: "Ongoing", count: ongoing.length },
            { label: "Completed", count: completed.length },
            { label: "Canceled", count: cancelled.length },
          ].map((t, i) => (
            <Pressable
              key={t.label}
              style={[styles.tabButton, active === i && styles.tabButtonActive]}
              onPress={() => goToTab(i)}
            >
              <Text
                style={[styles.tabText, active === i && styles.tabTextActive]}
              >
                {t.label}
              </Text>
              <Text style={styles.tabCount}>{t.count}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / width);
          setActive(page);
        }}
      >
        <View style={{ width, flex: 1 }}>
          {renderList(ongoing, "Ongoing", 0)}
        </View>
        <View style={{ width, flex: 1 }}>
          {renderList(completed, "Completed", 1)}
        </View>
        <View style={{ width, flex: 1 }}>
          {renderList(cancelled, "Canceled", 2)}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  headerSubtitle: { marginTop: 4, color: "#64748b", fontSize: 12 },
  countPill: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  countValue: { color: "#f8fafc", fontWeight: "800", fontSize: 14 },
  countLabel: { color: "#cbd5f5", fontSize: 10 },
  tabsWrap: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 18,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 10,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: "#ffffff",
  },
  tabText: { fontWeight: "700", color: "#64748b", fontSize: 12 },
  tabTextActive: { color: "#0f172a" },
  tabCount: { fontSize: 10, color: "#94a3b8" },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: "800" },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  meta: { color: "#64748b", fontSize: 12 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: { fontWeight: "700", color: "white" },
  cancelInfoBox: {
    marginTop: 12,
    backgroundColor: "#fff7ed",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  cancelInfoText: { fontSize: 12, color: "#c2410c", fontWeight: "600" },
});
