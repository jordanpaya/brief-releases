import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppData, Exercise, SetEntry, Unit } from './types';
import { todayISO, uid } from './utils';

const STORAGE_KEY = 'liftlog.v1';

const EMPTY: AppData = { exercises: [], sets: [], unit: 'lb' };

type Store = {
  ready: boolean;
  data: AppData;
  addExercise: (name: string) => Exercise | null;
  removeExercise: (id: string) => void;
  renameExercise: (id: string, name: string) => void;
  addSet: (exerciseId: string, weight: number, reps: number) => void;
  removeSet: (id: string) => void;
  setUnit: (unit: Unit) => void;
  setsFor: (exerciseId: string) => SetEntry[];
  lastSet: (exerciseId: string) => SetEntry | null;
  todaysSets: (exerciseId: string) => SetEntry[];
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  // Load once on mount.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppData>;
          setData({
            exercises: parsed.exercises ?? [],
            sets: parsed.sets ?? [],
            unit: parsed.unit ?? 'lb',
          });
        }
      } catch {
        // Corrupt or missing — start clean rather than crash.
      } finally {
        loaded.current = true;
        setReady(true);
      }
    })();
  }, []);

  // Persist on every change, but never before the initial load completes.
  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const addExercise = useCallback<Store['addExercise']>((name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const ex: Exercise = { id: uid(), name: trimmed, createdAt: Date.now() };
    setData((d) => {
      // Avoid dup names (case-insensitive).
      if (d.exercises.some((e) => e.name.toLowerCase() === trimmed.toLowerCase())) return d;
      return { ...d, exercises: [...d.exercises, ex] };
    });
    return ex;
  }, []);

  const removeExercise = useCallback<Store['removeExercise']>((id) => {
    setData((d) => ({
      ...d,
      exercises: d.exercises.filter((e) => e.id !== id),
      sets: d.sets.filter((s) => s.exerciseId !== id),
    }));
  }, []);

  const renameExercise = useCallback<Store['renameExercise']>((id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setData((d) => ({
      ...d,
      exercises: d.exercises.map((e) => (e.id === id ? { ...e, name: trimmed } : e)),
    }));
  }, []);

  const addSet = useCallback<Store['addSet']>((exerciseId, weight, reps) => {
    if (weight < 0 || reps <= 0) return;
    const entry: SetEntry = {
      id: uid(),
      exerciseId,
      weight,
      reps,
      date: todayISO(),
      createdAt: Date.now(),
    };
    setData((d) => ({ ...d, sets: [...d.sets, entry] }));
  }, []);

  const removeSet = useCallback<Store['removeSet']>((id) => {
    setData((d) => ({ ...d, sets: d.sets.filter((s) => s.id !== id) }));
  }, []);

  const setUnit = useCallback<Store['setUnit']>((unit) => {
    setData((d) => ({ ...d, unit }));
  }, []);

  const setsFor = useCallback<Store['setsFor']>(
    (exerciseId) => data.sets.filter((s) => s.exerciseId === exerciseId),
    [data.sets],
  );

  const lastSet = useCallback<Store['lastSet']>(
    (exerciseId) => {
      let best: SetEntry | null = null;
      for (const s of data.sets) {
        if (s.exerciseId !== exerciseId) continue;
        if (!best || s.createdAt > best.createdAt) best = s;
      }
      return best;
    },
    [data.sets],
  );

  const todaysSets = useCallback<Store['todaysSets']>(
    (exerciseId) => {
      const t = todayISO();
      return data.sets
        .filter((s) => s.exerciseId === exerciseId && s.date === t)
        .sort((a, b) => a.createdAt - b.createdAt);
    },
    [data.sets],
  );

  const value: Store = {
    ready,
    data,
    addExercise,
    removeExercise,
    renameExercise,
    addSet,
    removeSet,
    setUnit,
    setsFor,
    lastSet,
    todaysSets,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
