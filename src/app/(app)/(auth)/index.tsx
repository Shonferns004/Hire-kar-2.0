import { supabase } from "@/config/supabase";
import { router } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from "react-native";

export default function PhoneAuthScreen() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const otpRefs = Array.from({ length: 6 }, () => useRef<TextInput>(null));


  /* ================= SEND OTP ================= */
  const sendOtp = async () => {
    if (phone.length !== 10) {
      Alert.alert("Invalid number", "Enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setStep("otp");
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
  const token = otp.join("");

  if (token.length !== 6) {
    Alert.alert("Invalid OTP", "Enter the 6-digit OTP");
    return;
  }

  setLoading(true);

  const { data, error } = await supabase.auth.verifyOtp({
    phone: `+91${phone}`,
    token,
    type: "sms",
  });

  if (error) {
    setLoading(false);
    Alert.alert("OTP Failed", error.message);
    return;
  }

  const session = data?.session;
  const user = data?.user;

  if (!session || !user) {
    setLoading(false);
    Alert.alert("Auth Error", "No session created");
    return;
  }

  try {
    // 🔴 THE MOST IMPORTANT STEP (missing in your app)
    // Create or sync application profile using AUTH ID
    const { error: upsertError } = await supabase
      .from("users")
      .upsert(
        {
          id: user.id,              // <-- Supabase identity
          phone: user.phone,        // store phone for UI/admin
        },
        { onConflict: "id" }        // ensures no duplicates
      );

    if (upsertError) {
      throw upsertError;
    }

    

    // Fetch profile status
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile creation failed");
    }

    setLoading(false);

    // Route based on status
    switch (profile.status) {
      case "pending-1":
        router.replace({
          pathname: "/(app)/(auth)/pending",
          params: { phone },
        });
        break;

      case "pending-2":
        router.replace("/(app)/(tabs)");
        break;

      case "Success":
        Alert.alert("Blocked", "Please contact admin");
        await supabase.auth.signOut();
        break;

      default:
        Alert.alert("Error", "Invalid account state");
    }

    
  } catch (e: any) {
    setLoading(false);
    Alert.alert("Setup Error", e.message);
  }
};


  /* ================= OTP HANDLER ================= */
  const handleOtpChange = (value: string, index: number) => {
    // Handle paste (e.g. 123456)
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      const newOtp = [...otp];

      pasted.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });

      setOtp(newOtp);
      otpRefs[Math.min(index + pasted.length, 5)].current?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ================= PHONE ================= */}
      {step === "phone" && (
        <View style={styles.container}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>🔐</Text>
          </View>

          <Text style={styles.title}>Hire Kar</Text>

          <Text style={styles.subtitle}>
            Enter your phone number to receive a verification code.
          </Text>

          <View style={styles.formRow}>
            <View style={styles.codeBox}>
              <Text style={styles.label}>CODE</Text>
              <TextInput value="+91" editable={false} style={styles.input} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>PHONE NUMBER</Text>
              <TextInput
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={sendOtp}
            disabled={loading}
          >
            <Text style={styles.primaryText}>
              {loading ? "Sending..." : "Send Code"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= OTP ================= */}
      {step === "otp" && (
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setOtp(["", "", "", "", "", ""]);
              setStep("phone");
            }}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.iconBox}>
            <Text style={styles.icon}>🔓</Text>
          </View>

          <Text style={styles.titleLarge}>Verify</Text>

          <Text style={styles.subtitle}>
            We sent a 6-digit code to your mobile device.
          </Text>

          <View style={styles.otpRow}>
            {otpRefs.map((ref, i) => (
              <TextInput
                key={i}
                ref={ref}
                maxLength={1}
                keyboardType="number-pad"
                style={styles.otpInput}
                value={otp[i]}
                onChangeText={(val) => handleOtpChange(val, i)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Backspace" && !otp[i] && i > 0) {
                    otpRefs[i - 1].current?.focus();
                  }
                }}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={verifyOtp}>
            <Text style={styles.primaryText}>Verify</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "android" ? 24 : 0,
  },

  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
    alignItems: "center",
  },

  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(161,230,51,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },

  icon: { fontSize: 28 },

  title: {
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 16,
  },

  titleLarge: {
    fontSize: 44,
    fontWeight: "800",
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 17,
    color: "#616f89",
    textAlign: "center",
    marginBottom: 40,
  },

  formRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 32,
  },

  codeBox: { width: 90 },

  label: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 24,
  },

  backText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111318",
  },

  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbdfe6",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "black",
  },

  primaryButton: {
    width: "100%",
    backgroundColor: "#a1e633",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 24,
  },

  primaryText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111318",
  },

  otpRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 40,
  },

  otpInput: {
    width: 48, // 🔑 was 64
    height: 72, // slightly smaller
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#dbdfe6",
    textAlign: "center",
    fontSize: 24, // scale with box
    fontWeight: "700",
    color: "black",
  },
});
