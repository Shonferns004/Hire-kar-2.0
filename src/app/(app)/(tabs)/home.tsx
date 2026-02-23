import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

import {
  MagnifyingGlass,
  Wrench,
  Lightning,
  Fan,
  Broom,
  Users,
  ChatCircleDots,
  Star,
  MapPin,
} from "phosphor-react-native";

const { width } = Dimensions.get("window");

const AutoReviews = () => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const x = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const CARD_WIDTH = 294; // 280 card + 14 marginRight

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

        // loop back after 3 cards
        if (next > CARD_WIDTH * 2.5) {
          next = 0;
        }

        scrollTo(scrollRef, next, 0, true);
        x.value = next;
      })();
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingHorizontal: 24 }}
    >
      <Testimonial name="Riya S." />
      <Testimonial name="Aman Patel" />
      <Testimonial name="Kabir Mehta" />
    </Animated.ScrollView>
  );
};

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.header}
        >
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.title}>
              Hire <Text style={styles.primary}>Kar</Text>
            </Text>
            <Text style={styles.subtitle}>
              Book trusted home services near you.
            </Text>
          </View>

          <View style={styles.searchBox}>
            <MagnifyingGlass
              size={18}
              color="#7a7a7a"
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Search plumber, electrician, AC repair..."
              placeholderTextColor="#7a7a7a"
              style={styles.searchInput}
            />
          </View>
        </Animated.View>

        {/* FEATURED */}
        <View style={{ marginBottom: 28 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Near You</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={320}
            decelerationRate="fast"
            contentContainerStyle={{ paddingLeft: 24 }}
          >
            <AnimatedTouchable style={styles.featureCardPrimary}>
              <View>
                <View style={styles.badgeDark}>
                  <Text style={styles.badgeTextWhite}>MOST BOOKED</Text>
                </View>
                <Text style={styles.cardTitleDark}>
                  Get a Plumber {"\n"}within 15 mins
                </Text>
              </View>

              <TouchableOpacity style={styles.joinBtn}>
                <Text style={styles.joinText}>BOOK NOW</Text>
              </TouchableOpacity>
            </AnimatedTouchable>

            <AnimatedTouchable style={styles.featureCardDark}>
              <View>
                <View style={styles.badgePrimary}>
                  <Text style={styles.badgeTextDark}>AVAILABLE</Text>
                </View>
                <Text style={styles.cardTitleWhite}>
                  Electrician Near {"\n"}Your Location
                </Text>
              </View>

              <Text style={styles.students}>120+ Workers Online</Text>
            </AnimatedTouchable>
          </ScrollView>
        </View>

        {/* SERVICES */}
        <View style={{ marginBottom: 40 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services We Offer</Text>
            <Text style={styles.explore}>Explore All</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 24 }}
          >
            <ServiceCard
              icon={<Wrench size={22} color="#a1e633" />}
              title="Plumbing"
            />
            <ServiceCard
              icon={<Lightning size={22} color="#a1e633" />}
              title="Electrician"
            />
            <ServiceCard
              icon={<Fan size={22} color="#a1e633" />}
              title="AC Repair"
            />
            <ServiceCard
              icon={<Broom size={22} color="#a1e633" />}
              title="Cleaning"
            />
          </ScrollView>
        </View>

        {/* WHATS NEW */}
        <View style={{ marginBottom: 32 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Updates</Text>
            <Text style={styles.explore}>View All</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            <Animated.View
              entering={FadeIn.delay(100)}
              style={styles.newCardPrimary}
            >
              <MapPin size={46} color="#161b0e" />
              <View style={{ marginTop: "auto" }}>
                <Text style={styles.newCardTitleDark}>Live Tracking</Text>
                <Text style={styles.newCardDescDark}>
                  Track worker approaching your home.
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeIn.delay(200)}
              style={styles.newCardWhite}
            >
              <ChatCircleDots size={46} color="#a1e633" />
              <View style={{ marginTop: "auto" }}>
                <Text style={styles.newCardTitle}>In-App Chat</Text>
                <Text style={styles.newCardDesc}>
                  Chat directly with your worker.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </View>

        {/* REVIEWS */}
        {/* REVIEWS */}
        <View style={{ marginBottom: 36 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
          </View>

          <AutoReviews />
        </View>

        {/* TOP WORKERS */}
        <View style={{ marginBottom: 36 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Rated Workers</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            <Instructor name="Rahul Kumar" role="Plumber" />
            <Instructor name="Imran Shaikh" role="Electrician" />
            <Instructor name="Deepak Yadav" role="AC Technician" />
            <Instructor name="Suresh Patil" role="Cleaner" />
          </ScrollView>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>
            © 2026 HireKar. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- ANIMATED PRESS ---------- */

const AnimatedTouchable = ({ children, style }:any) => {
  const scale = useSharedValue(1);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={rStyle}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => (scale.value = withSpring(0.96))}
        onPressOut={() => (scale.value = withSpring(1))}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ---------- COMPONENTS ---------- */

const ServiceCard = ({ icon, title }:any) => (
  <AnimatedTouchable style={styles.serviceCard}>
    <View style={styles.serviceIcon}>{icon}</View>
    <Text style={styles.serviceText}>{title}</Text>
  </AnimatedTouchable>
);

const Testimonial = ({ name }:any) => (
  <Animated.View entering={FadeInDown.delay(150)} style={styles.testimonial}>
    <Text style={styles.testimonialText}>
      "Booked a worker in minutes. He arrived fast and fixed everything
      perfectly."
    </Text>
    <Text style={styles.testimonialName}>{name}</Text>
  </Animated.View>
);

const Instructor = ({ name, role }:any) => (
  <Animated.View entering={FadeInDown.delay(200)} style={styles.instructor}>
    <View style={styles.instructorAvatar} />
    <Text style={styles.instructorName}>{name}</Text>
    <Text style={styles.instructorRole}>{role}</Text>
    <TouchableOpacity style={styles.followBtn}>
      <Text style={styles.followText}>View</Text>
    </TouchableOpacity>
  </Animated.View>
);

/* ---------- STYLES (UNCHANGED) ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fcfdfa" },
  header: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 14 },

  title: { fontSize: 34, fontWeight: "900", color: "#161b0e" },
  primary: { color: "#a1e633" },
  subtitle: { marginTop: 4, fontSize: 13, color: "#6b7280" },

  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8d8",
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { fontSize: 14 },

  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#161b0e" },
  explore: { color: "#a1e633", fontSize: 11, fontWeight: "700" },

  featureCardPrimary: {
    width: 320,
    height: 180,
    backgroundColor: "#a1e633",
    borderRadius: 24,
    padding: 22,
    marginRight: 14,
    justifyContent: "space-between",
  },
  featureCardDark: {
    width: 320,
    height: 180,
    backgroundColor: "#161b0e",
    borderRadius: 24,
    padding: 22,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "rgba(161,230,51,0.3)",
    justifyContent: "space-between",
  },

  badgeDark: {
    backgroundColor: "#161b0e",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  badgePrimary: {
    backgroundColor: "#a1e633",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  badgeTextWhite: { color: "#fff", fontSize: 10, fontWeight: "800" },
  badgeTextDark: { color: "#161b0e", fontSize: 10, fontWeight: "800" },

  cardTitleDark: { fontSize: 22, fontWeight: "900", color: "#161b0e" },
  cardTitleWhite: { fontSize: 22, fontWeight: "900", color: "#fff" },

  joinBtn: {
    backgroundColor: "#161b0e",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  joinText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  students: { color: "#d1d5db", fontSize: 11 },

  serviceCard: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8d8",
    padding: 18,
    marginRight: 14,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(161,230,51,0.15)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  serviceText: { fontSize: 13, fontWeight: "700", color: "#161b0e" },

  newCardPrimary: {
    width: 200,
    height: 220,
    backgroundColor: "#a1e633",
    borderRadius: 20,
    padding: 18,
    marginRight: 14,
  },
  newCardWhite: {
    width: 200,
    height: 220,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#e2e8d8",
  },
  newCardTitleDark: { fontSize: 18, fontWeight: "900", color: "#161b0e" },
  newCardDescDark: { fontSize: 11, color: "#3f3f3f", marginTop: 4 },
  newCardTitle: { fontSize: 18, fontWeight: "900", color: "#161b0e" },
  newCardDesc: { fontSize: 11, color: "#6b7280", marginTop: 4 },

  testimonial: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#e2e8d8",
  },
  testimonialText: { fontSize: 13, fontStyle: "italic", color: "#161b0e" },
  testimonialName: { marginTop: 14, fontWeight: "700", fontSize: 12 },

  instructor: { width: 112, alignItems: "center", marginRight: 18 },
  instructorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ddd",
    marginBottom: 8,
  },
  instructorName: { fontSize: 12, fontWeight: "700" },
  instructorRole: { fontSize: 10, color: "#6b7280", marginBottom: 6 },
  followBtn: {
    backgroundColor: "#a1e633",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  followText: { fontSize: 10, fontWeight: "800", color: "#161b0e" },

  footer: { paddingTop: 28, paddingBottom: 30, alignItems: "center" },
  copyright: { fontSize: 10, color: "#9ca3af", marginBottom: 14 },
});
