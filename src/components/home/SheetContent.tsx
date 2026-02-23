import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { uiStyles } from "@/styles/uiStyles";
import { useUserStore } from "@/store/userStore";
import MapModal from "./MapModal";

const cubes = [
  {
    name: "Carpenter",
    imageUri: require("@/assets/icons/carpenter.png"),
  },
  {
    name: "Plumber",
    imageUri: require("@/assets/icons/plumber.png"),
  },
  {
    name: "Electrician",
    imageUri: require("@/assets/icons/electrician.png"),
  },
  {
    name: "Cleaner",
    imageUri: require("@/assets/icons/maid.png"),
  },
  {
    name: "Worker",
    imageUri: require("@/assets/icons/worker.png"),
  },
];

const Action = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.action} onPress={onPress}>
    <Image source={icon} style={uiStyles.cubeIcon} />
    <Text style={styles.actionTxt}>{label}</Text>
  </TouchableOpacity>
);
const SheetContent = () => {
  const { setLocation } = useUserStore();
  const [workerType, setWorkerType] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<any>(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRow}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {cubes.map((cube) => (
          <Action
            key={cube.name}
            icon={cube.imageUri}
            label={cube.name}
            onPress={() => {
              setWorkerType(cube.name.toLowerCase());
              setIsMapModalVisible(true);
            }}
          />
        ))}
      </ScrollView>

      <View style={uiStyles.adSection}>
        <Image
          source={require("@/assets/images/ad_banner.jpeg")}
          style={uiStyles.adImage}
        />
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
    </>
  );
};

export default SheetContent;

const styles = StyleSheet.create({
  container: { flex: 1 },

  sheetBackground: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: "#f9f9f8",
  },

  handle: {
    width: 50,
    height: 5,
    backgroundColor: "#ddd",
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
  },
  sheetContent: {
    padding: 20,
  },

  quickRow: {
    paddingHorizontal: 20,
    gap: 14, // safe here (ScrollView content container is not animated)
    marginBottom: 22,
  },

  action: {
    width: 90,
    height: 80,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    // elevation: 3,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  actionTxt: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 6,
  },

  promo: {
    backgroundColor: "#a1e633",
    padding: 20,
    borderRadius: 30,
  },

  offer: {
    fontSize: 10,
    fontWeight: "700",
    opacity: 0.6,
  },

  promoTitle: {
    marginTop: 6,
    fontWeight: "800",
    color: "#161b0e",
  },

  cta: {
    marginTop: 12,
    backgroundColor: "#161b0e",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  ctaText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
