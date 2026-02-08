import { useAuth } from "@/hooks/useAuth";
import { useSaveWorkout } from "@/hooks/useSaveWorkout";
import { Exercise } from "@/types/workout";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY_COLOR = "#FF6B35";
const DARK_BG = "#0F0E17";
const INPUT_BG = "#1A1924";
const INPUT_BORDER = "#2A2635";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#B0B0B0";
const CARD_BG = "#1A1924";

interface WorkoutSet {
  id: string;
  weight: string;
  reps: string;
}

export default function ExerciseLogScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { saveWorkout: saveWorkoutToDb } = useSaveWorkout();
  const params = useLocalSearchParams();

  // Parse exercise from params
  const exercise: Exercise = params.exercise
    ? JSON.parse(params.exercise as string)
    : null;

  const [sets, setSets] = useState<WorkoutSet[]>([
    { id: "1", weight: "", reps: "" },
    { id: "2", weight: "", reps: "" },
    { id: "3", weight: "", reps: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!exercise || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Exercise data not found</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const addSet = () => {
    const newSet: WorkoutSet = {
      id: (sets.length + 1).toString(),
      weight: "",
      reps: "",
    };
    setSets([...sets, newSet]);
  };

  const removeSet = (id: string) => {
    if (sets.length > 1) {
      setSets(sets.filter((set) => set.id !== id));
    } else {
      Alert.alert("Cannot remove", "You must have at least one set");
    }
  };

  const updateSet = (id: string, field: "weight" | "reps", value: string) => {
    setSets(
      sets.map((set) => (set.id === id ? { ...set, [field]: value } : set)),
    );
  };

  const validateSets = (): boolean => {
    for (const set of sets) {
      if (!set.weight.trim() || !set.reps.trim()) {
        Alert.alert(
          "Incomplete Set",
          "Please fill in weight and reps for all sets",
        );
        return false;
      }
      if (isNaN(parseFloat(set.weight)) || isNaN(parseInt(set.reps))) {
        Alert.alert("Invalid Input", "Weight and reps must be valid numbers");
        return false;
      }
    }
    return true;
  };

  const saveWorkout = async () => {
    if (!validateSets()) {
      return;
    }

    setIsSaving(true);
    try {
      // Convert sets to the format expected by useSaveWorkout
      const setsToSave = sets.map((set, index) => ({
        setNumber: index + 1,
        weight: parseFloat(set.weight),
        reps: parseInt(set.reps),
      }));

      // Save to Supabase
      const result = await saveWorkoutToDb(exercise.id, setsToSave);

      if (result?.success) {
        Alert.alert("Success", "Workout saved successfully!", [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to save workout. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save workout. Please try again.");
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderSetCard = ({ item }: { item: WorkoutSet }) => (
    <View style={styles.setCard}>
      <View style={styles.setHeader}>
        <Text style={styles.setNumber}>
          Set {sets.findIndex((s) => s.id === item.id) + 1}
        </Text>
        <TouchableOpacity
          onPress={() => removeSet(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <View style={styles.setInputsContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <TextInput
            style={styles.setInput}
            placeholder="0"
            placeholderTextColor={TEXT_SECONDARY}
            keyboardType="decimal-pad"
            value={item.weight}
            onChangeText={(text) => updateSet(item.id, "weight", text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps</Text>
          <TextInput
            style={styles.setInput}
            placeholder="0"
            placeholderTextColor={TEXT_SECONDARY}
            keyboardType="number-pad"
            value={item.reps}
            onChangeText={(text) => updateSet(item.id, "reps", text)}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={PRIMARY_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{exercise.name}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercise Image */}
        {exercise.img_url && !imageError ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: exercise.img_url }}
              style={styles.exerciseImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          </View>
        ) : null}
        {/* Exercise Info */}
        <View style={styles.exerciseInfo}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeLabel}>Muscle</Text>
            <Text style={styles.infoBadgeValue}>{exercise.muscle_group}</Text>
          </View>
          {exercise.category && (
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeLabel}>Category</Text>
              <Text style={styles.infoBadgeValue}>{exercise.category}</Text>
            </View>
          )}
          {exercise.equipment && (
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeLabel}>Equipment</Text>
              <Text style={styles.infoBadgeValue}>{exercise.equipment}</Text>
            </View>
          )}
        </View>

        {/* Sets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sets & Reps</Text>
            <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={PRIMARY_COLOR}
              />
              <Text style={styles.addSetButtonText}>Add Set</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={sets}
            renderItem={renderSetCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.setDivider} />}
          />
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about this workout..."
            placeholderTextColor={TEXT_SECONDARY}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
          onPress={saveWorkout}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={DARK_BG} />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color={DARK_BG} />
              <Text style={styles.primaryButtonText}>Save Workout</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: INPUT_BORDER,
  },
  headerTitle: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: INPUT_BG,
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  exerciseInfo: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 16,
    flexWrap: "wrap",
  },
  infoBadge: {
    backgroundColor: INPUT_BG,
    borderColor: INPUT_BORDER,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoBadgeLabel: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoBadgeValue: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "700",
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addSetButtonText: {
    color: PRIMARY_COLOR,
    fontSize: 13,
    fontWeight: "600",
  },
  setCard: {
    backgroundColor: CARD_BG,
    borderColor: INPUT_BORDER,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  setHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  setNumber: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: "700",
  },
  setInputsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  setInput: {
    backgroundColor: INPUT_BG,
    borderColor: INPUT_BORDER,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "600",
  },
  setDivider: {
    height: 8,
  },
  notesInput: {
    backgroundColor: CARD_BG,
    borderColor: INPUT_BORDER,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: TEXT_PRIMARY,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: INPUT_BORDER,
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: DARK_BG,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    marginBottom: 20,
  },
});
