import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const PRIMARY = "#a3e635";

export type TierId = "light" | "medium" | "heavy";

interface Props {
  id: TierId;
  title: string;
  subtitle: string;
  visitFee: number;
  jobCharge: number;
  min: number;
  max: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  selected: TierId;
  onSelect: (id: TierId) => void;
}

const TierCard = ({
  id,
  title,
  subtitle,
  visitFee,
  jobCharge,
  icon,
  min,
  max,
  selected,
  onSelect,
}: Props) => {
  const active = selected === id;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onSelect(id)}
      style={[styles.card, active && styles.cardActive]}
    >
      {/* Icon */}
      <View style={styles.iconBox}>
        <MaterialIcons name={icon} size={22} color={PRIMARY} />
      </View>

      {/* Text */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* Price */}
      {/* PRICE BLOCK */}
      <View style={styles.priceBlock}>
        <Text style={styles.jobCharge}>₹{jobCharge}</Text>
        <Text style={styles.visitFee}>₹{visitFee} visit fee</Text>
        <Text style={styles.range}>
          Est. ₹{min} – ₹{max}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default memo(TierCard);

const styles = StyleSheet.create({
  card: {
    width: 150,
    marginRight: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
    minHeight: 210, // stabilizes all cards
    justifyContent: "flex-start",
  },

  cardActive: {
    borderColor: PRIMARY,
    backgroundColor: "rgba(163,230,53,0.08)",
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(163,230,53,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },

  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 3,
    minHeight: 34,
  },

  /* ---- PRICE SECTION ---- */

  priceBlock: {
    marginTop: "auto", // pushes pricing to bottom of card
  },

  jobCharge: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },

  visitFee: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: "600",
    marginTop: 4,
  },

  range: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
});
