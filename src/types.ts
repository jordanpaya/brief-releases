export type Unit = 'lb' | 'kg';

export type Exercise = {
  id: string;
  name: string;
  createdAt: number;
};

export type SetEntry = {
  id: string;
  exerciseId: string;
  weight: number; // stored in the app's current unit at time of entry
  reps: number;
  rir?: number; // reps in reserve (optional, only when RIR tracking is on)
  date: string; // local day, 'YYYY-MM-DD'
  createdAt: number;
};

export type AppData = {
  exercises: Exercise[];
  sets: SetEntry[];
  unit: Unit;
  showRIR: boolean;
};

// A workout "session" = all sets for one exercise on one day.
export type Session = {
  date: string;
  sets: SetEntry[];
  topSet: SetEntry; // heaviest estimated-1RM set of the day
  best1RM: number;
  bestWeight: number;
  totalVolume: number; // sum of weight * reps
};
