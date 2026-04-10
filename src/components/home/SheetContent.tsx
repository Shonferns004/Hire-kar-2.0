import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  scrollTo,
  runOnUI,
  useAnimatedRef,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { NativeViewGestureHandler } from "react-native-gesture-handler";
import {
  Wrench,
  Lightning,
  Fan,
  Broom,
  MapPin,
  Star,
  Clock,
  ShieldCheck,
} from "phosphor-react-native";
import MapModal from "./MapModal";
import { useUserStore } from "@/store/userStore";
import { uiStyles } from "@/styles/uiStyles";
import { getTopWorkers } from "@/service/api";

const { width } = Dimensions.get("window");

const SERVICE_ACTIONS = [
  { name: "Carpenter", imageUri: require("@/assets/icons/carpenter.png") },
  { name: "Plumber", imageUri: require("@/assets/icons/plumber.png") },
  { name: "Electrician", imageUri: require("@/assets/icons/electrician.png") },
  { name: "Cleaner", imageUri: require("@/assets/icons/maid.png") },
  { name: "Worker", imageUri: require("@/assets/icons/worker.png") },
];

type TopWorker = {
  id: string;
  name: string;
  role: string;
  rating: string;
  completedJobs: number;
};

const AutoReviews = () => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const x = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const CARD_WIDTH = 284;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      x.value = e.contentOffset.x;
    },
    onBeginDrag: () => {
      isDragging.value = true;
    },
    onEndDrag: () => {
      isDragging.value = false;
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      runOnUI(() => {
        if (isDragging.value) return;

        let next = x.value + CARD_WIDTH;

        if (next > CARD_WIDTH * 2.5) {
          next = 0;
        }

        scrollTo(scrollRef, next, 0, true);
        x.value = next;
      })();
    }, 3600);

    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingHorizontal: 20 }}
    >
      <Testimonial name="Riya S." />
      <Testimonial name="Aman Patel" />
      <Testimonial name="Kabir Mehta" />
    </Animated.ScrollView>
  );
};

const HorizontalScroller = ({
  children,
  contentContainerStyle,
  ...props
}: any) => (
  <NativeViewGestureHandler disallowInterruption>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled
      directionalLockEnabled
      scrollEventThrottle={16}
      contentContainerStyle={contentContainerStyle}
      {...props}
    >
      {children}
    </ScrollView>
  </NativeViewGestureHandler>
);

