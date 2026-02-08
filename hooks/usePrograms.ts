import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Program, ProgramExercise, Exercise } from "@/types/workout";
import { useAuth } from "@/hooks/useAuth";

export const usePrograms = () => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchPrograms = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch owned programs
        const { data: ownedPrograms, error: ownedError } = await supabase
          .from("programs")
          .select(
            `
            id,
            user_id,
            name,
            description,
            focus_area,
            level,
            created_at,
            updated_at
          `
          )
          .eq("user_id", user.id);

        if (ownedError) throw ownedError;

        // Fetch shared program IDs with sharer info
        const { data: sharedProgramIds, error: sharedError } = await supabase
          .from("program_shares")
          .select(`
            program_id,
            shared_by:shared_by_user_id (
              id,
              username,
              full_name
            )
          `)
          .eq("shared_with_user_id", user.id);

        if (sharedError) throw sharedError;

        let sharedPrograms: any[] = [];
        if (sharedProgramIds && sharedProgramIds.length > 0) {
          const ids = sharedProgramIds.map(s => s.program_id);
          const { data: sharedData, error: sharedProgramsError } = await supabase
            .from("programs")
            .select(
              `
              id,
              user_id,
              name,
              description,
              focus_area,
              level,
              created_at,
              updated_at
            `
            )
            .in("id", ids);

          if (sharedProgramsError) throw sharedProgramsError;
          
          // Combine programs with sharer info
          sharedPrograms = (sharedData || []).map(program => {
            const shareInfo = sharedProgramIds.find(s => s.program_id === program.id);
            return {
              ...program,
              shared_by: shareInfo?.shared_by
            };
          });
        }

        const allPrograms = [...(ownedPrograms || []), ...(sharedPrograms || [])];

        const programsWithExercises = await Promise.all(
          allPrograms.map(async (program) => {
            const { data: exercisesData, error: exercisesError } =
              await supabase
                .from("program_exercises")
                .select(
                  `
                  id,
                  program_id,
                  exercise_id,
                  order_index,
                  sets_target,
                  reps_target,
                  created_at
                `
                )
                .eq("program_id", program.id)
                .order("order_index", { ascending: true });

            if (exercisesError) throw exercisesError;

            const { data: exercises, error: exError } = await supabase
              .from("exercises")
              .select("*")
              .in("id", exercisesData?.map((e) => e.exercise_id) || []);

            if (exError) throw exError;

            const exercisesMap = new Map(
              exercises?.map((e) => [e.id, e]) || []
            );

            const programExercises: ProgramExercise[] = (
              exercisesData || []
            ).map((pe) => ({
              ...pe,
              exercise: exercisesMap.get(pe.exercise_id),
            }));

            return {
              ...program,
              exercises: programExercises,
            };
          })
        );

        setPrograms(programsWithExercises);
      } catch (err) {
        console.error("Error fetching programs:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch programs"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [user?.id]);

  const createProgram = async (
    name: string,
    focusArea: string,
    description?: string,
    level?: string
  ): Promise<Program | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from("programs")
        .insert([
          {
            user_id: user.id,
            name,
            description,
            focus_area: focusArea,
            level: level || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newProgram: Program = {
        ...data,
        exercises: [],
      };

      setPrograms((prev) => [newProgram, ...prev]);
      return newProgram;
    } catch (err) {
      console.error("Error creating program:", err);
      setError(err instanceof Error ? err.message : "Failed to create program");
      return null;
    }
  };

  const updateProgram = async (
    id: string,
    name: string,
    focusArea: string,
    description?: string,
    level?: string
  ): Promise<Program | null> => {
    try {
      const { data, error } = await supabase
        .from("programs")
        .update({
          name,
          focus_area: focusArea,
          description,
          level: level || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setPrograms((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      );

      return data as Program;
    } catch (err) {
      console.error("Error updating program:", err);
      setError(err instanceof Error ? err.message : "Failed to update program");
      return null;
    }
  };

  const deleteProgram = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("programs").delete().eq("id", id);

      if (error) throw error;

      setPrograms((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting program:", err);
      setError(err instanceof Error ? err.message : "Failed to delete program");
      return false;
    }
  };

  const addExerciseToProgram = async (
    programId: string,
    exerciseId: string,
    orderIndex: number,
    setsTarget: number = 3,
    repsTarget: number = 10
  ): Promise<ProgramExercise | null> => {
    try {
      const { data, error } = await supabase
        .from("program_exercises")
        .insert([
          {
            program_id: programId,
            exercise_id: exerciseId,
            order_index: orderIndex,
            sets_target: setsTarget,
            reps_target: repsTarget,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Fetch the exercise details
      const { data: exercise, error: exerciseError } = await supabase
        .from("exercises")
        .select("*")
        .eq("id", exerciseId)
        .single();

      if (exerciseError) throw exerciseError;

      const programExercise: ProgramExercise = {
        ...data,
        exercise: exercise,
      };

      setPrograms((prev) =>
        prev.map((p) => {
          if (p.id === programId) {
            return {
              ...p,
              exercises: [...(p.exercises || []), programExercise],
            };
          }
          return p;
        })
      );

      return programExercise;
    } catch (err) {
      console.error("Error adding exercise to program:", err);
      setError(
        err instanceof Error ? err.message : "Failed to add exercise to program"
      );
      return null;
    }
  };

  const removeExerciseFromProgram = async (
    programExerciseId: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("program_exercises")
        .delete()
        .eq("id", programExerciseId);

      if (error) throw error;

      setPrograms((prev) =>
        prev.map((p) => ({
          ...p,
          exercises: (p.exercises || []).filter(
            (e) => e.id !== programExerciseId
          ),
        }))
      );

      return true;
    } catch (err) {
      console.error("Error removing exercise from program:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove exercise from program"
      );
      return false;
    }
  };

  const updateProgramExercise = async (
    programExerciseId: string,
    setsTarget: number,
    repsTarget: number,
    orderIndex: number
  ): Promise<ProgramExercise | null> => {
    try {
      const { data, error } = await supabase
        .from("program_exercises")
        .update({
          sets_target: setsTarget,
          reps_target: repsTarget,
          order_index: orderIndex,
        })
        .eq("id", programExerciseId)
        .select()
        .single();

      if (error) throw error;

      setPrograms((prev) =>
        prev.map((p) => ({
          ...p,
          exercises: (p.exercises || []).map((e) =>
            e.id === programExerciseId ? { ...e, ...data } : e
          ),
        }))
      );

      return data as ProgramExercise;
    } catch (err) {
      console.error("Error updating program exercise:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update program exercise"
      );
      return null;
    }
  };

  return {
    programs,
    loading,
    error,
    createProgram,
    updateProgram,
    deleteProgram,
    addExerciseToProgram,
    removeExerciseFromProgram,
    updateProgramExercise,
  };
};
