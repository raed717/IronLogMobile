import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useExercises } from "@/hooks/useExercises";
import {
  useWorkoutSessions,
  WorkoutLog,
  WorkoutSession,
  WorkoutSet,
} from "@/hooks/useWorkoutData";
import { supabase } from "@/lib/supabase";

export default function HistoryScreen() {
  const { sessions, loading: sessionsLoading } = useWorkoutSessions();
  const { exercises } = useExercises();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [logsData, setLogsData] = useState<{ [key: string]: WorkoutLog[] }>({});
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);

  // Create maps of exercise IDs to exercise names and images for quick lookup
  const exerciseMap = useMemo(() => {
    const nameMap: { [key: string]: string } = {};
    const imgMap: { [key: string]: string } = {};
    exercises.forEach((ex) => {
      nameMap[ex.id] = ex.name;
      imgMap[ex.id] = ex.img_url || "";
    });
    return { names: nameMap, images: imgMap };
  }, [exercises]);

  const formatSessionDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = date.toDateString();
    const todayString = today.toDateString();
    const yesterdayString = yesterday.toDateString();

    if (dateOnly === todayString) return "Today";
    if (dateOnly === yesterdayString) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }, []);

  const handleSessionPress = useCallback(
    async (sessionId: string) => {
      if (expandedSession === sessionId) {
        setExpandedSession(null);
        return;
      }

      if (logsData[sessionId]) {
        setExpandedSession(sessionId);
        return;
      }

      setLoadingSessionId(sessionId);
      try {
        // Fetch logs for this session
        const { data: logs, error: logsError } = await supabase
          .from("workout_logs")
          .select("*")
          .eq("workout_session_id", sessionId)
          .order("created_at", { ascending: false });

        if (logsError) throw logsError;

        // For each log, fetch its sets
        const logsWithSets: WorkoutLog[] = [];
        if (logs) {
          for (const log of logs) {
            const { data: sets, error: setsError } = await supabase
              .from("workout_sets")
              .select("*")
              .eq("workout_log_id", log.id)
              .order("set_number", { ascending: true });

            if (!setsError && sets) {
              logsWithSets.push({
                ...log,
                sets: sets as WorkoutSet[],
              });
            } else {
              logsWithSets.push(log);
            }
          }
        }

        setLogsData((prev) => ({
          ...prev,
          [sessionId]: logsWithSets,
        }));
        setExpandedSession(sessionId);
      } catch (error) {
        console.error("Failed to load session exercises:", error);
      } finally {
        setLoadingSessionId(null);
      }
    },
    [expandedSession, logsData],
  );

  const renderSetRow = (set: WorkoutSet) => (
    <View key={set.id} style={styles.setRow}>
      <ThemedText style={styles.setNumber}>Set {set.set_number}</ThemedText>
      <ThemedText style={styles.setData}>{set.weight} kg</ThemedText>
      <ThemedText style={styles.setData}>{set.reps} reps</ThemedText>
      {set.is_completed && (
        <Ionicons name="checkmark-circle" size={16} color="#FF6B35" />
      )}
    </View>
  );

  const renderExerciseDetail = (log: WorkoutLog) => {
    const exerciseName =
      exerciseMap.names[log.exercise_id] || `Exercise ${log.exercise_id}`;
    const exerciseImage = exerciseMap.images[log.exercise_id];
    const sets =
      logsData[expandedSession || ""]?.find((l) => l.id === log.id)?.sets || [];

    return (
      <View key={log.id} style={styles.exerciseDetail}>
        <ThemedText type="defaultSemiBold" style={styles.exerciseName}>
          {exerciseName}
        </ThemedText>
        {exerciseImage && (
          <Image
            source={{ uri: exerciseImage }}
            style={styles.exerciseImage}
            resizeMode="cover"
          />
        )}
        {log.notes && (
          <ThemedText style={styles.exerciseNotes}>
            <ThemedText type="defaultSemiBold">Notes: </ThemedText>
            {log.notes}
          </ThemedText>
        )}
        <View style={styles.setsContainer}>
          {sets && sets.length > 0 ? (
            sets.map((set) => renderSetRow(set))
          ) : (
            <ThemedText style={styles.noSets}>No sets recorded</ThemedText>
          )}
        </View>
      </View>
    );
  };

  const renderSessionCard = ({ item: session }: { item: WorkoutSession }) => {
    const isExpanded = expandedSession === session.id;
    const logs = logsData[session.id];
    const isLoading = loadingSessionId === session.id;

    return (
      <View style={styles.sessionCard}>
        <TouchableOpacity
          style={styles.sessionHeader}
          onPress={() => handleSessionPress(session.id)}
          activeOpacity={0.7}
        >
          <View style={styles.sessionInfo}>
            <ThemedText type="defaultSemiBold" style={styles.sessionDate}>
              {formatSessionDate(session.session_date)}
            </ThemedText>
            <View style={styles.sessionMeta}>
              {session.session_name && (
                <ThemedText style={styles.sessionName}>
                  {session.session_name}
                </ThemedText>
              )}
              {logs && (
                <ThemedText style={styles.exerciseCount}>
                  {logs.length} exercise{logs.length !== 1 ? "s" : ""}
                </ThemedText>
              )}
              {session.duration_minutes && (
                <ThemedText style={styles.sessionDuration}>
                  {session.duration_minutes} min
                </ThemedText>
              )}
            </View>
          </View>
          <View style={styles.expandIcon}>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#FF6B35"
            />
          </View>
        </TouchableOpacity>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#FF6B35" />
          </View>
        )}

        {isExpanded && logs && !isLoading && (
          <View style={styles.expandedContent}>
            {logs.length > 0 ? (
              logs.map((log) => renderExerciseDetail(log))
            ) : (
              <ThemedText style={styles.noExercises}>
                No exercises recorded
              </ThemedText>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="barbell-outline" size={48} color="#B0B0B0" />
      <ThemedText style={styles.emptyText}>No workout history yet</ThemedText>
      <ThemedText style={styles.emptySubtext}>
        Start logging workouts in the Exercises tab!
      </ThemedText>
    </View>
  );

  if (sessionsLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator color="#FF6B35" size="large" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Workout History</ThemedText>
      </View>
      <FlatList
        data={sessions}
        renderItem={renderSessionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        scrollEnabled={true}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0E17",
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
    borderBottomColor: "#2A2635",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  sessionCard: {
    backgroundColor: "#1A1924",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2635",
    marginBottom: 12,
    overflow: "hidden",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: "row",
    gap: 8,
  },
  sessionName: {
    fontSize: 12,
    color: "#B0B0B0",
  },
  sessionDuration: {
    fontSize: 12,
    color: "#FF6B35",
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  exerciseCount: {
    fontSize: 12,
    color: "#B0B0B0",
  },
  expandIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#2A2635",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0F0E17",
  },
  exerciseDetail: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2635",
    overflow: "hidden",
  },
  exerciseImage: {
    width: "100%",
    height: 140,
    borderRadius: 6,
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 14,
    color: "#FF6B35",
    marginBottom: 6,
  },
  exerciseNotes: {
    fontSize: 12,
    color: "#B0B0B0",
    marginBottom: 8,
    fontStyle: "italic",
  },
  setsContainer: {
    gap: 8,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#1A1924",
    borderRadius: 6,
  },
  setNumber: {
    fontSize: 11,
    color: "#B0B0B0",
    flex: 1,
  },
  setData: {
    fontSize: 12,
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  noSets: {
    fontSize: 12,
    color: "#B0B0B0",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  noExercises: {
    fontSize: 12,
    color: "#B0B0B0",
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
    color: "#B0B0B0",
    marginTop: 6,
    textAlign: "center",
  },
});
