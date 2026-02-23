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
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { FlatList } from "react-native";
import {
  Bell,
  Broom,
  Wrench,
  LightbulbFilament,
  Clock,
} from "phosphor-react-native";
import { useRouter } from "expo-router";
import { useJobStore } from "@/store/jobStore";
import { getJobDetails } from "@/service/api";

const { width, height } = Dimensions.get("window");
const PRIMARY = "#a3e635";
const PAGE_SIZE = 6;

/* ---------------- CARD ---------------- */
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
      <View style={[styles.iconBox, { backgroundColor: color + "22" }]}>
        <Icon size={26} color={color} weight="fill" />
      </View>

      <View style={[styles.badge, { backgroundColor: statusColor + "22" }]}>
        <Text style={[styles.badgeText, { color: statusColor }]}>{status}</Text>
      </View>
    </View>

    <Text style={styles.title}>{title}</Text>

    <View style={styles.row}>
      <Clock size={14} color="#64748b" weight="fill" />
      <Text style={styles.meta}>{time}</Text>
    </View>
  </TouchableOpacity>
);

/* ---------------- EMPTY STATE ---------------- */
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

/* ---------------- SCREEN ---------------- */
export default function PriorityBoardScreen() {
  const scrollX = useSharedValue(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [active, setActive] = useState(0);
  const { jobs, setJobs, initRealtime } = useJobStore();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [pages, setPages] = useState({ 0: 1, 1: 1, 2: 1 });

  /* ---------------- LOAD JOBS ---------------- */
  useEffect(() => {
    const loadInitialJobs = async () => {
      try {
        const res = await getJobDetails();
        setJobs(res?.jobs || []);
      } catch (e) {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadInitialJobs();
    initRealtime();
  }, []);

  /* ---------------- FILTER JOBS ---------------- */
  const ongoing = jobs.filter((job) =>
    [
      "IN_PROGRESS",
      "SEARCHING_FOR_WORKER",
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

  const tabData = [ongoing, completed, cancelled];

  /* ---------------- ICON + COLOR ---------------- */
  const getIconAndColor = (type: string) => {
    switch (type) {
      case "cleaner":
        return { Icon: Broom, color: "#65a30d" };
      case "plumber":
      case "carpenter":
        return { Icon: Wrench, color: "#3b82f6" };
      case "electrician":
        return { Icon: LightbulbFilament, color: "#f97316" };
      default:
        return { Icon: Wrench, color: "#64748b" };
    }
  };

  const getBatchColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "#65a30d";
      case "ASSIGNED":
        return "#3b82f6";
      case "AWAITING_APPROVAL":
        return "#f97316";
      default:
        return "#f97316";
    }
  };

  const handleJobPress = (job: any) => {
    if (!job) return;
    if (job.status === "AWAITING_APPROVAL") {
      router.push({
        pathname: "/(app)/(screens)/waiting",
        params: { id: job.id },
      });
    } else if (
      job.status === "ASSIGNED" ||
      job.status === "SEARCHING_FOR_WORKER" ||
      job.status === "ARRIVED"
    ) {
      router.push({
        pathname: "/(app)/(screens)/live-job",
        params: { id: job.id },
      });
    } else {
      return;
    }
  };

  /* ---------------- TAB ANIMATION ---------------- */
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const underlineStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [0, width, width * 2],
      [0, width / 3, (width / 3) * 2],
    );
    return { transform: [{ translateX }] };
  });

  const goToTab = (index: number) => {
    setActive(index);
    scrollRef.current?.scrollTo({ x: width * index, animated: true });
  };

  /* ---------------- RENDER LIST ---------------- */
  const renderList = (data: any[], label: string, tabIndex: number) => {
    if (data.length === 0) {
      return (
        <EmptyState
          Icon={Broom}
          title={`No ${label} Tasks`}
          subtitle={`You don’t have any ${label.toLowerCase()} bookings right now.`}
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
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 120,
        }}
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
          const formattedDateTime = new Date(item.created_at)
            .toLocaleString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
            .replace(",", " ·");

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

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      <View style={styles.tabs}>
        {["Ongoing", "Completed", "Canceled"].map((t, i) => (
          <Pressable key={i} style={styles.tab} onPress={() => goToTab(i)}>
            <Text style={[styles.tabText, active === i && styles.activeText]}>
              {t}
            </Text>
          </Pressable>
        ))}
        <Animated.View style={[styles.underline, underlineStyle]} />
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

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 26, fontWeight: "700" },

  tabs: {
    flexDirection: "row",
    position: "relative",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabText: { fontWeight: "600", color: "#94a3b8" },
  activeText: { color: "#0f172a", fontWeight: "700" },
  underline: {
    position: "absolute",
    bottom: 0,
    width: width / 3,
    height: 3,
    backgroundColor: PRIMARY,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f1f5f9",
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
    backgroundColor: "black",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius:10,
  },
  emptyButtonText: { fontWeight: "700", color: "white" },

  pageContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 10,
    borderWidth: 3,
    borderColor: "#f1f5f9",
    marginBottom: 18,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 26,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 6, marginLeft: 5 },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  meta: { color: "#64748b", fontSize: 13 },
  cancelInfoBox: {
    marginHorizontal: 20,
    marginLeft: 5,
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: "#fef3c7",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  cancelInfoText: { fontSize: 13, color: "#92400e", fontWeight: "500" },
});
