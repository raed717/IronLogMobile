import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useExercises } from "@/hooks/useExercises";
import { usePrograms } from "@/hooks/usePrograms";
import { useProgramShares } from "@/hooks/useProgramShares";
import { Program } from "@/types/workout";

const PRIMARY_COLOR = "#FF6B35";
const DARK_BG = "#0F0E17";
const INPUT_BG = "#1A1924";
const INPUT_BORDER = "#2A2635";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#B0B0B0";

type TabType = "owned" | "shared";

export default function ProgramsScreen() {
  const { programs, loading, createProgram, addExerciseToProgram } =
    usePrograms();
  const { loading: sharesLoading, refetch } = useProgramShares();
  const { exercises } = useExercises();
  const [activeTab, setActiveTab] = useState<TabType>("owned");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(
    null,
  );
  const [programName, setProgramName] = useState("");
  const [programDescription, setProgramDescription] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [level, setLevel] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Separate owned and shared programs
  const ownedPrograms = useMemo(() => {
    return programs.filter((p) => !p.shared_by);
  }, [programs]);

  const sharedPrograms = useMemo(() => {
    return programs.filter((p) => p.shared_by);
  }, [programs]);

  const displayPrograms =
    activeTab === "owned" ? ownedPrograms : sharedPrograms;

  const handleCreateProgram = async () => {
    if (!programName.trim()) {
      Alert.alert("Error", "Program name is required");
      return;
    }

    setIsCreating(true);
    try {
      const newProgram = await createProgram(
        programName,
        focusArea || "full body",
        programDescription,
        level || "beginner",
      );

      if (newProgram) {
        // Add selected exercises to the program
        for (let i = 0; i < selectedExercises.length; i++) {
          await addExerciseToProgram(newProgram.id, selectedExercises[i], i);
        }

        Alert.alert("Success", "Program created successfully!");
        setProgramName("");
        setProgramDescription("");
        setFocusArea("");
        setLevel("");
        setSelectedExercises([]);
        setShowCreateModal(false);
      } else {
        Alert.alert("Error", "Failed to create program");
      }
    } catch {
      Alert.alert("Error", "Failed to create program");
    } finally {
      setIsCreating(false);
    }
  };

  const focusAreaOptions = [
    "Upper Body",
    "Lower Body",
    "Full Body",
    "Push",
    "Pull",
    "Legs",
    "Chest",
    "Back",
    "Shoulders",
    "Arms",
    "Cardio",
    "Custom",
  ];

  const levelOptions = ["Beginner", "Intermediate", "Advanced"];

  const renderProgramCard = ({ item: program }: { item: Program }) => {
    const isExpanded = expandedProgramId === program.id;
    const exerciseCount = program.exercises?.length || 0;

    return (
      <View style={styles.programCard}>
        <TouchableOpacity
          style={styles.programHeader}
          onPress={() => setExpandedProgramId(isExpanded ? null : program.id)}
          activeOpacity={0.7}
        >
          <View style={styles.programInfo}>
            <ThemedText type="defaultSemiBold" style={styles.programName}>
              {program.name}
            </ThemedText>
            <View style={styles.programMeta}>
              {program.focus_area && (
                <ThemedText style={styles.metaTag}>
                  {program.focus_area}
                </ThemedText>
              )}
              {program.level && (
                <ThemedText style={styles.metaTag}>{program.level}</ThemedText>
              )}
              <ThemedText style={styles.exerciseCount}>
                {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
              </ThemedText>
            </View>
          </View>
          <View style={styles.expandIcon}>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={PRIMARY_COLOR}
            />
          </View>
        </TouchableOpacity>

        {program.description && (
          <ThemedText style={styles.programDescription}>
            {program.description}
          </ThemedText>
        )}

        {isExpanded && (
          <View style={styles.expandedContent}>
            {program.exercises && program.exercises.length > 0 ? (
              <View style={styles.exercisesList}>
                <ThemedText
                  type="defaultSemiBold"
                  style={styles.exercisesTitle}
                >
                  Exercises ({program.exercises.length})
                </ThemedText>
                {program.exercises.map((ex, index) => (
                  <View key={ex.id} style={styles.exerciseItem}>
                    <ThemedText style={styles.exerciseIndex}>
                      {index + 1}
                    </ThemedText>
                    <ThemedText style={styles.exerciseName}>
                      {exercises.find((e) => e.id === ex.exercise_id)?.name ||
                        `Exercise ${ex.exercise_id}`}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : (
              <ThemedText style={styles.noExercises}>
                No exercises in this program
              </ThemedText>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === "owned" ? "create-outline" : "share-social-outline"}
        size={48}
        color={TEXT_SECONDARY}
      />
      <ThemedText style={styles.emptyText}>
        {activeTab === "owned"
          ? "No programs created yet"
          : "No programs shared with you"}
      </ThemedText>
      <ThemedText style={styles.emptySubtext}>
        {activeTab === "owned"
          ? "Create your first training program"
          : "Wait for others to share programs"}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">Programs</ThemedText>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "owned" && styles.activeTab]}
          onPress={() => setActiveTab("owned")}
        >
          <Ionicons
            name="create"
            size={20}
            color={activeTab === "owned" ? PRIMARY_COLOR : TEXT_SECONDARY}
          />
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "owned" && styles.activeTabText,
            ]}
          >
            My Programs
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "shared" && styles.activeTab]}
          onPress={() => setActiveTab("shared")}
        >
          <Ionicons
            name="share-social"
            size={20}
            color={activeTab === "shared" ? PRIMARY_COLOR : TEXT_SECONDARY}
          />
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "shared" && styles.activeTabText,
            ]}
          >
            Shared
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Create Program Button */}
      {activeTab === "owned" && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color={DARK_BG} />
          <ThemedText style={styles.createButtonText}>New Program</ThemedText>
        </TouchableOpacity>
      )}

      {/* Programs List */}
      {loading || sharesLoading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator color={PRIMARY_COLOR} size="large" />
        </View>
      ) : (
        <FlatList
          data={displayPrograms}
          renderItem={renderProgramCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          scrollEnabled={true}
        />
      )}

      {/* Create Program Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>
                Create Program
              </ThemedText>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={28} color={TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Program Name */}
              <ThemedText style={styles.label}>Program Name *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., Push Day"
                placeholderTextColor={TEXT_SECONDARY}
                value={programName}
                onChangeText={setProgramName}
                editable={!isCreating}
              />

              {/* Description */}
              <ThemedText style={styles.label}>Description</ThemedText>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Program description (optional)"
                placeholderTextColor={TEXT_SECONDARY}
                value={programDescription}
                onChangeText={setProgramDescription}
                multiline
                numberOfLines={3}
                editable={!isCreating}
              />

              {/* Focus Area */}
              <ThemedText style={styles.label}>Focus Area</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipContainer}
              >
                {focusAreaOptions.map((area) => (
                  <TouchableOpacity
                    key={area}
                    style={[
                      styles.chip,
                      focusArea === area && styles.activeChip,
                    ]}
                    onPress={() => setFocusArea(area)}
                    disabled={isCreating}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        focusArea === area && styles.activeChipText,
                      ]}
                    >
                      {area}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Level */}
              <ThemedText style={styles.label}>Level</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipContainer}
              >
                {levelOptions.map((lv) => (
                  <TouchableOpacity
                    key={lv}
                    style={[styles.chip, level === lv && styles.activeChip]}
                    onPress={() => setLevel(lv)}
                    disabled={isCreating}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        level === lv && styles.activeChipText,
                      ]}
                    >
                      {lv}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Add Exercises */}
              <ThemedText style={styles.label}>
                Exercises ({selectedExercises.length})
              </ThemedText>

              {/* Exercise Search Input */}
              <TouchableOpacity
                style={styles.exerciseSearchButton}
                onPress={() => setShowExerciseList(!showExerciseList)}
                disabled={isCreating}
              >
                <Ionicons name="search" size={20} color={TEXT_SECONDARY} />
                <ThemedText style={styles.exerciseSearchText}>
                  {selectedExercises.length > 0
                    ? `${selectedExercises.length} exercises added`
                    : "Add exercises"}
                </ThemedText>
              </TouchableOpacity>

              {/* Exercise Selection List */}
              {showExerciseList && (
                <View style={styles.exerciseSelectionContainer}>
                  <TextInput
                    style={styles.exerciseSearchInput}
                    placeholder="Search exercises..."
                    placeholderTextColor={TEXT_SECONDARY}
                    value={exerciseSearch}
                    onChangeText={setExerciseSearch}
                    editable={!isCreating}
                  />
                  <FlatList
                    data={exercises.filter((ex) =>
                      ex.name
                        .toLowerCase()
                        .includes(exerciseSearch.toLowerCase()),
                    )}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    renderItem={({ item: exercise }) => {
                      const isSelected = selectedExercises.includes(
                        exercise.id,
                      );
                      return (
                        <TouchableOpacity
                          style={[
                            styles.exerciseOption,
                            isSelected && styles.selectedExerciseOption,
                          ]}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedExercises(
                                selectedExercises.filter(
                                  (id) => id !== exercise.id,
                                ),
                              );
                            } else {
                              setSelectedExercises([
                                ...selectedExercises,
                                exercise.id,
                              ]);
                            }
                          }}
                          disabled={isCreating}
                        >
                          <View style={styles.exerciseCheckbox}>
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color={PRIMARY_COLOR}
                              />
                            )}
                          </View>
                          <View style={styles.exerciseOptionContent}>
                            <ThemedText style={styles.exerciseOptionName}>
                              {exercise.name}
                            </ThemedText>
                            <ThemedText style={styles.exerciseOptionMeta}>
                              {exercise.muscle_group} • {exercise.equipment}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              )}

              {/* Selected Exercises List */}
              {selectedExercises.length > 0 && (
                <View style={styles.selectedExercisesContainer}>
                  <ThemedText style={styles.selectedExercisesTitle}>
                    Added Exercises:
                  </ThemedText>
                  {selectedExercises.map((exerciseId, index) => {
                    const exercise = exercises.find((e) => e.id === exerciseId);
                    return (
                      <View
                        key={exerciseId}
                        style={styles.selectedExerciseItem}
                      >
                        <ThemedText style={styles.selectedExerciseIndex}>
                          {index + 1}
                        </ThemedText>
                        <ThemedText style={styles.selectedExerciseName}>
                          {exercise?.name}
                        </ThemedText>
                        <TouchableOpacity
                          onPress={() =>
                            setSelectedExercises(
                              selectedExercises.filter(
                                (id) => id !== exerciseId,
                              ),
                            )
                          }
                          disabled={isCreating}
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color={PRIMARY_COLOR}
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Create Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isCreating && styles.disabledButton,
                ]}
                onPress={handleCreateProgram}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color={DARK_BG} />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>
                    Create Program
                  </ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: INPUT_BORDER,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: INPUT_BORDER,
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: PRIMARY_COLOR,
  },
  tabText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  activeTabText: {
    color: PRIMARY_COLOR,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
  },
  createButtonText: {
    color: DARK_BG,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  programCard: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    marginBottom: 12,
    overflow: "hidden",
  },
  programHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    marginBottom: 6,
  },
  programMeta: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  metaTag: {
    fontSize: 11,
    color: PRIMARY_COLOR,
    backgroundColor: "rgba(255, 107, 53, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
  exerciseCount: {
    fontSize: 11,
    color: TEXT_SECONDARY,
  },
  programDescription: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontStyle: "italic",
  },
  expandIcon: {
    marginLeft: 8,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: INPUT_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  exercisesList: {
    gap: 8,
  },
  exercisesTitle: {
    fontSize: 13,
    color: PRIMARY_COLOR,
    marginBottom: 8,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    borderRadius: 6,
  },
  exerciseIndex: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    fontWeight: "600",
    minWidth: 24,
  },
  exerciseName: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    flex: 1,
  },
  noExercises: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 6,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  modalContent: {
    flex: 1,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: INPUT_BORDER,
  },
  modalTitle: {
    fontSize: 20,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  label: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT_PRIMARY,
    marginBottom: 16,
    fontSize: 14,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  chipContainer: {
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    backgroundColor: INPUT_BG,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  chipText: {
    fontSize: 12,
    color: TEXT_PRIMARY,
  },
  activeChipText: {
    color: DARK_BG,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: DARK_BG,
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseSearchButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  exerciseSearchText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    flex: 1,
  },
  exerciseSelectionContainer: {
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 8,
    marginBottom: 12,
    maxHeight: 250,
    overflow: "hidden",
  },
  exerciseSearchInput: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderBottomWidth: 1,
    borderBottomColor: INPUT_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: TEXT_PRIMARY,
    fontSize: 14,
  },
  exerciseOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: INPUT_BORDER,
  },
  selectedExerciseOption: {
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  exerciseCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: INPUT_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseOptionContent: {
    flex: 1,
  },
  exerciseOptionName: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontWeight: "500",
  },
  exerciseOptionMeta: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  selectedExercisesContainer: {
    backgroundColor: "rgba(255, 107, 53, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  selectedExercisesTitle: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    marginBottom: 8,
    fontWeight: "600",
  },
  selectedExerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 107, 53, 0.2)",
  },
  selectedExerciseIndex: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    fontWeight: "600",
    minWidth: 20,
  },
  selectedExerciseName: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    flex: 1,
  },
});
