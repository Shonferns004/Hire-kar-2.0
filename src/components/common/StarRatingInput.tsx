import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Props = {
  value: number;
  onChange: (value: number) => void;
  size?: number;
};

export default function StarRatingInput({
  value,
  onChange,
  size = 30,
}: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;

        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            style={styles.starButton}
          >
            <MaterialIcons
              name={filled ? "star" : "star-border"}
              size={size}
              color={filled ? "#f59e0b" : "#cbd5e1"}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  starButton: {
    padding: 2,
  },
});