const AnimatedTouchable = ({ children, style }: any) => {
  const scale = useSharedValue(1);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={rStyle}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={() => (scale.value = withSpring(0.97))}
        onPressOut={() => (scale.value = withSpring(1))}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const ActionCard = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <View style={styles.actionIcon}>
      <Image source={icon} style={uiStyles.cubeIcon} />
    </View>
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

const ServiceCard = ({ icon, title, meta }: any) => (
  <AnimatedTouchable style={styles.serviceCard}>
    <View style={styles.serviceIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.serviceText}>{title}</Text>
      <Text style={styles.serviceMeta}>{meta}</Text>
    </View>
  </AnimatedTouchable>
);

const Testimonial = ({ name }: any) => (
  <Animated.View entering={FadeInDown.delay(150)} style={styles.testimonial}>
    <Text style={styles.testimonialText}>
      "Booked a worker in minutes. He arrived fast and fixed everything
      perfectly."
    </Text>
    <Text style={styles.testimonialName}>{name}</Text>
  </Animated.View>
);

const WorkerCard = ({ name, role, rating, completedJobs }: any) => (
  <Animated.View entering={FadeInDown.delay(200)} style={styles.workerCard}>
    <View style={styles.workerAvatar}>
      <Text style={styles.workerInitial}>{name.slice(0, 1)}</Text>
    </View>
    <Text style={styles.workerName}>{name}</Text>
    <Text style={styles.workerRole}>{role}</Text>
    <View style={styles.workerMetaRow}>
      <View style={styles.workerBadge}>
        <Star size={12} color="#161b0e" weight="fill" />
        <Text style={styles.workerBadgeText}>{rating}</Text>
      </View>
      <Text style={styles.workerJobs}>{completedJobs} jobs</Text>
    </View>
  </Animated.View>
);

const SheetContent = ({ sheetRef }: { sheetRef: any }) => {
  const { setLocation } = useUserStore();
  const [workerType, setWorkerType] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<any>(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [topWorkers, setTopWorkers] = useState<TopWorker[]>([]);

  const featureCards = useMemo(
    () => [
      {
        title: "Need a quick fix?",
        desc: "Verified help in 15-30 mins.",
        tag: "FAST",
      },
      {
        title: "Weekend deep clean",
        desc: "Bundle deals for your home.",
        tag: "POPULAR",
      },
    ],
    [],
  );

  useEffect(() => {
    let mounted = true;

    const loadTopWorkers = async () => {
      try {
        const res = await getTopWorkers(6);
        if (!mounted) return;
        setTopWorkers(res?.workers ?? []);
      } catch (error) {
        if (!mounted) return;
        setTopWorkers([]);
      }
    };

    loadTopWorkers();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.title}>
              Hire <Text style={styles.primary}>Kar</Text>
            </Text>
            <Text style={styles.subtitle}>Trusted pros for every home task.</Text>
          </View>
          <View style={styles.heroTag}>
            <ShieldCheck size={14} color="#161b0e" weight="fill" />
            <Text style={styles.heroTagText}>Verified</Text>
          </View>
        </View>

        <View style={styles.heroFooter}>
          <View style={styles.heroStat}>
            <Clock size={14} color="#161b0e" weight="fill" />
            <Text style={styles.heroStatText}>18 min avg arrival</Text>
          </View>
          <View style={styles.heroStat}>
            <Star size={14} color="#161b0e" weight="fill" />
            <Text style={styles.heroStatText}>4.8 average rating</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Book a Service</Text>
      </View>

      <HorizontalScroller
        contentContainerStyle={styles.actionRow}
      >
        {SERVICE_ACTIONS.map((cube) => (
          <ActionCard
            key={cube.name}
            icon={cube.imageUri}
            label={cube.name}
            onPress={() => {
              setWorkerType(cube.name.toLowerCase());
              setIsMapModalVisible(true);
            }}
          />
        ))}
      </HorizontalScroller>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured</Text>
        <Text style={styles.explore}>View all</Text>
      </View>

      <HorizontalScroller
        snapToInterval={FEATURE_CARD_WIDTH + 14}
        decelerationRate="fast"
        contentContainerStyle={{ paddingLeft: 20 }}
      >
        {featureCards.map((card) => (
          <AnimatedTouchable key={card.title} style={styles.featureCard}>
            <Text style={styles.featureTag}>{card.tag}</Text>
            <Text style={styles.featureTitle}>{card.title}</Text>
            <Text style={styles.featureDesc}>{card.desc}</Text>
            <TouchableOpacity style={styles.featureBtn}>
              <Text style={styles.featureBtnText}>Book now</Text>
            </TouchableOpacity>
          </AnimatedTouchable>
        ))}
      </HorizontalScroller>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popular Services</Text>
        <Text style={styles.explore}>Explore</Text>
      </View>

      <HorizontalScroller
        contentContainerStyle={{ paddingLeft: 20 }}
      >
        <ServiceCard
          icon={<Wrench size={22} color="#16a34a" />}
          title="Plumbing"
          meta="Leak fixes - Pipes"
        />
        <ServiceCard
          icon={<Lightning size={22} color="#16a34a" />}
          title="Electrician"
          meta="Wiring - Switches"
        />
        <ServiceCard
          icon={<Fan size={22} color="#16a34a" />}
          title="AC Repair"
          meta="Cooling - Gas top-up"
        />
        <ServiceCard
          icon={<Broom size={22} color="#16a34a" />}
          title="Cleaning"
          meta="Home - Office"
        />
      </HorizontalScroller>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Updates</Text>
        <Text style={styles.explore}>Latest</Text>
      </View>

      <HorizontalScroller
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        <Animated.View entering={FadeIn.delay(100)} style={styles.newCardPrimary}>
          <MapPin size={40} color="#161b0e" weight="fill" />
          <View style={{ marginTop: "auto" }}>
            <Text style={styles.newCardTitle}>Live tracking</Text>
            <Text style={styles.newCardDesc}>Track workers in real time.</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200)} style={styles.newCardWhite}>
          <Broom size={40} color="#a1e633" weight="fill" />
          <View style={{ marginTop: "auto" }}>
            <Text style={styles.newCardTitle}>Instant rebook</Text>
            <Text style={styles.newCardDesc}>Rebook your favorite pro.</Text>
          </View>
        </Animated.View>
      </HorizontalScroller>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Customer Reviews</Text>
      </View>

      <AutoReviews />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Rated Workers</Text>
      </View>

      <HorizontalScroller
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {topWorkers.map((worker) => (
          <WorkerCard key={worker.id} {...worker} />
        ))}
      </HorizontalScroller>

      <View style={styles.footer}>
        <Text style={styles.footerText}>(c) 2026 HireKar. All rights reserved.</Text>
      </View>

      {isMapModalVisible && (
        <MapModal
          visible={isMapModalVisible}
          selectedLocation={{
            latitude: destinationCoords?.latitude as number,
            longitude: destinationCoords?.longitude as number,
            address: destinationCoords?.address as string,
          }}
          onClose={() => setIsMapModalVisible(false)}
          onSelectLocation={(data: any) => {
            setDestinationCoords(data?.coords);
            setLocation(data);
          }}
          workerType={workerType}
        />
      )}
    </View>
  );
};

