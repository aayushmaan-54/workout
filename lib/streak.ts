import { dayNumber } from "./dates";

export interface StreakInfo {
  current: number;
  best: number;
  /** rest days since the last workout (0 if trained today) */
  restDaysSinceLast: number | null;
  trainedToday: boolean;
  /** how many more rest days are allowed before the current streak breaks */
  restDaysLeft: number | null;
}

/**
 * Streak = number of workout days in a chain where no gap has more than
 * `breakAfter` rest days in a row. `dates` are YYYY-MM-DD local dates.
 */
export function computeStreak(dates: string[], today: string, breakAfter: number): StreakInfo {
  const days = [...new Set(dates)].map(dayNumber).sort((a, b) => a - b);
  if (days.length === 0) return { current: 0, best: 0, restDaysSinceLast: null, trainedToday: false, restDaysLeft: null };

  let run = 1;
  let best = 1;
  for (let i = 1; i < days.length; i++) {
    const restDays = days[i] - days[i - 1] - 1;
    run = restDays > breakAfter ? 1 : run + 1;
    best = Math.max(best, run);
  }

  const last = days[days.length - 1];
  const restDaysSinceLast = Math.max(0, dayNumber(today) - last - 1);
  const trainedToday = last >= dayNumber(today);
  const broken = !trainedToday && restDaysSinceLast > breakAfter;
  const current = broken ? 0 : run;
  return {
    current,
    best,
    restDaysSinceLast: trainedToday ? 0 : restDaysSinceLast,
    trainedToday,
    restDaysLeft: broken ? null : trainedToday ? breakAfter : breakAfter - restDaysSinceLast,
  };
}
