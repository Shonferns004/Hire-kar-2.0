import React from "react";
import { Slot } from "expo-router";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Host } from "react-native-portalize";
import { MAPBOX_TOKEN } from "@/config/constants";
import Mapbox from "@rnmapbox/maps";
Mapbox.setAccessToken(MAPBOX_TOKEN);

const RootLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Host>
        <Slot />
      </Host>
    </GestureHandlerRootView>
  );
};

export default gestureHandlerRootHOC(RootLayout);
