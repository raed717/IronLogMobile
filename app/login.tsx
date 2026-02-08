import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const LOGO_EMOJI = "💪";
const PRIMARY_COLOR = "#FF6B35"; // Vibrant orange
const SECONDARY_COLOR = "#F7931E"; // Warm orange
const ACCENT_COLOR = "#FDB913"; // Golden yellow
const DARK_BG = "#0F0E17"; // Very dark background
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#B0B0B0";
const INPUT_BG = "#1A1924";
const INPUT_BORDER = "#2A2635";
const SUCCESS_COLOR = "#00D084"; // Green accent

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !username)) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, username, fullName);
        Alert.alert("Success", "Account created! Please sign in.");
        setIsSignUp(false);
        setPassword("");
      } else {
        await signIn(email, password);
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "An error occurred";
      Alert.alert("Authentication Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>{LOGO_EMOJI}</Text>
            <Text style={styles.appTitle}>IronLog</Text>
            <Text style={styles.tagline}>
              {isSignUp
                ? "Start Your Fitness Journey"
                : "Your Personal Strength Coach"}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={PRIMARY_COLOR}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={TEXT_SECONDARY}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Username Input (Sign Up Only) */}
            {isSignUp && (
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={PRIMARY_COLOR}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={TEXT_SECONDARY}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            )}

            {/* Full Name Input (Sign Up Only) */}
            {isSignUp && (
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color={PRIMARY_COLOR}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name (Optional)"
                  placeholderTextColor={TEXT_SECONDARY}
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!loading}
                />
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={PRIMARY_COLOR}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor={TEXT_SECONDARY}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={PRIMARY_COLOR}
                  style={styles.eyeIcon}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link (Sign In Only) */}
            {!isSignUp && (
              <TouchableOpacity disabled={loading}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Auth Button */}
            <TouchableOpacity
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={DARK_BG} size="large" />
              ) : (
                <>
                  <Ionicons
                    name={isSignUp ? "create-outline" : "log-in-outline"}
                    size={20}
                    color={DARK_BG}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.authButtonText}>
                    {isSignUp ? "Create Account" : "Sign In"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Toggle Sign In / Sign Up */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUp
                  ? "Already have an account? "
                  : "Don't have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setEmail("");
                  setPassword("");
                  setUsername("");
                  setFullName("");
                }}
                disabled={loading}
              >
                <Text style={styles.toggleLink}>
                  {isSignUp ? "Sign In" : "Create One"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.featuresContainer}>
            <FeatureItem
              icon="trending-up"
              title="Track Progress"
              description="Monitor your strength gains over time"
            />
            <FeatureItem
              icon="apps"
              title="Smart Workouts"
              description="Personalized programs & exercises"
            />
            <FeatureItem
              icon="pulse"
              title="Performance"
              description="Detailed analytics & statistics"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in, you agree to our Terms and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={24} color={ACCENT_COLOR} />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: "bold",
    color: TEXT_PRIMARY,
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    fontStyle: "italic",
  },
  formContainer: {
    marginBottom: 40,
    gap: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "500",
  },
  passwordInput: {
    paddingRight: 12,
  },
  eyeIcon: {
    marginLeft: 8,
  },
  forgotPassword: {
    color: SECONDARY_COLOR,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  authButton: {
    backgroundColor: PRIMARY_COLOR,
    height: 56,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonText: {
    color: DARK_BG,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  toggleText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
  },
  toggleLink: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: "700",
  },
  featuresContainer: {
    marginTop: 20,
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: INPUT_BG,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: `${INPUT_BORDER}`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  featureDescription: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    marginTop: 20,
    paddingHorizontal: 12,
  },
  footerText: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