export default SheetContent;

const FEATURE_CARD_WIDTH = Math.min(320, width * 0.82);

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: "#f9f9f8",
  },
  hero: {
    marginHorizontal: 20,
    marginTop: 6,
    backgroundColor: "#161b0e",
    borderRadius: 28,
    padding: 20,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontSize: 28, fontWeight: "900", color: "#f8fafc" },
  primary: { color: "#a1e633" },
  subtitle: { marginTop: 4, fontSize: 12, color: "#d1d5db" },
  heroTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#a1e633",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#161b0e",
  },
  searchBox: {
    marginTop: 18,
    backgroundColor: "#0f140a",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f2a12",
  },
  searchInput: { fontSize: 13, color: "#f8fafc", flex: 1 },
  heroFooter: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#a1e633",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroStatText: { fontSize: 10, fontWeight: "800", color: "#161b0e" },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#161b0e" },
  explore: { color: "#a1e633", fontSize: 11, fontWeight: "700" },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e8f7c4",
  },
  locationText: { fontSize: 10, fontWeight: "700", color: "#161b0e" },
  actionRow: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionCard: {
    width: 96,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8d8",
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#f5f9ea",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { marginTop: 8, fontSize: 11, fontWeight: "800", color: "#161b0e" },
  featureCard: {
    width: FEATURE_CARD_WIDTH,
    height: 170,
    backgroundColor: "#a1e633",
    borderRadius: 24,
    padding: 20,
    marginRight: 14,
    justifyContent: "space-between",
  },
  featureTag: {
    alignSelf: "flex-start",
    color: "#161b0e",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  featureTitle: { fontSize: 20, fontWeight: "900", color: "#161b0e" },
  featureDesc: { fontSize: 12, color: "#1f2a12" },
  featureBtn: {
    backgroundColor: "#161b0e",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  featureBtnText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  serviceCard: {
    width: 190,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8d8",
    padding: 16,
    marginRight: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(161,230,51,0.18)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceText: { fontSize: 13, fontWeight: "700", color: "#161b0e" },
  serviceMeta: { marginTop: 4, fontSize: 10, color: "#6b7280" },
  newCardPrimary: {
    width: 200,
    height: 200,
    backgroundColor: "#a1e633",
    borderRadius: 20,
    padding: 18,
    marginRight: 14,
  },
  newCardWhite: {
    width: 200,
    height: 200,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#e2e8d8",
  },
  newCardTitle: { fontSize: 16, fontWeight: "900", color: "#161b0e" },
  newCardDesc: { fontSize: 11, color: "#6b7280", marginTop: 4 },
  testimonial: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#e2e8d8",
  },
  testimonialText: { fontSize: 12, fontStyle: "italic", color: "#161b0e" },
  testimonialName: { marginTop: 12, fontWeight: "700", fontSize: 12, color: "#161b0e" },
  workerCard: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#e2e8d8",
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e8f7c4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  workerInitial: { fontWeight: "800", color: "#161b0e" },
  workerName: { fontSize: 13, fontWeight: "700", color: "#161b0e" },
  workerRole: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  workerMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  workerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f2f7e6",
  },
  workerBadgeText: { fontSize: 10, fontWeight: "800", color: "#161b0e" },
  workerJobs: { fontSize: 10, color: "#6b7280" },
  footer: { paddingTop: 24, paddingBottom: 30, alignItems: "center" },
  footerText: { fontSize: 10, color: "#9ca3af" },
});
