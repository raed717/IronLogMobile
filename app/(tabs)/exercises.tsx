import { useExercises } from "@/hooks/useExercises";
import { Exercise } from "@/types/workout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
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

// Filter options
const MUSCLE_GROUPS = [
  "Abs",
  "Back",
  "Biceps",
  "Calf",
  "Chest",
  "Forearm",
  "Leg",
  "Neck",
  "Shoulders",
  "Trapezius",
  "Triceps",
  "Erector Spinae",
  "Hip",
];

const FITNESS_CATEGORIES = ["Cardio", "Calisthenic", "Full Body", "Yoga"];

const EQUIPMENT_OPTIONS = [
  "All Equipment",
  "Full Gym",
  "NO EQUIPMENT",
  "Machine",
  "Cable",
  "Barbell",
  "Dumbbells",
  "Kettlebell",
  "Resistance Band",
];

export default function ExercisesScreen() {
  const { exercises, loading } = useExercises();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [imageLoadingErrors, setImageLoadingErrors] = useState<Set<string>>(
    new Set(),
  );

  const handleImageError = (exerciseId: string) => {
    setImageLoadingErrors((prev) => new Set([...prev, exerciseId]));
  };

  // Filter exercises based on search and filters
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch =
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMuscle =
        selectedMuscles.length === 0 ||
        selectedMuscles.some((muscle) =>
          exercise.muscle_group?.toLowerCase().includes(muscle.toLowerCase()),
        );

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((cat) =>
          exercise.category?.toLowerCase().includes(cat.toLowerCase()),
        );

      const matchesEquipment =
        selectedEquipment.length === 0 ||
        selectedEquipment.includes("All Equipment") ||
        selectedEquipment.some((eq) =>
          exercise.equipment?.toLowerCase().includes(eq.toLowerCase()),
        );

      return (
        matchesSearch && matchesMuscle && matchesCategory && matchesEquipment
      );
    });
  }, [
    exercises,
    searchQuery,
    selectedMuscles,
    selectedCategories,
    selectedEquipment,
  ]);

  const toggleFilter = (
    value: string,
    array: string[],
    setArray: (arr: string[]) => void,
  ) => {
    if (array.includes(value)) {
      setArray(array.filter((item) => item !== value));
    } else {
      setArray([...array, value]);
    }
  };

  const clearFilters = () => {
    setSelectedMuscles([]);
    setSelectedCategories([]);
    setSelectedEquipment([]);
    setSearchQuery("");
  };

  const renderExerciseCard = ({ item }: { item: Exercise }) => (
    <TouchableOpacity style={styles.exerciseCard} activeOpacity={0.7}>
      {item.img_url && !imageLoadingErrors.has(item.id) ? (
        <View style={styles.exerciseImageContainer}>
          <Image
            source={{ uri: item.img_url }}
            style={styles.exerciseImage}
            onError={() => handleImageError(item.id)}
            resizeMode="cover"
          />
        </View>
      ) : null}

      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseTitleContainer}>
          <Text style={styles.exerciseName}>{item.name}</Text>
        </View>
      </View>

      <Text style={styles.exerciseMuscle}>
        <Text style={{ fontWeight: "700" }}>Muscle: </Text>
        {item.muscle_group}
      </Text>

      {item.category && (
        <Text style={styles.exerciseCategory}>
          <Text style={{ fontWeight: "700" }}>Category: </Text>
          {item.category}
        </Text>
      )}

      <Text style={styles.exerciseEquipment}>
        <Text style={{ fontWeight: "700" }}>Equipment: </Text>
        {item.equipment}
      </Text>

      {item.description && (
        <Text style={styles.exerciseDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() =>
          router.push({
            pathname: "/exercise-log",
            params: { exercise: JSON.stringify(item) },
          })
        }
      >
        <Ionicons name="add-circle-outline" size={18} color={PRIMARY_COLOR} />
        <Text style={styles.selectButtonText}>Select Exercise</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons
            name="search-outline"
            size={20}
            color={PRIMARY_COLOR}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={TEXT_SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="funnel-outline" size={20} color={DARK_BG} />
          {(selectedMuscles.length > 0 ||
            selectedCategories.length > 0 ||
            selectedEquipment.length > 0) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {selectedMuscles.length +
                  selectedCategories.length +
                  selectedEquipment.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {(selectedMuscles.length > 0 ||
        selectedCategories.length > 0 ||
        selectedEquipment.length > 0) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.activeFiltersContainer}
        >
          {selectedMuscles.map((muscle) => (
            <TouchableOpacity
              key={muscle}
              style={styles.activeFilterTag}
              onPress={() =>
                toggleFilter(muscle, selectedMuscles, setSelectedMuscles)
              }
            >
              <Text style={styles.activeFilterText}>{muscle} ✕</Text>
            </TouchableOpacity>
          ))}
          {selectedCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={styles.activeFilterTag}
              onPress={() =>
                toggleFilter(cat, selectedCategories, setSelectedCategories)
              }
            >
              <Text style={styles.activeFilterText}>{cat} ✕</Text>
            </TouchableOpacity>
          ))}
          {selectedEquipment.map((eq) => (
            <TouchableOpacity
              key={eq}
              style={styles.activeFilterTag}
              onPress={() =>
                toggleFilter(eq, selectedEquipment, setSelectedEquipment)
              }
            >
              <Text style={styles.activeFilterText}>{eq} ✕</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredExercises.length} exercises found
        </Text>
      </View>

      {/* Exercises List */}
      {filteredExercises.length > 0 ? (
        <FlatList
          data={filteredExercises}
          renderItem={renderExerciseCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={64} color={TEXT_SECONDARY} />
          <Text style={styles.emptyText}>No exercises found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your filters or search term
          </Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={28} color={TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Muscle Groups */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Muscle Groups</Text>
                <View style={styles.filterGrid}>
                  {MUSCLE_GROUPS.map((muscle) => (
                    <TouchableOpacity
                      key={muscle}
                      style={[
                        styles.filterChip,
                        selectedMuscles.includes(muscle) &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        toggleFilter(
                          muscle,
                          selectedMuscles,
                          setSelectedMuscles,
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedMuscles.includes(muscle) &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {muscle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fitness Categories */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>
                  Fitness Categories
                </Text>
                <View style={styles.filterGrid}>
                  {FITNESS_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.filterChip,
                        selectedCategories.includes(cat) &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        toggleFilter(
                          cat,
                          selectedCategories,
                          setSelectedCategories,
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCategories.includes(cat) &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Equipment */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Equipment</Text>
                <View style={styles.filterGrid}>
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <TouchableOpacity
                      key={eq}
                      style={[
                        styles.filterChip,
                        selectedEquipment.includes(eq) &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        toggleFilter(
                          eq,
                          selectedEquipment,
                          setSelectedEquipment,
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedEquipment.includes(eq) &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {eq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 16,
    paddingVertical: 10,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#00D084",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  filterBadgeText: {
    color: DARK_BG,
    fontSize: 12,
    fontWeight: "700",
  },
  activeFiltersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 40,
  },
  activeFilterTag: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    color: DARK_BG,
    fontWeight: "600",
    fontSize: 13,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  exerciseCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
  },
  exerciseImageContainer: {
    width: "100%",
    height: 180,
    backgroundColor: INPUT_BG,
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  exerciseHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 8,
  },
  exerciseTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseName: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  exerciseMuscle: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  exerciseCategory: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  exerciseEquipment: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  exerciseDescription: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 10,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  selectButton: {
    flexDirection: "row",
    backgroundColor: `${PRIMARY_COLOR}20`,
    borderColor: PRIMARY_COLOR,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  selectButtonText: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  clearButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  clearButtonText: {
    color: DARK_BG,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: `${DARK_BG}E0`,
  },
  modalContent: {
    flex: 1,
    backgroundColor: DARK_BG,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: INPUT_BORDER,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  filterSectionTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    backgroundColor: INPUT_BG,
    borderColor: INPUT_BORDER,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  filterChipText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: DARK_BG,
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: INPUT_BORDER,
  },
  clearFiltersButton: {
    flex: 1,
    backgroundColor: INPUT_BG,
    borderColor: INPUT_BORDER,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
  clearFiltersButtonText: {
    color: TEXT_PRIMARY,
    textAlign: "center",
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    paddingVertical: 12,
  },
  applyButtonText: {
    color: DARK_BG,
    textAlign: "center",
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: TEXT_PRIMARY,
    marginTop: 12,
  },
});
