import React from "react";
import { Slot } from "expo-router";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Host } from "react-native-portalize";
import { MAPBOX_TOKEN } from "@/config/constants";
import Mapbox from "@rnmapbox/maps";
import AppAlertProvider from "@/components/common/AppAlertProvider";
// import "react-native-url-polyfill/auto";
Mapbox.setAccessToken(MAPBOX_TOKEN);

const RootLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppAlertProvider>
        <Host>
          <Slot />
        </Host>
      </AppAlertProvider>
    </GestureHandlerRootView>
  );
};

export default gestureHandlerRootHOC(RootLayout);
