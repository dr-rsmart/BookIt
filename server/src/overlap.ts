/**
 * Slot Overlap & Time Window Validation Engine
 * --------------------------------------------
 * Prevents double-opening overlapping or duplicate time slots for a professional
 * on the same date.
 */

export interface TimeWindow {
  date: string;
  professionalId: string;
  startTime: string;
  endTime: string;
}

export function isValidTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function isValidTimeWindow(startTime: string, endTime: string): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) return false;
  return startTime < endTime;
}

export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Filters a batch of candidate slots against existing slots (and deduplicates
 * within the candidate batch itself) so no overlapping slots are created for
 * the same professional on the same date.
 */
export function filterNonOverlappingSlots<T extends TimeWindow>(
  candidates: T[],
  existing: TimeWindow[],
): { accepted: T[]; skippedCount: number } {
  const accepted: T[] = [];
  let skippedCount = 0;

  for (const candidate of candidates) {
    if (!isValidTimeWindow(candidate.startTime, candidate.endTime)) {
      skippedCount++;
      continue;
    }

    const conflictsWithExisting = existing.some(
      (ex) =>
        ex.professionalId === candidate.professionalId &&
        ex.date === candidate.date &&
        timesOverlap(candidate.startTime, candidate.endTime, ex.startTime, ex.endTime),
    );

    const conflictsWithAccepted = accepted.some(
      (acc) =>
        acc.professionalId === candidate.professionalId &&
        acc.date === candidate.date &&
        timesOverlap(candidate.startTime, candidate.endTime, acc.startTime, acc.endTime),
    );

    if (conflictsWithExisting || conflictsWithAccepted) {
      skippedCount++;
    } else {
      accepted.push(candidate);
    }
  }

  return { accepted, skippedCount };
}
