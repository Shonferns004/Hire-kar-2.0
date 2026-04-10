import React, { ReactNode, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

type AlertState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
};

const DEFAULT_STATE: AlertState = {
  visible: false,
  title: "",
  message: "",
  buttons: [],
};

const normalizeButtons = (buttons?: AlertButton[]) => {
  if (!buttons || buttons.length === 0) {
    return [{ text: "Okay", style: "default" as const }];
  }

  return buttons.map((button) => ({
    text: button.text || "Okay",
    onPress: button.onPress,
    style: button.style || "default",
  }));
};

export default function AppAlertProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [alertState, setAlertState] = useState<AlertState>(DEFAULT_STATE);
  const originalAlertRef = useRef(Alert.alert);
  const originalGlobalAlertRef = useRef(global.alert);

  useEffect(() => {
    const showAlert = (
      title?: string,
      message?: string,
      buttons?: AlertButton[],
    ) => {
      setAlertState({
        visible: true,
        title: title || "Notice",
        message: message || "",
        buttons: normalizeButtons(buttons),
      });
    };

    Alert.alert = showAlert as typeof Alert.alert;
    global.alert = ((message?: string) =>
      showAlert("Notice", message || "")) as typeof global.alert;

    return () => {
      Alert.alert = originalAlertRef.current;
      global.alert = originalGlobalAlertRef.current;
    };
  }, []);

  const closeAlert = (button?: AlertButton) => {
    setAlertState(DEFAULT_STATE);
    button?.onPress?.();
  };

  return (
    <>
      {children}
      <Modal
        transparent
        animationType="fade"
        visible={alertState.visible}
        onRequestClose={() => closeAlert(alertState.buttons[0])}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>HireKar</Text>
            </View>
            <Text style={styles.title}>{alertState.title}</Text>
            {!!alertState.message && (
              <Text style={styles.message}>{alertState.message}</Text>
            )}
            <View style={styles.buttonRow}>
              {alertState.buttons.map((button, index) => {
                const destructive = button.style === "destructive";
                const cancel = button.style === "cancel";

                return (
                  <Pressable
                    key={`${button.text}-${index}`}
                    onPress={() => closeAlert(button)}
                    style={[
                      styles.button,
                      destructive && styles.buttonDestructive,
                      cancel && styles.buttonSecondary,
                      index === 0 &&
                        alertState.buttons.length === 1 &&
                        styles.buttonPrimary,
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        destructive && styles.buttonTextLight,
                        index === 0 &&
                          alertState.buttons.length === 1 &&
                          styles.buttonTextLight,
                      ]}
                    >
                      {button.text || "Okay"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.58)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    padding: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ecfccb",
    marginBottom: 14,
  },
  badgeText: {
    color: "#365314",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
  },
  message: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
    fontWeight: "600",
  },
  buttonRow: {
    marginTop: 22,
    gap: 10,
  },
  button: {
    minHeight: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe4ee",
  },
  buttonPrimary: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  buttonSecondary: {
    backgroundColor: "#ffffff",
  },
  buttonDestructive: {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  buttonTextLight: {
    color: "#ffffff",
  },
});
