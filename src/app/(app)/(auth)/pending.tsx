import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/config/supabase";

/* ================= CONSTANTS ================= */
const PRIMARY = "#a1e633";
const BG = "#ffffff";
const TEXT = "#111318";
const MUTED = "#616f89";
const BORDER = "#dbdfe6";

/* ================= MAIN ================= */
export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { phone } = useLocalSearchParams<{ phone: string }>();



  // Address
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");

  // OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const router = useRouter();

  const stepIcon =
    step === 1 ? "person" : step === 2 ? "map" : "mail";

  /* ================= VERIFY OTP ================= */
  const verifyOtpAndUpdateStatus = async () => {
    router.replace("/(app)/(auth)/done");
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back}>
          <MaterialIcons
            name="arrow-back-ios-new"
            size={18}
            color={TEXT}
          />
        </TouchableOpacity>
        <Text style={styles.step}>Step {step} of 3</Text>
      </View>

      {/* Progress */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(step / 3) * 100}%` }]} />
      </View>

      {/* Icon */}
      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <MaterialIcons name={stepIcon} size={26} color={PRIMARY} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {step === 1 && <StepOne />}
        {step === 2 && (
          <StepTwo
            street={street}
            setStreet={setStreet}
            city={city}
            setCity={setCity}
            stateName={stateName}
            setStateName={setStateName}
            zip={zip}
            setZip={setZip}
          />
        )}
        {step === 3 && <StepThree otp={otp} setOtp={setOtp} />}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (step < 3) {
            setStep(step + 1);
          } else {
            verifyOtpAndUpdateStatus();
          }
        }}
      >
        <Text style={styles.buttonText}>
          {step === 3 ? "Verify" : "Continue"}
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>
        Your personal information is securely stored and never shared.
      </Text>
    </SafeAreaView>
  );
}

/* ================= STEP 1 ================= */
function StepOne() {
  return (
    <>
      <Text style={styles.title}>Personal Details</Text>
      <Text style={styles.subtitle}>
        Let's get to know you better to personalize your experience.
      </Text>

      <Label text="Date of Birth" />
      <Input placeholder="YYYY-MM-DD" />

      <Label text="Gender" />
      <View style={styles.row}>
        {["Male", "Female", "Other"].map((g) => (
          <View key={g} style={styles.gender}>
            <Text style={styles.genderText}>{g}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

/* ================= STEP 2 ================= */
function StepTwo({
  street,
  setStreet,
  city,
  setCity,
  stateName,
  setStateName,
  zip,
  setZip,
}: any) {
  return (
    <>
      <Text style={styles.title}>Address Details</Text>
      <Text style={styles.subtitle}>
        Please provide your current delivery address.
      </Text>

      <Label text="Street Address" />
      <Input value={street} onChangeText={setStreet} />

      <Label text="City" />
      <Input value={city} onChangeText={setCity} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Label text="State" />
          <Input value={stateName} onChangeText={setStateName} />
        </View>
        <View style={{ flex: 1 }}>
          <Label text="Zip Code" />
          <Input
            value={zip}
            onChangeText={setZip}
            keyboardType="numeric"
          />
        </View>
      </View>
    </>
  );
}

/* ================= STEP 3 ================= */
function StepThree({ otp, setOtp }: any) {
  return (
    <>
      <Text style={styles.title}>Email Verification</Text>
      <Text style={styles.subtitle}>
        Enter the code sent to your email
      </Text>

      <View style={styles.otpRow}>
        {otp.map((v: string, i: number) => (
          <TextInput
            key={i}
            value={v}
            maxLength={1}
            keyboardType="numeric"
            style={styles.otp}
            onChangeText={(t) => {
              const copy = [...otp];
              copy[i] = t;
              setOtp(copy);
            }}
          />
        ))}
      </View>
    </>
  );
}

/* ================= HELPERS ================= */
const Label = ({ text }: any) => (
  <Text style={styles.label}>{text}</Text>
);

const Input = (props: any) => (
  <TextInput
    {...props}
    style={styles.input}
    placeholderTextColor="#9ca3af"
  />
);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, paddingHorizontal: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  step: { fontSize: 13, fontWeight: "600", color: TEXT, opacity: 0.7 },
  track: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 999,
    marginTop: 12,
  },
  fill: { height: "100%", backgroundColor: PRIMARY, borderRadius: 999 },
  iconWrap: { alignItems: "center", marginTop: 40 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(161,230,51,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, marginTop: 32 },
  title: { fontSize: 36, fontWeight: "800", color: TEXT },
  subtitle: { color: MUTED, marginVertical: 16, fontSize: 16 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  input: {
    height: 56,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: BORDER,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  row: { flexDirection: "row", gap: 12 },
  gender: {
    flex: 1,
    height: 56,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  genderText: { fontWeight: "500", color: TEXT },
  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: { fontSize: 18, fontWeight: "800", color: TEXT },
  footer: {
    fontSize: 11,
    color: MUTED,
    textAlign: "center",
    marginBottom: 20,
  },
  otpRow: { flexDirection: "row", gap: 8 },
  otp: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
  },
});
